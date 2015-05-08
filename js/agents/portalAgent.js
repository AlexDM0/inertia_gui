/**
 * Created by Alex on 12/1/2014.
 */
function PortalAgent(id) {
  // execute super constructor
  eve.Agent.call(this, id);

  // extend the agent with RPC functionality
  this.rpc = this.loadModule('rpc', this.rpcFunctions,{timeout: 60000});

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

          me.spaces[space] = [];
          for (var j = 0; j < spaceMapping[i].subspace.length; j++) {
            var subspace = spaceMapping[i].subspace[j];
            me.spaces[space].push(subspace);
            me.subspaces[subspace] = space;
          }
        }
        me.spaces['__noLocation__'] = [];
        resolve();
      })
      .catch(function (err) {reject(err);});
  });
};

PortalAgent.prototype.getSensorLocations = function() {
  var me = this;
  return new Promise(function (resolve, reject) {
  me.rpc.request(EVE_URL + "mgr/",{method:'getAllLocations',params:{}})
    .then(function (locationsObject) {
      for (var locationId in locationsObject) {
        var locationSensors = locationsObject[locationId];
        me.createAggregatorsIfNeeded(locationSensors.locations);
        var locationId = randomUUID();
        var agent = new DERagent(locationId, locationSensors.id, locationSensors.locations);
        derAgents[locationId] = agent; // we use a sensor as a der agent
      }
      resolve();
    })
    .catch(function (err) {
      console.log('portalAgent:getDers:error:',err);
      reject(err)})
  });
};
PortalAgent.prototype.getDERs = function() {
  var me = this;
  return new Promise(function (resolve, reject) {
  me.rpc.request(EVE_URL + "mgr/",{method:'getAllDers',params:{}})
    .then(function (DERObject) {
      for (var derId in DERObject) {
        var derEntree = DERObject[derId];
        me.createAggregatorsIfNeeded(derEntree.locations);
        var derID = randomUUID();
        var agent = new DERagent(derID, derEntree.id, derEntree.locations);
        derAgents[derID] = agent;
      }
      resolve();
    })
    .catch(function (err) {
      console.log('portalAgent:getDers:error:',err);
      reject(err)})
  });
};

PortalAgent.prototype.createAggregatorsIfNeeded = function(location) {
  if (location.length == 0) {
    location = ['__noLocation__'];
  }

  for (var i = 0; i < location.length; i++) {
    // Check if this is a space agent
    if (this.spaces[location[i]] === undefined || this.subspaces[location[i]] !== undefined) {
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