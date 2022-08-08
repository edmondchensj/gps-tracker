function getUserPool() {
    // Authenticate with Amazon Cognito to retrieve user pool
    var data = { 
		UserPoolId : _config.cognito.userPoolId,
        ClientId : _config.cognito.clientId
    };
    console.log("Cognito data: ", data);
    var userPool = new AmazonCognitoIdentity.CognitoUserPool(data);
    console.log("User pool: ", userPool);
    return userPool;
}

function getUser() {
    // Fetch user object from Cognito
    var userPool = getUserPool();
    var cognitoUser = userPool.getCurrentUser();
    console.log("Cognito user: ", cognitoUser);
    return cognitoUser;
}

function validateCognitoUser() {
    // Validates that the app is logged in. Disregards whether session has expired or not
    var cognitoUser = getUser();
    
	//window.onload = function() {
    if (cognitoUser != null) {
        // This fetches new session for the current user stored in localstorage no matter whether session has expired or not
        // https://stackoverflow.com/questions/42002953/how-to-remember-autorefresh-login-token-when-using-amazon-web-services-cognito
        let success = cognitoUser.getSession(function(err, session) {
            if (err) {
                alert(err);
                return false;
            }
            console.log('session validity: ' + session.isValid());

            AWS.config.region = 'ap-southeast-1'; // Region
            AWS.config.credentials = new AWS.CognitoIdentityCredentials({
                IdentityPoolId: 'ap-southeast-1:2c9e16dd-378c-4066-aa44-e3501e3581e0',
                Logins: {
                    [_config.cognito.cognitoIdentityProviderName]: session.getIdToken().getJwtToken()
                }
            });

            //refreshes credentials using AWS.CognitoIdentity.getCredentialsForIdentity(); migth be better to replace it with our sub function
            AWS.config.credentials.refresh(error => {
                if (error) {
                    console.error(error);
                } else {
                    console.log('Successfully refreshed credentials!');
                }
            });

            console.log("Cognito Identity Creds: ", AWS.config.region, AWS.config.credentials);
            // Get user attributes for info
			cognitoUser.getUserAttributes(function(err, result) {
				if (err) {
					console.log(err);
					return false;
				}
				console.log("User attributes: ", result);	
			});			
			return true;
        });
        return success;
    } else {
        return false;
    }
    //}
}

function refreshCognitoCredentials() {
    const cognitoUser = getUser();
    // session = cognitoUser.getSession();
    let success = cognitoUser.getSession(function(err, session) {
        if (err) {
            alert(err);
            return false;
        }
        
        console.log('session validity: ' + session.isValid());
        const refresh_token = session.getRefreshToken();  
        console.log("Retrieved refresh token: ", refresh_token);

        if (AWS.config.credentials.needsRefresh()) {
            cognitoUser.refreshSession(refresh_token, (err, session) => {
                if(err) {
                    console.log(err);
                } 
                else {
                    AWS.config.credentials.params.Logins[_config.cognito.cognitoIdentityProviderName]  = session.getIdToken().getJwtToken();
                    AWS.config.credentials.refresh((err)=> {
                        if(err)  {
                            console.log(err);
                        }
                        else{
                            console.log("TOKEN SUCCESSFULLY UPDATED");
                        }
                    });
                }
            });
        }})
}

export { validateCognitoUser, getUser, refreshCognitoCredentials };