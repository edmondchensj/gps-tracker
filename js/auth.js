import { goToPage } from "./utils.js";

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
            
            refreshCognitoCredentials(session, cognitoUser);

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


function refreshCognitoCredentials(session, cognitoUser) {
    // Checks that AWS credentials require refreshing, and then refreshes both Cognito session and AWS credentials
    console.log('Session validity: ' + session.isValid());
    const refresh_token = session.getRefreshToken();  

    if (AWS.config.credentials == null || AWS.config.credentials.needsRefresh()) {
        console.log("AWS credentials require refreshing.")
        cognitoUser.refreshSession(refresh_token, (err, session) => {
            if(err) {
                console.log("An error occurred when refreshing AWS credentials: ", err);
            } 
            else {
                console.log("Re-initialising AWS credentials")
                AWS.config.region = 'ap-southeast-1'; // Region
                AWS.config.credentials = new AWS.CognitoIdentityCredentials({
                    IdentityPoolId: _config.cognito.identityPoolId,
                    Logins: {
                        [_config.cognito.cognitoIdentityProviderName]: session.getIdToken().getJwtToken()
                    }
                });
                console.log("New Cognito Identity credentials: ", AWS.config.credentials);
                AWS.config.credentials.refresh((err)=> {
                    if(err)  {
                        console.log("Credentials could not be refreshed: ", err);
                    }
                    else{
                        console.log("Credentials successfully updated");
                    }
                });
            }
        });
    }
}

function logoutUser() {
    if (confirm("Are you sure you wish to logout?") == true) {
        console.log("Logging out ...")
        var cognitoUser = getUser();
        if (cognitoUser != null) {
            cognitoUser.signOut();
        }
        document.getElementById("logout").style.display = "none"; 
        goToPage("login");
        history.replaceState(null, null, ' '); // clear URL hash if present   
    }
}
export { validateCognitoUser, getUser, refreshCognitoCredentials, logoutUser };