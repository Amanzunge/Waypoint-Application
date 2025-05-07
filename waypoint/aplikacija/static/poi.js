// poi.js

let poiMarker = null;
let poiLatLng = null;

// When DOM is fully loaded
document.addEventListener('DOMContentLoaded', function () {
    if (typeof map !== 'undefined') {
        map.on('contextmenu', function (e) {
            e.originalEvent.preventDefault();  // Prevent browser menu
            setPOI(e.latlng);
        });
    } else {
        console.error('Map is not initialized yet!');
    }
});

function setPOI(latlng) {
    clearPOI();
    poiLatLng = latlng;
    poiMarker = L.marker(latlng, {
        icon: createCustomColorIcon('red')
    }).addTo(map).bindPopup("Point of Interest").openPopup();
}

function clearPOI() {
    if (poiMarker) {
        map.removeLayer(poiMarker);
        poiMarker = null;
    }
    poiLatLng = null;
}

function getPOIString() {
    if (!poiLatLng) return "0.000000,0.000000,0.000000";
    return `${poiLatLng.lng.toFixed(6)},${poiLatLng.lat.toFixed(6)},0.000000`;
}

function getPOIMode() {
    return poiLatLng ? "towardPOI" : "smoothTransition";
}
