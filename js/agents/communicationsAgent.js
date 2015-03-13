function CommunicationsAgent(id) {
  // execute super constructor
  eve.Agent.call(this, id);

  // extend the agent with RPC functionality
  this.rpc = this.loadModule('rpc', this.rpcFunctions,{timeout: 60000});

  // connect to all transports provided by the system
  this.connect(eve.system.transports.getAll());

  // these values are requested at the start (init function) and are used to keep track of the states
  this.buttonValues = {btn1:false, btn2: false, btn3: false};
}


// extend the eve.Agent prototype
CommunicationsAgent.prototype = Object.create(eve.Agent.prototype);
CommunicationsAgent.prototype.constructor = CommunicationsAgent;
// define RPC functions, preferably in a separated object to clearly distinct
// exposed functions from local functions.
CommunicationsAgent.prototype.rpcFunctions = {};

// get initial values for buttons and color them accordingly
CommunicationsAgent.prototype.init = function() {
  // references to the explaination spans
  var textDiv1 = document.getElementById('do1Text');
  var textDiv2 = document.getElementById('do2Text');
  var textDiv3 = document.getElementById('do3Text');

  var me = this;

  // get status for button 1
  this.rpc.request('http://openid.almende.org:8082/agents/dso',{method:'isOverflowscenario', params:{}})
    .then(function (reply) {
      if (reply == true || reply == 'Overcurrent') {
        me.buttonValues.btn1 = true;
        me.toggleButton('btn1');
        textDiv1.innerHTML = "isOverflowScenario is Overcurrent (agentreply:" + reply + ")";
      }
      else {
        me.buttonValues.btn1 = false;
        textDiv1.innerHTML = "isOverflowScenario is Overvoltage (agentreply:" + reply + ")";
      }
    })
    .catch (function (err) {
      textDiv1.innerHTML = "Error getting overcurrent: " + err.message;
    });

  // get status for button 3 (2 not yet available on the EVE)
  this.rpc.request('http://openid.almende.org:8081/agents/controlProxy',{method:'getActive', params:{}})
    .then(function (reply) {
      me.buttonValues.btn3 = reply;
      if (reply == true) {
        me.toggleButton('btn3');
        textDiv3.innerHTML = "Actuators are active. (agentreply:" + reply + ")";
      }
      else {
        textDiv3.innerHTML = "Actuators are not active. (agentreply:" + reply + ")";
      }
    })
    .catch (function (err) {
      textDiv3.innerHTML = "Error actuator status: " + err.message;
  })
};

/**
 * toggle the first button, function call is onclick in the dom
 */
CommunicationsAgent.prototype.toggleDSOScenario = function() {
  var button = document.getElementById('btn1');
  var textDiv = document.getElementById('do1Text');
  var me = this;
  this.rpc.request('http://openid.almende.org:8082/agents/dso',{method:'setOverflowscenario', params:{overflow: !this.buttonValues.btn1}})
    .then(function () {
      me.buttonValues.btn1 = !me.buttonValues.btn1;
      me.toggleButton('btn1');
      textDiv.innerHTML = "Request received. (" + new Date().valueOf() + ")"; // the timestamp is added to the GUI sees an update on touching the button
    })
    .catch(function (err) {
      button.className = button.className.replace("selected", "");
      textDiv.innerHTML = "Error in request:" + err.message;
    })
};

/**
 * toggle the second button, function call is onclick in the dom
 */
CommunicationsAgent.prototype.clearCurrentDispatch = function() {
  var button = document.getElementById('btn2');
  var textDiv = document.getElementById('do2Text');
  var me = this;
  this.rpc.request("NEED AN AGENT URL HERE",{method:'NEED A METHOD HERE', params:{state: !this.buttonValues.btn2}})
    .then(function () {
      me.buttonValues.btn2 = !me.buttonValues.btn2;
      me.toggleButton('btn2');
      textDiv.innerHTML = "Request received. (" + new Date().valueOf() + ")"; // the timestamp is added to the GUI sees an update on touching the button
    })
    .catch(function (err) {
      button.className = button.className.replace("selected", "");
      textDiv.innerHTML = "Error in request:" + err.message;
    })
};

/**
 * toggle the third button, function call is onclick in the dom
 */
CommunicationsAgent.prototype.ActuatorsActive = function() {
  var button = document.getElementById('btn3');
  var textDiv = document.getElementById('do3Text');
  var me = this;
  this.rpc.request('http://openid.almende.org:8081/agents/controlProxy',{method:'setActive', params:{state: !this.buttonValues.btn3}})
    .then(function () {
      me.buttonValues.btn3 = !me.buttonValues.btn3;
      me.toggleButton('btn3');
      textDiv.innerHTML = "Request received. (" + new Date().valueOf() + ")"; // the timestamp is added to the GUI sees an update on touching the button
    })
    .catch(function (err) {
      button.className = button.className.replace("selected", "");
      textDiv.innerHTML = "Error in request:" + err.message;
    })
};


/**
 * set the style of the button depending on true or false
 * @param button
 */
CommunicationsAgent.prototype.toggleButton = function(button) {
  var DOMbutton = document.getElementById(button);
  DOMbutton.className = DOMbutton.className.replace("selected", "");
  var value = this.buttonValues[button];
  if (value == true) {
    DOMbutton.className += ' selected';
  }
};

/**
 * toggle the third button, function call is onclick in the dom
 */
CommunicationsAgent.prototype.setKitchen = function(mode) {
  var dom = {
    'Free running':document.getElementById('kitchen_Free_running'),
    'Comfort optimization':document.getElementById('kitchen_Comfort_optimization'),
    'Energy conservation':document.getElementById('kitchen_Energy_conservation')
  };
  dom['Free running'].className = dom['Free running'].className.replace("selected", "");
  dom['Comfort optimization'].className = dom['Comfort optimization'].className.replace("selected", "");
  dom['Energy conservation'].className = dom['Energy conservation'].className.replace("selected", "");

  this.rpc.request('http://openid.almende.org:8081/agents/scenario',{method:'setKitchenModus', params:{modus: mode}})
    .then(function () {
      dom[mode].className += ' selected';
    })
    .catch(function (err) {
      document.getElementById("kitchenStatus").innerHTML = "Error in request:" + err.message;
    })
};


/**
 * toggle the third button, function call is onclick in the dom
 */
CommunicationsAgent.prototype.setMeetingroom = function(mode) {
  var dom = {
    'Free running':document.getElementById('mr_Free_running'),
    'Comfort optimization':document.getElementById('mr_Comfort_optimization'),
    'Energy conservation':document.getElementById('mr_Energy_conservation')
  };

  dom['Free running'].className = dom['Free running'].className.replace("selected", "");
  dom['Comfort optimization'].className = dom['Comfort optimization'].className.replace("selected", "");
  dom['Energy conservation'].className = dom['Energy conservation'].className.replace("selected", "");

  this.rpc.request('http://openid.almende.org:8081/agents/scenario',{method:'setMeetingRoomModus', params:{modus: mode}})
    .then(function () {
      dom[mode].className += ' selected';
    })
    .catch(function (err) {
      document.getElementById("meetingRoomStatus").innerHTML = "Error in request:" + err.message;
    })
};