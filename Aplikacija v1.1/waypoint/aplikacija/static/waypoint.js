// Initialize the map
var map = L.map('map').setView([44.77599, 20.47852], 9);

// Add a tile layer (using OpenStreetMap tiles)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Function to create a custom icon
function createCustomColorIcon(color) {
    return L.icon({
        iconUrl: `/static/icons/marker-icon-${color}.png`,
        shadowUrl: '/static/icons/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });
}

// Function to update all waypoint icons
function updateWaypointIcons() {
    waypoints.forEach((waypoint, index) => {
        const color = index === 0 ? 'orange' : 'gold';
        waypoint.marker.setIcon(createCustomColorIcon(color));
    });
}
// Arrays to store waypoints and paths
var waypoints = [];
var paths = [];
// Function to add a waypoint
function addWaypoint(latlng, altitude, speed, gimbal) {
    const order = waypoints.length + 1;
    const color = order === 1 ? 'orange' : 'gold';
    
    const marker = L.marker(latlng, {
        draggable: true,
        icon: createCustomColorIcon(color)
    }).addTo(map)
        .bindPopup(createPopupContent(latlng, altitude, speed, gimbal, order));

    attachPopupEvents(marker);
    bindDragEvents(marker);

    waypoints.push({
        latlng: latlng,
        altitude: altitude,
        speed: speed,
        gimbal: gimbal,
        marker: marker,
        order: order
    });

    updateDistances();
    updatePaths();
    updateWaypointIcons();
}

// Delete Waypoint Function
function deleteWaypoint(marker) {
    const waypointIndex = waypoints.findIndex(wp => wp.marker === marker);
    
    if (waypointIndex === -1) {
        console.error('Waypoint not found for marker');
        return;
    }


    console.log('Deleting waypoint at index:', waypointIndex);
    console.log('Waypoints array before deletion:', waypoints.map(wp => ({
        latlng: wp.latlng,
        order: wp.order
    })));



    // Remove the marker from the map
    map.removeLayer(marker);

    // Remove the waypoint from the waypoints array
    waypoints.splice(waypointIndex, 1);

    console.log('Waypoints array after deletion:', waypoints.map(wp => ({
        latlng: wp.latlng,
        order: wp.order
    })));

    //Reorder the remaining waypoints
    waypoints.forEach((wp, index) => {
        wp.order = index + 1; //+1 Update the order based on the new index
        wp.marker.setPopupContent(createPopupContent(wp.latlng, wp.altitude, wp.speed, wp.gimbal, wp.order, false));
    });

    console.log('Waypoints array after reindexing:', waypoints.map(wp => ({
        latlng: wp.latlng,
        order: wp.order
    })));


    // Update paths, distances, and waypoint icons
    updatePaths();
    updateDistances();
    updateWaypointIcons();

}

//if(wp.order.length === waypoints.length)
  //  waypoints[waypoints.length] =

// Update function
function saveWaypoint(marker) {
    //console.log('Saving waypoint for marker:', marker);
    const waypoint = waypoints.find(wp => wp.marker === marker);
    if (!waypoint) {
        console.error('Waypoint not found for marker');
        return;
    }

    const popupElement = marker.getPopup().getElement();
    if (!popupElement) {
        console.error('Popup element not found');
        return;
    }

    // Helper function to safely get input values
    const getInputValue = (selector, defaultValue) => {
        const element = popupElement.querySelector(selector);
       // console.log(`Element ${selector}:`, element);
        return element ? (parseFloat(element.value) || defaultValue) : defaultValue;
    };

    const newAltitude = getInputValue('.altitude-input', waypoint.altitude);
    const newSpeed = getInputValue('.speed-input', waypoint.speed);
    const newGimbal = getInputValue('.gimbal-input', waypoint.gimbal);
    const newOrder = getInputValue('.order-input', waypoint.order);

    //console.log('New values:', { newAltitude, newSpeed, newGimbal, newOrder });

    // Update waypoint properties
    waypoint.altitude = newAltitude;
    waypoint.speed = newSpeed;
    waypoint.gimbal = newGimbal;

    // Handle order change
    if (newOrder !== waypoint.order) {
        reorderWaypoint(waypoint, newOrder);
    } else {
        // Update the popup content with the new values
        const newContent = createPopupContent(waypoint.latlng, waypoint.altitude, waypoint.speed, waypoint.gimbal, waypoint.order, false);
        marker.setPopupContent(newContent);
        marker.getPopup().update();
        reorderWaypoint(waypoint, newOrder);
    }

    updateDistances();
    updatePaths();

}

// Event listener for map clicks to add waypoints
map.on('click', function (e) {
    // Check if the click is on the map itself, not on a popup or marker
    if (e.originalEvent.target === map._container) {
        const altitude = document.getElementById('altitude').value || 0;
        const speed = document.getElementById('speed').value || 0;
        const gimbal = document.getElementById('gimbal').value || 0;
        addWaypoint(e.latlng, altitude, speed, gimbal);
    }
});

// Function to bind dragging events to a marker
function bindDragEvents(marker) {
    marker.on('dragstart', function () {
    });

    marker.on('move', function () {
        const newLatLng = marker.getLatLng();
    });

    marker.on('dragend', function () {
        const newLatLng = marker.getLatLng();

        // Update waypoint's position in the waypoints array
        const waypoint = waypoints.find(wp => wp.marker === marker);
        if (waypoint) {
            waypoint.latlng = newLatLng; // Update the waypoint latlng
        }

        // Update distances and paths after dragging ends
        updateDistances();

        updatePaths();

    });
}
// New function to handle waypoint reordering
function reorderWaypoint(waypoint, newOrder) {
    //console.log('Reordering waypoint:', waypoint, 'to new order:', newOrder);
    const oldOrder = waypoint.order;
    if (newOrder < 1 || newOrder > waypoints.length || newOrder === oldOrder) {
        return;
    }

    // Remove the waypoint from its current position
    const waypointIndex = waypoints.findIndex(wp => wp === waypoint);
    waypoints.splice(waypointIndex, 1);

    // Insert the waypoint at its new position
    waypoints.splice(newOrder - 1, 0, waypoint);

    // Update the order of all waypoints
    waypoints.forEach((wp, index) => {
        wp.order = index + 1;
        wp.marker.setPopupContent(createPopupContent(wp.latlng, wp.altitude, wp.speed, wp.gimbal, wp.order, false));
    });

    updatePaths();
    updateDistances();
    updateWaypointIcons();
}

function updatePaths() {
    console.log('Updating paths. Number of waypoints:', waypoints.length);
    //console.log('Waypoint coordinates:', waypoints.map(wp => wp.latlng));

    // Remove old paths
    paths.forEach(path => map.removeLayer(path));
    paths = [];
    if (returnPath) {
        map.removeLayer(returnPath);
        returnPath = null;
    }

    // Only draw paths if they are enabled and there are at least 2 waypoints
    if (isPathEnabled && waypoints.length > 1) {
        const pathCoordinates = waypoints.map(wp => wp.latlng);

        const newPath = L.polyline(pathCoordinates, { color: 'blue' }).addTo(map);
        paths.push(newPath);

        // Handle return paths
        if (returnOption === 'through-all') {
            const returnCoordinates = [...pathCoordinates].reverse();
            returnPath = L.polyline(returnCoordinates, { color: 'red', dashArray: '5, 5' }).addTo(map);
        } else if (returnOption === 'direct' && waypoints.length > 1) {
            const firstWaypoint = waypoints[0].latlng;
            const lastWaypoint = waypoints[waypoints.length - 1].latlng;
            returnPath = L.polyline([lastWaypoint, firstWaypoint], { color: 'red', dashArray: '5, 5' }).addTo(map);
        }
    }

    //console.log('Paths updated. Number of paths:', paths.length);
}