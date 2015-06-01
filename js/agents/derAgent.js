"use strict";
function DERagent(id, inertiaId, locations) {
  // execute super constructor
  eve.Agent.call(this, id);
  // extend the agent with RPC functionality
  this.rpc = this.loadModule('rpc', this.rpcFunctions, {timeout: 60000});
  // connect to all transports provided by the system
  this.connect(eve.system.transports.getAll());

  this.getLiveData = false;
  this.inertiaId = inertiaId;
  this.locations = locations;
  if (this.locations.length === 0) {
    this.locations = ['__noLocation__'];
    console.log("NO LOCATION FOR:", inertiaId);
  }

  this.targetValue = '?';

  this.sensors = [];
  this.sensorsObj = {};
  this.sensorsObjHistory = {};
  this.canDim = false;
  this.canSwitch = false;
  this.canSetTemperature = false;
  this.canSetTime = true;
  this.category = 'OTHER';
  this.historyUpdateFrequency = 600000; // 10 min
  this.baseUpdateFrequency = 60000; // 1 min
  this.fastUpdateFrequency = 5000; // 5 sec
  this.lastData = undefined;

  //this.artificialSensorData = undefined;
  var me = this;
  this.getData()
    .then(function() {return me.updateHistoricalData()})
    .then(function() {return me.updateHistory()})
    .done();
  this.update().done();
  this.updateInterval = undefined;
  this.setUpdateFrequency(this.baseUpdateFrequency);

  setInterval(function() {me.updateHistory().done();}, this.historyUpdateFrequency);
}



// extend the eve.Agent prototype
DERagent.prototype = Object.create(eve.Agent.prototype);
DERagent.prototype.constructor = DERagent;

// define RPC functions, preferably in a separated object to clearly distinct
// exposed functions from local functions.
DERagent.prototype.rpcFunctions = {};

/**
 * bind the dataset events to eve back-and-forth
 */
DERagent.prototype.setUpdateFrequency = function(updateFrequency) {
  if (this.updateInterval !== undefined) {
    clearInterval(this.updateInterval);
  }

  var me = this;
  this.updateInterval = setInterval(function() {me.update().done();}, updateFrequency);
};



/**
 * Get the DER data from EVE and send to aggregator
 * @returns {Promise}
 */
DERagent.prototype.updateHistoricalData = function() {
  var me = this;
  var historicalDataFields = ['consumption', 'temperature', 'occupancy', 'humidity'];
  return new Promise(function (resolve, reject) {
    var promisesArray = [];
    for (var i = 0; i < historicalDataFields.length; i++) {
      var promise = new Promise(function (resolve2, reject2) {
        var sensor = me.sensorsObj[historicalDataFields[i]];
        if (sensor !== undefined) {
          me.rpc.request(EVE_URL + me.inertiaId, {method:'getHistoricalData', params:{entityName: sensor.entityName, propertyName: sensor.name}})
            .then(function (history) {
              if (history.historic) {
                if (history.type === 'consumption' && history.name === 'PowerConsumption' || history.type !== 'consumption') {
                  me.sensorsObjHistory[history.type] = history.historic;
                }
              }
              else {
                console.log("no historical data", me);
              }
              resolve2();
            }).catch(function (err) {
              console.error('DERagent:getHistoricalData', me.inertiaId, sensor, err);
              reject2(err);
            }).done();
        }
        else {
          resolve2();
        }
      });
      promisesArray.push(promise);
    }

    Promise.all(promisesArray).then(function (reply) {
      resolve();
    }).catch(function (err) {
      reject(err)
    })
  });
};


/**
 * Get the DER data from EVE and send to aggregator
 * @returns {Promise}
 */
DERagent.prototype.updateHistory = function() {
  this.register(true);
};



/**
 * Get the DER data from EVE and send to aggregator
 * @returns {Promise}
 */
DERagent.prototype.update = function() {
  var me = this;
  return new Promise(function (resolve, reject) {
    me.getData()
      .then(function () {
        //console.log(me.sensors)
        me.register();
        resolve();
      })
      .catch(function (err) {console.error("DERAgent:update",err);reject(err);})
  });
};


/**
 * get the DER data from EVE
 * @returns {Promise}
 */
DERagent.prototype.getData = function() {
  var me = this;
  return new Promise(function (resolve, reject) {
    me.rpc.request(EVE_URL + me.inertiaId, {method:'getUIData', params:{livedata: me.getLiveData}})
      .then(function (UIdata) {
        me.lastData = UIdata;
        me.category = UIdata.category;
        me.canDim = UIdata.canDim;
        me.canSetTemperature = UIdata.canSetTemperature;
        me.canSwitch = UIdata.canSwitch;
        me.sensors = UIdata.sensors || [];
        me.canSetTime = UIdata.canSetTime;
        me.canPause = UIdata.canPause;
        me.time = UIdata.time;

        for (var i = 0; i < me.sensors.length; i++) {
          if (me.sensors[i].type === 'consumption' && me.sensors[i].name === 'PowerConsumption' || me.sensors[i].type !== 'consumption') {
            if (me.sensors[i].name === 'OperationalStatus') {
              me.sensorsObj['operationalState'] = me.sensors[i];
            }
            else {
              me.sensorsObj[me.sensors[i].type] = me.sensors[i];
            }
          }
        }

        resolve();
      }).catch(function (err) {
        console.error('DERagent:getData',me.lastData, me,err);
        reject(err);
      }).done();
    }
  );
};


DERagent.prototype.register = function(history) {
  if (history === undefined) {
    history = false;
  }
  for (var i = 0; i < this.locations.length; i++) {
    var location = this.locations[i];
    if (spaceAgents[this.locations[i]] !== undefined && subspaceAgents[this.locations[i]] === undefined) {
      location = 'space_' + location;
    }
    this.rpc.request(location, {
      method: 'register',
      params: {data: this.sensors, derType: this.category, history: history, historicalData: this.sensorsObjHistory}
    }).catch(function (err) {
      console.error(err)
    });
  }
};

DERagent.prototype.getUIElement = function(temporaryToggle) {
  var temporary = '';
  var blocked = false;
  if (temporaryToggle === true) {
    temporary = ' temporary';
    blocked = true;
  }

  if (this.sensorsObj['state'] !== undefined) {
    if (this.targetValue === '?') {
      this.targetValue = this.sensorsObj['state'].value;
    }

    if (this.sensorsObj['state'].value !== this.targetValue) {
      temporaryToggle = true;
      temporary = ' temporary';
      blocked = true;
      this.setUpdateFrequency(this.fastUpdateFrequency);
    }
    else {
      this.setUpdateFrequency(this.baseUpdateFrequency);
    }
  }

  var innerHTML = '';
  switch (this.category) {
    case 'LIGHTING':
    case 'HVAC':
    case 'BATTERY':
    case 'OTHER':

      var disabledTag = "_disabled";
      if (this.canSwitch === true) {
        disabledTag = '';
      }
      innerHTML = '<div class="derUI toggle' + temporary + '"><img src="';
      if (this.sensorsObj['state'] !== undefined) {
        if (this.sensorsObj['state'].value === 'on')
          innerHTML += './images/toggleOn' + disabledTag + '.png"';
        else if (this.sensorsObj['state'].value === 'unknown') {
          innerHTML += './images/toggleUnknown' + disabledTag + '.png"';
        }
        else {
          innerHTML += './images/toggleOff' + disabledTag + '.png"';
        }
      }
      else {
        innerHTML += './images/toggleUnknown' + disabledTag + '.png"';
      }

      innerHTML += 'class="toggleImage" ';
      if (blocked === false) {
        innerHTML += 'onclick="toggleDER(\'' + this.id + '\')"'
      }
      innerHTML += '></div>';
      innerHTML += '<div class="derUI derName' + temporary + '">';
      if (temporaryToggle === true) {
        innerHTML += this.inertiaId + ' .. waiting';
      }
      else {
        innerHTML += this.inertiaId;
      }
      innerHTML += '</div>';

      if (this.sensorsObj['consumption'] !== undefined) {
        innerHTML += '<div class="derUI power' + temporary + '">' + this.sensorsObj['consumption'].value + ' ' + this.sensorsObj['consumption'].unit + '</div>';
      }
      else {
        innerHTML += '<div class="derUI power' + temporary + '">?</div>';
      }

      if (this.canSetTime === false) {
        if (this.sensorsObj['temperature'] === undefined) {
          innerHTML += '<div class="derUI sensorData' + temporary + '"></div>';
        }
        else {
          innerHTML += '<div class="derUI sensorData' + temporary + '">' + this.sensorsObj['temperature'].value + ' ' + this.sensorsObj['temperature'].unit + '</div>';
        }
      }


      if (this.canPause === true) {
        if (this.sensorsObj['operationalState'] === 'pause') {
          innerHTML += '<div class="derUI icon" onclick="resumeDER(\'' + this.id + '\')"><i class="fa fa-play"></i></div>';
        }
        else {
          innerHTML += '<div class="derUI icon" onclick="pauseDER(\'' + this.id + '\')"><i class="fa fa-pause"></i></div>';
        }
        innerHTML += '<div class="derUI icon"  onclick="stopDER(\'' + this.id + '\')"><i class="fa fa-stop"></i></div>';
      }

      if (this.canSetTime === true) {
        innerHTML += '<div class="derUI icon"><i class="fa fa-clock-o"></i></div><div class="derUI DERtime"><select id="'+this.id + '_hourSelect">';
        for (var i = 0; i < 24; i++) {
          innerHTML += '<option value="'+i+'"';
          if (this.time.hours === i) {
            innerHTML += ' selected="selected"'
          }
          innerHTML += '>' + (i < 10 ? '0' : '') + i + "</option>";
        }
        innerHTML += '</select>:<select id="'+this.id + '_minuteSelect">';
        for (i = 0; i < 60; i++) {
          innerHTML += '<option value="'+i+'"'
          if (this.time.minutes === i) {
            innerHTML += ' selected="selected"'
          }
          innerHTML += '>' + (i < 10 ? '0' : '') + i + '</option>';
        }
        innerHTML += "</select></div>"
      }

      else if (this.canDim === true && temporaryToggle !== true && this.sensorsObj['dimLevel'] !== undefined) {
        innerHTML += '<div class="derUI text' + temporary + '">Dimming:</div><div class="derUI DERrange' + temporary + '"><input type="range" min="0" max="100" step="1" id="range' + this.id + '" onchange="updateIndicator(\'' + this.id + '\', \'%\', true);" oninput="updateIndicator(\'' + this.id + '\',\'%\', false);" value="'+this.sensorsObj['dimLevel'].value+'" >' +
        '<span class="rangeAssistant"  id="rangeNumber' + this.id + '">' + this.sensorsObj['dimLevel'].value + '%</span>';
      }
      else if (this.canSetTemperature === true && temporaryToggle !== true && this.sensorsObj['setTemperature'] !== undefined) {
        innerHTML += '<div class="derUI text' + temporary + '">Set temp:</div><div class="derUI DERrange' + temporary + '"><input type="range" min="15" max="35"  step="1" id="range' + this.id + '" onchange="updateIndicator(\'' + this.id + '\',\'&deg;C\', true);" oninput="updateIndicator(\'' + this.id + '\',\'&deg;C\', false);" value="'+this.sensorsObj['setTemperature'].value+'">' +
        '<span class="rangeAssistant"  id="rangeNumber' + this.id + '">' + this.sensorsObj['setTemperature'].value + '&deg;C</span>';
      }
      else {
        innerHTML += '<div class="derUI text empty"></div><div class="derUI range empty"></div>';
      }
      break;
    case 'SENSORS':
      break;
    case 'PRODUCTION':
      break;
    default:
      break;
  }
  return innerHTML;
};

DERagent.prototype.rpcFunctions.getUIElement = function(params) {
  var me = this;
  this.refreshedData = false;
  this.update().then(function () {me.refreshedData = true; me.updateDerUI();}).done();
  return {type:this.category, content:this.getUIElement(), id:'derUI' + this.id};
};

DERagent.prototype.toggle = function() {
  if (this.canSwitch === true && this.refreshedData === true) {
    var method = 'switchOff';
    if (this.sensorsObj['state'].value === 'on') {
      this.targetValue = 'off';
      //this.sensorsObj['state'].value = 'off';
    }
    else {
      this.targetValue = 'on';
      //this.sensorsObj['state'].value = 'on';
      method = 'switchOn';
    }
    this.updateDerUI(true);
    this.rpc.request(EVE_URL + this.inertiaId,{method:method, params:{}}).done();
  }
};

DERagent.prototype.pause = function() {
  this.sensorsObj['operationalState'] = 'pause';
  this.updateDerUI();
  this.rpc.request(EVE_URL + this.inertiaId,{method:'pause', params:{}}).done();
};

DERagent.prototype.resume = function() {
  this.sensorsObj['operationalState'] = 'resumed';
  this.updateDerUI();
  this.rpc.request(EVE_URL + this.inertiaId,{method:'resume', params:{}}).done();
};

DERagent.prototype.stop = function() {
  this.sensorsObj['operationalState'] = 'stopped';
  this.updateDerUI();
  this.rpc.request(EVE_URL + this.inertiaId,{method:'stop', params:{}}).done();
};


DERagent.prototype.updateRange = function(value) {
  if (this.refreshedData === true) {
    var method = undefined;
    var paramName = undefined;
    if (this.canDim === true) {
      method = 'setDimLevel';
      paramName = 'dimlevel';
      this.sensorsObj['dimLevel'].value = value;
    }
    else if (this.canSetTemperature === true) {
      method = 'setTemperature';
      paramName = 'temperature';
      this.sensorsObj['setTemperature'].value = value;
    }
    if (method !== undefined) {
      this.updateDerUI(' temporary');
      var params = {};
      params[paramName] = value;
      this.rpc.request(EVE_URL + this.inertiaId, {method: method, params: params}).done();
    }
  }
};

DERagent.prototype.updateDerUI = function(temporary) {
  var divElement = document.getElementById("derUI" + this.id);
  if (divElement) {
    divElement.innerHTML = this.getUIElement(temporary);
  }
};


DERagent.prototype.setTime = function(hours, minutes) {
  this.rpc.request(EVE_URL + this.inertiaId, {method: 'setTime', params: {time:'PT'+hours+'h'+minutes+'m'}}).done();
}
