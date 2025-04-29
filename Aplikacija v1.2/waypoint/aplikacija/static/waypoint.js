// Initialize the map
var map = L.map('map').setView([44.77599, 20.47852], 9);
globalHeight = 1;
setupGlobalHeightSlider();
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
        altitude: (altitude === 0 || altitude === undefined || altitude === null) ? globalHeight : altitude,
        speed: speed,
        gimbal: gimbal,
        marker: marker,
        order: order
    });

    updateDistances();
    updatePaths();
    updateWaypointIcons();
    updateTotalFlightLength();
    setupGlobalHeightSlider();
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


    //Reorder the remaining waypoints
    waypoints.forEach((wp, index) => {
        wp.order = index + 1; //+1 Update the order based on the new index
        wp.marker.setPopupContent(createPopupContent(wp.latlng, wp.altitude, wp.speed, wp.gimbal, wp.order, false));
    });

    // Update paths, distances, and waypoint icons
    updatePaths();
    updateDistances();
    updateWaypointIcons();
    updateTotalFlightLength();
}
// Update function
function saveWaypoint(marker) {
    const popupElement = marker.getPopup().getElement(); // Add this!

    const waypoint = waypoints.find(wp => wp.marker === marker);
    if (!waypoint) {
        console.error('Waypoint not found for marker');
        return;
    }

    const getInputValue = (selector, defaultValue) => {
        const element = popupElement.querySelector(selector);
        return element ? (parseFloat(element.value) || defaultValue) : defaultValue;
    };

    const newAltitude = getInputValue('.altitude-input', waypoint.altitude);
    const newSpeed = getInputValue('.speed-input', waypoint.speed);
    const newGimbal = getInputValue('.gimbal-input', waypoint.gimbal);
    const newOrder = getInputValue('.order-input', waypoint.order);

    // Apply updates
    waypoint.altitude = newAltitude;
    waypoint.speed = newSpeed;
    waypoint.gimbal = newGimbal;

    if (newOrder !== waypoint.order) {
        reorderWaypoint(waypoint, newOrder);
    } else {
        const newContent = createPopupContent(waypoint.latlng, waypoint.altitude, waypoint.speed, waypoint.gimbal, waypoint.order, false);
        marker.setPopupContent(newContent);
        marker.getPopup().update();
    }

    updateDistances();
    updatePaths();
    updateTotalFlightLength();
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
        updateTotalFlightLength();

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
    updateTotalFlightLength();
    setupGlobalHeightSlider();
}

function updateWaypointHeight(marker, newHeight) {
    const waypoint = waypoints.find(wp => wp.marker === marker);
    if (!waypoint) {
        console.error('Waypoint not found for marker');
        return;
    }
    waypoint.altitude = newHeight;
    
    // Update the popup content
    const popupContent = createPopupContent(waypoint.latlng, newHeight, waypoint.speed, waypoint.gimbal, waypoint.order, false);
    marker.setPopupContent(popupContent);
    // If the popup is open, update its content
    if (marker.isPopupOpen()) {
        const popupElement = marker.getPopup().getElement();
        if (popupElement) {
            const heightSlider = popupElement.querySelector('.height-slider');
            if (heightSlider) {
                heightSlider.value = newHeight;
            }
            updateHeightLabel(popupElement, newHeight);
        }
    }
}

function updateAllWaypointsHeight(newHeight) {
    waypoints.forEach(waypoint => {
        waypoint.altitude = newHeight;
        updateWaypointHeight(waypoint.marker, newHeight);
            const popupElement = waypoint.marker.getPopup().getElement();
            if (popupElement) {
                const heightSlider = popupElement.querySelector('.height-slider');
                if (heightSlider) {
                    heightSlider.value = newHeight;
                }
                updateHeightLabel(popupElement, newHeight);
            }
        
    });
}


function setupGlobalHeightSlider() {
    const slider = document.getElementById('global-height-slider');
    const valueDisplay = document.getElementById('global-height-value');

    slider.min = 0;
    slider.max = 30;
    slider.step = 1;
    slider.value = globalHeight * 2;
    valueDisplay.textContent = globalHeight.toFixed(1);

    slider.addEventListener('input', function() {
        globalHeight = parseFloat((parseInt(this.value) / 2).toFixed(1));
        valueDisplay.textContent = globalHeight.toFixed(1);
        updateAllWaypointsHeight(globalHeight);
    });
}

// Function to clear all waypoints
function clearAllWaypoints() {
    waypoints.forEach(waypoint => {
        map.removeLayer(waypoint.marker);
    });
    waypoints = [];
    updatePaths();
    updateDistances();
    updateTotalFlightLength();
    updateWaypointIcons();
    clearPOI();
}