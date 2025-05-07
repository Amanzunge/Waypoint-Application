// Modified createPopupContent function in popup.js
// GLOBAL INITIALIZATION
// Add this at the top of your file with other global variables
let isProcessingSave = false; // Flag to prevent recursive save operations

// COMPLETELY REWRITTEN createPopupContent 
function createPopupContent(latlng, altitude, speed, gimbal, order, action, debug) {
    // Ensure action has a valid default value
    action = action || 'no_action';
    
    if (debug) {
        //console.log(`Creating popup for waypoint ${order} with action: ${action}`);
    }

    return `
        <div class="waypoint-popup" data-waypoint-action="${action}">
            <b>Waypoint ${order}</b><br>
            <b>Coordinates:</b> ${latlng.lat.toFixed(5)}, ${latlng.lng.toFixed(5)}<br>
            <b>Altitude:</b> <input type="number" class="altitude-input" value="${altitude}" step="0.5"> m<br>
            <b>Speed:</b> <input type="number" class="speed-input" value="${speed}"> m/s<br>
            <b>Gimbal Angle:</b> <input type="number" class="gimbal-input" value="${gimbal}"> °<br>
            <b>Action:</b> 
            <select class="action-select" data-original-action="${action}">
                <option value="no_action" ${action === 'no_action' ? 'selected' : ''}>No Action</option>
                <option value="take_picture" ${action === 'take_picture' ? 'selected' : ''}>Take Picture</option>
                <option value="start_recording" ${action === 'start_recording' ? 'selected' : ''}>Start Recording</option>
                <option value="stop_recording" ${action === 'stop_recording' ? 'selected' : ''}>Stop Recording</option>
            </select><br>
            <b>Order:</b> <input type="number" class="order-input" value="${order}" min="1"><br>
            <button class="save-waypoint">Save</button>
            <button class="delete-waypoint">Delete</button>
        </div>
    `;
}


// Attach events to Save and Delete buttons
function attachPopupEvents(marker) {
    marker.on('popupopen', function () {
        const popupElement = marker.getPopup().getElement();
        if (!popupElement) return;
        
        // Find the waypoint for this marker
        const waypoint = waypoints.find(wp => wp.marker === marker);
        if (!waypoint) {
           // console.error('Waypoint not found for marker in popupopen event');
            return;
        }
        
        // Get the current action from the waypoint
        const currentAction = waypoint.action || 'no_action';
        //console.log(`Popup opened for waypoint ${waypoint.order} with action: ${currentAction}`);
        
        // Select the dropdown and update its value 
        const actionSelect = popupElement.querySelector('.action-select');
        if (actionSelect) {
            //console.log(`Setting dropdown value to: ${currentAction}`);
            actionSelect.value = currentAction;
            
            // Update the data attribute to match the current action
            actionSelect.setAttribute('data-original-action', currentAction);
            
            // Also set it on the parent container for reference
            const container = popupElement.querySelector('.waypoint-popup');
            if (container) {
                container.setAttribute('data-waypoint-action', currentAction);
            }
        }
        
        // Make sure the listeners are attached only once
        if (!popupElement._listenersAttached) {
            // Save button click handler
            const saveButton = popupElement.querySelector('.save-waypoint');
            if (saveButton) {
                saveButton.addEventListener('click', function(e) {
                    e.stopPropagation();
                    e.preventDefault();
                    if (!isProcessingSave) {
                        isProcessingSave = true;
                        saveWaypoint(marker);
                        isProcessingSave = false;
                    }
                });
            }
            
            // Delete button click handler
            const deleteButton = popupElement.querySelector('.delete-waypoint');
            if (deleteButton) {
                deleteButton.addEventListener('click', function(e) {
                    e.stopPropagation();
                    e.preventDefault();
                    deleteWaypoint(marker);
                });
            }
            
            popupElement._listenersAttached = true;
        }
    });
}

// Utility to find marker from event (not used anymore but kept for future use if needed)
function getMarkerFromEvent(event) {
    const popupElement = event.target.closest('.leaflet-popup-content');
    if (!popupElement) return null;

    const waypoint = waypoints.find(wp => {
        const markerPopupElement = wp.marker.getPopup().getElement();
        return markerPopupElement === popupElement;
    });

    return waypoint ? waypoint.marker : null;
}

// Helper for formatting display if needed elsewhere
function formatActionName(action) {
    //console.log('Formatting action name for:', action);
    switch (action) {
        case 'take_picture': return 'Take Picture';
        case 'start_recording': return 'Start Recording';
        case 'stop_recording': return 'Stop Recording';
        case 'no_action':
        default: return 'No Action';
    }
}

function updateHeightLabel(popupElement, newHeight) {
    const altitudeValueSpan = popupElement.querySelector('.altitude-value');
    if (altitudeValueSpan) {
        altitudeValueSpan.textContent = newHeight;
    }

    const altitudeInput = popupElement.querySelector('.altitude-input');
    if (altitudeInput) {
        altitudeInput.value = newHeight;
    }
}

function attachPopupEvents(marker) {
    marker.on('popupopen', function () {
        const popupElement = marker.getPopup().getElement();
        if (!popupElement) return;
        
        // Find the waypoint for this marker
        const waypoint = waypoints.find(wp => wp.marker === marker);
        if (!waypoint) {
            //console.error('Waypoint not found for marker in popupopen event');
            return;
        }
        
        // Update the action dropdown to match the waypoint's action
        const actionSelect = popupElement.querySelector('.action-select');
        if (actionSelect && waypoint.action) {
            //console.log(`Setting dropdown value to: ${waypoint.action}`);
            actionSelect.value = waypoint.action;
        }
        
        // Attach event listeners if not already attached
        if (!popupElement._listenersAttached) {
            popupElement.addEventListener('click', function(event) {
                event.stopPropagation();
                event.preventDefault();

                const target = event.target;
                if (target.classList.contains('save-waypoint')) {
                    saveWaypoint(marker);
                    marker.getPopup().update();
                } else if (target.classList.contains('delete-waypoint')) {
                    deleteWaypoint(marker);
                }
            });
            popupElement._listenersAttached = true;
        }
    });
}