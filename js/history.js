
var buildingHistoryGraph2d;
var spaceHistoryGraph2d;

function loadBuildingHistory(container, data) {
  if (buildingHistoryGraph2d === undefined) {
    var items = [
      {x: '2014-06-11', y: 10},
      {x: '2014-06-12', y: 25},
      {x: '2014-06-13', y: 30},
      {x: '2014-06-14', y: 10},
      {x: '2014-06-15', y: 15},
      {x: '2014-06-16', y: 30}
    ];

    var dataset = new vis.DataSet(items);
    var options = {
      start: '2014-06-10',
      end: '2014-06-18',
      height: 380
    };
    buildingHistoryGraph2d = new vis.Graph2d(container, dataset, options);
  }
}


function loadSpaceHistory(data) {
  if (spaceHistoryGraph2d === undefined) {
    var items = [
      {x: '2014-06-11', y: 10},
      {x: '2014-06-12', y: 25},
      {x: '2014-06-13', y: 30},
      {x: '2014-06-14', y: 10},
      {x: '2014-06-15', y: 15},
      {x: '2014-06-16', y: 30}
    ];

    var dataset = new vis.DataSet(items);
    var options = {
      start: '2014-06-10',
      end: '2014-06-18',
      height: 270
    };
    spaceHistoryGraph2d = new vis.Graph2d(document.getElementById('spaceHistory'), dataset, options);
  }
}