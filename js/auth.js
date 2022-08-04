function validateCognitoUser() {
    var data = { 
		UserPoolId : _config.cognito.userPoolId,
        ClientId : _config.cognito.clientId
    };
    console.log("Cognito data: ", data);
    var userPool = new AmazonCognitoIdentity.CognitoUserPool(data);
    var cognitoUser = userPool.getCurrentUser();
    console.log("Cognito user: ", cognitoUser);
    
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

export { validateCognitoUser };