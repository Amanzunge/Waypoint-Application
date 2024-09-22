// Function to create popup content for the waypoint marker
function createPopupContent(latlng, altitude, speed, gimbal, order, isEditing) {
    //console.log('Creating popup content, isEditing:', isEditing);
    if (isEditing) {
        return `
            <b>Waypoint ${order}</b><br>
            <b>Coordinates:</b> ${latlng.lat.toFixed(5)}, ${latlng.lng.toFixed(5)}<br>
            <b>Altitude:</b> <input type="number" class="altitude-input" value="${altitude}"> m<br>
            <b>Speed:</b> <input type="number" class="speed-input" value="${speed}"> m/s<br>
            <b>Gimbal Angle:</b> <input type="number" class="gimbal-input" value="${gimbal}"> °<br>
            <b>Order:</b> <input type="number" class="order-input" value="${order}" min="1"><br>
            <button class="save-waypoint">Save</button>
            <button class="delete-waypoint">Delete</button>
        `;
    } else {
        return `
            <b>Waypoint ${order}</b><br>
            <b>Coordinates:</b> ${latlng.lat.toFixed(5)}, ${latlng.lng.toFixed(5)}<br>
            <b>Altitude:</b> <span class="altitude">${altitude}</span> m<br>
            <b>Speed:</b> <span class="speed">${speed}</span> m/s<br>
            <b>Gimbal Angle:</b> <span class="gimbal">${gimbal}</span>°<br>
            <b>Order:</b> ${order}<br>
            <button class="edit-waypoint">Edit</button>
            <button class="delete-waypoint">Delete</button>
        `;
    }
}

// Attach events to Edit, Save, Cancel, and Delete buttons
function attachPopupEvents(marker) {
    marker.on('popupopen', function () {
        const popupElement = marker.getPopup().getElement();

        // Ensure events are not added multiple times by checking if they are already attached
        if (!popupElement._listenersAttached) {
            // Use event delegation on the popup element
            popupElement.addEventListener('click', function(event) {
                event.stopPropagation(); // Stop the event from bubbling up
                event.preventDefault(); // Prevent any default behavior
                
                const target = event.target;

                if (target.classList.contains('edit-waypoint')) {
                    openEditMode(marker);
                } else if (target.classList.contains('save-waypoint')) {
                    saveWaypoint(marker);
                    marker.getPopup().update();  // Keep the popup open after saving
                } else if (target.classList.contains('delete-waypoint')) {
                    deleteWaypoint(marker);
                }
            });

            // Mark that listeners are attached
            popupElement._listenersAttached = true;
        }
    });
}

// Listener functions for button clicks
function openEditModeListener(event) {
    //console.log('Edit button clicked');
    const marker = getMarkerFromEvent(event);
    if (marker) {
        //console.log('Marker found:', marker);
        openEditMode(marker);
    } else {
        console.error('Marker not found');
    }
}

function saveWaypointListener(event) {
    const marker = getMarkerFromEvent(event);
    saveWaypoint(marker);
}

function deleteWaypointListener(event) {
    const marker = getMarkerFromEvent(event);
    deleteWaypoint(marker);
}

// Helper function to get marker from event
function getMarkerFromEvent(event) {
    //console.log('Event target:', event.target);
    // Ensure that the popup is open and accessible
    const popupElement = event.target.closest('.leaflet-popup-content');
    if (!popupElement) {
        //console.error('Popup element not found');
        return null;
    }
    //console.log('Popup element found:', popupElement);

    // Find the marker associated with this popup element
    const waypoint = waypoints.find(wp => {
        const markerPopupElement = wp.marker.getPopup().getElement();
        //console.log('Checking marker popup element:', markerPopupElement);
        return markerPopupElement === popupElement;
    });
    if (waypoint) {
        //console.log('Waypoint found:', waypoint);
        return waypoint.marker;
    } else {
        console.error('Waypoint not found');
        return null;
    }
}
// Open edit mode in the popup
function openEditMode(marker) {
    //console.log('Opening edit mode for marker:', marker);
    const waypoint = waypoints.find(wp => wp.marker === marker);
    if (!waypoint) {
        console.error('Waypoint not found for marker');
        return;
    }

    //console.log('Opening edit mode for waypoint:', waypoint);
    const newContent = createPopupContent(waypoint.latlng, waypoint.altitude, waypoint.speed, waypoint.gimbal, waypoint.order, true);
    marker.setPopupContent(newContent);
    marker.getPopup().update();
}