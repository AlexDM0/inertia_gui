function DERagent(id, derId, inertiaId, locations) {
  // execute super constructor
  eve.Agent.call(this, id);
  // extend the agent with RPC functionality
  this.rpc = this.loadModule('rpc', this.rpcFunctions, {timeout: 60000});
  // connect to all transports provided by the system
  this.connect(eve.system.transports.getAll());

  this.getLiveData = false;
  this.type = 'light';
  this.inertiaId = inertiaId;
  this.locations = locations;
  this.derId = derId;

  this.sensors = [];
  this.sensorsObj = {};
  this.canDim = false;
  this.canSwitch = false;
  this.canSetTemperature = false;
  this.category = 'OTHER';

  this.artificialSensorData = undefined;
  this.update().done();

  //var me = this;
  //var updateFrequency = 60000;
  //setInterval(function() {me.update().done();}, updateFrequency);
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
DERagent.prototype.bindData = function() {
  this.artificialSensorData.temperature.on("*", this.sendArtificialToEve.bind(this, 'temperature'));
  this.artificialSensorData.occupancy.on("*", this.sendArtificialToEve.bind(this, 'occupancy'));
};

/**
 * get artificial sensor data from eve
 */
DERagent.prototype.getArtificialFromEve = function() {
  var me = this;
  this.rpc.request(EVE_URL + this.inertiaId, {method:'getArtificialSensors', params:{}})
    .then(function (reply) {
      return new Promise(function (resolve, reject) {
        // if the reply is an filled array
        if (typeof reply == 'object' && reply.length > 0) {
          var start, end, value;
          // look through all types
          for (var i = 0; i < reply.length; i++) {
            var data = [];
            // we need matching pairs
            if (reply[i].values.length % 2 == 0) {
              for (var j = 0; j < reply[i].values.length; j++) {
                // every first entree is the start value, every second value is the end
                if (j % 2 == 0) {
                  start = reply[i].values[j].timestamp;
                  value = reply[i].values[j].value;
                }
                else {
                  end = reply[i].values[j].timestamp;
                  data.push({start: start, end: end, content: value});
                }
              }
              me.artificialSensorData[reply[i].type] = new vis.DataSet(data);
            }
            else {
              reject(new Error("Error: data is not an even number"));
            }
          }
        }
        resolve();
      });
    })
    .then(function () {
      me.bindData();
    }).done();
};


/**
 * send sorted artificial sensors data to EVE
 * @param type
 */
DERagent.prototype.sendArtificialToEve = function(type) {
  var sendData = [];
  var unit = 'people';
  var data = this.artificialSensorData[type].get({returnType:'Array'});

  for (var i = 0; i < data.length; i++) {
    var end = data[i].end;
    if (typeof data[i].end != 'number') {
      end = data[i].end.valueOf();
    }
    sendData.push({timestamp:data[i].start.valueOf(), value:data[i].content});
    sendData.push({timestamp:end, value:0})
  }
  sendData.sort(function(a,b) {return a.timestamp - b.timestamp;});

  if (type == 'temperature') {
    unit = 'C';
  }
  var me = this;
  this.rpc.request(EVE_URL + this.inertiaId, {method:'addArtificialSensor', params:{type:type,unit:unit, values:sendData}})
    .then(function () {
      return me.update();
    }).done();
};


/**
 * get artificial sensor data from EVE
 * @param type
 */
DERagent.prototype.getArtificialToEve = function(type) {
  this.rpc.request(EVE_URL + this.inertiaId, {method:'getArtificialSensor', params:{type:type,unit:unit, values:sendData}});
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
        me.category = UIdata.category;
        me.canDim = UIdata.canDim;
        me.canSetTemperature = UIdata.canSetTemperature;
        me.canSwitch = UIdata.canSwitch;
        me.sensors = UIdata.sensors;

        for (var i = 0; i < me.sensors.length; i++) {
          me.sensorsObj[me.sensors[i].type] = me.sensors[i];
        }

        //me.getLiveData = true;
        if (me.category == "SENSORS") {
          me.artificialSensorData = {temperature: new vis.DataSet(), occupancy: new vis.DataSet()};
          me.getArtificialFromEve();
        }

        resolve();
      }).catch(function (err) {
        console.error('DERagent:getData',err);
        reject(err);
      }).done();
    }
  );
};


DERagent.prototype.register = function() {
  for (var i = 0; i < this.locations.length; i++) {
    var location = this.locations[i];
    if (spaceAgents[this.locations[i]] !== undefined && subspaceAgents[this.locations[i]] === undefined) {
      location = 'space_' + location;
    }
    this.rpc.request(location, {
      method: 'register',
      params: {data: this.sensors, derType: this.category}
    }).done();
  }
};

DERagent.prototype.getUIElement = function(temporaryToggle) {
  var temporary = '';
  if (temporaryToggle == true) {
    temporary = ' temporary';
  }
  var innerHTML = '';
  switch (this.category) {
    case 'LIGHTING':
    case 'HVAC':
    case 'OTHER':
      var disabledTag = "_disabled";
      if (this.canSwitch == true) {
        disabledTag = '';
      }
      innerHTML = '<div class="derUI toggle' + temporary + '"><img src="';
      if (this.sensorsObj['state'].value == 'on')
        innerHTML += './images/toggleOn' + disabledTag + '.png"';
      else if (this.sensorsObj['state'].value == 'unknown') {
        innerHTML += './images/toggleUnknown' + disabledTag + '.png"';
      }
      else {
        innerHTML += './images/toggleOff' + disabledTag + '.png"';
      }

      innerHTML += 'class="toggleImage" onclick="toggleDER(\'' + this.id + '\')"></div>';
      innerHTML += '<div class="derUI derName' + temporary + '">' + this.derId + '</div>';

      if (this.sensorsObj['consumption'] !== undefined) {
        innerHTML += '<div class="derUI power' + temporary + '">' + this.sensorsObj['consumption'].value + ' ' + this.sensorsObj['consumption'].unit + '</div>';
      }
      else {
        innerHTML += '<div class="derUI power' + temporary + '">?</div>';
      }


      if (this.sensorsObj['temperature'] === undefined) {
        innerHTML += '<div class="derUI sensorData' + temporary + '"></div>';
      }
      else {
        innerHTML += '<div class="derUI sensorData' + temporary + '">' + this.sensorsObj['temperature'].value + ' ' + this.sensorsObj['temperature'].unit + '</div>';
      }

      if (this.canDim == true && temporaryToggle != true) {
        innerHTML += '<div class="derUI text' + temporary + '">Dimming:</div><div class="derUI DERrange' + temporary + '"><input type="range" min="0" max="100" step="1" id="range' + this.id + '" onchange="updateIndicator(\'' + this.id + '\', \'%\', true);" oninput="updateIndicator(\'' + this.id + '\',\'%\', false);" value="'+this.sensorsObj['dimLevel'].value+'" >' +
        '<span class="rangeAssistant"  id="rangeNumber' + this.id + '">' + this.sensorsObj['dimLevel'].value + '%</span>';
      }
      else if (this.canSetTemperature == true && temporaryToggle != true) {
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
  if (this.canSwitch == true && this.refreshedData == true) {
    var method = 'switchOff';
    if (this.sensorsObj['state'].value == 'on') {
      this.sensorsObj['state'].value = 'off';
    }
    else {
      this.sensorsObj['state'].value = 'on';
      method = 'switchOn';
    }
    this.updateDerUI();
    this.rpc.request(EVE_URL + this.inertiaId,{method:method, params:{}}).done();
  }
};

DERagent.prototype.updateRange = function(value) {
  if (this.refreshedData == true) {
    var method = undefined;
    var paramName = undefined;
    if (this.canDim == true) {
      method = 'setDimLevel';
      paramName = 'dimlevel';
      this.sensorsObj['dimLevel'].value = value;
    }
    else if (this.canSetTemperature == true) {
      method = 'setTemperature';
      paramName = 'temperature';
      this.sensorsObj['setTemperature'].value = value;
    }
    if (method !== undefined) {
      this.updateDerUI(' temporary');
      var me = this;
      var params = {};
      params[paramName] = value;
      this.rpc.request(EVE_URL + this.inertiaId, {method: method, params: params})
        .then(function () {
          me.update().then(function () {
            me.updateDerUI();
          }).done();
        });
    }
  }
};

DERagent.prototype.updateDerUI = function(temporary) {
  var divElement = document.getElementById("derUI" + this.id);
  if (divElement) {
    divElement.innerHTML = this.getUIElement(temporary);
  }
};


DERagent.prototype.getDataSet = function(type) {
  return this.artificialSensorData[type];
};