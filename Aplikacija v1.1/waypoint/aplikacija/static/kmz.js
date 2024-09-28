document.getElementById('export-kmz').addEventListener('click', exportKMZ);



// Function to create KML content with waypoints and path
function createKMLContent(waypoints, pathCoordinates, returnCoordinates = null) {
  addStartingWaypoint();
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
    // Loop through waypoints and create placemarks for each
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

    // Add main path placemark if paths are enabled
    if (isPathEnabled && pathCoordinates.length > 1) {
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

    // Add return path if selected and there are enough waypoints
    if (returnCoordinates && returnCoordinates.length > 1) {
        kmlContent += `
        <Placemark>
          <name>Return Path</name>
          <LineString>
            <coordinates>`;
        returnCoordinates.forEach(coord => {
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
    const pathCoordinates = waypoints.map(wp => wp.latlng); // Main path coordinates
    let returnCoordinates = null;

    // Handle return path based on selected option
    if (returnOption === 'through-all') {
        returnCoordinates = [...pathCoordinates].reverse(); // Reverse the path
    } else if (returnOption === 'direct' && waypoints.length > 1) {
        const firstWaypoint = waypoints[0].latlng;
        const lastWaypoint = waypoints[waypoints.length - 1].latlng;
        returnCoordinates = [lastWaypoint, firstWaypoint]; // Direct return from last to first
    }

    const kmlContent = createKMLContent(waypoints, pathCoordinates, returnCoordinates); // Pass returnCoordinates

    // Create KMZ (zip) file using JSZip
    const zip = new JSZip();
    zip.file('doc.kml', kmlContent);

    // Generate KMZ (as blob) and prompt download
    zip.generateAsync({ type: 'blob' })
        .then(function (content) {
            const a = document.createElement('a');
            a.href = URL.createObjectURL(content);
            a.download = 'waypoints.kmz'; // File name
            a.click(); // Trigger download
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
