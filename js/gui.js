var htmlContainer = {};

var rooms = {}

rooms["Corridor_NW"] =      new Space("Corridor_NW",{name:"Corridor NW"});
rooms["Corridor_SE"] =      new Space("Corridor_SE",{name:"Corridor Corridor_SE"});
rooms["Researcher's_Office"] = new Space("Researcher's_Office",{name:"Researcher's Office"});
rooms["Rest_Area"] =        new Space("Rest_Area",{name:"Rest Area"});
rooms["Developer_SW_02"] =  new Space("Developer_SW_02",{name:"Dev. SW 02"});
rooms["Developer_SW_01"] =  new Space("Developer_SW_01",{name:"Dev. SW 01"});
rooms["Developer_Central"] =new Space("Developer_Central",{name:"Developer Central"});
rooms["Developer_NE"] =     new Space("Developer_NE",{name:"Developer NE"});
rooms["Long_Corridor"] =    new Space("Long_Corridor",{name:"Long Corridor"});
rooms["Meeting_Room"] =     new Space("Meeting_Room",{name:"Meeting Room"});
rooms["Admin_NW"] =         new Space("Admin_NW",{name:"Admin NW"});
rooms["Admin_SE"] =         new Space("Admin_SE",{name:"Admin SE"});
rooms["Building"] = new Space("Building",{name:"Building"});
rooms["Building"].aggregateData([
  rooms["Corridor_NW"],
  rooms["Corridor_SE"],
  rooms["Researcher's_Office"],
  rooms["Rest_Area"],
  rooms["Developer_SW_02"],
  rooms["Developer_SW_01"],
  rooms["Developer_Central"],
  rooms["Developer_NE"],
  rooms["Long_Corridor"],
  rooms["Meeting_Room"],
  rooms["Admin_NW"],
  rooms["Admin_SE"]
])

function onLoad() {
  loadVis();
  populateExternalLegend();
  enableSubLegend();
  container = document.getElementById('mapContainer');
  winDims = [container.offsetWidth, container.offsetHeight];
  winHalfW = winDims[0] / 2;
  var xml = loadJSON("./gbxml/gbxml.xml", function(data) {
    var parser = new DOMParser()
    var doc = parser.parseFromString(data, "text/xml");
    var data3D = parseGbXML(doc);
    init(data3D.floors, data3D.walls, data3D.spaces);
    render();
  })

}

function stop(event) {
  event.stopPropagation();
}


function updateTextDivs() {
  vis.DOMutil.prepareElements(htmlContainer);
  for (var i = 0; i < usedAreas.length; i++) {
    var pos = toScreenXY(usedAreaData[i].position, camera, container);
    var div = vis.DOMutil.getDOMElement("div",htmlContainer,container, container.children[1]);
    div.className = 'roomNames'
    div.innerHTML = usedAreaData[i].name;
    div.style.left = (pos.x - 0.5 * div.offsetWidth) + 'px';
    div.style.top = pos.y + 'px';
    div.onclick = webglClick.bind(this);
  }
  vis.DOMutil.cleanupElements(htmlContainer);
}


function clickedRoom(roomId) {
  var statsTable = document.getElementById("statsTable");
  var statsDescription = document.getElementById("statsDescription");
  statsTable.innerHTML = '<table class="stats">' +
    '<tr>' +
    '<th>Energy</th>' +
    '<th>Temperature</th>' +
    '<th>Occupancy</th>' +
    '<th>Humidity</th>' +
    '<th>Luminance</th>' +
    '</tr>' +
    '<tr>' +
    '<td>' + rooms[roomId].data.energy.total[0] + ' KW</td>' +
    '<td>' + rooms[roomId].data.temperature[0] + ' C  <span class="preferences">('+rooms[roomId].preferences.temperature+' C)</span></td>' +
    '<td>' + rooms[roomId].data.occupancy[0] + ' people</td>' +
    '<td>' + rooms[roomId].data.humidity[0] + ' % <span class="preferences">('+rooms[roomId].preferences.humidity+' %)</span></td>' +
    '<td>' + rooms[roomId].data.luminance[0] + ' lx <span class="preferences">('+rooms[roomId].preferences.luminance+' lx)</span></td>' +
    '</tr>' +
    '</table>';
  statsDescription.innerHTML = rooms[roomId].name + ' Status: <span class="preferences">(preferences)</span>';
  updateVis(roomId);
  showInfoDiv(roomId);
}

function deselect() {
  var roomId = 'Building';
  var statsTable = document.getElementById("statsTable");
  var statsDescription = document.getElementById("statsDescription");
  statsTable.innerHTML = '<table class="stats">' +
    '<tr>' +
    '<th>Energy</th>' +
    '<th>Temperature</th>' +
    '<th>Occupancy</th>' +
    '<th>Humidity</th>' +
  '</tr>' +
    '<tr>' +
    '<td>' + rooms[roomId].data.energy.total[0] + ' KW</td>' +
    '<td>' + rooms[roomId].data.temperature[0] + ' C</span></td>' +
    '<td>' + rooms[roomId].data.occupancy[0] + ' people</td>' +
    '<td>' + rooms[roomId].data.humidity[0] + ' %</span></td>' +
    '</tr>' +
  '</table>';
  statsDescription.innerHTML = "Building Status:";
  updateVis(roomId);
  hideInfoDiv();
}

function showInfoDiv(roomId) {
  var containerDiv = document.getElementById("informationDiv");
  var headerDiv = document.getElementById("informationHeader");
  var contentDiv = document.getElementById("informationContent");
  containerDiv.style.display = "block";
  headerDiv.innerHTML = rooms[roomId].name;
  rooms[roomId].loadDerInterface(contentDiv);
}


function hideInfoDiv() {
  var containerDiv = document.getElementById("informationDiv");
  containerDiv.style.display = "none";
}
