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

  this.getProfile();
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
  this.rpc.request(EVE_URL + "holistic", {method:'setModus', params:{modus: this.profile}}).done();
  this.updateHTML();

}

FacilityManager.prototype.getProfile = function() {
  var me = this;
  this.rpc.request(EVE_URL + "holistic", {method:'getModus', params:{}})
    .then(function(reply) {
      me.profile = reply;
      if (me.profile == "Contract") {
        me.rpc.request(EVE_URL + 'holistic', {method:'getRequestProfile',params:{}})
          .then(function (reply) {

          }).done();
      }
      me.updateHTML();
    })
    .done();
}