var artificialSensorTimeline;

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


function toggleDER(derId) {
  derAgents[derId].toggle();
}

function updateIndicator(derId, unit, sendToEVE) {
  var range = document.getElementById("range" + derId);
  var indicator = document.getElementById("rangeNumber" + derId);
  indicator.innerHTML = range.value + unit;
  if (sendToEVE == true) {
    derAgents[derId].updateRange(range.value);
  }
}

function openArtificialSensorSetup(type, sensorAgentId) {
  var overlay = document.getElementById("darkOverlay");
  overlay.style.display = 'block';
  var container = document.getElementById("artificialSensorTimelineContainer");


  var popup = document.getElementById("artificialSensorPopup");
  var low,high,selected;
  if (type == 'temperature') {
    low = 15;
    high = 30;
    selected = 20;
  }
  else if (type == 'occupancy') {
    low = 0;
    high = 30;
    selected = 2;
  }
  if (derAgents[sensorAgentId].sensorsObj[type] !== undefined) {
    selected = derAgents[sensorAgentId].sensorsObj[type].value;
  }

  var items = derAgents[sensorAgentId].getDataSet(type);
  var options = {
    height: '150px',
    editable: true,
    showCurrentTime: true,
    onAdd: function (item, callback) {
      popup.style.display = 'block';
      var innerHTML = '<select id="popupValue">';
      for (var i = low; i < high; i++) {
        innerHTML += '<option value="' + i + '" ' + (selected == i ? 'selected="selected"' : '') + '>' + i + '</option>';
      }
      innerHTML += '</select>';
      document.getElementById("popupValueSpan").innerHTML = innerHTML;
      document.getElementById("artificialSensorSaveBtn").onclick = function () {
        var popupValue = document.getElementById("popupValue");
        var popupDuration = document.getElementById("popupDuration");
        item.content = popupValue.options[popupValue.selectedIndex].value;
        item.end = new Date(item.start).valueOf() + popupDuration[popupDuration.selectedIndex].value * 60000;
        callback(item);
        closeArtificialSensorPopup();
      };
    }
  };

  artificialSensorTimeline = new vis.Timeline(container, items, options);
}

function closeArtificialSensor() {
  if (artificialSensorTimeline !== undefined) {
    artificialSensorTimeline.destroy();
  }
  var overlay = document.getElementById("darkOverlay");
  var popup = document.getElementById("artificialSensorPopup");
  var container = document.getElementById("artificialSensorTimelineContainer");

  overlay.style.display = 'none';
  popup.style.display = 'none';
  container.innerHTML = "";
}


function closeArtificialSensorPopup() {
  var popup = document.getElementById("artificialSensorPopup");
  popup.style.display = 'none';
}

