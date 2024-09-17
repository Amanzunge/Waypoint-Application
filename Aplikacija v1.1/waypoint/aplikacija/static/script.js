console.log('Script loaded successfully!');

// Add these variables at the top of your script
let returnOption = 'none';
let returnPath = null;

// Add this function to handle radio button changes
function handleReturnOptionChange(event) {
    returnOption = event.target.value;
    updatePaths();
}

// Add event listeners to the radio buttons
document.querySelectorAll('input[name="return-option"]').forEach(radio => {
    radio.addEventListener('change', handleReturnOptionChange);
});

// Initialize the map
var map = L.map('map').setView([44.77599, 20.47852], 9);

// Add a tile layer (using OpenStreetMap tiles)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
}).addTo(map);


// Arrays to store waypoints and paths
var waypoints = [];
var paths = [];

// Function to calculate the distance between two points (Haversine formula)
function calculateDistance(latlng1, latlng2) {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = latlng1.lat * Math.PI / 180;
    const φ2 = latlng2.lat * Math.PI / 180;
    const Δφ = (latlng2.lat - latlng1.lat) * Math.PI / 180;
    const Δλ = (latlng2.lng - latlng1.lng) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
}

// Function to add a waypoint
function addWaypoint(latlng, altitude, speed, gimbal) {
    const order = waypoints.length + 1;
    const marker = L.marker(latlng, { draggable: true }).addTo(map)
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
}

// Delete Waypoint Function
function deleteWaypoint(marker) {
    // Remove the marker from the map
    map.removeLayer(marker);

    // Find and remove the waypoint associated with the marker
    waypoints = waypoints.filter(wp => wp.marker !== marker);

    // Update distances only, do not update paths automatically
    updateDistances();
    updatePaths();  // Update paths when a waypoint is deleted
}

// Function to create popup content for the waypoint marker
function createPopupContent(latlng, altitude, speed, gimbal, order, isEditing) {
    console.log('Creating popup content, isEditing:', isEditing);
    if (isEditing) {
        return `
            <b>Waypoint ${order}</b><br>
            <b>Coordinates:</b> ${latlng.lat.toFixed(5)}, ${latlng.lng.toFixed(5)}<br>
            <b>Altitude:</b> <input type="number" class="altitude-input" value="${altitude}"> m<br>
            <b>Speed:</b> <input type="number" class="speed-input" value="${speed}"> m/s<br>
            <b>Gimbal Angle:</b> <input type="number" class="gimbal-input" value="${gimbal}"> °<br>
            <b>Order:</b> <input type="number" class="order-input" value="${order}" min="1"><br>
            <button class="save-waypoint">Save</button>
            <button class="cancel-edit">Cancel</button>
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
        console.log('Popup opened for marker:', marker);
        const popupElement = marker.getPopup().getElement();
        console.log('Popup element:', popupElement);

        // Use event delegation on the popup element
        popupElement.addEventListener('click', function(event) {
            event.stopPropagation(); // Stop the event from bubbling up
            event.preventDefault(); // Prevent any default behavior
            
            const target = event.target;
            
            if (target.classList.contains('edit-waypoint')) {
                console.log('Edit button clicked');
                openEditMode(marker);
            } else if (target.classList.contains('save-waypoint')) {
                console.log('Save button clicked');
                saveWaypoint(marker);
                // Keep the popup open after saving
                marker.getPopup().update();
            } else if (target.classList.contains('cancel-edit')) {
                console.log('Cancel button clicked');
                cancelEdit(marker);
            } else if (target.classList.contains('delete-waypoint')) {
                console.log('Delete button clicked');
                deleteWaypoint(marker);
            }
        });
    });
}

// Listener functions for button clicks
function openEditModeListener(event) {
    console.log('Edit button clicked');
    const marker = getMarkerFromEvent(event);
    if (marker) {
        console.log('Marker found:', marker);
        openEditMode(marker);
    } else {
        console.error('Marker not found');
    }
}

function saveWaypointListener(event) {
    const marker = getMarkerFromEvent(event);
    saveWaypoint(marker);
}

function cancelEditListener(event) {
    const marker = getMarkerFromEvent(event);
    cancelEdit(marker);
}

function deleteWaypointListener(event) {
    const marker = getMarkerFromEvent(event);
    deleteWaypoint(marker);
}

// Helper function to get marker from event
function getMarkerFromEvent(event) {
    console.log('Event target:', event.target);
    // Ensure that the popup is open and accessible
    const popupElement = event.target.closest('.leaflet-popup-content');
    if (!popupElement) {
        console.error('Popup element not found');
        return null;
    }
    console.log('Popup element found:', popupElement);

    // Find the marker associated with this popup element
    const waypoint = waypoints.find(wp => {
        const markerPopupElement = wp.marker.getPopup().getElement();
        console.log('Checking marker popup element:', markerPopupElement);
        return markerPopupElement === popupElement;
    });
    if (waypoint) {
        console.log('Waypoint found:', waypoint);
        return waypoint.marker;
    } else {
        console.error('Waypoint not found');
        return null;
    }
}
// Open edit mode in the popup
function openEditMode(marker) {
    console.log('Opening edit mode for marker:', marker);
    const waypoint = waypoints.find(wp => wp.marker === marker);
    if (!waypoint) {
        console.error('Waypoint not found for marker');
        return;
    }

    console.log('Opening edit mode for waypoint:', waypoint);
    const newContent = createPopupContent(waypoint.latlng, waypoint.altitude, waypoint.speed, waypoint.gimbal, waypoint.order, true);
    marker.setPopupContent(newContent);
    marker.getPopup().update();
}

// Update the saveWaypoint function
function saveWaypoint(marker) {
    console.log('Saving waypoint for marker:', marker);
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
        console.log(`Element ${selector}:`, element);
        return element ? (parseFloat(element.value) || defaultValue) : defaultValue;
    };

    const newAltitude = getInputValue('.altitude-input', waypoint.altitude);
    const newSpeed = getInputValue('.speed-input', waypoint.speed);
    const newGimbal = getInputValue('.gimbal-input', waypoint.gimbal);
    const newOrder = getInputValue('.order-input', waypoint.order);

    console.log('New values:', { newAltitude, newSpeed, newGimbal, newOrder });

    // Update waypoint properties
    waypoint.altitude = newAltitude;
    waypoint.speed = newSpeed;
    waypoint.gimbal = newGimbal;

    // Handle order change
    if (newOrder !== waypoint.order) {
        reorderWaypoint(waypoint, newOrder);
    }

    // Update the popup content with the new values
    const newContent = createPopupContent(waypoint.latlng, waypoint.altitude, waypoint.speed, waypoint.gimbal, waypoint.order, false);
    marker.setPopupContent(newContent);
    marker.getPopup().update();

    updateDistances();
    updatePaths();
}

// Update the cancelEdit function
function cancelEdit(marker) {
    console.log('Canceling edit for marker:', marker);
    const waypoint = waypoints.find(wp => wp.marker === marker);
    if (!waypoint) {
        console.error('Waypoint not found for marker');
        return;
    }

    const newContent = createPopupContent(marker.getLatLng(), waypoint.altitude, waypoint.speed, waypoint.gimbal, false);
    marker.setPopupContent(newContent);
    marker.getPopup().update();
}
// Function to update paths (after waypoint drag or addition)
// Function to update paths based on the current waypoints array
function updatePaths() {
    // Remove old paths
    paths.forEach(path => map.removeLayer(path));
    paths = [];
    if (returnPath) {
        map.removeLayer(returnPath);
        returnPath = null;
    }

    // Add new path if there are multiple waypoints
    if (waypoints.length > 1) {
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
}
// Function to update distances in waypoints' popups
function updateDistances() {
    waypoints.forEach((waypoint, index) => {
        if (index > 0) {
            const prevWaypoint = waypoints[index - 1];
            const distance = calculateDistance(prevWaypoint.latlng, waypoint.latlng).toFixed(2);
            const popupContent = createPopupContent(
                waypoint.latlng,
                waypoint.altitude,
                waypoint.speed,
                waypoint.gimbal,
                waypoint.order,
                false
            ) + `<br><b>Distance from last:</b> ${distance} m`;
            waypoint.marker.setPopupContent(popupContent);
        } else {
            waypoint.marker.setPopupContent(createPopupContent(
                waypoint.latlng,
                waypoint.altitude,
                waypoint.speed,
                waypoint.gimbal,
                waypoint.order,
                false
            ));
        }
    });
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

document.getElementById('export-kmz').addEventListener('click', exportKMZ);

// Function to create KML content with waypoints and path
function createKMLContent(waypoints, pathCoordinates) {
    let kmlContent = `<?xml version="1.0" encoding="UTF-8"?>
    <kml xmlns="http://www.opengis.net/kml/2.2">
      <Document>
        <name>Waypoint Map</name>
        <Style id="waypointStyle">
          <IconStyle>
            <Icon>
              <href>http://maps.google.com/mapfiles/kml/shapes/placemark_circle.png</href>
            </Icon>
          </IconStyle>
        </Style>`;

    waypoints.forEach((wp, index) => {
        kmlContent += `
        <Placemark>
          <name>Waypoint ${index + 1}</name>
          <description>Altitude: ${wp.altitude} m, Speed: ${wp.speed} m/s, Gimbal Angle: ${wp.gimbal}°</description>
          <styleUrl>#waypointStyle</styleUrl>
          <Point>
            <coordinates>${wp.latlng.lng},${wp.latlng.lat},${wp.altitude}</coordinates>
          </Point>
        </Placemark>`;
    });

    if (pathCoordinates.length > 1) {
        kmlContent += `
        <Placemark>
          <name>Path</name>
          <LineString>
            <coordinates>`;
        pathCoordinates.forEach(coord => {
            kmlContent += `${coord.lng},${coord.lat},0 `;
        });
        kmlContent += `</coordinates>
          </LineString>
        </Placemark>`;
    }

    kmlContent += `
      </Document>
    </kml>`;

    return kmlContent;
}

// Export KMZ Function
function exportKMZ() {
    const pathCoordinates = waypoints.map(wp => wp.latlng);
    const kmlContent = createKMLContent(waypoints, pathCoordinates);

    const zip = new JSZip();
    zip.file('doc.kml', kmlContent);

    zip.generateAsync({ type: 'blob' })
        .then(function (content) {
            const a = document.createElement('a');
            a.href = URL.createObjectURL(content);
            a.download = 'waypoints.kmz';
            a.click();
        });
}

// KMZ File Loader
document.getElementById('show-load-kmz').addEventListener('click', function () {
    document.getElementById('load-kmz').click();
});

document.getElementById('load-kmz').addEventListener('change', function (event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        JSZip.loadAsync(e.target.result).then(zip => {
            return zip.file("doc.kml").async("string");
        }).then(parseKML);
    };
    reader.readAsArrayBuffer(file);
});

// Function to parse loaded KML data and add waypoints and paths
function parseKML(kmlText) {
    const parser = new DOMParser();
    const kml = parser.parseFromString(kmlText, "application/xml");

    const placemarks = kml.getElementsByTagName("Placemark");
    waypoints.forEach(wp => map.removeLayer(wp.marker));
    paths.forEach(path => map.removeLayer(path));
    waypoints = [];
    paths = [];

    Array.from(placemarks).forEach(placemark => {
        const point = placemark.getElementsByTagName("Point")[0];
        const lineString = placemark.getElementsByTagName("LineString")[0];
        const description = placemark.getElementsByTagName("description")[0]?.textContent || '';

        if (point) {
            const coords = point.getElementsByTagName("coordinates")[0].textContent.trim().split(",");
            const latlng = L.latLng(parseFloat(coords[1]), parseFloat(coords[0]));
            
            // Extract altitude, speed, and gimbal from description
            const altitudeMatch = description.match(/Altitude: (\d+\.?\d*)/);
            const speedMatch = description.match(/Speed: (\d+\.?\d*)/);
            const gimbalMatch = description.match(/Gimbal Angle: (\d+\.?\d*)/);

            const altitude = altitudeMatch ? parseFloat(altitudeMatch[1]) : 0;
            const speed = speedMatch ? parseFloat(speedMatch[1]) : 0;
            const gimbal = gimbalMatch ? parseFloat(gimbalMatch[1]) : 0;

            addWaypoint(latlng, altitude, speed, gimbal);
        }

        if (lineString) {
            const coords = lineString.getElementsByTagName("coordinates")[0].textContent.trim().split(/\s+/);
            const pathCoordinates = coords.map(coord => {
                const [lng, lat] = coord.split(",").map(Number);
                return L.latLng(lat, lng);
            });

            if (pathCoordinates.length > 1) {
                const newPath = L.polyline(pathCoordinates, { color: 'blue' }).addTo(map);
                paths.push(newPath);
            }
        }
    });
}

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
    const oldOrder = waypoint.order;
    if (newOrder < 1 || newOrder > waypoints.length || newOrder === oldOrder) {
        return;
    }

    // Update the order of all waypoints
    waypoints.forEach(wp => {
        if (newOrder > oldOrder && wp.order > oldOrder && wp.order <= newOrder) {
            wp.order--;
        } else if (newOrder < oldOrder && wp.order < oldOrder && wp.order >= newOrder) {
            wp.order++;
        }
    });

    waypoint.order = newOrder;

    // Sort waypoints by order
    waypoints.sort((a, b) => a.order - b.order);

    // Update all waypoint popups
    waypoints.forEach(wp => {
        wp.marker.setPopupContent(createPopupContent(wp.latlng, wp.altitude, wp.speed, wp.gimbal, wp.order, false));
    });
    updatePaths();
}