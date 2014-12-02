

function clickedRoom(roomId) {
  //updateVis(roomId);
  // clear previous details
  if (subspaceAgents[selectedRoom] !== undefined) {
    subspaceAgents[selectedRoom].overviewActive = false;
    subspaceAgents[selectedRoom].loadOverview();
  }
  selectedRoom = roomId;
  if (subspaceAgents[selectedRoom] !== undefined) {
    subspaceAgents[selectedRoom].overviewActive = true;
    subspaceAgents[selectedRoom].loadOverview();
  }
  colorAccordingToDers();
  showInfoDiv(selectedRoom);

  focusOnClick[0] = focus[activeFloorNumber][0];
  focusOnClick[1] = focus[activeFloorNumber][1];
  moveView();
}

function deselect() {
  if (subspaceAgents[selectedRoom] !== undefined) {
    subspaceAgents[selectedRoom].overviewActive = false;
    subspaceAgents[selectedRoom].loadOverview();
  }
  selectedRoom = undefined;
  colorAccordingToDers();
  hideInfoDiv();

  focusOnClick[0] = focus[activeFloorNumber][0];
  focusOnClick[1] = focus[activeFloorNumber][1];
  moveView();
}

function showInfoDiv(roomId) {
  var containerDiv = document.getElementById("informationDiv");
  var headerDiv = document.getElementById("informationHeader");
  var contentDiv = document.getElementById("informationContent");
  containerDiv.style.display = "block";
  headerDiv.innerHTML = roomId.replace(/[_]/g, " ");
  if (subspaceAgents[roomId] === undefined) {
    contentDiv.innerHTML = "No DERs are available in this room."
  }
  else {
    subspaceAgents[roomId].loadDerInterface(contentDiv);
  }
}


function hideInfoDiv() {
  var containerDiv = document.getElementById("informationDiv");
  containerDiv.style.display = "none";
}
