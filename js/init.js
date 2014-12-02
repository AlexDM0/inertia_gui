/**
 * Created by Alex on 11/28/2014.
 */

// configure eve
eve.system.init({
  transports: [
    {
      type: 'local'
    },
    {
      type: 'http'
    }
  ]
});

var buildingAgents = {};
buildingAgents['Building_ITA'] = new AggregatorAgent('Building_ITA');

var floorAgents = {};
floorAgents['Floor_0'] = new AggregatorAgent('Floor_0');
floorAgents['Floor_0'].setParent('Building_ITA')
floorAgents['Floor_1'] = new AggregatorAgent('Floor_1');
floorAgents['Floor_1'].setParent('Building_ITA')

var spaceAgents = {}
var subspaceAgents = {};
var derAgents = {};
var portalAgent = new PortalAgent('portalAgent');
portalAgent.getMappings()
  .then(function () {return portalAgent.getDERs();})
  .then(function () {colorAccordingToDers();})
  .catch(function (err) {
    console.log("getMappings:error",err);
    throw err});


function onLoad() {
  //loadVis();
  //populateExternalLegend();
  //enableSubLegend();
  buildingAgents['Building_ITA'].overviewActive = true;
  buildingAgents["Building_ITA"].loadOverview();
  floorAgents['Floor_1'].overviewActive = true;
  floorAgents["Floor_1"].loadOverview();

  webglInit(gbxmlData,1);
  webglRender();


  //var xml = loadJSON("./gbxml/ITI-Building_FirstFloor_V10.xml", function(data) {
  //  var parser = new DOMParser()
  //  var doc = parser.parseFromString(data, "text/xml");
  //
  //  var data3D = parseGbXML(doc);
  //  console.log('ITI-Building_FirstFloor_V10,',JSON.stringify(data3D.floors))
  //})
  //
  //var xml2 = loadJSON("./gbxml/ITI-Building_Ground_Floor(Kitchen)_V4.xml", function(data) {
  //  var parser = new DOMParser()
  //  var doc = parser.parseFromString(data, "text/xml");
  //
  //  var data3D = parseGbXML(doc);
  //  console.log('ITI-Building_Ground_Floor(Kitchen)_V4,',JSON.stringify(data3D.floors))
  //})

}
