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

var paths = [];
let returnOption = 'none';
let returnPath = null;
let isPathEnabled = false;
const label = document.getElementById('totalFlightLength');
var totalDistanceInMeters = 1;
// Enable path function
function enablePath() {
    isPathEnabled = true;
    updatePaths(); // Redraw paths
    updateTotalFlightLength();
}

// Disable path function
function disablePath() {
    isPathEnabled = false;
    updatePaths(); // Remove paths
    totalDistanceInMeters = 0;
    label.innerHTML = `Total Flight Length: ${totalDistanceInMeters} m`;
}
// Function to update paths (after waypoint drag or addition)
// Function to update paths based on the current waypoints array


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

// Add this function to handle radio button changes
function handleReturnOptionChange(event) {
    returnOption = event.target.value;
    if (isPathEnabled) {
        updatePaths();
        updateTotalFlightLength();
    }
}

// Add event listeners to the radio buttons
document.querySelectorAll('input[name="return-option"]').forEach(radio => {
    radio.addEventListener('change', handleReturnOptionChange);
    updateTotalFlightLength();
});

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

function updateTotalFlightLength() {
    let totalDistance = 0;

    if (isPathEnabled && waypoints.length > 1) {
    if (waypoints.length <= 1) {
        totalDistance = 0;
    } else {
    // Calculate distance between consecutive waypoints
    for (let i = 1; i < waypoints.length; i++) {
        const latlng1 = waypoints[i - 1].latlng;
        const latlng2 = waypoints[i].latlng;
        const distance = calculateDistance(latlng1, latlng2); // Calculate distance between waypoints
        totalDistance += distance; // Add distance to total
    }

    // Handle return options
    if (returnOption === 'through-all') {
        // Add the reverse path distance (waypoints in reverse order)
        for (let i = waypoints.length - 1; i > 0; i--) {
            const latlng1 = waypoints[i].latlng;
            const latlng2 = waypoints[i - 1].latlng;
            totalDistance += calculateDistance(latlng1, latlng2);
        }
    } else if (returnOption === 'direct' && waypoints.length > 1) {
        // Add the direct distance between the last and the first waypoint
        totalDistance += calculateDistance(waypoints[waypoints.length - 1].latlng, waypoints[0].latlng);
    }

    // Display the total distance with two decimal precision
    totalDistanceInMeters = totalDistance.toFixed(2);
    if (label) {
        label.innerHTML = `Total Flight Length: ${totalDistanceInMeters} m`;
    } else {
        console.error('Label for total flight length not found');
    }
}
    }
}