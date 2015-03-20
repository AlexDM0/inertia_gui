"use strict";

function SimulationAgent(id) {
  // execute super constructor
  eve.Agent.call(this, id);

  // extend the agent with RPC functionality
  this.rpc = this.loadModule('rpc', this.rpcFunctions,{timeout: 60000});

  // connect to all transports provided by the system
  this.connect(eve.system.transports.getAll());

  this.LCHid = 0;
  this.DERid = 0;
  this.LCHdata = {};
  this.DERtemplates = {};
}


// extend the eve.Agent prototype
SimulationAgent.prototype = Object.create(eve.Agent.prototype);
SimulationAgent.prototype.constructor = SimulationAgent;
// define RPC functions, preferably in a separated object to clearly distinct
// exposed functions from local functions.
SimulationAgent.prototype.rpcFunctions = {};

// get initial values for buttons and color them accordingly
SimulationAgent.prototype.init = function() {
  // references to the explanation spans

};

SimulationAgent.prototype.loadDERTemplates = function() {
	var me = this;
	this.rpc.request(EVE_ADDRESS, {method:"loadDERTemplates", params: {}}).then(function(reply) {
		me.DERtemplates = reply;
	});
};


/**
 * This is called by the start sim button, the ders (if available) are async
 * collected due to the file attachements this is done with promises.
 * 
 */
SimulationAgent.prototype.startSimulation = function() {
  // show the overlay
  document.getElementById('progressBarWrapper').style.display = "block";

  // construct the simulation data
  this.simData = {
    name: document.getElementById("name").value,
    startTime: document.getElementById("startTime").value,
    duration: document.getElementById("duration").value,
    pace: document.getElementById("pace").value,
    LCHs: {}
  }

  this.LCHIds = Object.keys(this.LCHdata);
  this.LCHIndex = 0;

  if (this.LCHIds.length == 0) {
    this.sendSimulationData();
  }
  else {
    // this will iterate over all LCHs and the DERs if required
    this.parseLCH();
  }
}

/**
 * If all data is collected, it is sent with this.
 */
SimulationAgent.prototype.sendSimulationData = function() {
  console.log("sending simulation data", this.simData);
  this.rpc.request(EVE_ADDRESS, {method:"startSimulation", params: {simulationData:this.simData}});
}


/**
 * Ony by one parse the LCH's. this is done to allow the async handling of files
 * for ders.
 */
SimulationAgent.prototype.parseLCH = function() {
  // finished, send data
  if (this.LCHIndex === this.LCHIds.length) {
    this.sendSimulationData();
    return;
  }

  var LCHid = this.LCHIds[this.LCHIndex];

  var LCHdata = this.LCHdata[LCHid];
  this.simData.LCHs[LCHid] = {id: LCHid, type: LCHdata.type}
  if (LCHdata['DERs'] !== undefined) {
    this.simData.LCHs[LCHid]['DERs'] = {};
    var promises = [];
    // gather promises
    for (var DERid in LCHdata['DERs']) {
      promises.push(this.parseDER(LCHid,DERid));
    }

    // handle the resolving of the promises
    Promise.all(promises)
      .then(function () {
        this.LCHIndex++;
        this.parseLCH();
      }.bind(this))
      .catch(function (err) {
        console.log(err);
      })
  }
  else {
    this.simData.LCHs[LCHid]['data'] = document.getElementById('lch_' + LCHid + '_kv');
    this.LCHIndex++;
    this.parseLCH();
  }
}

/**
 * Handle the async collecting of files with promises
 * 
 */
SimulationAgent.prototype.parseDER = function(LCHid,DERid) {
  return new Promise(function (resolve, reject) {
    this.simData.LCHs[LCHid]['DERs'][DERid] = {id: DERid};
    this.simData.LCHs[LCHid]['DERs'][DERid]['data'] = document.getElementById('lch_' + LCHid + '_' + DERid + '_kv').value;
    this.simData.LCHs[LCHid]['DERs'][DERid]['file'] = null;

    var files = document.getElementById(DERid + '_file').files;
    if (!files.length) {
      console.log("no file selected for der: " + DERid);
      resolve();
    }

    var file = files[0];
    var reader = new FileReader();

    // If we use onloadend, we need to check the readyState.
    reader.onloadend = function(evt) {
      if (evt.target.readyState == FileReader.DONE) { // DONE == 2
        this.simData.LCHs[LCHid]['DERs'][DERid]['file'] = evt.target.result;
        resolve();
      }
    }.bind(this);

    var start = 0;
    var stop = file.size;
    var blob = file.slice(start, stop);
    reader.readAsText(blob);
  }.bind(this));
}




// * UTIL functions *//

// remove LCH from data and DOM
SimulationAgent.prototype.removeLCH = function(id) {
  if(!confirm('Are you sure, permanently delete setup of LCH '+id+'?')) return;
  var div = document.getElementById(id + "_container")
  div.parentNode.removeChild(div);
  delete this.LCHdata[id];
}

//add DER in DOM and data
SimulationAgent.prototype.resetDERFromTemplate = function(areaId, tplId) {
	  var area = document.getElementById(areaId);
	  area.setValue(this.DERTemplates[tplId]);
}

//add DER in DOM and data
SimulationAgent.prototype.addDER = function(id) {
  var container = document.getElementById(id + "_DERcontainer");
  var div = document.createElement("div");
  var areaID = 'lch_' + id + '_' + this.DERid + '_kv';
  var tplButtons = '&lArr; template: <select onChange="resetDERFromTemplate(\''+areaID+'\',this.value);">';
  for(var i in {'Lights':'bla','HVACs':'bla','Appliances':'bla','Generators':'bla'})
  {
	  tplButtons += '<optgroup label="'+i+'">';
	  for(var j in {'Small':'bla','Medium':'bla','Large':'bla'})
		  tplButtons += '<option value="['+i+']['+j+']">\t\t'+j+'</option>';
	  tplButtons += '</optgroup>';
  }
  tplButtons += '</select>';
  var content = 
    '<table class="DERtable" width="100%">' +
    '<tr><th class="leftColumn"><nobr>DER '+this.DERid+'</nobr></th><td align="right">' + tplButtons + '</td>'+
    '<td width="20" rowSpan="3" vAlign=bottom> <div class="typeButton" title="Remove DER '+this.DERid+'" onClick="simAgent.removeDER('+id+','+this.DERid+')"><img class="delete" src="./images/delete.png"/></div></td></tr>'+
    '<tr><th class="leftColumn"></th><td><textarea id="'+areaID+'">{\n'+
    '\t"class": "eu.inertia.model.lch.VirtualDER",\n'+
    '\t"der-model": { \n'+
    '\t\t"type": "lighting", \n'+
    '\t\t"parameters": { ... } \n'+
    '\t\t"schedule": { ... } \n'+
    '\t},\n'+
    '\t"sensors": [ \n'+
    '\t\t{ \n'+
    '\t\t\t"type": "power", \n'+
    '\t\t\t"parameters": { ... } \n'+
    '\t\t},\n'+
    '\t\t{ \n'+
    '\t\t\t"type": "temperature", \n'+
    '\t\t\t"parameters": { ... } \n'+
    '\t\t},\n'+
    '\t\t{ \n'+
    '\t\t\t"type": "power", \n'+
    '\t\t\t"parameters": { ... } \n'+
    '\t\t},\n'+
    '\t},\n'+
    '}</textarea></td></tr>' +
    '<tr><th class="leftColumn">Attach file<br/>(optional)</th><td><input type="file" id="' + this.DERid + '_file"></td></tr>' +
    '</table>';

  div.id = 'lch_' + id + '_' + this.DERid + '_div';
  div.innerHTML = content;
  div.className = 'LCHwrapper';
  container.appendChild(div);

  this.LCHdata[id]['DERs'][this.DERid] = {id: this.DERid, data: null, file: null};
  this.DERid += 1;
}

// removce DER from data and DOM
SimulationAgent.prototype.removeDER = function(LCHid, DERid) {
	  if(!confirm('Are you sure, permanently delete setup of DER '+DERid+' from LCH '+LCHid+'?')) return;
  var div = document.getElementById('lch_' + LCHid + '_' + DERid + '_div')
  div.parentNode.removeChild(div);
  delete this.LCHdata[LCHid]["DERs"][DERid];
}


/**
 * adds a DOM element to the page for a MESO LCH
 */
SimulationAgent.prototype.addMesoLCH = function() {
  var container = document.getElementById("LCHContainer");
  var div = document.createElement("div");
  var areaID = 'lch_' + this.LCHid + '_kv';
  var tplButtons = '';
  for(var i in {'SmallArea':'bla','MediumArea':'bla','LargeArea':'bla'})
	  tplButtons += 
		    '<button onClick="import">'+i+'</button>';
  var content = 
    '<table class="LCHtable" width="100%">' +
    '<tr><th class="leftColumn"><nobr>LCH ' + this.LCHid + '</nobr></th><td>' + tplButtons + '</td>'+
    '<td width="20" rowSpan="2" vAlign="bottom"><div class="typeButton" title="Remove LCH '+this.LCHid+'" onClick="simAgent.removeLCH('+this.LCHid+')"><img class="delete" src="./images/delete.png"/></div></td></tr>'+
    '<tr><th class="leftColumn"></th><td><textarea id="' + areaID + '">{\n'+
    '\t"class": "eu.inertia.model.lch.VirtualMesoLCH",\n'+
    '\t"extrapolation-factors": { \n'+
    '\t\t"lighting" : 2.1, \n'+
    '\t\t"hvac" : 2.5, \n'+
    '\t\t"outlets" : 4.0, \n'+
    '\t\t"generators" : 0.3 \n'+
    '\t},\n'+
    '\t"occupancy-day-type-distribution": { \n'+
    '\t\t"vacant" : 0.1, \n'+
    '\t\t"minimal" : 0.2, \n'+
    '\t\t"normal" : 0.4, \n'+
    '\t\t"maximal" : 0.2, \n'+
    '\t\t"stressed" : 0.1 \n'+
    '\t},\n'+
    '\t"comfort-noise-distribution": { \n'+
    '\t\t"hourly-extremes" : [ 0.95, 1.05 ], \n'+
    '\t\t"daily-extremes" : [ 0.95, 1.05 ], \n'+
    '\t\t"weekly-extremes" : [ 0.95, 1.05 ], \n'+
    '\t},\n'+
    '\t"humidity-noise-distribution" : { \n'+
    '\t\t"hourly-extremes" : [ 0.95, 1.05 ], \n'+
    '\t\t"daily-extremes" : [ 0.9, 1.1 ], \n'+
    '\t\t"weekly-extremes" : [ 0.95, 1.05 ], \n'+
    '\t}, \n'+
    '\t"temperature-noise-distribution" : { \n'+
    '\t\t"hourly-extremes" : [ 0.95, 1.05 ], \n'+
    '\t\t"daily-extremes" : [ 0.9, 1.1 ], \n'+
    '\t\t"weekly-extremes" : [ 0.95, 1.05 ], \n'+
    '\t}\n'+
    '}</textarea></td></tr>' +
    '</table>';

  div.id = this.LCHid + "_container"
  div.innerHTML = content;
  div.className = 'LCHwrapper';
  container.appendChild(div);

  this.LCHdata[this.LCHid] = {type:"meso"};
  this.LCHid += 1;
}


/**
 * adds a DOM element to the page for a MICRO LCH
 */
SimulationAgent.prototype.addMicroLCH = function() {
  var container = document.getElementById("LCHContainer");
  var div = document.createElement("div");
  var content = 
    '<table class="LCHtable" width="100%">' +
    '<tr><th class="leftColumn">LCH ' + this.LCHid + '</th><td><div class="typeButton" onClick="simAgent.addDER(' + this.LCHid + ')">Add DER <img src="./images/add.png"/></div></td>'+
    '<td width="20"><div class="typeButton" title="Remove LCH '+this.LCHid+'" onClick="simAgent.removeLCH('+this.LCHid+')"><img class="delete" src="./images/delete.png"/></div></tr>' +
    '<tr><td colSpan="3"><div class="DERcontainer" id="' + this.LCHid + '_DERcontainer"></div></td></tr>' +
    '</table>';

  div.id = this.LCHid + "_container"
  div.innerHTML = content;
  div.className = 'LCHwrapper';
  container.appendChild(div);

  this.LCHdata[this.LCHid] = {type:"micro", DERs:{}};
  this.LCHid += 1;
}

