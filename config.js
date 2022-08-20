window._config = {
    cognito: {
        userPoolId: 'ap-southeast-1_f78ln7RZL', // diva-sandbox tbt-user-pool
        region: 'ap-southeast-1',
		clientId: '65g1dvj5s8vo33v42vi9vsrbai', // tbt-web-app
        identityPoolId: "ap-southeast-1:2c9e16dd-378c-4066-aa44-e3501e3581e0",
        cognitoIdentityProviderName: "cognito-idp.ap-southeast-1.amazonaws.com/ap-southeast-1_f78ln7RZL" // cognito login with user pool id
    },
    location: {
        trackerName: "bus_tracker",
        maxUpdateFrequencySeconds: 10, // minimum duration between each update
        maxSizeGetDevicePositionHistory: 1000 // maximum number of device positions to fetch per getDevicePositionHistory call
    },
    gps: {
        maxAccuracy: 250
    },
    apiUrls: {
        stopService: "https://npanq82o3m.execute-api.ap-southeast-1.amazonaws.com/stop-service"
    },
    apiKeys: {
        stopService: "4VFv%tfoM19G@sj1"
    }
};