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
function addWaypoint(latlng, altitude, speed, gimbal, action = 'no_action') {
    const order = waypoints.length + 1;
    const color = order === 1 ? 'orange' : 'gold';
    
    // Ensure action has a valid value
    action = action || 'no_action';
    //console.log(`Adding waypoint with action: ${action}`); // Debug log
    
    const marker = L.marker(latlng, {
        draggable: true,
        icon: createCustomColorIcon(color)
    }).addTo(map)
        .bindPopup(createPopupContent(latlng, altitude, speed, gimbal, order, action, true));

    attachPopupEvents(marker);
    bindDragEvents(marker);

    const waypoint = {
        latlng: latlng,
        altitude: (altitude === 0 || altitude === undefined || altitude === null) ? globalHeight : altitude,
        speed: speed,
        gimbal: gimbal,
        action: action,
        marker: marker,
        order: order
    };
    
    waypoints.push(waypoint);
    
    //console.log(`Waypoint added with action: ${waypoint.action}`); // Additional debug log

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
        //console.error('Waypoint not found for marker');
        return;
    }
    //console.log('Deleting waypoint at index:', waypointIndex);
    console.log('Waypoints array before deletion:', waypoints.map(wp => ({
        latlng: wp.latlng,
        order: wp.order,
        action: wp.action // Include action in debug log
    })));

    // Remove the marker from the map
    map.removeLayer(marker);

    // Remove the waypoint from the waypoints array
    waypoints.splice(waypointIndex, 1);

    //Reorder the remaining waypoints
    waypoints.forEach((wp, index) => {
        wp.order = index + 1; //+1 Update the order based on the new index
        // Ensure action is preserved when updating content
        const action = wp.action || 'no_action';
        wp.marker.setPopupContent(createPopupContent(wp.latlng, wp.altitude, wp.speed, wp.gimbal, wp.order, action, true));
    });

    // Update paths, distances, and waypoint icons
    updatePaths();
    updateDistances();
    updateWaypointIcons();
    updateTotalFlightLength();
}

// Update function
function saveWaypoint(marker) {
    const popupElement = marker.getPopup().getElement();
    if (!popupElement) {
        //console.error('Popup element not found');
        return;
    }

    const waypoint = waypoints.find(wp => wp.marker === marker);
    if (!waypoint) {
        //console.error('Waypoint not found for marker');
        return;
    }

    // Helper function to safely get input values
    const getInputValue = (selector, defaultValue) => {
        const element = popupElement.querySelector(selector);
        return element ? (parseFloat(element.value) || defaultValue) : defaultValue;
    };

    // Get the current values from inputs
    const newAltitude = getInputValue('.altitude-input', waypoint.altitude);
    const newSpeed = getInputValue('.speed-input', waypoint.speed);
    const newGimbal = getInputValue('.gimbal-input', waypoint.gimbal);
    const newOrder = getInputValue('.order-input', waypoint.order);
    
    // Get action value directly from the select element
    let newAction = waypoint.action || 'no_action';
    const actionSelect = popupElement.querySelector('.action-select');
    if (actionSelect) {
        newAction = actionSelect.value;
        console.log(`Saving new action: ${newAction} (from dropdown)`);
    }

    // Log the before and after states
    //console.log(`Waypoint before update - Action: ${waypoint.action}, Altitude: ${waypoint.altitude}`);
    
    // Apply all updates to the waypoint object
    waypoint.altitude = newAltitude;
    waypoint.speed = newSpeed;
    waypoint.gimbal = newGimbal;
    waypoint.action = newAction;
    
    //console.log(`Waypoint after update - Action: ${waypoint.action}, Altitude: ${waypoint.altitude}`);

    // Handle reordering if needed
    if (newOrder !== waypoint.order) {
        reorderWaypoint(waypoint, newOrder);
    } else {
        // Update the marker popup with new content
        const newContent = createPopupContent(
            waypoint.latlng, 
            waypoint.altitude, 
            waypoint.speed, 
            waypoint.gimbal, 
            waypoint.order, 
            waypoint.action, // Explicitly pass the updated action
            true
        );
        
        // Close popup, update content, then reopen
        const wasOpen = marker.isPopupOpen();
        if (wasOpen) marker.closePopup();
        
        marker.setPopupContent(newContent);
        
        if (wasOpen) {
            setTimeout(() => {
                marker.openPopup();
                
                // After popup reopens, make sure action dropdown is set correctly
                setTimeout(() => {
                    const newPopupElement = marker.getPopup().getElement();
                    if (newPopupElement) {
                        const newActionSelect = newPopupElement.querySelector('.action-select');
                        if (newActionSelect && waypoint.action) {
                            //console.log(`Re-setting dropdown to: ${waypoint.action} after reopen`);
                            newActionSelect.value = waypoint.action;
                        }
                    }
                }, 50);
            }, 50);
        }
    }

    // Update map display
    updateDistances();
    updatePaths();
    updateTotalFlightLength();
}

// Function to log any external changes to waypoints for debugging
function logWaypointsChange(source) {
    console.log(`Waypoints changed from ${source}:`, waypoints.map(wp => ({
        order: wp.order,
        action: wp.action
    })));
}

// Event listener for map clicks to add waypoints
map.on('click', function (e) {
    // Check if the click is on the map itself, not on a popup or marker
    if (e.originalEvent.target === map._container) {
        const altitude = document.getElementById('altitude').value || 0;
        const speed = document.getElementById('speed').value || 0;
        const gimbal = document.getElementById('gimbal').value || 0;
        
        // Get action from dropdown or default to 'no_action'
        let action = 'no_action';
        const actionElement = document.getElementById('action');
        if (actionElement) {
            action = actionElement.value;
            //console.log('Selected action from dropdown for new waypoint:', action);
        }
        
        addWaypoint(e.latlng, altitude, speed, gimbal, action);
    }
});

// Function to bind dragging events to a marker
function bindDragEvents(marker) {
    marker.on('dragstart', function () {
        // Add dragstart logging if needed
    });

    marker.on('move', function () {
        // Add move logging if needed
    });

    marker.on('dragend', function () {
        const newLatLng = marker.getLatLng();

        // Update waypoint's position in the waypoints array
        const waypoint = waypoints.find(wp => wp.marker === marker);
        if (waypoint) {
            waypoint.latlng = newLatLng; // Update the waypoint latlng
            
            // Update popup content while preserving the action
            const newContent = createPopupContent(
                newLatLng, 
                waypoint.altitude, 
                waypoint.speed, 
                waypoint.gimbal, 
                waypoint.order, 
                waypoint.action, 
                true
            );
            marker.setPopupContent(newContent);
        }

        // Update distances and paths after dragging ends
        updateDistances();
        updatePaths();
        updateTotalFlightLength();
    });
}

// New function to handle waypoint reordering
function reorderWaypoint(waypoint, newOrder) {
    const oldOrder = waypoint.order;
    if (newOrder < 1 || newOrder > waypoints.length || newOrder === oldOrder) {
        return;
    }

    //console.log(`Reordering waypoint ${oldOrder} to ${newOrder}. Action before reorder: ${waypoint.action}`);

    // Remove the waypoint from its current position
    const waypointIndex = waypoints.findIndex(wp => wp === waypoint);
    waypoints.splice(waypointIndex, 1);

    // Insert the waypoint at its new position
    waypoints.splice(newOrder - 1, 0, waypoint);

    // Update the order of all waypoints
    waypoints.forEach((wp, index) => {
        wp.order = index + 1;
        
        // Preserve action when updating content
        const action = wp.action || 'no_action';
        //console.log(`Updating waypoint ${wp.order} popup with action: ${action}`);
        
        wp.marker.setPopupContent(createPopupContent(wp.latlng, wp.altitude, wp.speed, wp.gimbal, wp.order, action, true));
    });

    updatePaths();
    updateDistances();
    updateWaypointIcons();
    updateTotalFlightLength();
    setupGlobalHeightSlider();
    
    // Log waypoints after reordering
    console.log('Waypoints after reorder:', waypoints.map(wp => ({
        order: wp.order,
        action: wp.action
    })));
}

function updateWaypointHeight(marker, newHeight) {
    const waypoint = waypoints.find(wp => wp.marker === marker);
    if (!waypoint) {
        //console.error('Waypoint not found for marker');
        return;
    }
    
    waypoint.altitude = newHeight;
    
    // CRITICAL: Ensure we get and use the existing action, don't reset it
    const action = waypoint.action || 'no_action';
    //console.log(`Updating waypoint height with preserved action: ${action}`);
    
    // Update the popup content with the preserved action
    const popupContent = createPopupContent(waypoint.latlng, newHeight, waypoint.speed, waypoint.gimbal, waypoint.order, action, true);
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
            
            // Make sure the action select is updated to the correct value
            const actionSelect = popupElement.querySelector('.action-select');
            if (actionSelect && waypoint.action) {
                actionSelect.value = waypoint.action;
            }
        }
    }
}

function updateAllWaypointsHeight(newHeight) {
    //console.log('Updating all waypoints height to:', newHeight);
    console.log('Waypoints before height update:', waypoints.map(wp => ({
        order: wp.order,
        action: wp.action,
        altitude: wp.altitude
    })));
    
    waypoints.forEach(waypoint => {
        // Save the original values before updating
        const originalAction = waypoint.action || 'no_action';
        //console.log(`Waypoint ${waypoint.order} original action: ${originalAction}`);
        
        // Update altitude but preserve all other properties
        waypoint.altitude = newHeight;
        
        // Call updateWaypointHeight with the preserved action
        updateWaypointHeight(waypoint.marker, newHeight);
    });
    
    // Log after update
    console.log('Waypoints after height update:', waypoints.map(wp => ({
        order: wp.order,
        action: wp.action, 
        altitude: wp.altitude
    })));
}

function setupGlobalHeightSlider() {
    const slider = document.getElementById('global-height-slider');
    const valueDisplay = document.getElementById('global-height-value');

    if (!slider || !valueDisplay) return;

    slider.min = 0;
    slider.max = 30;
    slider.step = 1;
    slider.value = globalHeight * 2;
    valueDisplay.textContent = globalHeight.toFixed(1);

    // Remove existing listeners to prevent duplicates
    const newSlider = slider.cloneNode(true);
    slider.parentNode.replaceChild(newSlider, slider);
    
    newSlider.addEventListener('input', function() {
        //console.log('Global height slider changed');
        globalHeight = parseFloat((parseInt(this.value) / 2).toFixed(1));
        valueDisplay.textContent = globalHeight.toFixed(1);
        
        // Log waypoints before height update
        console.log('Before updating all waypoints height:', waypoints.map(wp => ({
            order: wp.order,
            action: wp.action
        })));
        
        updateAllWaypointsHeight(globalHeight);
    });
}

// You may also want to add an action dropdown to the control panel
function setupActionDropdown() {
    const controlPanel = document.querySelector('.control-panel') || document.getElementById('control-panel');
    if (!controlPanel) return;
    
    // Check if action dropdown already exists
    if (document.getElementById('action')) return;
    
    const actionDiv = document.createElement('div');
    actionDiv.className = 'control-group';
    actionDiv.innerHTML = `
        <label for="action">Action:</label>
        <select id="action">
            <option value="no_action">No Action</option>
            <option value="take_picture">Take Picture</option>
            <option value="start_recording">Start Recording</option>
            <option value="stop_recording">Stop Recording</option>
        </select>
    `;
    
    // Insert after the gimbal input or at the end of control panel
    const gimbalDiv = controlPanel.querySelector('div:has(#gimbal)');
    if (gimbalDiv) {
        gimbalDiv.after(actionDiv);
    } else {
        controlPanel.appendChild(actionDiv);
    }
}

// Call this function when the page loads
document.addEventListener('DOMContentLoaded', function() {
    setupActionDropdown();
});

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
    
    // Check if clearPOI exists before calling it
    if (typeof clearPOI === 'function') {
        clearPOI();
    }
}

