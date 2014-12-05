function FacilityManager(id) {
  // execute super constructor
  eve.Agent.call(this, id);

  // extend the agent with RPC functionality
  this.rpc = this.loadModule('rpc', this.rpcFunctions,{timeout: 60000});

  // connect to all transports provided by the system
  this.connect(eve.system.transports.getAll());

  this.profile = "pending"
  this.profiles = ['Free running', 'Energy conservation', 'Contract'];
  this.information = {
    'Free running': 'The GUI can be used to toggle DERs',
    'Energy conservation': 'DERs are switched automatically to conserve energy',
    'Contract': 'GUI locked. View contract details here'
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
    var innerHTML ='<select onchange="updateFacilityProfile();" id="facilityProfileSelector">';
    for (var i = 0; i < this.profiles.length; i++) {
      innerHTML +='<option value="' + this.profiles[i] +'" ' + (this.profile == this.profiles[i] ? 'selected="selected"' : '') + '>' + this.profiles[i] + '</option>';
    }
    innerHTML += '</select>';
    selectDiv.innerHTML = innerHTML;

    var information = "Data is being fetched."
    var infoSpan = document.getElementById('profileInformationSpan');
  }
}


FacilityManager.prototype.setProfile = function(profile) {
  this.profile = profile;
  this.rpc.request(EVE_URL + "holistic", {method:'setModus', params:{modus: this.profile}}).done();
  this.updateHTML();

}

FacilityManager.prototype.getProfile = function() {
  var me = this;
  console.log(EVE_URL + "holistic", {method:'getModus', params:{}})
  this.rpc.request(EVE_URL + "holistic", {method:'getModus', params:{}})
    .then(function(reply) {
      console.log(reply)
      //me.profile = reply.modus;
      //me.updateHTML();
    })
    .done();
}