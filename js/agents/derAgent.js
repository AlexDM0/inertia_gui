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

  this.sensors = []
  this.canDim = false;
  this.canSwitch = false;
  this.canSetTemperature = false;
  this.category = 'OTHER';

  var me = this;
  this.getData().then(function () {
      me.register();
    console.log(me.category)
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
      innerHTML = '<table class"lightingTable">' +
      '<tr><th>' + this.derId + ':</th>' +
      '<td class="description">Consumption:</td><td class="smallDescription">' + this.sensors[0].value + ' ' + this.sensors[0].unit + '</td>';
      if (this.canSwitch == true) {
        innerHTML += '<td><img src="./images/toggleOn.png"></td>';
      }
      else {
        innerHTML += '<td></td>';
      }
      if (this.canDim == true) {
        innerHTML += '</tr>' +
        '<tr>' +
        ' <td><input type="range"></td>' +
        '</tr>';
      }

      innerHTML += '</tr></table>'
      break;
    case 'HVAC':
      innerHTML = 'HVAC'
      //innerHTML = '<table class='derTable'><tr><th colspan='4'>HVAC:</th></tr>' +
      //'<tr><td class='description'>Consumption </td><td class='data'>' + this.data[0].value + ' ' + this.data[0].unit + '</td>' +
      //'<td class='description'>Current Temperature  </td><td class='data'>' + this.data.temperature[3] + ' &deg; C</td></tr>' +
      //'<tr><td class='description'>Target Temperature  </td><td class='bigdata' colspan='2'><span class='rangeLabel'>15</span> ' +
      //'<input type='range' min='15' max='30' step='0.5' style='width:198px;' value=''+(this.data.temperature[3]+2)+'' onchange='' +
      //'document.getElementById(\'' + randomId + '\').value = this.value;'> ' +
      //'<span class='rangeLabel'>30</span></td><td><input id=''+randomId+'' value=''+(this.data.temperature[3]+2)+'' class='rangeinputLabel'>&deg; C</td></tr></table>';
      break;
    case 'OTHER':
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