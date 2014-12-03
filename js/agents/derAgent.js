function DERagent(id, derId, inertiaId, locations) {
  // execute super constructor
  eve.Agent.call(this, id);
  // extend the agent with RPC functionality
  this.rpc = this.loadModule('rpc', this.rpcFunctions, {timeout: 6000});
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

  this.update().done();
}

// extend the eve.Agent prototype
DERagent.prototype = Object.create(eve.Agent.prototype);
DERagent.prototype.constructor = DERagent;

// define RPC functions, preferably in a separated object to clearly distinct
// exposed functions from local functions.
DERagent.prototype.rpcFunctions = {};

DERagent.prototype.update = function() {
  var me = this;
  return new Promise(function (resolve, reject) {
    me.getData()
      .then(function () {
        me.register();
        resolve();
      })
      .catch(function (err) {console.log("er",err);reject(err);})
  });
}

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

        me.getLiveData = true;
        resolve();
      }).catch(function (err) {
        console.log('DERagent:gedivata:error',err);
        reject(err);
      }).done();
    }
  );
};


DERagent.prototype.register = function() {
  for (var i = 0; i < this.locations.length; i++) {
    var location = this.locations[i];
    if (spaceAgents[this.locations[i]] !== undefined) {
      location = 'space_' + location;
    }
    this.rpc.request(location, {
      method: 'register',
      params: {data: this.sensors, sensorType: this.category, agentType:'DER'}
    }).done();
  }
};

DERagent.prototype.getUIElement = function(temporary) {
  if (temporary === undefined) {
    temporary = '';
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
      else {
        innerHTML += './images/toggleOff' + disabledTag + '.png"';
      }
      innerHTML += 'class="toggleImage" onclick="toggleDER(\'' + this.id + '\')"></div>';

      innerHTML += '<div class="derUI derName' + temporary + '">' + this.derId + '</div>' +
      '<div class="derUI power' + temporary + '">' + this.sensorsObj['consumption'].value + ' ' + this.sensorsObj['consumption'].unit + '</div>';

      if (this.sensorsObj['temperature'] === undefined) {
        innerHTML += '<div class="derUI sensorData' + temporary + '"></div>';
      }
      else {
        innerHTML += '<div class="derUI sensorData' + temporary + '">' + this.sensorsObj['temperature'].value + ' ' + this.sensorsObj['temperature'].unit + '</div>';
      }

      if (this.canDim == true) {
        innerHTML += '<div class="derUI text' + temporary + '">Dimming:</div><div class="derUI DERrange' + temporary + '"><input type="range" min="0" max="100" step="1" id="range' + this.id + '" onchange="updateIndicator(\'' + this.id + '\', \'%\', true);" oninput="updateIndicator(\'' + this.id + '\',\'%\', false);" value="'+this.sensorsObj['dimLevel'].value+'" >' +
        '<span class="rangeAssistant"  id="rangeNumber' + this.id + '">' + this.sensorsObj['dimLevel'].value + '%</span>';
      }
      else if (this.canSetTemperature == true) {
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
}

DERagent.prototype.rpcFunctions.getUIElement = function() {
  return {type:this.category, content:this.getUIElement(), id:'derUI' + this.id};
}

DERagent.prototype.toggle = function() {
  if (this.canSwitch == true) {
    var method = 'switchOff';
    if (this.sensorsObj['state'].value == 'on') {
      this.sensorsObj['state'].value = 'off';
    }
    else {
      this.sensorsObj['state'].value = 'on';
      method = 'switchOn';
    }
    this.updateDerUI(' temporary');
    var me = this;
    this.rpc.request(EVE_URL + this.inertiaId,{method:method, params:{}})
      .then(function () {
        me.update().then(function () {
          me.updateDerUI();
        }).done();
      });
  }
}

DERagent.prototype.updateRange = function(value) {
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
    console.log(EVE_URL + this.inertiaId,{method:method, params:params})
    this.rpc.request(EVE_URL + this.inertiaId,{method:method, params:params})
      .then(function () {
        me.update().then(function () {
          me.updateDerUI();
        }).done();
      });
  }
}

DERagent.prototype.updateDerUI = function(temporary) {
  var divElement = document.getElementById("derUI" + this.id);
  if (divElement) {
    divElement.innerHTML = this.getUIElement(temporary);
  }
}
