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

export { validateCognitoUser, getUser };