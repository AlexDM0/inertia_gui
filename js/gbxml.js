/**
 * Import tool to load a gbxml model into Three.js
 */


/**
 * Read a cartesian point from xml and return a vector
 * @param xml
 * @return {THREE.Vector3} vector
 */
function parseCartesianPoint(xml) {
  if(xml.nodeName !== 'CartesianPoint'){
//    console.log(xml);
    throw new TypeError('CartesianPoint expected');
  }

  var childNodes = xml.children,
      x = Number(childNodes[0].childNodes[0].nodeValue),
      y = Number(childNodes[1].childNodes[0].nodeValue),
      z = Number(childNodes[2].childNodes[0].nodeValue);

  return new THREE.Vector3(x, y, z);
}

/**
 * Read a poly loop from xml document
 * @param xml
 * @return {Array.<THREE.Geometry>} geometries
 */
function parsePolyLoop(xml, spaceIdRef) {
  if(xml.nodeName !== 'PolyLoop'){
//    console.log(xml);
    throw new TypeError('PolyLoop expected');
  }

  if (xml.children.length < 4)
	  return [];
  var a = parseCartesianPoint( xml.children[0]),
      b = parseCartesianPoint( xml.children[1]),
      c = parseCartesianPoint( xml.children[2]),
      d = parseCartesianPoint( xml.children[3]),
      uvs = [
        new THREE.Vector2( 0, 0 ),
        new THREE.Vector2( 0, 1 ),
        new THREE.Vector2( 1, 1 ),
        new THREE.Vector2( 1, 0 )
      ];

  var inner = new THREE.Geometry();
  inner.vertices.push( a );
  inner.vertices.push( b );
  inner.vertices.push( c );
  inner.faces.push( new THREE.Face3( 0, 1, 2) );
  inner.computeFaceNormals();

  // add uvs
//  inner.faceVertexUvs[ 0 ].push( uvs );


  var inner2 = new THREE.Geometry();
  inner2.vertices.push( c );
  inner2.vertices.push( a );
  inner2.vertices.push( d );
  inner2.faces.push( new THREE.Face3( 0, 1, 2) );
  inner2.computeFaceNormals();

  inner.merge(inner2);
  inner.spaceIdRef = spaceIdRef;

  // add uvs
//  outer2.faceVertexUvs[ 0 ].push( uvs );

  return [inner];
}

/**
 * Read a planar geometry from xml
 * @param xml
 * @return {Array.<THREE.Geometry>} geometries
 */
function parsePlanarGeometry(xml, type, spaceIdRef) {
  var geometries = [];
  if(xml.nodeName !== 'PlanarGeometry'){
//    console.log(xml);
    throw new TypeError('PlanarGeometry expected');
  }

  // loop over all polyLoops
  var childNodes = xml.childNodes;
  for (var i = 0, ii = childNodes.length; i < ii; i++) {
    var child = xml.childNodes[i];
    if(child.nodeName === 'PolyLoop' && child.children){
      if (type === "UndergroundSlab") {
        geometries = geometries.concat(parseFloors(child, spaceIdRef));
      }
      else {
        geometries = geometries.concat(parsePolyLoop(child, spaceIdRef));
      }
    }
  }

  return geometries;
}

/**
 * Parse a surface
 * @param xml
 * @return {Array.<THREE.Geometry>} geometries
 */
function parseSurface (xml, types) {
  var geometries = [];
  var surfaceType = xml.attributes.getNamedItem('surfaceType');
  var spaceIdRef = xml.childNodes[1].attributes.getNamedItem('spaceIdRef').value;
  if (surfaceType == null)
	  return geometries;
  var type = surfaceType.value;
  if (types.indexOf(type) != -1) {
    var childNodes = xml.childNodes;
    for (var i = 0, ii = childNodes.length; i < ii; i++) {
      var child = childNodes[i];
      if (child.nodeName === 'PlanarGeometry') {
        geometries = geometries.concat(parsePlanarGeometry(child, type, spaceIdRef));
      }
    }
  }

  return geometries;
}


function parseFloors(xml, spaceIdRef) {
  var points = [];
  for (var i = 0; i < xml.children.length; i++) {
    points.push(parseCartesianPoint(xml.children[i]))
  }

  var floor = []
  //for (var i = 0; i < points.length; i++) {
  //  var point = points[i];
  //  if (i == 0) {
  //    floor.moveTo(point.x, point.y);
  //  } else {
  //    floor.lineTo(point.x, point.y);
  //  }
  //}
  for (var i = 0; i < points.length; i++) {
    var point = points[i];
    floor.push({x:point.x, y:point.y});
  }
  var shape = {};
  shape['coordinates'] = floor;
  shape['spaceIdRef']  = spaceIdRef;
//
//  var floor2 = new THREE.Shape();
//  for (var i = points.length - 1; i >= 0; i--) {
//    var point = points[i];
//    if (i == points.length - 1) {
//      floor2.moveTo(point.x, point.y);
//    } else {
//      floor2.lineTo(point.x, point.y);
//    }
//  }
//
//  var geometry2 = floor2.makeGeometry();
//  geometry2.computeFaceNormals();
//
//  THREE.GeometryUtils.merge(geometry, geometry2);

  return [shape];
}
/**
 * Parse all surfaces
 * @param xml   A gbXML file containing a building
 * @returns {Array.<THREE.Geometry>} geometries
 */
function parseSurfaces (xml, types) {
  var geometries = [];
  var surfaces = xml.getElementsByTagName('Surface');

  for (var i = 0, ii = surfaces.length; i < ii; i++) {
    var surface = surfaces[i];
    geometries = geometries.concat(parseSurface(surface, types));
  }

return geometries;
}

/**
 * Parse an opening
 * @param xml
 * @return {Array.<THREE.Geometry>} geometries
 */
function parseOpening (xml) {
  var geometries = [];
  var distance = 0.01; // meters, distance of door opening from the wall

  // just pick the first polyloop. There is supposed to be only one.
  // TODO: improve this...
  var polyLoop = xml.getElementsByTagName('PolyLoop')[0];
  if (polyLoop) {
    var vectors = [];
    for (var i = 0; i < polyLoop.children.length; i++) {
      vectors[i] = parseCartesianPoint(polyLoop.children[i]);
    }

    if (vectors.length > 2) {
      // calculate the cross product. We have to move the surface a little out of the wall
      var v1 = vectors[0].clone().negate().add(vectors[1]);
      var v2 = vectors[0].clone().negate().add(vectors[2]);
      var crossProd = new THREE.Vector3();
      crossProd.crossVectors(v1, v2).normalize();

      // create surface on one side of the wall
      var crossProdInner = crossProd.clone().multiplyScalar(distance);
      var inner = new THREE.Geometry();
      vectors.forEach(function (vector) {
        inner.vertices.push( vector.clone().add(crossProdInner) );
      });
      inner.faces.push( new THREE.Face3( 0, 1, 2) );
      inner.computeFaceNormals();
      geometries.push(inner);



      // create surface on the other side of the wall
      var crossProdOuter = crossProd.clone().multiplyScalar(-distance);
      var outer = new THREE.Geometry();
      vectors.forEach(function (vector) {
        outer.vertices.push( vector.clone().add(crossProdOuter ) );
      });
      outer.faces.push( new THREE.Face3( 2, 1, 0) );
      outer.computeFaceNormals();
      geometries.push(outer);
    }
  }

  return geometries;
}

/**
 * Parse all openings (doors)
 * @param xml   A gbXML file containing a building
 * @returns {Array.<THREE.Geometry>} geometries
 */
function parseOpenings (xml) {
  var geometries = [];
  var openings = xml.getElementsByTagName('Opening');

  for (var i = 0, ii = openings.length; i < ii; i++) {
    var opening = openings[i];
    if (opening.children) {
      geometries = geometries.concat(parseOpening(opening));
    }
  }

  return geometries;
}

/**
 * Parse a space. returns an object containing the id, name, and an estimated
 * center point of the room.
 * @param xml
 * @return {Object} space
 */
function parseSpace (xml) {
  var id = xml.attributes.getNamedItem('id').value;
  var names = xml.getElementsByTagName('Name');
  var name = (names && names[0]) ? names[0].childNodes[0].nodeValue : id;

  var points = xml.getElementsByTagName('CartesianPoint');

  var count = points.length,  // total number of points
      xSum = 0,               // all x coordinates summed up
      ySum = 0,               // all y coordinates summed up
      zSum = 0;               // all z coordinates summed up
  for (var i = 0; i < count; i++) {
    var point = points[i];
    var childNodes = point.children;

    if (childNodes) {
      xSum += Number(childNodes[0].childNodes[0].nodeValue);
      ySum += Number(childNodes[1].childNodes[0].nodeValue);
      zSum += Number(childNodes[2].childNodes[0].nodeValue);
    }
  }

  // calculate average of all points
  var xAvg = xSum / count;
  var yAvg = ySum / count;
  var zAvg = zSum / count;

  return {
    id: id,
    name: name,
    center: new THREE.Vector3(xAvg, yAvg, zAvg)
  };
}

/**
 * Parse the spaces. returns an object containing each room and door,
 * giving their id, name, and an estimated center point.
 * @param {Element} xml   gbXML document
 * @return {Object} spaces
 */
function parseSpaces (xml) {
  var spaces = {};
  var i, ii;

  // parse spaces
  var xmlSpaces = xml.getElementsByTagName('Space');
  for (i = 0, ii = xmlSpaces.length; i < ii; i++) {
    var xmlSpace = xmlSpaces[i].cloneNode(true);
    if (xmlSpace.getElementsByTagName('Surface').length == 0) {
    	var surfaces = xml.getElementsByTagName('Surface');
    	for (var n = 0; n < surfaces.length; n++) {
    		var surface = surfaces[n];
    		var adjSpaces = surface.getElementsByTagName('AdjacentSpaceId');
    		for (var m = 0; m < adjSpaces.length; m++) {
    			var adjSpace = adjSpaces[m];
    			if (adjSpace.getAttribute('spaceIdRef') == xmlSpace.getAttribute('id')) {
    				xmlSpace.appendChild(surface.cloneNode(true));
//    				console.log(adjSpace.getAttribute('spaceIdRef')+" == "+xmlSpace.getAttribute('id'))
    				break;
    			}
    		}
    	}
    }

//    console.log(xmlSpace);
    var space = parseSpace(xmlSpace);
    spaces[space.id] = space;
  }

  // parse openings
  var xmlOpenings = xml.getElementsByTagName('Opening');
  for (i = 0, ii = xmlOpenings.length; i < ii; i++) {
    var xmlOpening = xmlOpenings[i];
    var opening = parseSpace(xmlOpening);
    spaces[opening.id] = opening;
  }

  return spaces;
}

/**
 * Parse a GbXML document
 * @param xml
 * @return {{surfaces: Array.<THREE.Geometry>, openings: Array.<THREE.Geometry>, spaces:Object}} building
 */
function parseGbXML(xml) {
  return {
    floors: parseSurfaces(xml, ["UndergroundSlab"]),
    walls: parseSurfaces(xml, ["ExteriorWall","InteriorWall"]),
    openings: parseOpenings(xml),
    spaces: parseSpaces(xml)
  };
}


