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
    var cognitoUser = getUser();
    
	//window.onload = function() {
    if (cognitoUser != null) {
        let success = cognitoUser.getSession(function(err, session) {
            if (err) {
                alert(err);
                return false;
            }
            console.log('session validity: ' + session.isValid());
            
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