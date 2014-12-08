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
  var button1 = document.getElementById('do1');
  var textDiv1 = document.getElementById('do1Text');
  var button2 = document.getElementById('do2');
  var textDiv2 = document.getElementById('do2Text');
  var button3 = document.getElementById('do3');
  var textDiv3 = document.getElementById('do3Text');

  button1.className = button1.className.replace("selected", "");
  button2.className = button2.className.replace("selected", "");
  button3.className = button3.className.replace("selected", "");

  var me = this;

  this.rpc.request('http://openid.almende.org:8082/agents/dso',{method:'isOverflowscenario', params:{}})
    .then(function (reply) {
      if (reply == true || reply == 'Overcurrent') {
        me.btn1 = true;
        button1.className += ' selected';
        textDiv1.innerHTML = "isOverflowScenario is Overcurrent (agentreply:" + reply + ")";
      }
      else {
        me.btn1 = false;
        textDiv1.innerHTML = "isOverflowScenario is Overvoltage (agentreply:" + reply + ")";
      }
    })
    .catch (function (err) {
      textDiv1.innerHTML = "Error getting overcurrent: " + err.message;
    })

  //this.rpc.request(EVE_URL + "dso",{method:'isOverflowscenario', params:{}})
  //  .then(function (reply) {
  //    if (reply == true || reply == 'Overcurrent') {
  //      me.btn1 = true;
  //      button2.className += ' selected';
  //      textDiv1.innerHTML = "Overcurrent is true: " + reply;
  //    }
  //    else {
  //      me.btn1 = false;
  //      textDiv1.innerHTML = "Overcurrent is false: " + reply;
  //    }
  //  })
  //  .catch (function (err) {
  //  textDiv1.innerHTML = "Error getting overcurrent: " + err.message;
  //})

  this.rpc.request('http://openid.almende.org:8081/agents/controlProxy',{method:'getActive', params:{}})
    .then(function (reply) {
      if (reply == true || reply == 'Overcurrent') {
        me.btn3 = true;
        button3.className += ' selected';
        textDiv3.innerHTML = "Actuators are active: " + reply;
      }
      else {
        me.btn3 = false;
        textDiv3.innerHTML = "Actuators are not active: " + reply;
      }
    })
    .catch (function (err) {
    textDiv3.innerHTML = "Error actuator status: " + err.message;
  })
};

CommunicationsAgent.prototype.toggleDSOScenario = function() {
  this.rpc.request('http://openid.almende.org:8082/agents/dso',{method:'setOverflowscenario', params:{overflow: !this.buttonValues.btn1}})
    .then(function (reply) {
      var button = document.getElementById('do1');
      button.className = button.className.replace("selected", "");
      var textDiv = document.getElementById('do1Text');
      textDiv.innerHTML = "Request received:" + JSON.stringify(reply);
    })
    .catch(function (err) {
      var button = document.getElementById('do1');
      button.className = button.className.replace("selected", "");
      var textDiv = document.getElementById('do1Text');
      textDiv.innerHTML = "Error in request:" + err.message;
    })
}


CommunicationsAgent.prototype.clearCurrentDispatch = function() {
  this.rpc.request("agent1",{method:'hello', params:{}})
    .then(function (reply) {
      var button = document.getElementById('do2');
      button.className = button.className.replace("selected", "");
      var textDiv = document.getElementById('do2Text');
      textDiv.innerHTML = "Request received:" + JSON.stringify(reply);
    })
    .catch(function (err) {
      var button = document.getElementById('do2');
      button.className = button.className.replace("selected", "");
      var textDiv = document.getElementById('do2Text');
      textDiv.innerHTML = "Error in request:" + err.message;
    })
}


CommunicationsAgent.prototype.ActuatorsActive = function() {
  this.rpc.request('http://openid.almende.org:8081/agents/controlProxy',{method:'setActive', params:{state: !this.buttonValues.btn3}})
    .then(function (reply) {
      var textDiv = document.getElementById('do3Text');
      var button = document.getElementById('do3');
      button.className = button.className.replace("selected", "");
      textDiv.innerHTML = "Request received:" + JSON.stringify(reply);
    })
    .catch(function (err) {
      var textDiv = document.getElementById('do3Text');
      var button = document.getElementById('do3');
      button.className = button.className.replace("selected", "");
      textDiv.innerHTML = "Error in request:" + err.message;
    })
}
