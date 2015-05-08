"use strict";

function showRest() {
  showMap = false;
  cleanupWebGl();
  clearFloorSelectors();
  var container = document.getElementById("otherDERs");
  var derContainer = document.getElementById("otherDERoverview");
  container.style.display = 'block';
  document.getElementById("rest").className += " active";
  spaceAgents['__noLocation__'].loadDerInterface(derContainer);
}

function showHistory() {
  showMap = false;
  cleanupWebGl();
  clearFloorSelectors();
  document.getElementById("buildingHistory").style.display = 'block';
  document.getElementById("history").className += " active";

  loadBuildingHistory(document.getElementById("historyContainer"));
}

function showSpaceOverview() {
  var overviewContainer = document.getElementById("informationContent");
  if (overviewContainer.style.display !== 'block') {
    var historyContainer = document.getElementById("spaceHistory");
    var overviewTab = document.getElementById('informationHeader');
    var historyTab = document.getElementById('historyHeader');

    overviewContainer.style.display = 'block';
    historyContainer.style.display = 'none';
    overviewTab.className += ' active';
    historyTab.className = historyTab.className.replace(' active','');
  }
}

function showSpaceHistory() {
  var historyContainer = document.getElementById("spaceHistory");

  if (historyContainer.style.display !== 'block') {
    var overviewContainer = document.getElementById("informationContent");
    var overviewTab = document.getElementById('informationHeader');
    var historyTab = document.getElementById('historyHeader');

    historyContainer.style.display = 'block';
    overviewContainer.style.display = 'none';
    historyTab.className += ' active';
    overviewTab.className = overviewTab.className.replace(' active','');
  }
  loadSpaceHistory();
}