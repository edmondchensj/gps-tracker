import { getUser, refreshCognitoCredentials, getCognitoTokens } from "./auth.js";
import { getBusPlate, getCurrentISOTime } from "./utils.js";

async function stopService() {
    // Call stop-service API when toggle is turned off, which wipes out the ETA calculations in the backend

    console.log("Calling stopService API");
    const cognitoUser = getUser();
    const cognitoTokens = getCognitoTokens(cognitoUser);
    console.log("Cognito tokens: ", cognitoTokens)
    const url = _config.apiUrls.stopService;
    const response = await fetch(url, {
        method: 'POST', 
        cache: 'no-cache', 
        headers: {
            //"Authorization": cognitoTokens["accessToken"] // not in use yet by the API
        },
        referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
        body: JSON.stringify({
            "Authorization": _config.apiKeys.stopService,
            "BusId": getBusPlate()
        })
    });
    console.log("StopService API Response: ", response);
    return response; 
}


async function getDevicePositionHistory(deviceId, start, end, maxResults=100) {
    // Make API call to Amazon Location Service to fetch device position history for a given date range and device ID
    // Params defined in https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-location/interfaces/getdevicepositionhistorycommandinput.html
    
    // Initialise location client
    const credentials = await getAWSCredentials();
    const locationClient = new AWS.Location({
        credentials,
        region: _config.cognito.region
    });

    const params = {
        TrackerName: _config.location.trackerName, 
        DeviceId: deviceId,
        StartTimeInclusive: start,
        EndTimeExclusive: end,
        MaxResults: maxResults
    }
    
    console.log("Calling getDevicePositionHistory with params: ", params);
    
    var nextToken = true // api paginates results, so we need to check nexttoken to retrieve all results
    var data = [];
    var counter = 0
    const MAX_PAGES = 10; 
    var apiFailAttempts = 0;
    const MAX_RETRY = 3;
    var statusCode = 200;

    while (nextToken != null) {
        try {
            // Break if too many pages are being fetched as it can be costly
            if (counter == MAX_PAGES) {
                console.log("Data exceeded capacity to call. Stopping");
                statusCode = 206;
                break;
            }

            // Call API
            counter = counter + 1;
            console.log(`Fetching device positions (${counter})`)
            let resp = await locationClient.getDevicePositionHistory(params).promise();
            data = data.concat(resp.DevicePositions);
            nextToken = resp.NextToken;
            console.log("GetDevicePositionHistory response: ", resp);
        } catch (error) {
            // Handle failure
            apiFailAttempts = apiFailAttempts + 1;
            console.log(`An error occurred when calling getDevicePositionHistory ${apiFailAttempts} `, error);
            if (apiFailAttempts >= MAX_RETRY) {
                statusCode = 500;
                break;
            }
        }        
    }
    console.log("API call completed")
    return [data, statusCode];
}

async function getAWSCredentials() {
    // Get latest refreshed AWS credentials to make subsequent API calls
    const cognitoUser = getUser();
    if (cognitoUser == null) return false;

    // Refresh credentials
    await cognitoUser.getSession(async function(err, session) {
        if (err) {
            alert(err);
            return false;
        } else {
            await refreshCognitoCredentials(session, cognitoUser);
        }})
        
    const credentials = AWS.config.credentials; // null -> valid
    return credentials
}

async function sendDataToLocationService(e) {
    // Send coordinates and other metadata to AWS Location Service if accuracy value <= 100
    
    // Accuracy check -- dont transmit data if accuracy > 100
    console.log("Current GPS accuracy: ", e.accuracy);
    if (e.accuracy > _config.gps.maxAccuracy) {
        console.log("GPS error margin too high, ignoring values and waiting for next re-try...")
        return null;
    }

    const credentials = getAWSCredentials()

    // Initialise Location client
    const locationClient = new AWS.Location({
        credentials,
        region: _config.cognito.region
    });

    // Test parameters (ignore)
    const insideGeofence = [103.98457177301275, 1.3395123571936962]
    const outsideGeofence = [103.98530940713842,1.3405608558355409]

    // Parse service type param using username
    const username = cognitoUser.username;
    const serviceType = (username.includes("landside")) ? "landside" : "airside";

    // Set API params
    const params = {
        TrackerName: _config.location.trackerName,
        Updates: [
        {
            DeviceId: getBusPlate(),
            Accuracy: { 
                Horizontal: e.accuracy
            },
            Position: [e.latlng.lng, e.latlng.lat],
            SampleTime: getCurrentISOTime(),
            PositionProperties: {
                "field1": serviceType // type of service: airside or landside
            }
        }
        ]
    } 
    console.log("Sending data to Amazon Location with params: ", params);

    // Call location client to update position, using async/await as recommended in the docs
    try {
        const data = await locationClient.batchUpdateDevicePosition(params).promise();
        console.log("Batch update response: ", data);
        const statusCode = data.$response.httpResponse.statusCode
        console.log("Status code: ", statusCode);
        if (statusCode!=200) return false;
        else return true;
    } catch (error) {
        console.log("An error occurred when updating device position", error, error.stack); // an error occurred
        return false;
    }
}

export { sendDataToLocationService, stopService, getDevicePositionHistory };