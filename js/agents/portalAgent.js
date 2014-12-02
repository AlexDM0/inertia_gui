/**
 * Created by Alex on 12/1/2014.
 */
function PortalAgent(id) {
  // execute super constructor
  eve.Agent.call(this, id);

  // extend the agent with RPC functionality
  this.rpc = this.loadModule('rpc', this.rpcFunctions);

  // connect to all transports provided by the system
  this.connect(eve.system.transports.getAll());

  this.spaces = {};
  this.subspaces = {};
}

// extend the eve.Agent prototype
PortalAgent.prototype = Object.create(eve.Agent.prototype);
PortalAgent.prototype.constructor = AggregatorAgent;

// define RPC functions, preferably in a separated object to clearly distinct
// exposed functions from local functions.
PortalAgent.prototype.rpcFunctions = {};



PortalAgent.prototype.getMappings = function() {
  var me = this;
  return new Promise(function (resolve, reject) {
    me.rpc.request(EVE_URL + "mappings/", {method: 'getSpaceMapping', params: {}})
      .then(function (spaceMapping) {
        for (var i = 0; i < spaceMapping.length; i++) {
          var space = spaceMapping[i].space;
          // only store as space if it is not 1:1
          if (spaceMapping[i].subspace.length > 1) {
            me.spaces[space] = [];
            for (var j = 0; j < spaceMapping[i].subspace.length; j++) {
              var subspace = spaceMapping[i].subspace[j];
              me.spaces[space].push(subspace);
              me.subspaces[subspace] = space;
            }
          }
          else if (spaceMapping[i].subspace.length == 1) {
            var subspace = spaceMapping[i].subspace[0];
            me.subspaces[subspace] = space;
          }
        }
        resolve();
      })
      .catch(function (err) {reject(err);});
  });
};

PortalAgent.prototype.getDERs = function() {
  var me = this;
  return new Promise(function (resolve, reject) {
  me.rpc.request(EVE_URL + "mgr/",{method:'getAllDers',params:{}})
    .then(function (DERinfo) {
      for (var i = 0; i < DERinfo.length; i++) {
        me.createAggregatorsIfNeeded(DERinfo[i].locations);
        var agent = new DERagent(randomUUID(), DERinfo[i].derID, DERinfo[i].id, DERinfo[i].locations);
        derAgents[DERinfo[i].derID] = agent;
      }
      resolve();
    })
    .catch(function (err) {
      console.log('portalAgent:getDers:error:',err);
      reject(err)})
  });
};

PortalAgent.prototype.createAggregatorsIfNeeded = function(location) {
  if (location.length > 0) {
    for (var i = 0; i < location.length; i++) {
      if (this.spaces[location[i]] === undefined) {
        // make a subspace agent, not a space agents
        if (subspaceAgents[location[i]] === undefined) {
          subspaceAgents[location[i]] = new AggregatorAgent(location[i]);
          subspaceAgents[location[i]].setParent(this.getSpace(location[i]));
        }
      }
      else {
        if (spaceAgents[location[i]] === undefined) {
          spaceAgents[location[i]] = new AggregatorAgent('space_' + location[i]);
          spaceAgents[location[i]].setParent(this.getFloor(location[i]));
        }
      }
    }
  }
};

PortalAgent.prototype.getFloor = function(location) {
  if (this.spaces[location] !== undefined) {
    location = this.spaces[location][0];
  }
  for (var floorId in gbxmlData) {
    if (gbxmlData.hasOwnProperty(floorId)) {
      for (var i = 0; i < gbxmlData[floorId].length; i++) {
        if (gbxmlData[floorId][i].spaceIdRef == location) {
          return 'Floor_' + floorId;
        }
      }
    }
  }

  return undefined;
};

PortalAgent.prototype.getSpace = function(location) {
  for (var space in this.spaces) {
    if (this.spaces.hasOwnProperty(space)) {
      if (this.spaces[space].indexOf(location) != -1) {
        if (spaceAgents[space] === undefined) {
          spaceAgents[space] = new AggregatorAgent('space_' + space);
          spaceAgents[space].setParent(this.getFloor(space));
        }
        return 'space_' + space;
      }
    }
  }
  return undefined;
};

//  -------------------  RPC  -------------------- //

PortalAgent.prototype.rpcFunctions.register = function(params, sender) {
  this.agentsToAggregate[sender] = params;
};

PortalAgent.prototype.rpcFunctions.update = function(params, sender) {
  this.agentsToAggregate[sender] = params;
};