/**
 * Created by Alex on 8/19/14.
 */
var graph2dGroups;
var graph2dItems;
var graph2d;
var subGraph1;
var subGraph2;
var subGraph3;
var subGraph4;
var timeline;
var selectedRoomId = "Building";
var toggleGraphId1 = 1;
var toggleGraphId2 = 2;
var toggleGraphId3 = 3;
var toggleGraphId4 = 4;


function loadVis() {
  loadBarGraph();
  loadTimeline();
}


function loadTimeline() {
  var groups = new vis.DataSet();
  for (var room in rooms) {
    if (rooms.hasOwnProperty(room)) {
      groups.add({id: rooms[room].id, content: rooms[room].name, className:"roomGroup"});
    }
  }

  // create a dataset with items
  var items = new vis.DataSet();
  items.add({
    id: 0,
    group: "Admin_NW",
    content: 'Do not disturb',
    start: "2014-06-11 09:00:00",
    end: "2014-06-11 11:00:00",
    type: 'range'
  });

  items.add({
    id: 1,
    group: "Developer_Central",
    content: 'Integration session',
    start: "2014-06-11 15:00:00",
    end: "2014-06-11 17:00:00",
    type: 'range'
  });

  items.add({
    id: 2,
    group: "Meeting_Room",
    content: 'Big important meeting',
    start: "2014-06-11 10:00:00",
    end: "2014-06-11 16:00:00",
    type: 'range'
  });


  // create visualization
  var container = document.getElementById('timelineWrapper');
  var options = {
    groupOrder: 'content',  // groupOrder can be a property name or a sorting function
    start: '2014-06-11 08:00:00',
    end: '2014-06-11 18:00:00',
    stack: false,
    clickToUse: true,
    editable: {
      add: true,         // add new items by double tapping
      updateTime: true,  // drag items horizontally
      updateGroup: true, // drag items from one group to another
      remove: true       // delete an item by tapping the delete button top right
    },
    onAdd: function (item, callback) {newTimelineItem(item,callback);}
  };

  timeline = new vis.Timeline(container);
  timeline.setOptions(options);
  timeline.setGroups(groups);
  timeline.setItems(items);
}


function newTimelineItem(item,callback) {
  item.end = new Date(item.start).getTime() + 1.5*3600000;
  item.content = "Allocated"
  callback(item);
}

function loadGroups(container, visibilityArray) {
  container.add({
    id: 0,
    content: "Energy Consumption (KW)",
    className: "customStyle1",
    visible:visibilityArray[0],
    options: {
      drawPoints:false,
      style:'bar',
      catmullRom: false
    }
  });
  container.add({
    id: 1,
    content: "Occupancy (# people)",
    visible:visibilityArray[1],
    options: {
      style:'line',
      catmullRom: false
    }
  });
  container.add({
    id: 2,
    content: "Temperature (&deg;C)",
    visible:visibilityArray[2],
    options: {
      style:'line',
      catmullRom: false
    }
  });
  container.add({
    id: 3,
    content: "Humidity (%)",
    visible:visibilityArray[3],
    options: {
      style:'line',
      catmullRom: false
    }
  });
  container.add({
    id: 4,
    content: "Luminance (lx)",
    visible:visibilityArray[4],
    options: {
      style:'line',
      catmullRom: false
    }
  });
  container.add({
    id: 5,
    content: "HVAC (KW)",
    className: "graphGroup0",
    visible:visibilityArray[5],
    options: {
      drawPoints:false,
      style:'bar',
      catmullRom: false
    }
  });
  container.add({
    id: 6,
    content: "Lighting (KW)",
    className: "graphGroup1",
    visible:visibilityArray[6],
    options: {
      drawPoints:false,
      style:'bar',
      catmullRom: false
    }
  });
  container.add({
    id: 7,
    content: "Office Appliances (KW)",
    className: "graphGroup3",
    visible:visibilityArray[7],
    options: {
      drawPoints:false,
      style:'bar',
      catmullRom: false
    }
  });
}

function loadBarGraph() {
  var container = document.getElementById('barGraphWrapper');
  var items = [];
  graph2dGroups = new vis.DataSet();
  loadGroups(graph2dGroups,[true, true, true, true, true, true, true, true]);

  graph2dItems = new vis.DataSet(items);
  var options = {
    legend:true,
    clickToUse: true,
    barChart:{
      width:30,
      handleOverlap:'stack'
    },
    dataAxis: {
      visible:true,
      icons:false,
      customRange: {
        left: {min:0}
      }
    },
    graphHeight:300,
    start: '2014-06-11 06:00:00',
    end: '2014-06-11 18:00:00'
  };

  var subOptions = vis.util.deepExtend({},options);
  subOptions.graphHeight = 30;
  subOptions.legend = false;
  subOptions.start = '2014-06-11 08:00:00';
  subOptions.end = '2014-06-11 18:00:00';
  subOptions.dataAxis.visible = false;
  subOptions.dataAxis.customRange.left.min = undefined;
  subOptions.showMajorLabels = false;
  subOptions.showMinorLabels = false;
  subOptions.moveable = false;
  subOptions.clickToUse = false;

  graph2d = new vis.Graph2d(container, graph2dItems, options, graph2dGroups);
  subGraph1 = new vis.Graph2d(document.getElementById('barGraphSubWrapper1'), graph2dItems, subOptions, graph2dGroups);
  subGraph2 = new vis.Graph2d(document.getElementById('barGraphSubWrapper2'), graph2dItems, subOptions, graph2dGroups);
  subGraph3 = new vis.Graph2d(document.getElementById('barGraphSubWrapper3'), graph2dItems, subOptions, graph2dGroups);
  subGraph4 = new vis.Graph2d(document.getElementById('barGraphSubWrapper4'), graph2dItems, subOptions, graph2dGroups);

  graph2d.setOptions(  {groups:{visibility:{0:false,1:false,2:false,3:false,4:false,5:true, 6:true, 7:true }}});
  subGraph1.setOptions({groups:{visibility:{0:false,1:true, 2:false,3:false,4:false,5:false,6:false,7:false}}});
  subGraph2.setOptions({groups:{visibility:{0:false,1:false,2:true, 3:false,4:false,5:false,6:false,7:false}}});
  subGraph3.setOptions({groups:{visibility:{0:false,1:false,2:false,3:true, 4:false,5:false,6:false,7:false}}});
  subGraph4.setOptions({groups:{visibility:{0:false,1:false,2:false,3:false,4:true, 5:false,6:false,7:false}}});

  document.getElementById("barGraphSubWrapper1Exp").onclick = toggleGraphFromID.bind(this, 1);
  document.getElementById("barGraphSubWrapper2Exp").onclick = toggleGraphFromID.bind(this, 2);
  document.getElementById("barGraphSubWrapper3Exp").onclick = toggleGraphFromID.bind(this, 3);
  document.getElementById("barGraphSubWrapper4Exp").onclick = toggleGraphFromID.bind(this, 4);
  updateVis("Building");
}


function updateVis(roomId) {
  if (roomId === undefined) {
    roomId = selectedRoomId;
  }
  else {
    selectedRoomId = roomId;
  }
  var costContainer = document.getElementById("plotCost");
  var multiplier = 1.0;
  if (costContainer.className.indexOf("hidden") == -1) {
    multiplier = 0.25;
  }


  var items = [];
  var roomData = rooms[roomId].data.energy.total;
  for (var i = 0; i < roomData.length; i++) {
    if (i + 9 < 10) {
      items.push({id: i, x:'2014-06-11 0' + (i + 9) + ':00:00', y:roomData[i] * multiplier, group: 0});}
    else {
      items.push({id: i, x:'2014-06-11 ' + (i + 9) + ':00:00', y:roomData[i] * multiplier, group: 0});}
  }

  roomData = rooms[roomId].data.energy.hvac;
  for (var i = 0; i < roomData.length; i++) {
    if (i + 9 < 10) {
      items.push({id: i+1*roomData.length, x:'2014-06-11 0' + (i + 9) + ':00:00', y:roomData[i] * multiplier, group: 5});}
  else {
      items.push({id: i+1*roomData.length, x:'2014-06-11 ' + (i + 9) + ':00:00', y:roomData[i] * multiplier, group: 5});}
  }
  roomData = rooms[roomId].data.energy.lighting;
  for (var i = 0; i < roomData.length; i++) {
    if (i + 9 < 10) {
      items.push({id: i+2*roomData.length, x:'2014-06-11 0' + (i + 9) + ':00:00', y:roomData[i] * multiplier, group: 6});}
else {
      items.push({id: i+2*roomData.length, x:'2014-06-11 ' + (i + 9) + ':00:00', y:roomData[i] * multiplier, group: 6});}
  }
  roomData = rooms[roomId].data.energy.other;
  for (var i = 0; i < roomData.length; i++) {
    if (i + 9 < 10) {
      items.push({id: i+3*roomData.length, x:'2014-06-11 0' + (i + 9) + ':00:00', y:roomData[i] * multiplier, group: 7});}
    else {
      items.push({id: i+3*roomData.length, x:'2014-06-11 ' + (i + 9) + ':00:00', y:roomData[i] * multiplier, group: 7});}
  }
  roomData = rooms[roomId].data.occupancy;
  for (var i = 0; i < roomData.length; i++) {
    if (i + 9 < 10) {
      items.push({id: i+4*roomData.length, x:'2014-06-11 0' + (i + 9) + ':00:00', y:roomData[i], group: 1});}
    else {
      items.push({id: i+4*roomData.length, x:'2014-06-11 ' + (i + 9) + ':00:00', y:roomData[i], group: 1});}
  }
  roomData = rooms[roomId].data.temperature;
  for (var i = 0; i < roomData.length; i++) {
    if (i + 9 < 10) {
      items.push({id: i+5*roomData.length, x:'2014-06-11 0' + (i + 9) + ':00:00', y:roomData[i], group: 2});}
    else {
      items.push({id: i+5*roomData.length, x:'2014-06-11 ' + (i + 9) + ':00:00', y:roomData[i], group: 2});}
  }
  roomData = rooms[roomId].data.humidity;
  for (var i = 0; i < roomData.length; i++) {
    if (i + 9 < 10) {
      items.push({id: i+6*roomData.length, x:'2014-06-11 0' + (i + 9) + ':00:00', y:roomData[i], group: 3});}
    else {
      items.push({id: i+6*roomData.length, x:'2014-06-11 ' + (i + 9) + ':00:00', y:roomData[i], group: 3});}
  }
  roomData = rooms[roomId].data.luminance;
  for (var i = 0; i < roomData.length; i++) {
    if (i + 9 < 10) {
      items.push({id: i+7*roomData.length, x:'2014-06-11 0' + (i + 9) + ':00:00', y:roomData[i], group: 4});}
    else {
      items.push({id: i+7*roomData.length, x:'2014-06-11 ' + (i + 9) + ':00:00', y:roomData[i], group: 4});}
  }
  graph2dItems.update(items);

  if (roomId == "Building") {
    document.getElementById("detailsDescription").innerHTML = "Detailed view of aggregated data in building."
  }
  else {
    document.getElementById("detailsDescription").innerHTML = "Detailed view of data in area: " + rooms[roomId].name;
  }


}

/**
 * this function fills the external legend with content using the getLegend() function.
 */
function populateExternalLegend() {
  var groupsData = graph2dGroups.get();
  var legendDiv = document.getElementById("Legend");
  legendDiv.innerHTML = "";

  // get for all groups:
  for (var i = 0; i < groupsData.length - 3; i++) {
    // create divs
    var containerDiv = document.createElement("div");
    var iconDiv = document.createElement("div");
    var descriptionDiv = document.createElement("div");

    // give divs classes and Ids where necessary

    containerDiv.className = 'legendElementContainer';
    if (graph2d.isGroupVisible(groupsData[i].id) == false && groupsData[i].id != 0) {
      containerDiv.className += " hidden";
    }
    containerDiv.id = groupsData[i].id + "_legendContainer"
    iconDiv.className = "iconContainer";
    descriptionDiv.className = "descriptionContainer";

    // get the legend for this group.
    var legend = graph2d.getLegend(groupsData[i].id,15,15);

    // append class to icon. All styling classes from the vis.css have been copied over into the head here to be able to style the
    // icons with the same classes if they are using the default ones.
    legend.icon.setAttributeNS(null, "class", "legendIcon");

    // append the legend to the corresponding divs
    iconDiv.appendChild(legend.icon);
    descriptionDiv.innerHTML = legend.label;

    // determine the order for left and right orientation
    if (legend.orientation == 'left') {
      descriptionDiv.style.textAlign = "left";
      containerDiv.appendChild(iconDiv);
      containerDiv.appendChild(descriptionDiv);
    }
    else {
      descriptionDiv.style.textAlign = "right";
      containerDiv.appendChild(descriptionDiv);
      containerDiv.appendChild(iconDiv);
    }

    // append to the legend container div
    legendDiv.appendChild(containerDiv);

    // bind click event to this legend element.
    containerDiv.onclick = toggleGraph.bind(this,groupsData[i].id);
  }
}

function toggleGraphFromID(idx) {
  console.log(idx, toggleGraphId1,toggleGraphId2,toggleGraphId3,toggleGraphId4)
  switch (idx) {
    case 1:
      toggleGraph(toggleGraphId1);
      break;
    case 2:
      toggleGraph(toggleGraphId2);
      break;
    case 3:
      toggleGraph(toggleGraphId3);
      break;
    case 4:
      toggleGraph(toggleGraphId4);
      break;

  }
}


/**
 * This function switchs the visible option of the selected group on an off.
 * @param groupId
 */
function toggleGraph(toggleGroupId) {
  toggleGroupId = toggleGroupId + "";
  if (graph2d.isGroupVisible(toggleGroupId) == true || toggleGroupId == "0" && graph2d.isGroupVisible(5) == true) {
  }
  else {
    var groupsData = graph2dGroups.get();
    for (var i = 0; i < groupsData.length - 3 ; i++) {
      var groupId = groupsData[i].id;
      if (graph2d.isGroupVisible(groupId) == true || (groupId == 0 && graph2d.isGroupVisible(5) == true)) {
        document.getElementById(groupId + "_legendContainer").className += " hidden";
      }
    }


    switch(toggleGroupId) {
      case "0":
        graph2d.setOptions( { dataAxis:{customRange:{left:{min:0}}},groups:{visibility:{0:false,1:false,2:false,3:false,4:false,5:true, 6:true, 7:true }}});
        subGraph1.setOptions({groups:{visibility:{0:false,1:true, 2:false,3:false,4:false,5:false,6:false,7:false}}});
        subGraph2.setOptions({groups:{visibility:{0:false,1:false,2:true, 3:false,4:false,5:false,6:false,7:false}}});
        subGraph3.setOptions({groups:{visibility:{0:false,1:false,2:false,3:true, 4:false,5:false,6:false,7:false}}});
        subGraph4.setOptions({groups:{visibility:{0:false,1:false,2:false,3:false,4:true, 5:false,6:false,7:false}}});
        toggleGraphId1 = 1; toggleGraphId2 = 2; toggleGraphId3 = 3; toggleGraphId4 = 4;
        document.getElementById("subLegend").style.display = "block";
        document.getElementById(toggleGroupId + "_legendContainer").className = document.getElementById(toggleGroupId + "_legendContainer").className.replace(" hidden","");
        break;
      case "1":
        subGraph1.setOptions({groups:{visibility:{0:true,1:false,2:false,3:false,4:false,5:false, 6:false, 7:false }}});
        graph2d.setOptions({dataAxis:{customRange:{left:{min:undefined}}},groups:{visibility:{0:false,1:true, 2:false,3:false,4:false,5:false,6:false,7:false}}});
        subGraph2.setOptions({groups:{visibility:{0:false,1:false,2:true, 3:false,4:false,5:false,6:false,7:false}}});
        subGraph3.setOptions({groups:{visibility:{0:false,1:false,2:false,3:true, 4:false,5:false,6:false,7:false}}});
        subGraph4.setOptions({groups:{visibility:{0:false,1:false,2:false,3:false,4:true, 5:false,6:false,7:false}}});
        toggleGraphId1 = 0; toggleGraphId2 = 2; toggleGraphId3 = 3; toggleGraphId4 = 4;
        document.getElementById("subLegend").style.display = "none";
        document.getElementById(toggleGroupId + "_legendContainer").className = document.getElementById(toggleGroupId + "_legendContainer").className.replace(" hidden","");
        break;
      case "2":
        subGraph1.setOptions({groups:{visibility:{0:true,1:false,2:false,3:false,4:false,5:false, 6:false, 7:false }}});
        subGraph2.setOptions({groups:{visibility:{0:false,1:true, 2:false,3:false,4:false,5:false,6:false,7:false}}});
        graph2d.setOptions({dataAxis:{customRange:{left:{min:undefined}}},groups:{visibility:{0:false,1:false,2:true, 3:false,4:false,5:false,6:false,7:false}}});
        subGraph3.setOptions({groups:{visibility:{0:false,1:false,2:false,3:true, 4:false,5:false,6:false,7:false}}});
        subGraph4.setOptions({groups:{visibility:{0:false,1:false,2:false,3:false,4:true, 5:false,6:false,7:false}}});
        toggleGraphId1 = 0; toggleGraphId2 = 1; toggleGraphId3 = 3; toggleGraphId4 = 4;
        document.getElementById("subLegend").style.display = "none";
        document.getElementById(toggleGroupId + "_legendContainer").className = document.getElementById(toggleGroupId + "_legendContainer").className.replace(" hidden","");
        break;
      case "3":
        subGraph1.setOptions({groups:{visibility:{0:true,1:false,2:false,3:false,4:false,5:false, 6:false, 7:false }}});
        subGraph2.setOptions({groups:{visibility:{0:false,1:true, 2:false,3:false,4:false,5:false,6:false,7:false}}});
        subGraph3.setOptions({groups:{visibility:{0:false,1:false,2:true, 3:false,4:false,5:false,6:false,7:false}}});
        graph2d.setOptions({dataAxis:{customRange:{left:{min:undefined}}},groups:{visibility:{0:false,1:false,2:false,3:true, 4:false,5:false,6:false,7:false}}});
        subGraph4.setOptions({groups:{visibility:{0:false,1:false,2:false,3:false,4:true, 5:false,6:false,7:false}}});
        toggleGraphId1 = 0; toggleGraphId2 = 1; toggleGraphId3 = 2; toggleGraphId4 = 4;
        document.getElementById("subLegend").style.display = "none";
        document.getElementById(toggleGroupId + "_legendContainer").className = document.getElementById(toggleGroupId + "_legendContainer").className.replace(" hidden","");
        break;
      case "4":
        subGraph1.setOptions({groups:{visibility:{0:true,1:false,2:false,3:false,4:false,5:false, 6:false, 7:false }}});
        subGraph2.setOptions({groups:{visibility:{0:false,1:true, 2:false,3:false,4:false,5:false,6:false,7:false}}});
        subGraph3.setOptions({groups:{visibility:{0:false,1:false,2:true, 3:false,4:false,5:false,6:false,7:false}}});
        subGraph4.setOptions({groups:{visibility:{0:false,1:false,2:false,3:true, 4:false,5:false,6:false,7:false}}});
        graph2d.setOptions({dataAxis:{customRange:{left:{min:undefined}}},groups:{visibility:{0:false,1:false,2:false,3:false,4:true, 5:false,6:false,7:false}}});
        toggleGraphId1 = 0; toggleGraphId2 = 1; toggleGraphId3 = 2; toggleGraphId4 = 3;
        document.getElementById("subLegend").style.display = "none";
        document.getElementById(toggleGroupId + "_legendContainer").className = document.getElementById(toggleGroupId + "_legendContainer").className.replace(" hidden","");
        break;
    }

//    var groupsData = graph2dGroups.get();
//    var updateQueries = [];
//    for (var i = 0; i < groupsData.length - 3 ; i++) {
//      var groupId = groupsData[i].id;
//      if (groupId == toggleGroupId) {
//        if (graph2d.isGroupVisible(groupId) == true) {
//          updateQueries.push({id:groupId, visible:false});
//          document.getElementById(groupId + "_legendContainer").className += " hidden";
//        }
//        else {
//          if (groupId != "0"){
//            updateQueries.push({id:groupId, visible:true});
//          }
//          document.getElementById(groupId + "_legendContainer").className = document.getElementById(groupId + "_legendContainer").className.replace(" hidden","");
//        }
//      }
//      else {
//        if (graph2d.isGroupVisible(groupId) == true) {
//          updateQueries.push({id:groupId, visible:false});
//          document.getElementById(groupId + "_legendContainer").className += " hidden";
//        }
//      }
//    }
//    if (toggleGroupId == "0") {
//      if (graph2d.isGroupVisible(5) == true) {
//        updateQueries.push({id:5, visible:false});
//        updateQueries.push({id:6, visible:false});
//        updateQueries.push({id:7, visible:false});
//        document.getElementById("subLegend").style.display = "none";
//        graph2d.setOptions({legend:false})
//      }
//      else {
//        updateQueries.push({id:5, visible:true});
//        updateQueries.push({id:6, visible:true});
//        updateQueries.push({id:7, visible:true});
//        document.getElementById("subLegend").style.display = "block";
//        graph2d.setOptions({
//          legend:true,
//          start: '2014-06-11 6:00:00',
//          end: '2014-06-11 18:00:00',
//          dataAxis:{
//            customRange:{left:{min:0}}
//          }
//        })
//      }
//    }
//    else {
//      updateQueries.push({id:5, visible:false});
//      updateQueries.push({id:6, visible:false});
//      updateQueries.push({id:7, visible:false});
//      document.getElementById("0_legendContainer").className += " hidden";
//      document.getElementById("subLegend").style.display = "none";
//      graph2d.setOptions({
//        legend:false,
//        start: '2014-06-11 8:00:00',
//        end: '2014-06-11 18:00:00',
//        dataAxis:{
//          customRange:{left:{min:undefined}}
//        }
//      })
//    }
//    graph2dGroups.update(updateQueries);
  }
}



function enableSubLegend() {
  var costContainer = document.getElementById("plotCost");
  var energyContainer = document.getElementById("plotEnergy");

  costContainer.onclick = updateEnergyPlot.bind(this,"cost");
  energyContainer.onclick = updateEnergyPlot.bind(this,"energy");
}

function updateEnergyPlot(type) {
  var costContainer = document.getElementById("plotCost");
  var energyContainer = document.getElementById("plotEnergy");
  if (type == "cost") {
   if (costContainer.className.indexOf("hidden") != -1) {
     energyContainer.className += " hidden";
     costContainer.className = costContainer.className.replace(" hidden","");
     graph2dGroups.update({id:0, content: "Energy Cost (&euro;)"})
     graph2dGroups.update({id:5, content: "HVAC (&euro;)"})
     graph2dGroups.update({id:6, content: "Lighting (&euro;)"})
     graph2dGroups.update({id:7, content: "Office Appliances (&euro;)"})
   }
  }
  if (type == "energy") {
    if (energyContainer.className.indexOf("hidden") != -1) {
      costContainer.className += " hidden";
      energyContainer.className = energyContainer.className.replace(" hidden","");
      graph2dGroups.update({id:0, content: "Energy Consumption (KW)"})
      graph2dGroups.update({id:5, content: "HVAC (KW)"})
      graph2dGroups.update({id:6, content: "Lighting (KW)"})
      graph2dGroups.update({id:7, content: "Office Appliances (KW)"})
    }
  }
  populateExternalLegend();
  updateVis();
}


