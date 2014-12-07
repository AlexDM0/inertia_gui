function FacilityManager(id) {
  // execute super constructor
  eve.Agent.call(this, id);

  // extend the agent with RPC functionality
  this.rpc = this.loadModule('rpc', this.rpcFunctions,{timeout: 60000});

  // connect to all transports provided by the system
  this.connect(eve.system.transports.getAll());

  this.profile = "pending"
  this.profiles = ['Free running','Comfort optimization', 'Energy conservation', 'Contract'];
  this.profilesLabels = ['Free running','Flexibility optimization', 'Energy conservation', 'Contract'];
  this.information = {
    'Free running': 'The GUI can be used to toggle DERs.',
    'Comfort optimization': 'DERs are switched automatically to maximize flexibility through comfort optimization.',
    'Energy conservation': 'DERs are switched automatically to conserve energy.',
    'Contract': 'Contract mode locked in. <a class="link1" onclick="loadContract()">View contract details here <img class="icon" src="./images/chart_curve.png" />.</a>'
  }

  this.contractLength = 30 * 60 * 1000; // 15 mins in millis
  this.contractData = new vis.DataSet();
  this.contractData.on("*",updateContractOverview);
  this.contractOptions = {
    start: '2014-06-10',
    end: '2014-06-18',
    height: '280px',
    showCurrentTime: true,
    moveable:false,
    zoomable:false,
    catmullRom:false,
    drawPoints:{
      style:'circle'
    },
    dataAxis: {
      showMinorLabels: true,
      title: {
        left: {
          text: 'Power (W)'
        }
      }
    }};

  this.getProfile();
  var me = this;
  var updateFrequency = 60000;
  setInterval(function() {me.getProfile();}, updateFrequency);
}

// extend the eve.Agent prototype
FacilityManager.prototype = Object.create(eve.Agent.prototype);
FacilityManager.prototype.constructor = FacilityManager;

// define RPC functions, preferably in a separated object to clearly distinct
// exposed functions from local functions.
FacilityManager.prototype.rpcFunctions = {};

FacilityManager.prototype.updateHTML = function() {
  var selectDiv = document.getElementById('facilityProfileDiv');
  if (this.profile == 'pending') {
    selectDiv.innerHTML = 'Fetching from remote...'
  }
  else {
    var lock = '';
    if (this.profile == 'Contract') {
      lock = 'disabled';
    }
    var innerHTML ='<select onchange="updateFacilityProfile();" '+lock+' id="facilityProfileSelector">';
    for (var i = 0; i < this.profiles.length; i++) {
      innerHTML +='<option value="' + this.profiles[i] +'" ' + (this.profile == this.profiles[i] ? 'selected="selected"' : '') + '>' + this.profilesLabels[i] + '</option>';
    }
    innerHTML += '</select>';
    selectDiv.innerHTML = innerHTML;

    var infoSpan = document.getElementById('profileInformationSpan');
    infoSpan.innerHTML = this.information[this.profile];
  }
}


FacilityManager.prototype.setProfile = function(profile) {
  this.profile = profile;
  this.processProfile();
  this.rpc.request(EVE_URL + "holistic", {method:'setModus', params:{modus: this.profile}}).done();
  this.updateHTML();

}

FacilityManager.prototype.processProfile = function() {
  if (this.profile == "Contract") {
    var me = this;
    var dataCollecting = [
      this.rpc.request(EVE_URL + 'holistic', {method:'getRequestProfile',params:{}}),
      this.rpc.request(EVE_URL + 'holistic', {method:'getCurrentProfile',params:{}})
    ]
    Promise.all(dataCollecting)
      .then(function (values) {
        me.processData(values)
      }).done();
  }
}

FacilityManager.prototype.getProfile = function() {
  var me = this;
  this.rpc.request(EVE_URL + "holistic", {method:'getModus', params:{}})
    .then(function(reply) {
      me.profile = reply;
      me.processProfile();
      me.updateHTML();
    }).done();
}

FacilityManager.prototype.processData = function(data) {
  var visData = [];
  if (data) {
    var requestData = data[0];
    var currentData = data[1];
    if (requestData && requestData.request && requestData.request.series) {
      var timestamp = requestData.request.timestamp;
      this.contractOptions.start = timestamp;
      this.contractOptions.end = timestamp + this.contractLength;
      for (var i = 0; i < requestData.request.series.length; i++) {
        var datapoint = requestData.request.series[i];
        visData.push({x: timestamp + datapoint.offset, y: datapoint.value, group: 'contract'})
      }
    }

    if (currentData) {
      timestamp = currentData.consumptionInWatts.timestamp;
      for (var i = 0; i < currentData.consumptionInWatts.series.length; i++) {
        var datapoint = currentData.consumptionInWatts.series[i];
        visData.push({x: timestamp + datapoint.offset, y: datapoint.value, group: 'usage'})
      }
      for (var i = 0; i < currentData.demand.series.length; i++) {
        var datapoint = currentData.demand.series[i];
        visData.push({x: timestamp + datapoint.offset, y: datapoint.value, group: 'demand'})
      }
    }
  }

  this.contractData.clear();
  this.contractData.add(visData);
}