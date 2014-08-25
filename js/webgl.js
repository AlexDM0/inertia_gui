/**
 * Created by Alex on 8/19/14.
 */
/**
 * Created by Alex on 8/18/14.
 */


function loadJSON(path, success, error) {
  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function() {
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
      window.mozRequestAnimationFrame    ||
      window.oRequestAnimationFrame      ||
      window.msRequestAnimationFrame     ||
      function(cb, element) {window.setTimeout(cb, 1000 / 30);};
}

var container;
var camera, scene, renderer;
var geometry = [];

var winDims = [];
var winHalfW;
var projector = new THREE.Projector();

var borderSize = 0;
var userInteracting = false;
var prevPos = null;

var focus = [15.8,6.7]
var radius = 20.15;
var theta = 0.001;
var phi = -0.5 * Math.PI;
var usedAreaData = [
  {id:"Corridor_NW",          name:"Corridor NW",        position: new THREE.Vector3(4 ,9,0)},
  {id:"Corridor_SE",          name:"CorridorSE",         position: new THREE.Vector3(11,9,0)},
  {id:"Researcher's_Office",  name:"Researcher's Office",position: new THREE.Vector3(3.5,4,0)},
  {id:"Rest_Area",            name:"Rest Area",          position: new THREE.Vector3(8.5 ,5,0)},
  {id:"Developer_SW_02",      name:"Dev. SW 02",         position: new THREE.Vector3(12.6,2.5,0)},
  {id:"Developer_SW_01",      name:"Dev. SW 01",         position: new THREE.Vector3(16.6,2.5,0)},
  {id:"Developer_Central",    name:"Developer Central",  position: new THREE.Vector3(15,5.5,0)},
  {id:"Developer_NE",         name:"Developer NE",       position: new THREE.Vector3(13.5,6.7,0)},
  {id:"Long_Corridor",        name:"Long Corridor",      position: new THREE.Vector3(23,9,0)},
  {id:"Meeting_Room",         name:"Meeting Room",       position: new THREE.Vector3(20.3,4,0)},
  {id:"Admin_NW",             name:"Admin NW",           position: new THREE.Vector3(24.1,4,0)},
  {id:"Admin_SE",             name:"Admin SE",           position: new THREE.Vector3(27.4,2,0)}
]

var usedAreas = ["Corridor_NW",
  "Corridor_SE",
  "Researcher's_Office",
  "Rest_Area",
  "Developer_SW_02",
  "Developer_SW_01",
  "Developer_Central",
  "Developer_NE",
  "Long_Corridor",
  "Meeting_Room",
  "Admin_NW",
  "Admin_SE"
];
var spaces;

function init(floors, walls, gbxmlSpaces) {
  spaces = gbxmlSpaces;
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(45, (container.offsetWidth-2*borderSize)/(container.offsetHeight-2*borderSize), 0.1, 1000);

  renderer = new THREE.WebGLRenderer({antialias:true, alpha:true});
  renderer.setSize((container.offsetWidth-2*borderSize), container.offsetHeight-2*borderSize);
  renderer.setClearColor( 0x000000, 0);
  container.insertBefore(renderer.domElement, container.children[0]);

  document.getElementById("loadingIndicator").style.display = "none"



  for (var i = 0; i < floors.length; i++) {
    if (usedAreas.indexOf(floors[i].spaceIdRef) != -1) {
      var material = new THREE.MeshBasicMaterial({color: 0xbbbbbb, overdraw: 0, side: THREE.DoubleSide});
      var geo = new THREE.Mesh(floors[i], material);
      geometry.push(geo);
      scene.add(geo);
    }
  }
//  for (var i = 0; i < walls.length; i++) {
//    if (usedAreas.indexOf(walls[i].spaceIdRef) != -1) {
//      var material = new THREE.MeshBasicMaterial({color: 0x555555, overdraw: 0, side: THREE.DoubleSide});
//      var geo = new THREE.Mesh(walls[i], material);
//      scene.add(geo);
//      geo.scale.z = 0.05;
//    }
//  }

  camera.up = new THREE.Vector3(0,0,1);

  container.children[0].addEventListener( 'mousedown', webglClick, false );
  container.children[0].addEventListener( 'mousemove', webglMove, false );
  container.children[0].addEventListener( 'mouseup', webglRelease, false );
  container.children[0].addEventListener( 'mousewheel', webglScroll, false );
//  document.addEventListener( 'touchstart', onDocumentTouchStart, false );
//  document.addEventListener( 'touchmove', onDocumentTouchMove, false );
  camera.position.x = Math.sin(theta) * Math.cos(phi) * radius + focus[0];
  camera.position.y = Math.sin(theta) * Math.sin(phi) * radius + focus[1];
  camera.position.z = Math.cos(theta) * radius;
  camera.lookAt(new THREE.Vector3(focus[0],focus[1],0));
  renderer.render(scene, camera);
  updateTextDivs();
}

function selectArea(event) {
  var containerProps = container.getBoundingClientRect();
  var vector = new THREE.Vector3(
    ( (event.x - containerProps.left) / containerProps.width ) * 2 - 1 ,
    - ( (event.y - containerProps.top) / containerProps.height ) * 2 + 1 ,
    0.5
  );
  projector.unprojectVector( vector, camera );

  var ray = new THREE.Raycaster( camera.position, vector.sub( camera.position ).normalize(),0,1000);


  var intersects = ray.intersectObjects(geometry);
  if ( intersects.length > 0 ) {
    for (var i = 0; i < geometry.length; i++) {
      geometry[i].material.color.setHex(0xdddddd);
    }
    intersects[0].object.material.color.setHex(0xffb400);
    clickedRoom(intersects[0].object.geometry.spaceIdRef);
  }
  else {
    for (var i = 0; i < geometry.length; i++) {
      geometry[i].material.color.setHex(0xbbbbbb);
    }
    deselect();
  }
}

function webglClick(event) {
  userInteracting = true;
  prevPos = {x:event.x, y: event.y};
  selectArea(event);
}
function webglMove(event) {
  if (userInteracting == true) {
//    phi += 0.003 * (prevPos.x - event.x);
//    theta += 0.003 * (prevPos.y - event.y);
//    theta = Math.min(Math.PI-0.0001,Math.max(theta, 0.0001));
    updateTextDivs();
    prevPos = {x:event.x, y: event.y};
  }
}
function webglRelease(event) {
  userInteracting = false;

}
function webglScroll(event) {
//  if (event.wheelDelta < 0) {radius *= 1.05;}
//  else                      {radius *= 0.95;}
  updateTextDivs();
}


function render() {
  requestAnimationFrame(render);
  camera.position.x = Math.sin(theta) * Math.cos(phi) * radius + focus[0];
  camera.position.y = Math.sin(theta) * Math.sin(phi) * radius + focus[1];
  camera.position.z = Math.cos(theta) * radius;
  camera.lookAt(new THREE.Vector3(focus[0],focus[1],0));
  renderer.render(scene, camera);
}

function toScreenXY( position, camera, div ) {
  var pos = position.clone();
  projScreenMat = new THREE.Matrix4();
  projScreenMat.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);
  pos.applyProjection(projScreenMat);
  var boundingRect = div.getBoundingClientRect();
  var res = {
    x: ( pos.x + 1 ) * 0.5 * boundingRect.width,
    y: ( -pos.y + 1) * 0.5 * boundingRect.height
  };
  return res;
}

