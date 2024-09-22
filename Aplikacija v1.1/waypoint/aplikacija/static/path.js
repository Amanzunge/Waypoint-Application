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

paths = [];
let returnOption = 'none';
let returnPath = null;
let isPathEnabled = false;

// Enable path function
function enablePath() {
    isPathEnabled = true;
    updatePaths(); // Redraw paths
}

// Disable path function
function disablePath() {
    isPathEnabled = false;
    updatePaths(); // Remove paths
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
    }
}

// Add event listeners to the radio buttons
document.querySelectorAll('input[name="return-option"]').forEach(radio => {
    radio.addEventListener('change', handleReturnOptionChange);
});
