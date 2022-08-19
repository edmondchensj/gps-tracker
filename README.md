# GPS Tracker Web App

This web app tracks the device's location and sends the latest coordinates to AWS Location Service. 

## Usage
1. Run the server 
```python -m SimpleHTTPServer```
or
```python -m http.server 9000```
2. Open browser and visit http://localhost:8000 (HTTP not HTTPS)


## Todos
- implement re-polling of get device history -> retry with refresh credentials + to bypass maxresults issue

