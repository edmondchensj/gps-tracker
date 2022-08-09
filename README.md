# GPS Tracker Web App

This web app tracks the device's location and sends the latest coordinates to AWS Location Service. 

## Usage
1. Run the server 
```python -m SimpleHTTPServer```
or
```python -m http.server 9000```
2. Open browser and visit http://localhost:8000 (HTTP not HTTPS)



## Todos
- create cognito users with bus plate
- refactor constants
- refactor other code
- replace tiles with AWS tiles?
- test API with dummy data (done)
- integrate API for send coordinates (ok)
- Provide success response (ok)
- Test API without using login userpool (ok - still able to call, which might be insecure)
- Refactor js code in index.html --> esp routing section (ok)
- Remove bus plate selection; use username as bus plate (done)
- update home screen; simplify (ok)

