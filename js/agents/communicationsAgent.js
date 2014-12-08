function CommunicationsAgent(id) {
  // execute super constructor
  eve.Agent.call(this, id);

  // extend the agent with RPC functionality
  this.rpc = this.loadModule('rpc', this.rpcFunctions,{timeout: 60000});

  // connect to all transports provided by the system
  this.connect(eve.system.transports.getAll());

  this.buttonValues = {btn1:false, btn2: false, btn3: false};
}


// extend the eve.Agent prototype
CommunicationsAgent.prototype = Object.create(eve.Agent.prototype);
CommunicationsAgent.prototype.constructor = CommunicationsAgent;
// define RPC functions, preferably in a separated object to clearly distinct
// exposed functions from local functions.
CommunicationsAgent.prototype.rpcFunctions = {};

CommunicationsAgent.prototype.init = function() {
  var textDiv1 = document.getElementById('do1Text');
  var textDiv2 = document.getElementById('do2Text');
  var textDiv3 = document.getElementById('do3Text');

  var me = this;

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
    })

  this.rpc.request('http://openid.almende.org:8081/agents/controlProxy',{method:'getActive', params:{}})
    .then(function (reply) {
      if (reply == true || reply == 'Overcurrent') {
        me.buttonValues.btn3 = true;
        me.toggleButton('btn3');
        textDiv3.innerHTML = "Actuators are active. (agentreply:" + reply + ")";
      }
      else {
        me.buttonValues.btn3 = false;
        textDiv3.innerHTML = "Actuators are not active. (agentreply:" + reply + ")";
      }
    })
    .catch (function (err) {
    textDiv3.innerHTML = "Error actuator status: " + err.message;
  })
};

CommunicationsAgent.prototype.toggleDSOScenario = function() {
  var button = document.getElementById('btn1');
  var textDiv = document.getElementById('do1Text');
  var me = this;
  this.rpc.request('http://openid.almende.org:8082/agents/dso',{method:'setOverflowscenario', params:{overflow: !this.buttonValues.btn1}})
    .then(function (reply) {
      me.buttonValues.btn1 = !me.buttonValues.btn1;
      me.toggleButton('btn1');
      textDiv.innerHTML = "Request received. (" + new Date().valueOf() + ")";
    })
    .catch(function (err) {
      button.className = button.className.replace("selected", "");
      textDiv.innerHTML = "Error in request:" + err.message;
    })
}


CommunicationsAgent.prototype.clearCurrentDispatch = function() {
  var button = document.getElementById('btn2');
  var textDiv = document.getElementById('do2Text');
  var me = this;
  this.rpc.request("agent1",{method:'hello', params:{}})
    .then(function (reply) {
      me.buttonValues.btn2 = !me.buttonValues.btn2;
      me.toggleButton('btn2');
      textDiv.innerHTML = "Request received. (" + new Date().valueOf() + ")";
    })
    .catch(function (err) {
      button.className = button.className.replace("selected", "");
      textDiv.innerHTML = "Error in request:" + err.message;
    })
}


CommunicationsAgent.prototype.ActuatorsActive = function() {
  var button = document.getElementById('btn3');
  var textDiv = document.getElementById('do3Text');
  var me = this;
  this.rpc.request('http://openid.almende.org:8081/agents/controlProxy',{method:'setActive', params:{state: !this.buttonValues.btn3}})
    .then(function (reply) {
      me.buttonValues.btn3 = !me.buttonValues.btn3;
      me.toggleButton('btn3');
      textDiv.innerHTML = "Request received. (" + new Date().valueOf() + ")";
    })
    .catch(function (err) {
      button.className = button.className.replace("selected", "");
      textDiv.innerHTML = "Error in request:" + err.message;
    })
}


CommunicationsAgent.prototype.toggleButton = function(button) {
  var DOMbutton = document.getElementById(button);
  DOMbutton.className = DOMbutton.className.replace("selected", "");
  var value = this.buttonValues[button];
  if (value == true) {
    DOMbutton.className += ' selected';
  }
}