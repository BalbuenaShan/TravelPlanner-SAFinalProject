# TravelPlanner

A small Expo React Native app to add and manage trips. Data is saved using the PHP file in `travel_api/api.php`.

How it works
- The app talks to one API URL (set in `src/config.js`).
- Screens: add a trip, list trips, view trip details.

Quick setup
```
cd /path/to/TravelPlanner-SAFinalProject-main
npm install
# start the PHP API (example)
cd travel_api
php -S 0.0.0.0:8000
# back in project root, set API in src/config.js to http://<your-ip>:8000/api.php
cd ..
npm start
```

Examples
- Add a trip: go to Add Trip screen, fill form, hit save.
- View trips: Trips screen shows all trips; tap one to see details.

Features (CRUD)
- Create: add trips via `AddTripScreen` (POST to API).
- Read: list trips in `TripsScreen` and view details in `TripDetailsScreen` (GET).
- Update: edit a trip from details (sends update request to API).
- Delete: remove a trip from list or details (sends delete request to API).

Notes
- Set `API_URL` in `src/config.js` to your machine IP so device/emulator can reach the PHP server.
- For Android emulator use `http://10.0.2.2/...` if needed.

Jazrel Shan Kurvy A. Balbuena (SA Final Project)


