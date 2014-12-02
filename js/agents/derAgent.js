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

  var me = this;
  this.getData().then(function () {
      me.register();
    }).done();
}

// extend the eve.Agent prototype
DERagent.prototype = Object.create(eve.Agent.prototype);
DERagent.prototype.constructor = DERagent;

// define RPC functions, preferably in a separated object to clearly distinct
// exposed functions from local functions.
DERagent.prototype.rpcFunctions = {};

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

        for (var i = 0; i < UIdata.sensors.length; i++) {
          me.sensorsObj[UIdata.sensors[i].type] = UIdata.sensors[i];
        }

        me.getLiveData = true;
        resolve();
      }).catch(function (err) {
        console.log('DERagent:getData:error',err);
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

DERagent.prototype.rpcFunctions.getUIElement = function() {
  var innerHTML = '';
  switch (this.category) {
    case 'LIGHTING':
    case 'HVAC':
    case 'OTHER':
      var disabledTag = "_disabled";
      innerHTML = '<table class="derTable">' +
      '<tr>';
      if (this.canSwitch == true) {
        disabledTag = '';
      }
      innerHTML += '<td class="toggle"><img src="';
      if (this.sensorsObj['state'].value == 'on')
        innerHTML += './images/toggleOn' + disabledTag + '.png"';
      else {
        innerHTML += './images/toggleOff' + disabledTag + '.png"';
      }
      innerHTML += 'class="toggleImage"></td>';

      innerHTML += '<td class="derName">' + this.derId + '</td>' +
      '<td class="power">' + this.sensorsObj['consumption'].value + ' ' + this.sensorsObj['consumption'].unit + '</td>';

      if (this.sensorsObj['temperature'] === undefined) {
        innerHTML += '<td class="sensorData"></td>';
      }
      else {
        innerHTML += '<td class="sensorData">' + this.sensorsObj['temperature'].value + ' ' + this.sensorsObj['temperature'].unit + '</td>';
      }

      if (this.canDim == true) {
        innerHTML += '<td class="text">Dimming:</td><td class="range"><input type="range" min="0" max="100" value="'+this.sensorsObj['dimLevel'].value+'">' +
        '<input class="rangeAssistant" value="'+this.sensorsObj['dimLevel'].value+'"></td>';
      }
      else if (this.canSetTemperature == true) {
        innerHTML += '<td class="text">Set temp:</td><td class="range"><input type="range" min="15" max="35" value="'+this.sensorsObj['setTemperature'].value+'">' +
        '<input class="rangeAssistant" value="' + this.sensorsObj['setTemperature'].value + '"></td>';
      }
      else {
        innerHTML += '<td class="text empty"></td><td class="range empty"></td>';
      }
      break;
    case 'SENSORS':
      break;
    case 'PRODUCTION':
      break;
    default:
      break;
  }
  return {type:this.category, content:innerHTML};
}