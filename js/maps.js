import { sendDataToLocationService, stopService } from "./api.js";

const changi = [// southwest
        [1.3214, 103.9729],
        // northeast
        [1.3849, 104.0192]],
        wider = [
        // southwest
        [1.315, 103.94],
        // northeast
        [1.41, 104.05]];

const singapore_island = [//southwest
        [1.265206318838706, 103.71624436262216],
        //northeast
        [1.4292806607158928, 104.02705269597813]]

function createMap(map_id, lat=1.355, lng=103.991, zoom=12) { 
    // Render map at specified centre coordinates and zoom. 

    // Initialize Leaflet map
    console.log("Creating Leaflet map object")
    var map = L.map(map_id, {
            maxZoom: 18,
            minZoom: 12,
            maxBounds: singapore_island,
            attributionControl: false,
            dragging: !L.Browser.mobile,
            tap: !L.Browser.mobile
      }).setView({lat: lat, lng: lng}).setZoom(zoom);

    // Add the OpenStreetMap tiles
    L.tileLayer.grayscale('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            bounds: singapore_island,
            attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap contributors</a>'
            }).addTo(map);

    // show the scale bar on the lower left corner
    L.control.scale().addTo(map);

    return map;
}

function showUserLocation(map, gps_group, metadata_id, metadata_placeholder_id, maxZoom=16) {
    // Show user's current GPS location
    map.locate({setView: true, 
                maxZoom: maxZoom,
                watch: true,
                enableHighAccuracy: true,
                timeout: 3000});
    var inner_circle = null;
    var outer_circle; 

    map.on('locationfound', async function(e) {
        var radius = e.accuracy;

        // Create new marker if location found for the first time
        if (inner_circle == null) {
            inner_circle = new L.circle(e.latlng, {
                            radius: 8,
                            weight: 2,
                            color: '#ffffff',
                            fillColor: '#1249A6',
                            fillOpacity: 0.8}).addTo(map);
            //inner_circle.bindPopup(popupContent).openPopup();
            outer_circle = new L.circle(e.latlng, {
                            radius: radius,
                            weight: 3,
                            color: '#3388ff',
                            fillColor: '#3388ff',
                            fillOpacity: 0.3}).addTo(map);

            // Add to layer group for easier deleting 
            gps_group.addLayer(inner_circle);
            gps_group.addLayer(outer_circle);
        }
        // Update marker for subsequent new gps locations
        else {
            //inner_circle.getPopup().setContent(popupContent); 
            inner_circle.setLatLng(e.latlng);
            outer_circle.setLatLng(e.latlng);
            outer_circle.setRadius(radius);
        }
        console.log('location found');
        let success = await sendDataToLocationService(e);
        updateLocationMetadataText(e, metadata_id, metadata_placeholder_id, success);
    });

    map.on('locationerror', function(e) {
        console.log('location not found');
        updateLocationMetadataText(null, metadata_id, metadata_placeholder_id, null);
    });

    // Allow user to modify zoom level 
    map.on('zoomend', changeLocateMaxZoom);

    function changeLocateMaxZoom(e) {
    if (map._locateOptions) {
        map._locateOptions.maxZoom = map.getZoom();
    }}
}

function updateLocationMetadataText(e, metadata_id, metadata_placeholder_id, status) {
    // Update location textbox with latest location updates
    var metadata_textbox = document.getElementById(metadata_id);
    var metadata_placeholder = document.getElementById(metadata_placeholder_id);
    metadata_placeholder.style.display = "none";
    metadata_textbox.style.display = "none"; 

    let d = new Date();
    const timeNow = d.toTimeString().substring(0,8);

    if (status == null && e != null) {
        metadata_textbox.innerHTML = `<div class="row justify-content-center">
                                <small class="font-weight-light text-muted ml-2">We found your location but signal is too weak. Please wait ...</small>
                                <small class="font-weight-light text-muted block">(Current accuracy: ${e.accuracy.toFixed(0)} metres)</small>
                            </div>`
    } else if (status == null) {
        metadata_textbox.innerHTML = `<div class="row justify-content-center">
                                <small class="font-weight-light text-muted ml-2">We're still searching for your location ...</small>
                            </div>`
    } else {
        const statusHTML = status ? `
                        <div class="row justify-content-center">
                            <span class="spinner-grow spinner-grow-sm text-success"></span>
                            <span class="text-success font-weight-light ml-2">Tracking in progress</span>
                        </div>
                        <small class="row pl-2 mx-auto mt-1 justify-content-center text-muted">Last updated at ${timeNow} </small>` :
                        `
                        <div class="row justify-content-center">
                            <div class="spinner-grow spinner-grow-sm text-danger"></div>
                            <div class="text-danger font-weight-light ml-2">An error occurred!</div>
                        </div>
                        <div class="row justify-content-center">
                            <div class="text-muted font-weight-light">Press button again or contact the admin</div>
                        </div>`
        metadata_textbox.innerHTML = statusHTML;
    }

    $('#'+metadata_id).fadeIn("slow");
}


function stopLocate(map, gps_group, metadata_id, metadata_placeholder_id) {
    // Stop GPS tracking & remove GPS leaflet layer group

    console.log('Stopping GPS service ...');

    // Stop GPS searching
    map.stopLocate();

    // Turn off JS events relating to GPS
    map.off('locationfound');
    map.off('locationerror');
    map.off('zoomend');

    // Clear GPS circles
    gps_group.clearLayers();

    // Remove metadata
    var metadata_textbox = document.getElementById(metadata_id);
    var metadata_placeholder = document.getElementById(metadata_placeholder_id);
    console.log("Clearing metadata")
    metadata_placeholder.style.display = "block";
    metadata_textbox.innerHTML = "";
    metadata_textbox.style.display = "none";
}

function renderMap(map, toggle_btn_id, metadata_id, metadata_placeholder_id) {
    // Render Leaflet map. 
    // Shows user's latest geolocation and updates the metadata HTML div with latest location metadata 

    console.log("Adding layer group to map");
    var gps_group = L.layerGroup().addTo(map);

    // Start locating user if toggle is on
    var toggle_button = $('#' + toggle_btn_id);
    toggle_button.on('change', async function() {
        if (toggle_button.is(':checked')) {
            showUserLocation(map, gps_group, metadata_id, metadata_placeholder_id);
        }
        else {
            stopLocate(map, gps_group, metadata_id, metadata_placeholder_id);
            stopService().then((resp) => {
                if (resp.status != 200) {
                    console.log("Error in stopService API call. Status code: ", resp.status);
                    updateLocationMetadataText(null, metadata_id, metadata_placeholder_id, false);
                }
              });
        }
    })

}

L.TileLayer.Grayscale = L.TileLayer.extend({
	options: {
		quotaRed: 21,
		quotaGreen: 71,
		quotaBlue: 8,
		quotaDividerTune: 0,
		quotaDivider: function() {
			return this.quotaRed + this.quotaGreen + this.quotaBlue + this.quotaDividerTune;
		}
	},

	initialize: function (url, options) {
		options = options || {}
		options.crossOrigin = true;
		L.TileLayer.prototype.initialize.call(this, url, options);

		this.on('tileload', function(e) {
			this._makeGrayscale(e.tile);
		});
	},

	_createTile: function () {
		var tile = L.TileLayer.prototype._createTile.call(this);
		tile.crossOrigin = "Anonymous";
		return tile;
	},

	_makeGrayscale: function (img) {
		if (img.getAttribute('data-grayscaled'))
			return;

                img.crossOrigin = '';
		var canvas = document.createElement("canvas");
		canvas.width = img.width;
		canvas.height = img.height;
		var ctx = canvas.getContext("2d");
		ctx.drawImage(img, 0, 0);

		var imgd = ctx.getImageData(0, 0, canvas.width, canvas.height);
		var pix = imgd.data;
		for (var i = 0, n = pix.length; i < n; i += 4) {
                        pix[i] = pix[i + 1] = pix[i + 2] = (this.options.quotaRed * pix[i] + this.options.quotaGreen * pix[i + 1] + this.options.quotaBlue * pix[i + 2]) / this.options.quotaDivider();
		}
		ctx.putImageData(imgd, 0, 0);
		img.setAttribute('data-grayscaled', true);
		img.src = canvas.toDataURL();
	}
});

L.tileLayer.grayscale = function (url, options) {
	return new L.TileLayer.Grayscale(url, options);
};

export { createMap, renderMap };


