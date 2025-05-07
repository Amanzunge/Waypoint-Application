var drawControl = new L.Control.Draw({
    draw: {
        polygon: true,
        polyline: false,
        rectangle: false,
        circle: false,
        marker: false,
        circlemarker: false
    },
    edit: false
});
map.addControl(drawControl);

// Variable to store the drawn polygon
var drawnPolygon = null;
let gimbal = 0;
let speed = 0;
// Event listener for when a polygon is drawn
map.on(L.Draw.Event.CREATED, function (event) {
    var layer = event.layer;

    if (layer instanceof L.Polygon) {
        // Remove previously drawn polygon if it exists
        if (drawnPolygon) {
            map.removeLayer(drawnPolygon);
        }

        // Add the new polygon to the map
        drawnPolygon = layer;
        map.addLayer(drawnPolygon);

        // Ensure polygon is fully closed
        var polygonLatLngs = drawnPolygon.getLatLngs()[0];
        if (polygonLatLngs.length > 2) {
            gimbal = document.getElementById('gimbal').value || 0;
            speed = document.getElementById('speed').value || 0;
            
            // Generate waypoints inside the polygon
            generateWaypointsOnPolygonEdges(drawnPolygon);
        }
    }
});

function generateWaypointsOnPolygonEdges(polygon) {
    var polygonLatLngs = polygon.getLatLngs()[0];
    
    // Define the distance between waypoints (in meters)
    const waypointDistance = document.getElementById('distance').value || 20; 

    const gimbal = document.getElementById('gimbal').value || 0;
    const speed = document.getElementById('speed').value || 0;

    // Clear existing waypoints before generating new ones
    clearAllWaypoints();

    for (var i = 0; i < polygonLatLngs.length; i++) {
        var start = polygonLatLngs[i];
        var end = polygonLatLngs[(i + 1) % polygonLatLngs.length];
        
        var distance = start.distanceTo(end);
        var numWaypoints = Math.floor(distance / waypointDistance);
        
        // Add first point (start of the edge)
        addWaypoint(start, globalHeight, speed, gimbal);
        
        // Add intermediate points
        for (var j = 1; j < numWaypoints; j++) {
            var ratio = j / numWaypoints;
            var lat = start.lat + (end.lat - start.lat) * ratio;
            var lng = start.lng + (end.lng - start.lng) * ratio;
            
            var point = L.latLng(lat, lng);
            addWaypoint(point, globalHeight, speed, gimbal);
        }
    }

    updateDistances();
    updatePaths();
    updateWaypointIcons();
    updateTotalFlightLength();
    setupGlobalHeightSlider();
    deletePolygon();
}

function isPointInPolygon(point, polygon) {
    var x = point.lat, y = point.lng;
    var inside = false;
    for (var i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        var xi = polygon[i].lat, yi = polygon[i].lng;
        var xj = polygon[j].lat, yj = polygon[j].lng;
        
        var intersect = ((yi > y) != (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}

function deletePolygon(){
    if (drawnPolygon) {
        map.removeLayer(drawnPolygon);
    }
}