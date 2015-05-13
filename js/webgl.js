/**
 * Created by Alex on 8/19/14.
 */

function loadJSON(path, success, error) {
  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4) {
      if (xhr.status === 200) {
        success(xhr.responseText);
      }
      else {
        error(xhr);
      }
    }
  };
  xhr.open("GET", path, true);
  xhr.send();
}

if (!window.requestAnimationFrame) {
  window.requestAnimationFrame =
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    function (cb, element) {
      window.setTimeout(cb, 1000 / 60);
    };
}

var container;
var camera, scene, renderer;
var geometryArray = [];

var winDims = [];
var winHalfW;

var activeFloorNumber = 0;
var borderSize = 0;
var focusOnClick = [1, 1, 1];
var highlightFocus = {"0": [-6, -2, 15], "1": [9.7, 6.7, 15]};
var normalFocus = {"0": [4.95, -1.6, 23], "1": [21, 7, 23]};
var focus = {"0": [4.95, -1.6, 23], "1": [21, 7, 23]};
var theta = 0.001;
var phi = -0.5 * Math.PI;
var selectedRoom = undefined;
var showMap = true;



function cleanupWebGl() {
  document.getElementById("buildingHistory").style.display = 'none';
  document.getElementById("otherDERs").style.display = 'none';
  document.getElementById("loadingIndicator").style.display = "none";
  document.getElementById('historyLegend').style.display = 'none';
  vis.DOMutil.prepareElements(htmlContainer);
  vis.DOMutil.cleanupElements(htmlContainer);
  var oldCanvas = document.getElementById("webglMapping");
  if (oldCanvas !== null) {
    container.removeChild(oldCanvas)
  }
}

/**
 *
 * @param gbxmlData
 * @param floorNumber
 */
function webglInit(gbxmlData, floorNumber) {
  cleanupWebGl();
  showMap = true;

  document.getElementById("buildingHistory").style.display = 'none';
  document.getElementById("otherDERs").style.display = 'none';

  container = document.getElementById('mapContainer');
  winDims = [container.offsetWidth, container.offsetHeight];
  winHalfW = winDims[0] / 2;
  var rooms = gbxmlData[floorNumber];
  toggleFloorSelectors(floorNumber);

  geometryArray = [];
  activeFloorNumber = floorNumber;

  //setup renderer
  renderer = new THREE.WebGLRenderer({antialias: true, alpha: false});
  renderer.setSize((container.offsetWidth - 2 * borderSize), container.offsetHeight - 2 * borderSize);
  renderer.setClearColor(0xffffff, 0);

  renderer.domElement.id = "webglMapping";
  container.insertBefore(renderer.domElement, container.children[0]);

  camera = new THREE.PerspectiveCamera(45, (container.offsetWidth - 2 * borderSize) / (container.offsetHeight - 2 * borderSize), 0.1, 1000);
  scene = new THREE.Scene();

  var group = new THREE.Group();
  group.position.y = 0;
  scene.add(group);

  for (var i = 0; i < rooms.length; i++) {
    var groundplane = new THREE.Shape();
    for (var j = 0; j < rooms[i].coordinates.length; j++) {
      var point = rooms[i].coordinates[j];
      if (j == 0) {
        groundplane.moveTo(point.x, point.y);
      }
      else {
        groundplane.lineTo(point.x, point.y);
      }
    }
    var material = new THREE.MeshBasicMaterial({color: 0xbbbbbb, overdraw: 0});
    var geometry = new THREE.ShapeGeometry(groundplane);
    var geo = new THREE.Mesh(geometry, material);
    geo.spaceIdRef = rooms[i].spaceIdRef;
    geometryArray.push(geo);
    group.add(geo);
  }

  camera.up = new THREE.Vector3(0, 0, 1);
  renderer.domElement.addEventListener('mousedown', selectArea, false);
  colorAccordingToDers();
  prepareCamera();
  renderer.render(scene, camera);
  updateTextDivs();
}

/**
 *
 * @param event
 */
function selectArea(event) {
  var containerProps = container.getBoundingClientRect();
  var vector = new THREE.Vector3(
    ( (event.x - containerProps.left) / containerProps.width ) * 2 - 1,
    -( (event.y - containerProps.top) / containerProps.height ) * 2 + 1,
    0.5
  );
  vector.unproject(camera);

  var ray = new THREE.Raycaster(camera.position, vector.sub(camera.position).normalize(), 0, 1000);

  var intersects = ray.intersectObjects(geometryArray);

  if (intersects.length > 0) {
    clickedRoom(intersects[0].object.spaceIdRef);
    for (var i = 0; i < intersects.length; i++) {
      intersects[i].object.material.color.setHex(0xffb400);
    }
  }
  else {
    deselect();
  }
}


/**
 *
 */
function moveView() {
  if (selectedRoom !== undefined) {
    var position;
    for (var i = 0; i < geometryArray.length; i++) {
      if (geometryArray[i].spaceIdRef == selectedRoom) {
        position = geometryArray[i].geometry.boundingSphere.center;
        focus[activeFloorNumber][0] -= (highlightFocus[activeFloorNumber][0] - position.x - normalFocus[activeFloorNumber][0] + focusOnClick[0]);
        focus[activeFloorNumber][1] -= (highlightFocus[activeFloorNumber][1] - position.y - normalFocus[activeFloorNumber][1] + focusOnClick[1]);
        focus[activeFloorNumber][2] = highlightFocus[activeFloorNumber][2];
        break;
      }
    }
  }
  else {
    focus[activeFloorNumber][0] = normalFocus[activeFloorNumber][0];
    focus[activeFloorNumber][1] = normalFocus[activeFloorNumber][1];
    focus[activeFloorNumber][2] = normalFocus[activeFloorNumber][2];
  }
  prepareCamera();
  renderer.render(scene, camera);
  updateTextDivs();
  setTimeout(updateTextDivs, 0);
}


function prepareCamera() {
  camera.position.x = Math.sin(theta) * Math.cos(phi) * focus[activeFloorNumber][2] + focus[activeFloorNumber][0];
  camera.position.y = Math.sin(theta) * Math.sin(phi) * focus[activeFloorNumber][2] + focus[activeFloorNumber][1];
  camera.position.z = Math.cos(theta) * focus[activeFloorNumber][2];
  camera.lookAt(new THREE.Vector3(focus[activeFloorNumber][0], focus[activeFloorNumber][1], 0));
}

function webglRender() {
  requestAnimationFrame(webglRender);
  prepareCamera();
  renderer.render(scene, camera);
}

function toScreenXY(position, camera, div) {
  var pos = position.clone();
  projScreenMat = new THREE.Matrix4();
  projScreenMat.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
  pos.applyProjection(projScreenMat);
  var boundingRect = div.getBoundingClientRect();
  var res = {
    x: ( pos.x + 1 ) * 0.5 * boundingRect.width,
    y: ( -pos.y + 1) * 0.5 * boundingRect.height
  };
  return res;
}


function updateTextDivs() {
  if (showMap === true) {
    vis.DOMutil.prepareElements(htmlContainer);
    for (var i = 0; i < geometryArray.length; i++) {
      if (geometryArray[i].spaceIdRef.indexOf("Column") == -1 && geometryArray[i].spaceIdRef.indexOf("WC") == -1 && geometryArray[i].spaceIdRef.indexOf("Storage") == -1) {
        var posVector = new THREE.Vector3(geometryArray[i].geometry.boundingSphere.center.x, geometryArray[i].geometry.boundingSphere.center.y, 0);
        var pos = toScreenXY(posVector, camera, container);
        var div = vis.DOMutil.getDOMElement("div", htmlContainer, container, container.children[1]);
        div.className = 'roomNames';
        div.innerHTML = geometryArray[i].spaceIdRef.replace(/[_]/g, " ") + "<div class='arrowDiv'></div>";
        div.x = pos.x - 0.5 * div.offsetWidth;
        div.y = pos.y - 0.9 * div.offsetHeight;
        div.index = i;
        div.style.left = div.x + 'px';
        var offset = getOverlapAvoidanceOffset(div.x, div.y, div.x + div.offsetWidth, div.y + div.offsetHeight, i);
        div.style.top = div.y + offset + 'px';

        div.onclick = selectArea.bind(this);
      }
    }
    vis.DOMutil.cleanupElements(htmlContainer);
  }
}

function getOverlapAvoidanceOffset(x1, y1, x2, y2, index) {
  for (var i = 0; i < htmlContainer.div.used.length; i++) {
    var div = htmlContainer.div.used[i];
    var dx1 = div.x;
    var dx2 = div.x + div.offsetWidth;
    var dy1 = div.y;
    var dy2 = div.y + div.offsetHeight;
    // if one div overlaps with the other
    if (dx2 < x1 || dx1 > x2 || dy2 < y1 || dy1 > y2) {
      //console.log("no overlap", div.index,index)
    }
    else if (div.index != index) {
      var offset = 0.8 * (y1 - dy1);
      if (Math.abs(offset) < 0.3 * div.offsetHeight) {
        offset = 0.6 * div.offsetHeight;
        if (0.8 * (y1 - dy1) < 0) {
          offset *= -1;
        }
      }
      div.style.top = Number(div.style.top.replace("px", "")) - offset + 'px';
      return offset;
    }
  }
  return 0;
}


function colorAccordingToDers() {
  for (var i = 0; i < geometryArray.length; i++) {
    // if a room has been selected
    if (selectedRoom !== undefined) {
      // if the room has a DER
      if (subspaceAgents[geometryArray[i].spaceIdRef] !== undefined) {
        geometryArray[i].material.color.setHex(0xcccccc);
      }
      else {
        geometryArray[i].material.color.setHex(0xeeeeee);
      }
    }
    else {
      // if the room has a DER
      if (subspaceAgents[geometryArray[i].spaceIdRef] !== undefined) {
        geometryArray[i].material.color.setHex(0xbbbbbb);
      }
      else {
        geometryArray[i].material.color.setHex(0xdddddd);
      }
    }
  }
}


function toggleFloorSelectors(floorNumber) {
  clearFloorSelectors();
  if (floorNumber == '0') {
    document.getElementById("floorNumber0").className += " active";
    floorAgents['Floor_1'].overviewActive = false;
    floorAgents["Floor_1"].loadOverview();
    floorAgents['Floor_0'].overviewActive = true;
    floorAgents["Floor_0"].loadOverview();
  }
  else {
    document.getElementById("floorNumber1").className += " active";
    floorAgents['Floor_0'].overviewActive = false;
    floorAgents["Floor_0"].loadOverview();
    floorAgents['Floor_1'].overviewActive = true;
    floorAgents["Floor_1"].loadOverview();
  }
}

function clearFloorSelectors() {
  document.getElementById("floorNumber0").className = document.getElementById("floorNumber0").className.replace("hidden", "");
  document.getElementById("floorNumber1").className = document.getElementById("floorNumber1").className.replace("hidden", "");
  document.getElementById("history").className = document.getElementById("history").className.replace("hidden", "");
  document.getElementById("rest").className = document.getElementById("rest").className.replace("hidden", "");

  document.getElementById("floorNumber1").className = document.getElementById("floorNumber1").className.replace("active", "");
  document.getElementById("floorNumber0").className = document.getElementById("floorNumber0").className.replace("active", "");
  document.getElementById("history").className = document.getElementById("history").className.replace("active", "");
  document.getElementById("rest").className = document.getElementById("rest").className.replace("active", "");
}