var changi = [// southwest
        [1.3214, 103.9729],
        // northeast
        [1.3849, 104.0192]],
        wider = [
        // southwest
        [1.315, 103.94],
        // northeast
        [1.41, 104.05]];

var singapore_island = [//southwest
        [1.265206318838706, 103.71624436262216],
        //northeast
        [1.432342931373927, 103.98382638715712]]

var path_to_changi_map = "./img/changi_21May21.png"

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
    var metadata_textbox = document.getElementById(metadata_id);
    var metadata_placeholder = document.getElementById(metadata_placeholder_id);

    map.on('locationfound', function(e) {
        //alert('Success: Your location should now be shown on the map.')
        var radius = e.accuracy;
        var magnifier = 1.1;
        //var popupContent = "You are within " + radius + " meters from here.";

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
                            radius: radius*magnifier,
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
            outer_circle.setRadius(radius*magnifier);
        }
        console.log('location found');

        // Update metadata textbox
        metadata_placeholder.style.display = "none";
        metadata_textbox.style.display = "hidden"; // hidden allows space to remain, but text invisible
        var current_metadata = metadata_textbox.innerHTML;
        var date = new Date();
        var timestamp = date.toDateString() + " " + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
        var metadata = `
                <div class="row pl-2">{</div> 
                <div class="row pl-4">"lat": "${e.latlng.lat}", </div>
                <div class="row pl-4">"lng": "${e.latlng.lng}", </div>
                <div class="row pl-4">"last_update_ts": "${timestamp}" </div>
                <div class="row pl-2">}</div>
            `
        if (current_metadata != "") {
            var metadata = metadata + "," + current_metadata; 
        }
        metadata_textbox.innerHTML = metadata;
        $('#'+metadata_id).fadeIn("slow");
    });

    map.on('locationerror', function(e) {
        console.log('location not found');
    });

    // Allow user to modify zoom level 
    map.on('zoomend', changeLocateMaxZoom);

    function changeLocateMaxZoom(e) {
    if (map._locateOptions) {
        map._locateOptions.maxZoom = map.getZoom();
    }}
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
    toggle_button.on('change', function() {
        if (toggle_button.is(':checked')) {
            showUserLocation(map, gps_group, metadata_id, metadata_placeholder_id);
        }
        else {
            stopLocate(map, gps_group, metadata_id, metadata_placeholder_id);
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


