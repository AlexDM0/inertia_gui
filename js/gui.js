

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
    //'<td>' + rooms[roomId].data.energy.total[0] + ' KW</td>' +
    //'<td>' + rooms[roomId].data.temperature[0] + ' C  <span class="preferences">('+rooms[roomId].preferences.temperature+' C)</span></td>' +
    //'<td>' + rooms[roomId].data.occupancy[0] + ' people</td>' +
    //'<td>' + rooms[roomId].data.humidity[0] + ' % <span class="preferences">('+rooms[roomId].preferences.humidity+' %)</span></td>' +
    //'<td>' + rooms[roomId].data.luminance[0] + ' lx <span class="preferences">('+rooms[roomId].preferences.luminance+' lx)</span></td>' +
    '</tr>' +
    '</table>';
  //statsDescription.innerHTML = rooms[roomId].name + ' Status: <span class="preferences">(preferences)</span>';
  //updateVis(roomId);
  showInfoDiv(roomId);
}

function deselect() {
  selectedRoom = undefined;
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
      //'<td>' + rooms[roomId].data.energy.total[0] + ' KW</td>' +
      //'<td>' + rooms[roomId].data.temperature[0] + ' C</span></td>' +
      //'<td>' + rooms[roomId].data.occupancy[0] + ' people</td>' +
      //'<td>' + rooms[roomId].data.humidity[0] + ' %</span></td>' +
    '</tr>' +
  '</table>';
  statsDescription.innerHTML = "Building Status:";
  //updateVis(roomId);
  hideInfoDiv();
}

function showInfoDiv(roomId) {
  var containerDiv = document.getElementById("informationDiv");
  var headerDiv = document.getElementById("informationHeader");
  var contentDiv = document.getElementById("informationContent");
  containerDiv.style.display = "block";
  headerDiv.innerHTML = roomId.replace(/[_]/g, " ");
  if (subspaceAggregatorAgents[roomId] === undefined) {
    contentDiv.innerHTML = "No DERs are available in this room."
  }
  else {
    subspaceAggregatorAgents[roomId].loadDerInterface(contentDiv);
  }
}


function hideInfoDiv() {
  var containerDiv = document.getElementById("informationDiv");
  containerDiv.style.display = "none";
}
