
var buildingHistoryGraph2d;
var buildingHistoryItems = new vis.DataSet();
var buildingHistoryGroups = new vis.DataSet();

var spaceHistoryGraph2d;
var spaceHistoryItems = new vis.DataSet();
var spaceHistoryGroups = new vis.DataSet();

var locationColors = [
  "#ff8d3d",
  "#e1ac33",
  "#c4c12a",
  "#84a722",
  "#5a951d",
  "#6bb022",
  "#7bcc27",
  "#8ce72c",
  "#72f635",
  "#43f364",
  "#52f0be",
  "#60d2ed",
  "#589eda",
  "#4375be",
  "#3150a2",
  "#223085",
  "#2e228c",
  "#53269b",
  "#7e29aa",
  "#b12dba"
];

var dertypeColors = [ "#66b8ec", "#4189db", "#305cb6", "#2e85a9", "#2ac667", "#85dd2b"];
var historyType = 'consumption';

function loadBuildingHistory(type,location) {
  historyType = type;
  if (buildingHistoryGraph2d === undefined) {
    var options = {
      height: 380,
      interpolation:false,
      legend:true,
      style:'bar',
      stack:true,
      drawPoints:false,
      barChart:{align:'center'}
    };
    buildingHistoryGraph2d = new vis.Graph2d(document.getElementById('historyContainer'), buildingHistoryItems, buildingHistoryGroups, options);
  }
  var agent;
  var labels = {
    occupancy:"Amount of people",
    consumption:"Average usage (W)",
    cost:"Hourly costs (&Euro;)",
    temperature:"Outside Temperature (C)",
    humidity:"Outside Humidity (%)"
  };
  switch (type) {
    case 'occupancy':
      location = true;
      document.getElementById('historyViewType').value = 'space';
    case 'consumption':
    case 'cost':
      agent = buildingAgents['Building_ITI'];
      break;
    case 'temperature':
      agent = subspaceAgents['Outside'];
      break;
    case 'humidity':
      agent = subspaceAgents['Outside'];
      break;
  }

  var colors;
  if (location === true) {
    colors = locationColors;
  }
  else {
    colors = dertypeColors;
  }
  // get the agent
  var data = agent.getHistoricData(location, colors, type);
  buildingHistoryGroups.clear();
  buildingHistoryGroups.add(data.groups);
  buildingHistoryItems.clear();
  buildingHistoryItems.add(data.items);
  buildingHistoryGraph2d.setOptions({dataAxis:{left:{title:{text:labels[type]}}}})
}


function loadSpaceHistory() {
  if (spaceHistoryGraph2d === undefined) {
    var options = {
      height: 270,
      interpolation:false,
      legend:true,
      style:'bar',
      stack:true,
      drawPoints:false,
      barChart:{align:'right'}
    };
    spaceHistoryGraph2d = new vis.Graph2d(document.getElementById('spaceHistory'), spaceHistoryItems, spaceHistoryGroups, options);
  }
  var agent = spaceAgents[selectedRoom];
  if (subspaceAgents[selectedRoom] !== undefined) {
    agent = subspaceAgents[selectedRoom];
  }
  //document.getElementById('historyLegend').style.display = 'block';
  var data = agent.getHistoricData(false, dertypeColors, 'consumption');
  spaceHistoryGroups.clear();
  spaceHistoryGroups.add(data.groups);
  spaceHistoryItems.clear();
  spaceHistoryItems.add(data.items);
}

function clearAllHistoryButtons() {
  document.getElementById('historyCosts').className = 'typeButton';
  document.getElementById('historyUsage').className = 'typeButton';
  document.getElementById('historyOccupancy').className = 'typeButton';
  document.getElementById('historyTemperature').className = 'typeButton';
  document.getElementById('historyHumidity').className = 'typeButton';
}

function loadConsumptionHistory(aThis) {
  clearAllHistoryButtons();
  aThis.className = 'typeButton selected';
  loadBuildingHistory('consumption',document.getElementById('historyViewType').value === 'space');
}

function loadCostHistory(aThis) {
  clearAllHistoryButtons();
  aThis.className = 'typeButton selected';
  loadBuildingHistory('cost',document.getElementById('historyViewType').value === 'space');
}

function loadOccupancyHistory(aThis) {
  clearAllHistoryButtons();
  aThis.className = 'typeButton selected';
  loadBuildingHistory('occupancy',document.getElementById('historyViewType').value === 'space');
}

function loadTemperatureHistory(aThis) {
  clearAllHistoryButtons();
  aThis.className = 'typeButton selected';
  loadBuildingHistory('temperature');
}

function loadHumidityHistory(aThis) {
  clearAllHistoryButtons();
  aThis.className = 'typeButton selected';
  loadBuildingHistory('humidity');
}

function toggleHistoryCategories() {
  loadBuildingHistory(historyType,document.getElementById('historyViewType').value === 'space');
}