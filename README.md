# GPS Tracker Web App

This web app tracks the device's location and sends the latest coordinates to AWS Location Service. 

## Usage
1. Run the server 
```python -m SimpleHTTPServer```
or
```python -m http.server 9000```
2. Open browser and visit http://localhost:8000 (HTTP not HTTPS)



## Todos
- integrate API for send coordinates (ok)
- Provide success response (ok)
- test API with dummy data
- Refactor js code in index.html --> esp routing section
- Remove bus plate selection; use username as bus plate
- create cognito users with bus plate
- update home screen; simplify
