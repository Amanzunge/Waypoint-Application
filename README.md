# Waypoint Mission Planner

## Project Structure
```
waypoint/
├── db.sqlite3
├── manage.py
├── Uputstvo.txt
├── tree.txt
├── aplikacija/
│   ├── admin.py
│   ├── apps.py
│   ├── models.py
│   ├── tests.py
│   ├── urls.py
│   ├── views.py
│   ├── __init__.py
│   ├── static/
│   │   ├── kmz.js
│   │   ├── path.js
│   │   ├── poi.js
│   │   ├── polygon.js
│   │   ├── popup.js
│   │   ├── waypoint.js
│   │   ├── style.css
│   │   └── icons/
│   └── templates/
│       └── index.html
└── waypoint/
    ├── settings.py
    ├── urls.py
    ├── wsgi.py
    └── __init__.py
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
1. Run the Django server using `python manage.py runserver`.
2. Open `http://127.0.0.1:8000/` in your browser.
3. Use the popup to configure waypoint altitude, gimbal angle, speed, and action.
4. Set a POI using right-click (context menu) on the map.
5. Use buttons to export KMZ or import a saved mission.
6. Load the exported KMZ into your DJI controller by replacing a dummy mission (Android/data/dji.go.v5/files/waypoint/LAST_CREATED_FOLDER).

## Dependencies
- Leaflet.js (map interface)
- Leaflet.draw (drawing polygons)
- JSZip (KMZ creation and extraction)

## Compatibility
- Tested with DJI Mavic 3 Pro
- Produces DJI Fly-compatible KMZ files (with waypoint actions and gimbal rotation)
