/**
 * Created by Alex on 8/20/14.
 */

function Space(id, options) {
  this.id = id;
  this.name = options.name;

  this.preferences = {};
  this.data = {};
  this.pos3d = options.pos3d;
  this.amountLightDers = Math.random()*5 + 1;
  this.lightStatus = [];
  for (var i = 0; i < this.amountLightDers; i++) {
    this.lightStatus.push(Math.round(Math.random()));
  }

  this.container = undefined;
  this.generatePreferences();
  this.generateData();
}

Space.prototype.setPreferences = function(preferences) {

}

Space.prototype.generatePreferences = function(preferences) {
  this.preferences.temperature = Math.round(Math.random()*10 + 15);
  this.preferences.luminance = Math.round(Math.random()*200 + 200);
  this.preferences.humidity = Math.round(Math.random()*20 + 20);
}

Space.prototype.setData = function(data) {

}

Space.prototype.aggregateData = function(spaces) {
  this.data.energy = {hvac:[], lighting:[], other:[], total:[]};
  this.data.occupancy = [];
  this.data.humidity = [];
  this.data.luminance = [];
  this.data.temperature = [];
  for (var i = 0; i < 9; i++) {
    var energyTotal = 0;
    var energyHvacTotal = 0;
    var energyLightingTotal = 0;
    var energyOtherTotal = 0;
    var occupancyTotal = 0;
    var humidityTotal = 0;
    var luminanceTotal = 0;
    var temperatureTotal = 0;
    for (var j = 0; j < spaces.length; j++) {
      energyTotal += spaces[j].data.energy.total[i];
      energyHvacTotal += spaces[j].data.energy.hvac[i];
      energyLightingTotal += spaces[j].data.energy.lighting[i];
      energyOtherTotal += spaces[j].data.energy.other[i];
      occupancyTotal += spaces[j].data.occupancy[i];
      humidityTotal += spaces[j].data.humidity[i];
      luminanceTotal += spaces[j].data.luminance[i];
      temperatureTotal += spaces[j].data.temperature[i];
    }
    this.data.energy.total.push(Math.round(energyTotal));
    this.data.energy.hvac.push(energyHvacTotal);
    this.data.energy.lighting.push(energyLightingTotal);
    this.data.energy.other.push(energyOtherTotal);
    this.data.occupancy.push(occupancyTotal);
    this.data.humidity.push(Math.round(100*humidityTotal / spaces.length)/100);
    this.data.luminance.push(Math.round(100*luminanceTotal / spaces.length)/100);
    this.data.temperature.push(Math.round(100*temperatureTotal / spaces.length)/100);
  }
}

Space.prototype.generateData = function() {
  this.data.energy = {hvac:[], lighting:[], other:[], total:[]};
  this.data.occupancy = [];
  this.data.humidity = [];
  this.data.luminance = [];
  this.data.temperature = [];

  for (var i = 0; i < 9; i++) {
    this.data.temperature.push(Math.round(Math.random()*10 + 15));
    this.data.luminance.push(Math.round(Math.random()*200 + 200));
    this.data.humidity.push(Math.round(Math.random()*20 + 20));
    var hvac = Math.round(Math.random()*5*100) / 100;
    var lighting = Math.round(Math.random()*5*100) / 100;
    var other = Math.round(Math.random()*5*100) / 100;
    this.data.energy.hvac.push(hvac);
    this.data.energy.lighting.push(lighting);
    this.data.energy.other.push(other);
    this.data.energy.total.push(Math.round((hvac + lighting + other)*100) / 100);
    this.data.occupancy.push(Math.round(Math.random()*20));
  }
}


Space.prototype.loadDerInterface = function(container) {
  if (container === undefined) {
    container = this.container;
  }
  else {
    this.container = container;
  }
  container.innerHTML = "";
  var randomId = "hvacInput" + Math.round(Math.random()*1000);
  var hvacDesc = document.createElement("div");
  hvacDesc.innerHTML = "<table class='derTable'><tr><th colspan='4'>HVAC:</th></tr>" +
    "<tr><td class='description'>Consumption </td><td class='data'>" + this.data.energy.hvac[3] + " KW</td>" +
    "<td class='description'>Current Temperature  </td><td class='data'>" + this.data.temperature[3] + " &deg; C</td></tr>" +
    "<tr><td class='description'>Target Temperature  </td><td class='bigdata' colspan='2'><span class='rangeLabel'>15</span> " +
    "<input type='range' min='15' max='30' step='0.5' style='width:198px;' value='"+(this.data.temperature[3]+2)+"' onchange='" +
    "document.getElementById(\"" + randomId + "\").value = this.value;'> " +
    "<span class='rangeLabel'>30</span></td><td><input id='"+randomId+"' value='"+(this.data.temperature[3]+2)+"' class='rangeinputLabel'>&deg; C</td></tr></table>";
  container.appendChild(hvacDesc);

  for (var i = 0; i < this.amountLightDers; i++) {
    var lightDer = document.createElement("div");
    var divclass = "lightButton on";
    var toggleVal = 0;
    var consumption = 100;

    if (this.lightStatus[i] == 0) {
      divclass = "lightButton off";
      consumption = 0;
      toggleVal = 1;
    }
    lightDer.innerHTML = "<table class='lightingTable'><tr><th>Light " + i + ":</th>" +
      "<td class='description'>Consumption:</td><td class='smallDescription'>" + consumption + " W</td>" +
      "<td class='smallDescription'>Status:</td><td class='smallDescription'><div class='"+divclass+"' onclick='rooms[\"" + this.id + "\"].lightStatus["+i+"] = " + toggleVal + "; rooms[\"" + this.id + "\"].loadDerInterface();'></div>" +
      "</td></tr></table>"
    container.appendChild(lightDer);
  }

}