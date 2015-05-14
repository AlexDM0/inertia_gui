function FacilityManager(id) {
  // execute super constructor
  eve.Agent.call(this, id);

  // extend the agent with RPC functionality
  this.rpc = this.loadModule('rpc', this.rpcFunctions,{timeout: 60000});

  // connect to all transports provided by the system
  this.connect(eve.system.transports.getAll());

  this.profile = "pending";
  this.profiles = ['Abstain','Vacant','Economy','Comfort'];
  this.profilesLabels = ['Abstain','Vacant','Economy','Comfort'];
  this.information = {
    'Abstain': 'No flexible power consumption being offered to power supplier.',
    'Vacant':  'Room comfort flexibility is minimal (no control / off).',
    'Comfort': 'Room comfort flexibility is optimal (partial control).',
    'Economy': 'Room comfort flexibility is maximal (full control).',
    'Contract': 'Contract mode locked in. <a class="link1" onclick="loadContract()">View contract details here <img class="icon" src="./images/chart_curve.png" />.</a>'
  };

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
    legend: {left: {position: 'top-right'}},
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
  this.getControlStrategy();
  var me = this;
  var updateFrequency = 2000;
  setInterval(function() {me.getProfile();}, updateFrequency);
  this.kWhPrice = 0.17;
  this.getCost();
}

// extend the eve.Agent prototype
FacilityManager.prototype = Object.create(eve.Agent.prototype);
FacilityManager.prototype.constructor = FacilityManager;

// define RPC functions, preferably in a separated object to clearly distinct
// exposed functions from local functions.
FacilityManager.prototype.rpcFunctions = {};

FacilityManager.prototype.getCost = function () {
  this.rpc.request(EVE_URL + "mgr", {method:'getEurosPerKWh', params:{}}).then(function (reply) {this.kWhPrice = Number(reply);}).done();
};

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
    if (this.profile == 'Contract') {
      innerHTML +='<option value="Contract" selected="selected">' + 'Contract' + '</option>';
    }
    for (var i = 0; i < this.profiles.length; i++) {
      innerHTML +='<option value="' + this.profiles[i] +'" ' + (this.profile == this.profiles[i] ? 'selected="selected"' : '') + '>' + this.profilesLabels[i] + '</option>';
    }
    innerHTML += '</select>';
    selectDiv.innerHTML = innerHTML;

    var infoSpan = document.getElementById('profileInformationSpan');
    infoSpan.innerHTML = this.information[this.profile];
  }
};


FacilityManager.prototype.setProfile = function(profile) {
  this.profile = profile;
  this.processProfile();
  this.rpc.request(EVE_URL + "holistic", {method:'setModus', params:{modus: this.profile}}).done();
  this.updateHTML();

};

FacilityManager.prototype.processProfile = function() {
  if (this.profile == "Contract") {
    var me = this;
    var dataCollecting = [
      this.rpc.request(EVE_URL + 'holistic', {method:'getRequestProfile',params:{}}),
      this.rpc.request(EVE_URL + 'holistic', {method:'getCurrentProfile',params:{}})
    ];
    Promise.all(dataCollecting)
      .then(function (values) {
        me.processData(values)
      }).done();
  }
};

FacilityManager.prototype.getProfile = function() {
  var me = this;
  this.rpc.request(EVE_URL + "holistic", {method:'getModus', params:{}})
    .then(function(reply) {
      var updateHTML = true;
      if (me.profile !== reply) {
        updateHTLM = false;
      }
      me.profile = reply;
      me.processProfile();
      if (updateHTML === true) {
        me.updateHTML();
      }

    }).done();
};

FacilityManager.prototype.getControlStrategy = function() {
  this.rpc.request(EVE_URL + "mgr", {method:'getCategoryProportions', params:{}})
    .then(function(reply) {
      for (var key in reply) {
        var range = document.getElementById("range" + key);
        var span = document.getElementById("configRange" + key + 'span');
        if (range) {
          range.value = 100*reply[key];
          span.innerHTML = 100*reply[key] + '%';
        }
      }
    }).done();
};


FacilityManager.prototype.setControlStrategy = function(rangeObject) {
  var category = rangeObject.id.replace('range','');
  var value = rangeObject.value / 100;
  this.rpc.request(EVE_URL + "mgr", {method:'setCategoryProportions', params:{category:category, proportion:value}}).done();
};

FacilityManager.prototype.processData = function(data) {
  var visData = [];
  if (data) {
    var requestData = data[0];
    var currentData = data[1];
    if (requestData != null && requestData.request && requestData.request.series) {
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
        if (datapoint.value != 'NaN') {
          visData.push({x: timestamp + datapoint.offset, y: datapoint.value, group: 'usage'})
        }
      }
      for (var i = 0; i < currentData.demand.series.length; i++) {
        var datapoint = currentData.demand.series[i];
        if (datapoint.value != 'NaN') {
          visData.push({x: timestamp + datapoint.offset, y: datapoint.value, group: 'demand'})
        }
      }
    }
  }

  this.contractData.clear();
  this.contractData.add(visData);
};

