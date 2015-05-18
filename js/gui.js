var artificialSensorTimeline;
var contractOverviewGraph2d;

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
    subspaceAgents[selectedRoom].loadOverview();// cleanup
  }
  selectedRoom = undefined;
  colorAccordingToDers(); // restore colors
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


function toggleDER(derId) {
  derAgents[derId].toggle();
}

function setDERTime(derId) {
  var hours = document.getElementById(derId + "_hourSelect");
  var mins = document.getElementById(derId + "_minuteSelect");
  derAgents[derId].setTime(hours , mins);
}

function updateIndicator(derId, unit, sendToEVE) {
  var range = document.getElementById("range" + derId);
  var indicator = document.getElementById("rangeNumber" + derId);
  indicator.innerHTML = range.value + unit;
  if (sendToEVE == true) {
    derAgents[derId].updateRange(range.value);
  }
}

function updateIndicatorInput(rangeThis, inputId) {
  document.getElementById(inputId).innerHTML = rangeThis.value + '%';
}

// used by the drop down mode box
function updateFacilityProfile() {
  var facilityProfileSelector = document.getElementById("facilityProfileSelector");
  var value = facilityProfileSelector.options[facilityProfileSelector.selectedIndex].value;
  facilityManagerAgent.setProfile(value);
}

function loadContract() {
  var overlay = document.getElementById("darkOverlay");
  overlay.style.display = 'block';
  var contractOverview = document.getElementById("contractOverview");
  contractOverview.style.display = 'block';
  var container = document.getElementById("contractOverviewContainer");

  var groups = new vis.DataSet();
  groups.add({id:'contract', content:'contract',className:'contractGraph', options: {
    shaded: {
      orientation: 'bottom'
    }}});
  groups.add({id:'usage', content:'usage',className:'usageGraph', options: {
    shaded: false
  }});
  groups.add({id:'demand', content:'demand',className:'demandGraph', options: {
    shaded: false
  }});

  contractOverviewGraph2d = new vis.Graph2d(container, facilityManagerAgent.contractData, groups, facilityManagerAgent.contractOptions);

}

function closeContractOverview() {
  if (contractOverviewGraph2d !== undefined) {
    contractOverviewGraph2d.destroy();
    contractOverviewGraph2d = undefined;
  }
  var overlay = document.getElementById("darkOverlay");
  var contractOverview = document.getElementById("contractOverview");
  var container = document.getElementById("contractOverviewContainer");

  overlay.style.display = 'none';
  contractOverview.style.display = 'none';
  container.innerHTML = "";
}

function updateContractOverview() {
  if (contractOverviewGraph2d !== undefined) {
    contractOverviewGraph2d.setOptions(facilityManagerAgent.contractOptions);
  }
}

function unlockProfile() {
  if (facilityManagerAgent.profile == 'Contract') {
    facilityManagerAgent.setProfile(facilityManagerAgent.profiles[0]);
  }
}


























