# Waypoint Mission Planner

## Project Structure
```
./index.html
./waypoint.js
./popup.js
./kmz.js
./polygon.js
./poi.js
./path.js
```

## Overview
This application is a browser-based waypoint mission planner designed for DJI drones, especially the Mavic 3 Pro. It enables users to define and export autonomous flight missions in KMZ format compatible with DJI Fly.

## Features
- Interactive Leaflet.js-based map interface
- Add, edit, delete waypoints with altitude, speed, gimbal, and custom actions (e.g. Take Picture)
- Define POIs (Points of Interest) for drone heading
- Polygon tool for auto-generating perimeter waypoints
- Export and import DJI-compatible encrypted KMZ files
- Visualize and measure flight path and total flight distance

## File Descriptions
- `index.html`: Main HTML layout, loads all JS components and control panel
- `waypoint.js`: Core waypoint logic, including data structures and state updates
- `popup.js`: Popup UI logic for editing waypoint properties
- `kmz.js`: Export/import logic for DJI Fly-compatible KMZ missions (with encrypted markers)
- `polygon.js`: Polygon drawing and automatic edge waypoint generation
- `poi.js`: POI selection and integration with heading system
- `path.js`: Path rendering between waypoints and flight length calculation

## How to Use
1. Open the `index.html` in a modern web browser.
2. Click on the map to add waypoints or use the polygon tool.
3. Use the popup to configure waypoint altitude, gimbal angle, speed, and action.
4. Set a POI using right-click (context menu) on the map.
5. Use buttons to export KMZ or import a saved mission.
6. Load the exported KMZ into your DJI controller by replacing a dummy mission.

## Dependencies
- Leaflet.js (map interface)
- Leaflet.draw (drawing polygons)
- JSZip (KMZ creation and extraction)

## Compatibility
- Tested with DJI Mavic 3 Pro
- Produces DJI Fly-compatible KMZ files (with waypoint actions and gimbal rotation)

## License
This project is open-source and provided under the MIT License.

---
Made with ❤️ for custom drone mission planning.
