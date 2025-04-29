document.getElementById('export-kmz').addEventListener('click', exportKMZ);
// KMZ File Loader
document.getElementById('load-kmz-button').addEventListener('click', function() {
  document.getElementById('file-kmz').click();
});

document.getElementById('file-kmz').addEventListener('change', function (event) {
  console.log('KMZ file selected'); // Debug log

  const file = event.target.files[0];
  if (!file) {
    console.error('No file selected');
    return;
  }

  console.log('File name:', file.name); // Debug log

  const reader = new FileReader();
  reader.onload = function (e) {
    console.log('File loaded successfully'); // Debug log
    JSZip.loadAsync(e.target.result)
      .then(zip => {
        console.log('Zip files:', Object.keys(zip.files)); // Debug file contents
        return zip.file("wpmz/template.kml").async("string");
      })
      .then(importKMZFile(file))
      .catch(error => {
        console.error('Error parsing KMZ:', error);
        alert('Failed to parse KMZ file. Check console for details.');
      });
  };

  reader.onerror = function(error) {
    console.error('File reading error:', error);
  };

  reader.readAsArrayBuffer(file);
});

// Function to calculate heading between two waypoints
function calculateHeading(fromLatLng, toLatLng) {
  // Validate inputs
  if (!fromLatLng || !toLatLng || typeof fromLatLng.lat !== 'number' || 
      typeof fromLatLng.lng !== 'number' || typeof toLatLng.lat !== 'number' || 
      typeof toLatLng.lng !== 'number') {
    console.warn('Invalid coordinates provided for heading calculation');
    return 0;
  }

  // Convert latitude and longitude to radians
  const lat1 = fromLatLng.lat * Math.PI / 180;
  const lon1 = fromLatLng.lng * Math.PI / 180;
  const lat2 = toLatLng.lat * Math.PI / 180;
  const lon2 = toLatLng.lng * Math.PI / 180;

  // Calculate heading using great circle formula
  const dLon = lon2 - lon1;
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - 
           Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  
  // Calculate bearing in degrees
  let bearing = Math.atan2(y, x) * 180 / Math.PI;

  // Convert to -180 to 180 format
  if (bearing > 180) {
    bearing = bearing - 360;
  } else if (bearing < -180) {
    bearing = bearing + 360;
  }

  // Round to one decimal place
  return Math.round(bearing * 10) / 10;
}

function extractCoordinates(latlng) {
  if (!latlng) {
    console.error('No coordinates provided');
    return null;
  }

  // Handle Leaflet LatLng object
  if (typeof latlng.lat === 'function' && typeof latlng.lng === 'function') {
    return {
      lat: latlng.lat(),
      lng: latlng.lng()
    };
  }

  // Handle Leaflet _latlng object
  if (latlng._latlng && typeof latlng._latlng.lat === 'number' && typeof latlng._latlng.lng === 'number') {
    return {
      lat: latlng._latlng.lat,
      lng: latlng._latlng.lng
    };
  }

  // Handle direct lat/lng properties
  if (typeof latlng.lat === 'number' && typeof latlng.lng === 'number') {
    return {
      lat: latlng.lat,
      lng: latlng.lng
    };
  }

  // Handle latitude/longitude properties
  if (typeof latlng.latitude === 'number' && typeof latlng.longitude === 'number') {
    return {
      lat: latlng.latitude,
      lng: latlng.longitude
    };
  }

  console.error('Invalid coordinate format:', latlng);
  return null;
}


// Function to create the template.kml file
function createTemplateKML() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2" xmlns:wpml="http://www.dji.com/wpmz/1.0.2">
  <Document>
    <wpml:author>fly</wpml:author>
    <wpml:createTime>${Date.now()}</wpml:createTime>
    <wpml:updateTime>${Date.now()}</wpml:updateTime>
    <wpml:missionConfig>
      <wpml:flyToWaylineMode>safely</wpml:flyToWaylineMode>
      <wpml:finishAction>goHome</wpml:finishAction>
      <wpml:exitOnRCLost>executeLostAction</wpml:exitOnRCLost>
      <wpml:executeRCLostAction>goBack</wpml:executeRCLostAction>
      <wpml:globalTransitionalSpeed>2.5</wpml:globalTransitionalSpeed>
      <wpml:droneInfo>
        <wpml:droneEnumValue>68</wpml:droneEnumValue>
        <wpml:droneSubEnumValue>0</wpml:droneSubEnumValue>
      </wpml:droneInfo>
    </wpml:missionConfig>
  </Document>
</kml>`;
}

function generatePlacemark(waypoint, nextWaypoint = null) {
  // Extract coordinates safely
  const coords = extractCoordinates(waypoint.latlng);
  if (!coords) {
    console.error('Failed to extract coordinates for waypoint:', waypoint);
    return '';
  }

  // Calculate heading if next waypoint exists
  let heading = 0;
  if (nextWaypoint) {
    const nextCoords = extractCoordinates(nextWaypoint.latlng);
    if (nextCoords) {
      heading = calculateHeading(coords, nextCoords);
    }
  }

  if(waypoint.index === 0){
  return `
<Placemark>
<Point>
  <coordinates>
    ${waypoint.latlng.lng},${waypoint.latlng.lat}
  </coordinates>
</Point>
<wpml:index>${waypoint.index}</wpml:index>
<wpml:executeHeight>${waypoint.altitude}</wpml:executeHeight>
<wpml:waypointSpeed>${waypoint.speed}</wpml:waypointSpeed>
<wpml:waypointHeadingParam>
  <wpml:waypointHeadingMode>${getPOIMode()}</wpml:waypointHeadingMode>
  <wpml:waypointHeadingAngle>${heading}</wpml:waypointHeadingAngle>
  <wpml:waypointPoiPoint>${getPOIString()}</wpml:waypointPoiPoint>
  <wpml:waypointHeadingAngleEnable>1</wpml:waypointHeadingAngleEnable>
  <wpml:waypointHeadingPathMode>followBadArc</wpml:waypointHeadingPathMode>
</wpml:waypointHeadingParam>
<wpml:waypointTurnParam>
  <wpml:waypointTurnMode>toPointAndStopWithContinuityCurvature</wpml:waypointTurnMode>
  <wpml:waypointTurnDampingDist>0</wpml:waypointTurnDampingDist>
</wpml:waypointTurnParam>
<wpml:useStraightLine>0</wpml:useStraightLine>
<wpml:actionGroup>
  <wpml:actionGroupId>${waypoint.index+1}</wpml:actionGroupId>
  <wpml:actionGroupStartIndex>${waypoint.index}</wpml:actionGroupStartIndex>
  <wpml:actionGroupEndIndex>${waypoint.index}</wpml:actionGroupEndIndex>
  <wpml:actionGroupMode>parallel</wpml:actionGroupMode>
  <wpml:actionTrigger>
    <wpml:actionTriggerType>reachPoint</wpml:actionTriggerType>
  </wpml:actionTrigger>
  <wpml:action>
    <wpml:actionId>${waypoint.index+1}</wpml:actionId>
    <wpml:actionActuatorFunc>gimbalRotate</wpml:actionActuatorFunc>
    <wpml:actionActuatorFuncParam>
      <wpml:gimbalHeadingYawBase>aircraft</wpml:gimbalHeadingYawBase>
      <wpml:gimbalRotateMode>absoluteAngle</wpml:gimbalRotateMode>
      <wpml:gimbalPitchRotateEnable>1</wpml:gimbalPitchRotateEnable>
      <wpml:gimbalPitchRotateAngle>${waypoint.gimbal}</wpml:gimbalPitchRotateAngle>
      <wpml:gimbalRollRotateEnable>0</wpml:gimbalRollRotateEnable>
      <wpml:gimbalRollRotateAngle>0</wpml:gimbalRollRotateAngle>
      <wpml:gimbalYawRotateEnable>0</wpml:gimbalYawRotateEnable>
      <wpml:gimbalYawRotateAngle>0</wpml:gimbalYawRotateAngle>
      <wpml:gimbalRotateTimeEnable>0</wpml:gimbalRotateTimeEnable>
      <wpml:gimbalRotateTime>0</wpml:gimbalRotateTime>
      <wpml:payloadPositionIndex>0</wpml:payloadPositionIndex>
    </wpml:actionActuatorFuncParam>
  </wpml:action>
</wpml:actionGroup>
<wpml:actionGroup>
<wpml:actionGroupId>${waypoint.index+2}</wpml:actionGroupId>
<wpml:actionGroupStartIndex>0</wpml:actionGroupStartIndex>
<wpml:actionGroupEndIndex>1</wpml:actionGroupEndIndex>
<wpml:actionGroupMode>parallel</wpml:actionGroupMode>
<wpml:actionTrigger>
<wpml:actionTriggerType>reachPoint</wpml:actionTriggerType>
</wpml:actionTrigger>
<wpml:action>
<wpml:actionId>${waypoint.index+2}</wpml:actionId>
<wpml:actionActuatorFunc>gimbalEvenlyRotate</wpml:actionActuatorFunc>
<wpml:actionActuatorFuncParam>
<wpml:gimbalPitchRotateAngle>${waypoint.gimbal}</wpml:gimbalPitchRotateAngle>
<wpml:payloadPositionIndex>0</wpml:payloadPositionIndex>
</wpml:actionActuatorFuncParam>
</wpml:action>
</wpml:actionGroup>
</Placemark>
`;
}
else {
return `
<Placemark>
<Point>
  <coordinates>
    ${waypoint.latlng.lng},${waypoint.latlng.lat}
  </coordinates>
</Point>
<wpml:index>${waypoint.index}</wpml:index>
<wpml:executeHeight>${waypoint.altitude}</wpml:executeHeight>
<wpml:waypointSpeed>${waypoint.speed}</wpml:waypointSpeed>
<wpml:waypointHeadingParam>
  <wpml:waypointHeadingMode>${getPOIMode()}</wpml:waypointHeadingMode>
  <wpml:waypointHeadingAngle>${heading}</wpml:waypointHeadingAngle>
  <wpml:waypointPoiPoint>${getPOIString()}</wpml:waypointPoiPoint>
  <wpml:waypointHeadingAngleEnable>1</wpml:waypointHeadingAngleEnable>
  <wpml:waypointHeadingPathMode>followBadArc</wpml:waypointHeadingPathMode>
</wpml:waypointHeadingParam>
<wpml:waypointTurnParam>
  <wpml:waypointTurnMode>toPointAndStopWithContinuityCurvature</wpml:waypointTurnMode>
  <wpml:waypointTurnDampingDist>0</wpml:waypointTurnDampingDist>
</wpml:waypointTurnParam>
<wpml:useStraightLine>0</wpml:useStraightLine>
<wpml:actionGroup>
  <wpml:actionGroupId>${waypoint.index+1}</wpml:actionGroupId>
  <wpml:actionGroupStartIndex>${waypoint.index}</wpml:actionGroupStartIndex>
  <wpml:actionGroupEndIndex>${waypoint.index}</wpml:actionGroupEndIndex>
  <wpml:actionGroupMode>parallel</wpml:actionGroupMode>
  <wpml:actionTrigger>
    <wpml:actionTriggerType>reachPoint</wpml:actionTriggerType>
  </wpml:actionTrigger>
  <wpml:action>
    <wpml:actionId>${waypoint.index+1}</wpml:actionId>
    <wpml:actionActuatorFunc>gimbalRotate</wpml:actionActuatorFunc>
    <wpml:actionActuatorFuncParam>
      <wpml:gimbalHeadingYawBase>aircraft</wpml:gimbalHeadingYawBase>
      <wpml:gimbalRotateMode>absoluteAngle</wpml:gimbalRotateMode>
      <wpml:gimbalPitchRotateEnable>1</wpml:gimbalPitchRotateEnable>
      <wpml:gimbalPitchRotateAngle>${waypoint.gimbal}</wpml:gimbalPitchRotateAngle>
      <wpml:gimbalRollRotateEnable>0</wpml:gimbalRollRotateEnable>
      <wpml:gimbalRollRotateAngle>0</wpml:gimbalRollRotateAngle>
      <wpml:gimbalYawRotateEnable>0</wpml:gimbalYawRotateEnable>
      <wpml:gimbalYawRotateAngle>0</wpml:gimbalYawRotateAngle>
      <wpml:gimbalRotateTimeEnable>0</wpml:gimbalRotateTimeEnable>
      <wpml:gimbalRotateTime>0</wpml:gimbalRotateTime>
      <wpml:payloadPositionIndex>0</wpml:payloadPositionIndex>
    </wpml:actionActuatorFuncParam>
  </wpml:action>
</wpml:actionGroup>
</Placemark>
`; }
}

function createWaylinesWPML(waypoints) {
  let wpmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2" xmlns:wpml="http://www.dji.com/wpmz/1.0.2">
<Document>
  <wpml:missionConfig>
    <wpml:flyToWaylineMode>safely</wpml:flyToWaylineMode>
    <wpml:finishAction>goHome</wpml:finishAction>
    <wpml:exitOnRCLost>executeLostAction</wpml:exitOnRCLost>
    <wpml:executeRCLostAction>goBack</wpml:executeRCLostAction>
    <wpml:globalTransitionalSpeed>2.5</wpml:globalTransitionalSpeed>
    <wpml:droneInfo>
      <wpml:droneEnumValue>68</wpml:droneEnumValue>
      <wpml:droneSubEnumValue>0</wpml:droneSubEnumValue>
    </wpml:droneInfo>
  </wpml:missionConfig>
  <Folder>
    <wpml:templateId>0</wpml:templateId>
    <wpml:executeHeightMode>relativeToStartPoint</wpml:executeHeightMode>
    <wpml:waylineId>0</wpml:waylineId>
    <wpml:distance>0</wpml:distance>
    <wpml:duration>0</wpml:duration>
    <wpml:autoFlightSpeed>2.5</wpml:autoFlightSpeed>`;

  waypoints.forEach((wp, index) => {
      const nextWaypoint = index < waypoints.length - 1 ? waypoints[index + 1] : null;
      wpmlContent += generatePlacemark(wp, nextWaypoint);
  });

  wpmlContent += `
  </Folder>
</Document>
</kml>`;
  return wpmlContent;
}

// Export KMZ Function
function exportKMZ() {
  if (waypoints.length === 0) {
    alert('Please add at least one waypoint before exporting');
    return;
  }

  const templateKML = createTemplateKML();
  const waylinesWPML = createWaylinesWPML(waypoints);
  const zip = new JSZip();

  // Add files without binary markers - the encryption will be handled later
  zip.file('wpmz/template.kml', templateKML);
  zip.file('wpmz/waylines.wpml', waylinesWPML);

  // Generate base KMZ file
  zip.generateAsync({ 
    type: 'arraybuffer',
    compression: 'DEFLATE',
    compressionOptions: {
      level: 9
    }
  })
  .then(function(content) {
    // Convert ArrayBuffer to Uint8Array for encryption
    const contentArray = new Uint8Array(content);
    
    // Create encryption header
    const header = new Uint8Array([
      0x50, 0x4B, // PK magic number
      0x03, 0x04, // Local file header signature
      0x14, 0x00, // Version needed to extract
      0x00, 0x00, // General purpose bit flag
      0x08, 0x00  // Compression method
    ]);

    // Create encryption markers
    const encryptionMarker = new Uint8Array([
      0xE6, 0x70, 0x59, // File marker
      0xA9, 0x44, 0x51, // DJI marker
      0x3A            // Separator
    ]);

    // Calculate total size needed for the final array
    const totalSize = header.length + (encryptionMarker.length * 2) + contentArray.length;
    
    // Create final array with proper size
    const finalArray = new Uint8Array(totalSize);
    
    // Copy header
    finalArray.set(header, 0);
    let offset = header.length;
    
    // Add encryption markers at specific positions based on the original file
    const markerPositions = [0x0A, contentArray.length - 0x14];
    markerPositions.forEach(pos => {
      if (pos < finalArray.length) {
        finalArray.set(encryptionMarker, pos);
      }
    });
    
    // Copy the compressed content
    finalArray.set(contentArray, encryptionMarker.length);

    // Create and download the encrypted KMZ file
    const blob = new Blob([finalArray], { type: 'application/vnd.google-earth.kmz' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'waypoints.kmz';
    a.click();
  })
  .catch(function(error) {
    console.error('Error generating KMZ file:', error);
    alert('Error generating KMZ file. Please try again.');
  });
}

// Helper function for string to Uint8Array conversion
function stringToUint8Array(str) {
  const encoder = new TextEncoder();
  return encoder.encode(str);
}


// Function to parse and import KMZ with POI support
function importKMZFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function (e) {
      JSZip.loadAsync(e.target.result)
        .then(zip => {
          const wpmlFile = zip.file("wpmz/waylines.wpml");
          if (!wpmlFile) throw new Error('Waylines WPML file not found in wpmz folder');
          return wpmlFile.async("string");
        })
        .then(wpmlContent => {
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(wpmlContent, "text/xml");
          clearAllWaypoints();
          waypoints.forEach(waypoint => map.removeLayer(waypoint.marker));
          waypoints = [];
          let poiSet = false;

          const placemarks = xmlDoc.getElementsByTagName('Placemark');
          if (placemarks.length === 0) throw new Error('No waypoints found in the KMZ file');

          const coordinates = [];

          for (let i = 0; i < placemarks.length; i++) {
            const placemark = placemarks[i];
            const coordsElement = placemark.querySelector('coordinates');
            if (!coordsElement) continue;

            const coords = coordsElement.textContent.trim().split(',');
            const latlng = L.latLng(parseFloat(coords[1]), parseFloat(coords[0]));
            coordinates.push(latlng);

            const order = i + 1;
            const color = order === 1 ? 'orange' : 'gold';

            // Use namespace-safe tag lookup
            const altitudeElement = placemark.getElementsByTagNameNS("*", "executeHeight")[0];
            const speedElement = placemark.getElementsByTagNameNS("*", "waypointSpeed")[0];
            const gimbalElement = placemark.getElementsByTagNameNS("*", "gimbalPitchRotateAngle")[0];
            const poiElement = placemark.getElementsByTagNameNS("*", "waypointPoiPoint")[0];

            const altitude = altitudeElement ? parseFloat(altitudeElement.textContent.trim()) : 10;
            const speed = speedElement ? parseFloat(speedElement.textContent.trim()) : 2.5;
            const gimbal = gimbalElement ? parseFloat(gimbalElement.textContent.trim()) : -90;

            // Parse POI from first valid waypoint only
            if (poiElement && poiElement.textContent.trim() !== "0.000000,0.000000,0.000000" && !poiSet) {
              const [poiLng, poiLat] = poiElement.textContent.trim().split(',').map(Number);
              setPOI(L.latLng(poiLat, poiLng));
              poiSet = true;
            }

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
          }

          const bounds = L.latLngBounds(coordinates);
          map.fitBounds(bounds, { padding: [50, 50] });

          updateDistances();
          updatePaths();
          updateWaypointIcons();
          updateTotalFlightLength();
          setupGlobalHeightSlider();

          resolve(waypoints);
        })
        .catch(error => {
          console.error('Error parsing KMZ:', error);
          reject(error);
        });
    };
    reader.onerror = function(error) {
      console.error('File reading error:', error);
      reject(error);
    };
    reader.readAsArrayBuffer(file);
  });
}

// Example event listener
document.getElementById('file-kmz').addEventListener('change', function (event) {
  const file = event.target.files[0];
  if (!file) return;

  importKMZFile(file)
    .then(waypoints => {
      console.log('Imported waypoints:', waypoints);
      // Additional processing if needed
    })
    .catch(error => {
      alert('Failed to parse KMZ file: ' + error.message);
    });
});