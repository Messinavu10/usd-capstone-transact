const appSettings = () => {

    // BASE_URI = `YOUR-APP-NAME`
    const domainName = process.env.BASE_URI || "localhost";
    
    let port, baseUri;
    
    if (domainName === 'localhost') {
        port = process.env.PORT || 8080;
        baseUri = `http://${domainName}:${port}`;
        console.log(`local development only baseUri = ${baseUri}`)
    } else if (domainName.startsWith('http') ) {
        // deployed to NGROK
        port = 8080;
        baseUri = domainName;
        console.log(`deploy to NGROK baseUri = ${baseUri}`)

    } else {
        // deployed to Azure
        port = 8080;
        baseUri = `https://${domainName}.azurewebsites.net`;
        console.log(`deploy to Azure baseUri = ${baseUri}`)
    }
    
    const app_settings_vals = {
        "host": {
            "port": port,
            "baseUri": baseUri,
            "domainName": domainName,
            "ver":"0.0.1"
        },
        "credentials": {
            "clientId": process.env.AD_CLIENT_ID || "REPLACE-WITH-YOUR-APP-CLIENT-ID",
            "tenantId": process.env.AD_TENANT_ID || "REPLACE-WITH-YOUR-APP-TENANT-ID",
            "clientSecret": process.env.AD_CLIENT_ID_SECRET || "REPLACE-WITH-YOUR-APP-CLIENT-ID-SECRET"
        },
        "settings": {
            "homePageRoute": "/home",
            "redirectUri": `${baseUri}/redirect`,
            "postLogoutRedirectUri": `${baseUri}/`,
            "scopes": ["https://graph.microsoft.com/User.Read.All"]
        },
        "resources": {
            "graphAPI": {
                "callingPageRoute": "/issuer",
                "endpoint": "https://graph.microsoft.com/v1.0/{subjectId}",
                "scopes": ["https://graph.microsoft.com/User.Read.All"]
            },
            "armAPI": {
                "callingPageRoute": "/tenant",
                "endpoint": "https://management.azure.com/tenants?api-version=2020-01-01",
                "scopes": ["https://management.azure.com/user_impersonation"]
            }
        },
        "policies": {
            "authorityDomain": process.env.B2C_AUTHORITY_DOMAIN || "REPLACE-WITH-YOUR-APP-AUTHORITY-DOMAIN",
            "signUpSignIn": {
                "authority": process.env.B2C_AUTHORITY || "REPLACE-WITH-YOUR-APP-AUTHORITY"
            }
        }

    }
    console.log(JSON.stringify(app_settings_vals));
    return app_settings_vals;
}

module.exports = appSettings;