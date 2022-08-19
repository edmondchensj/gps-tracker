import { goToPage, setBusPlate } from "./utils.js";

function getUserPool() {
    // Authenticate with Amazon Cognito to retrieve user pool
    var data = { 
		UserPoolId : _config.cognito.userPoolId,
        ClientId : _config.cognito.clientId
    };
    var userPool = new AmazonCognitoIdentity.CognitoUserPool(data);
    return userPool;
}

function getUser() {
    // Fetch user object from Cognito
    var userPool = getUserPool();
    var cognitoUser = userPool.getCurrentUser();
    console.log("Current user is: ", cognitoUser);
    return cognitoUser;
}

function validateCognitoUser() {
    // Validates that the app is logged in. Disregards whether session has expired or not
    // https://stackoverflow.com/questions/42002953/how-to-remember-autorefresh-login-token-when-using-amazon-web-services-cognito
    var cognitoUser = getUser();
    
    if (cognitoUser != null) {
        console.log("Cognito user not null. Refreshing session to keep user logged in.")
        
        // This fetches new session for the current user stored in localstorage no matter whether session has expired or not
        cognitoUser.getSession(function(err, session) {
            if (err) {
                alert(err);
            }
            
            refreshCognitoCredentials(session, cognitoUser);
        });
        return true;
    } else {
        console.log("Cognito user is NULL")
        return false;
    }
    //}
}


function getCognitoTokens(cognitoUser) {
    // Automatically refresh session and return valid access token
    const tokens = cognitoUser.getSession(function(err, data) {
        if (err) {
          // Prompt the user to reauthenticate by hand...
        } else {
          const cognitoUserSession = data;
          const idToken = cognitoUserSession.getIdToken().jwtToken;
          const accessToken = cognitoUserSession.getAccessToken().jwtToken;
          return {"accessToken": accessToken, 
                "idToken": idToken}
        }
      });
    return tokens;
}

async function refreshCognitoCredentials(session, cognitoUser) {
    // Checks that AWS credentials require refreshing, and then refreshes both Cognito session and AWS credentials
    const refresh_token = session.getRefreshToken();  

    if (AWS.config.credentials == null || AWS.config.credentials.needsRefresh()) {
        console.log("AWS credentials require refreshing.")

        await cognitoUser.refreshSession(refresh_token, (err, session) => {
            if(err) {
                console.log("An error occurred when refreshing AWS credentials: ", err);
            } 
            else {
                // THIS PART DELAY
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

function signIn(event) {
    // Authenticates user at login page. Takes in form inputs with element IDs specified below

    const buttonText = document.getElementById("signInButton").innerText;
    document.getElementById("signInButton").innerHTML = `
        <div class="spinner-border spinner-border-sm" role="status"></div>    
    `
    
    var authenticationData = {
        Username : document.getElementById("inputUsername").value,
        Password : document.getElementById("inputPassword").value,
    };
    
    var authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails(authenticationData);
    
    var poolData = {
        UserPoolId : _config.cognito.userPoolId, // Your user pool id here
        ClientId : _config.cognito.clientId, // Your client id here
    };
    
    var userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
    
    var userData = {
        Username : document.getElementById("inputUsername").value,
        Pool : userPool,
    };
    
    var cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
    event.preventDefault(); // prevent page from refreshing before authentication is completed, causing network errors
    cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: async function (result) {
            console.log("User authenticated. Logging in...")
            const __ = await goToPage("home");
            setBusPlate(getUser().username);
            document.getElementById("logout").style.display = "block"; 

            // Refresh AWS credentials
            console.log("Refreshing AWS credentials")
            cognitoUser.getSession(function(err, session) {
                if (err) {
                    alert(err);
                    return false;
                }

                // Force refresh for first login
                refreshCognitoCredentials(session, cognitoUser, true);
            })
        },

        onFailure: function(err) {
            alert(err.message || JSON.stringify(err));
            document.getElementById("signInButton").innerHTML = buttonText;
        },
    });
}
export { validateCognitoUser, getUser, refreshCognitoCredentials, 
        logoutUser, getCognitoTokens, signIn };