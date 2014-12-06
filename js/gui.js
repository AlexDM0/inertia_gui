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
  var artificialSensor = document.getElementById("artificialSensor");
  artificialSensor.style.display = 'block';
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
    start: new Date().valueOf() - 3600000*6,
    end: new Date().valueOf() + 3600000*6,
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
    artificialSensorTimeline = undefined;
  }
  var overlay = document.getElementById("darkOverlay");
  var popup = document.getElementById("artificialSensorPopup");
  var container = document.getElementById("artificialSensorTimelineContainer");
  var artificialSensor = document.getElementById("artificialSensor");

  overlay.style.display = 'none';
  popup.style.display = 'none';
  artificialSensor.style.display = 'none';
  container.innerHTML = "";
}


function closeArtificialSensorPopup() {
  var popup = document.getElementById("artificialSensorPopup");
  popup.style.display = 'none';
}

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
    }}})
  groups.add({id:'usage', content:'usage',className:'usageGraph', options: {
    shaded: false
  }})

  var datapoints = new vis.DataSet();
  datapoints.add({x: '2014-06-11', y: 10, group:'contract'});
  datapoints.add({x: '2014-06-12', y: 25, group: 'contract'});
  datapoints.add({x: '2014-06-13', y: 30, group: 'contract'});
  datapoints.add({x: '2014-06-14', y: 10, group: 'contract'});
  datapoints.add({x: '2014-06-15', y: 15, group: 'contract'});
  datapoints.add({x: '2014-06-16', y: 30, group: 'contract'});

  datapoints.add({x: '2014-06-11', y: 12, group:'usage'});
  datapoints.add({x: '2014-06-12', y: 15, group: 'usage'});
  datapoints.add({x: '2014-06-13', y: 32, group: 'usage'});
  datapoints.add({x: '2014-06-14', y: 11, group: 'usage'});
  datapoints.add({x: '2014-06-15', y: 14, group: 'usage'});
  datapoints.add({x: '2014-06-16', y: 32, group: 'usage'});

  var options = {
    start: '2014-06-10',
    end: '2014-06-18',
    height: '280px',
    showCurrentTime: true,
    catmullRom:false,
    drawPoints:{
      style:'circle'
    },
    dataAxis: {
      showMinorLabels: true,
      title: {
        left: {
          text: 'Power (W)'
        }
      }
    }
  };
  contractOverviewGraph2d = new vis.Graph2d(container, datapoints, groups, options);

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





























