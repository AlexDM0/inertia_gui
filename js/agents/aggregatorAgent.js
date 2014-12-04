function AggregatorAgent(id) {
  // execute super constructor
  eve.Agent.call(this, id);

  // extend the agent with RPC functionality
  this.rpc = this.loadModule('rpc', this.rpcFunctions);

  // connect to all transports provided by the system
  this.connect(eve.system.transports.getAll());

  this.agentsToAggregate = {};
  this.aggregatedValues = [
    {type:'consumption' , value: 0, method:'sum', unit:'W', counter: 0},
    {type:'temperature' , value: 0, method:'avg', unit:'C', counter: 0},
    {type:'occupancy'   , value: 0, method:'sum', unit:'people', counter: 0},
    {type:'brightness'  , value: 0, method:'avg', unit:'lux', counter: 0},
    {type:'humidity'    , value: 0, method:'avg', unit:'%', counter: 0},
    {type:'co2level'    , value: 0, method:'avg', unit:'ppm', counter: 0}
    ];
  this.parent = undefined;
  this.overviewActive = false;
}

// extend the eve.Agent prototype
AggregatorAgent.prototype = Object.create(eve.Agent.prototype);
AggregatorAgent.prototype.constructor = AggregatorAgent;

// define RPC functions, preferably in a separated object to clearly distinct
// exposed functions from local functions.
AggregatorAgent.prototype.rpcFunctions = {};

AggregatorAgent.prototype.setParent = function(parent) {
  this.parent = parent;
};

AggregatorAgent.prototype.register = function() {
  if (this.parent !== undefined) {
    this.rpc.request(this.parent,{method:'register',params:{sensors:this.aggregatedValues, sensorType:'NONE', agentType:'aggregator'}}).done();
  }
};

AggregatorAgent.prototype.loadDerInterface = function(container) {
  var me = this;
  var spaceDiv = document.createElement('div');
  var derDiv = document.createElement('div');
  var spaceDivHeader = document.createElement("div");
  var subspaceDivHeader = document.createElement("div");

  var spaceHVACdiv = document.createElement('div');
  var spaceLIGHTINGdiv = document.createElement('div');
  var spaceOTHERdiv = document.createElement('div');

  var subspaceHVACdiv = document.createElement('div');
  var subspaceLIGHTINGdiv = document.createElement('div');
  var subspaceOTHERdiv = document.createElement('div');
  spaceDivHeader.className = 'spaceDivHeader';
  subspaceDivHeader.className = 'subspaceDivHeader';

  container.innerHTML = "";
  container.appendChild(spaceDivHeader);
  container.appendChild(spaceDiv);
  spaceDiv.appendChild(spaceHVACdiv);
  spaceDiv.appendChild(spaceLIGHTINGdiv);
  spaceDiv.appendChild(spaceOTHERdiv);
  derDiv.appendChild(subspaceHVACdiv);
  derDiv.appendChild(subspaceLIGHTINGdiv);
  derDiv.appendChild(subspaceOTHERdiv);
  container.appendChild(subspaceDivHeader);
  container.appendChild(derDiv);

  // get subspace agents
  var hasSubspaceDers = false;
  for (var agentId in this.agentsToAggregate) {
    if (this.agentsToAggregate.hasOwnProperty(agentId)) {
      var sensorType = this.agentsToAggregate[agentId].sensorType;
      if (sensorType == "LIGHTING" || sensorType == "HVAC" || sensorType == "OTHER") {
        hasSubspaceDers = true;
      }
      if (this.agentsToAggregate[agentId].agentType == 'DER') {
        me.rpc.request(agentId, {method: 'getUIElement', params: {}}).then(function (reply) {
          if (reply.content != '') {
            var derElement = document.createElement("div");
            derElement.className = 'derElement';
            derElement.id = reply.id;
            derElement.innerHTML = reply.content;
            if (reply.type == "HVAC") {
              subspaceHVACdiv.appendChild(derElement);
            }
            else if (reply.type == "LIGHTING") {
              subspaceLIGHTINGdiv.appendChild(derElement);
            }
            else {
              subspaceOTHERdiv.appendChild(derElement);
            }
          }
        }).done();
      }
    }
  }

  // there is a superspace
  if (this.parent !== undefined) {
    if (this.parent.indexOf("space_") != -1) {
      this.rpc.request(this.parent, {method: "getDERS", params: {}})
        .then(function (derAgents) {
          for (var i = 0; i < derAgents.length; i++) {
            me.rpc.request(derAgents[i], {method: 'getUIElement', params: {}})
              .then(function (reply) {
                if (reply.content != '') {
                  spaceDivHeader.innerHTML = "DERs in shared space:";
                  if (hasSubspaceDers == true) {
                    subspaceDivHeader.innerHTML = "DERs in room:";
                  }
                  var derElement = document.createElement("div");
                  derElement.className = 'derElement';
                  derElement.id = reply.id;
                  derElement.innerHTML = reply.content;
                  if (reply.type == "HVAC") {
                    spaceHVACdiv.appendChild(derElement);
                  }
                  else if (reply.type == "LIGHTING") {
                    spaceLIGHTINGdiv.appendChild(derElement);
                  }
                  else {
                    spaceOTHERdiv.appendChild(derElement);
                  }
                }
              }).done();
          }
        }).done();
    }
  }


};

AggregatorAgent.prototype.loadOverview = function() {
  var container = document.getElementById("aggregatedInfo");
  var allowArtificialSensor = false;
  if (this.parent !== undefined) {
    if (this.parent.indexOf("space_") != -1) {
      allowArtificialSensor = true;
    }
  }

  var sensorAgentId = undefined;
  for (var agentId in this.agentsToAggregate) {
    if (this.agentsToAggregate.hasOwnProperty(agentId)) {
      if (this.agentsToAggregate[agentId].agentType == 'SENSOR_COLLECTIVE') {
        sensorAgentId = agentId;
        break;
      }
    }
  }

  allowArtificialSensor = allowArtificialSensor && sensorAgentId !== undefined;

  if (this.overviewActive == true) {
    var innerHTML = "" +
      '<span class="statsDescription">' + this.id.replace(/[_]/g, " ") + ' Status:</span>' +
      '<span>' +
      '<table class="stats">' +
      '  <tr>' +
      '    <th>Power (total)</th>' +
      '    <th>Temperature (avg)</th>' +
      '    <th>Occupancy (total)</th>' +
      '    <th>Brightness (avg)</th>' +
      '    <th>Humidity (avg)</th>' +
      '    <th>CO2 (avg)</th>' +
      '  </tr>' +
      '  <tr>' +
      '    <td>' + Math.round(this.aggregatedValues[0].value * 100) / 100 + ' ' + this.aggregatedValues[0].unit + '</td>' +
      '    <td>' + Math.round(this.aggregatedValues[1].value * 100) / 100 + ' ' + this.aggregatedValues[1].unit + (allowArtificialSensor ? ' <img class="override" src="./images/cog_edit.png" onclick="openArtificialSensorSetup(\'temperature\',\'' + sensorAgentId + '\');">' : '') + '</td>' +
      '    <td>' + Math.round(this.aggregatedValues[2].value * 100) / 100 + ' ' + this.aggregatedValues[2].unit + (allowArtificialSensor ? ' <img class="override" src="./images/cog_edit.png" onclick="openArtificialSensorSetup(\'occupancy\',\'' + sensorAgentId + '\');">' : '') + '</td>' +
      '    <td>' + Math.round(this.aggregatedValues[3].value * 100) / 100 + ' ' + this.aggregatedValues[3].unit + '</td>' +
      '    <td>' + Math.round(this.aggregatedValues[4].value * 100) / 100 + ' ' + this.aggregatedValues[4].unit + '</td>' +
      '    <td>' + Math.round(this.aggregatedValues[5].value * 100) / 100 + ' ' + this.aggregatedValues[5].unit + '</td>' +
      '  </tr>' +
      '</table>' +
      '</span>';
    var oldContainer = document.getElementById(this.id + "overview");
    if (oldContainer !== null) {
      oldContainer.innerHTML = innerHTML;
    }
    else {
      var newContainer = document.createElement("div");
      newContainer.id = this.id + "overview";
      newContainer.className = 'stats_overview';
      newContainer.innerHTML = innerHTML;
      container.insertBefore(newContainer, container.firstChild);
    }

  }
  else {
    var oldContainer = document.getElementById(this.id + "overview");
    if (oldContainer !== null) {
      container.removeChild(oldContainer)
    }
  }
};

AggregatorAgent.prototype.aggregate = function() {
  // clear values;
  for (var i = 0; i < this.aggregatedValues.length; i++) {
      this.aggregatedValues[i].value   = 0;
      this.aggregatedValues[i].counter = 0;
  }

  // aggregate data
  for (var agentId in this.agentsToAggregate) {
    if (this.agentsToAggregate.hasOwnProperty(agentId)) {
      var agentData = this.agentsToAggregate[agentId].data;
      for (var i = 0; i < agentData.length; i++) {
        var dataField = agentData[i];
        for (var j = 0; j < this.aggregatedValues.length; j++) {
          if (this.aggregatedValues[j]['type'] == dataField.type) {
            if (this.aggregatedValues[j].method == 'avg' && dataField.value > 0 || this.aggregatedValues[j].method == 'sum') {
              this.aggregatedValues[j]['value'] += dataField.value;
              this.aggregatedValues[j]['counter'] += 1;
            }
            if (dataField.unit != "x") {
              this.aggregatedValues[j]['unit'] = dataField.unit;
            }
            break;
          }
        }
      }
    }
  }

  //average over sensor values
  for (var i = 0; i < this.aggregatedValues.length; i++) {
    if (this.aggregatedValues[i].method == 'avg') {
      if (this.aggregatedValues[i].counter > 0) {
        this.aggregatedValues[i].value /= this.aggregatedValues[i].counter;
      }
    }
  }
};

AggregatorAgent.prototype.propagate = function() {
  if (this.parent !== undefined) {
    this.rpc.request(this.parent, {method: 'register', params: {data: this.aggregatedValues, type: this.id}}).done();
  }
};



//  -------------------  RPC  -------------------- //

AggregatorAgent.prototype.rpcFunctions.register = function(params, sender) {
  this.agentsToAggregate[sender] = params;
  this.aggregate();
  this.propagate();
  this.loadOverview();
};

AggregatorAgent.prototype.rpcFunctions.getDERS = function(params, sender) {
  var DERs = [];
  for (var agentId in this.agentsToAggregate) {
    if (this.agentsToAggregate.hasOwnProperty(agentId)) {
      if (this.agentsToAggregate[agentId].agentType == 'DER') {
        DERs.push(agentId);
      }
    }
  }
  return DERs;
};

AggregatorAgent.prototype.rpcFunctions.update = AggregatorAgent.prototype.rpcFunctions.register;