const axios = require('axios');
const sql = require('mssql');
const qs = require('qs');


const config = {
    user: process.env.DB_USERNAME, // better stored in an app setting such as process.env.DB_USER
    password: process.env.DB_PASSWORD, // better stored in an app setting such as process.env.DB_PASSWORD
    server: process.env.DB_HOSTNAME, // better stored in an app setting such as process.env.DB_SERVER
    port: 1433, // optional, defaults to 1433, better stored in an app setting such as process.env.DB_PORT
    database: 'usdtransactvc', // better stored in an app setting such as process.env.DB_NAME
    authentication: {
        type: 'default'
    },
    options: {
        encrypt: true
    }
}
async function connectAndQuery(email) {
    try {
        console.log(JSON.stringify(config),"\n\n");
        var poolConnection = await sql.connect(config);

        console.log("Reading rows from the Table...");
        var q = `SELECT USERS.userName, USERS.userEmail, ua.attributeName, ua.attributeValue
        FROM USERS
        INNER JOIN UserAttributes AS ua ON USERS.userID = ua.userID
        WHERE USERS.userEmail = '${email}';`
        console.log(q);
        var resultSet = await poolConnection.request().query(q);

        console.log(`${resultSet.recordset.length} rows returned.`);

        // output column headers
        var columns = "";
        for (var column in resultSet.recordset.columns) {
            columns += column + ", ";
        }
        console.log("%s\t", columns.substring(0, columns.length - 2));

        // ouput row contents from default record set
        var rows = [];
        resultSet.recordset.forEach(row => {
            rows.push(row);
            console.log("%s\t%s\t%s\t%s", row.userName, row.userEmail, row.attributeName, row.attributeValue);
        });

        // close connection only when we're certain application is finished
        poolConnection.close();
    } catch (err) {
        console.error(err.message);
    }
    return rows;
}

const fetchManager = require('./utils/fetchManager');

const isConfigured = (req) => {
    
    if (req.app.locals.appSettings.credentials.clientId != 'REPLACE-WITH-YOUR-APP-CLIENT-ID' &&
        req.app.locals.appSettings.credentials.tenantId != 'REPLACE-WITH-YOUR-APP-TENANT-ID' &&
        req.app.locals.appSettings.credentials.clientSecret != 'REPLACE-WITH-YOUR-APP-CLIENT-ID-SECRET') {
        console.log("appSettings is configured")
        return true;
    } else {
        console.log("appSettings is NOT configured")
        return false;
    }
}

exports.getHomePage = (req, res, next) => {

    let access_token = '';
    let contracts = '';
    axios({
        method: 'post',
        url: 'https://login.microsoftonline.com/7b79d002-1780-49a7-804f-8437a1f0222d/oauth2/v2.0/token',
        headers:{'content-Type':'application/x-www-form-urlencoded'},
        data: qs.stringify({grant_type: 'client_credentials', 
            client_secret:'rL98Q~JlmJeu5.ZOATdEalWxANHbsyD9WB4aUbmx',
            client_id:'4af44c25-ae3f-4436-b42e-53eda45413cd',
           redirect_uri:'http://localhost',
            scope:'6a8b4b39-c021-437c-b060-5a14a3fd65f3/.default'
        })
      })
      .then(function(postResponse){
        access_token = postResponse.data.access_token;
        //console.log(access_token);
        axios({
            method: 'get',
            url: 'https://verifiedid.did.msidentity.com/v1.0/verifiableCredentials/authorities/6dd1670d-05da-da07-006e-6655fe15ccb3/contracts',
            headers:{'Authorization':('Bearer ' + access_token)}
          })
          .then(function(getResponse){
            contracts = getResponse.data.value;
            console.log(contracts);
          })
          .catch(function (error) {
            if (error.response) {
              // The request was made and the server responded with a status code
              // that falls out of the range of 2xx
              console.log(error.response.data);
              console.log(error.response.status);
              console.log(error.response.headers);
            } else if (error.request) {
              // The request was made but no response was received
              // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
              // http.ClientRequest in node.js
              console.log(error.request);
            } else {
              // Something happened in setting up the request that triggered an Error
              console.log('Error', error.message);
            }
            console.log(error.config);
          });
      })
      .catch(function (error) {
        if (error.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          console.log(error.response.data);
          console.log(error.response.status);
          console.log(error.response.headers);
        } else if (error.request) {
          // The request was made but no response was received
          // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
          // http.ClientRequest in node.js
          console.log(error.request);
        } else {
          // Something happened in setting up the request that triggered an Error
          console.log('Error', error.message);
        }
        console.log(error.config);
      });
      
    res.render('home', { isAuthenticated: req.session.isAuthenticated, configured: isConfigured(req) });

}

exports.getIssuerPage = (req, res, next) => {
    connectAndQuery(req.session.idTokenClaims.emails[0]).then((attributes) => {
        const claims = {
            name: req.session.idTokenClaims.name,
            authEmail: req.session.idTokenClaims.emails[0],
            preferred_username: req.session.idTokenClaims.preferred_username,
            oid: req.session.idTokenClaims.oid,
            sub: req.session.idTokenClaims.sub,
            userName: attributes[0].userName,
            userEmail: attributes[0].userEmail,
            attributes: attributes
        };
    res.render('issuer', { isAuthenticated: req.session.isAuthenticated, claims: claims, configured: isConfigured(req) });
    });
}
exports.getManagePage = (req, res, next) => {

    const claims = {
        name: req.session.idTokenClaims.name,
        preferred_username: req.session.idTokenClaims.preferred_username,
        oid: req.session.idTokenClaims.oid,
        sub: req.session.idTokenClaims.sub
    };

    res.render('manage', { isAuthenticated: req.session.isAuthenticated, claims: claims, configured: isConfigured(req) });

}
exports.getCreatePage = (req, res, next) => {

    const claims = {
        name: req.session.idTokenClaims.name,
        preferred_username: req.session.idTokenClaims.preferred_username,
        oid: req.session.idTokenClaims.oid,
        sub: req.session.idTokenClaims.sub
    };

    res.render('create', { isAuthenticated: req.session.isAuthenticated, claims: claims, configured: isConfigured(req) });

}
exports.getIssueCredentialsPage = (req, res, next) => {

    const claims = {
        name: req.session.idTokenClaims.name,
        preferred_username: req.session.idTokenClaims.preferred_username,
        oid: req.session.idTokenClaims.oid,
        sub: req.session.idTokenClaims.sub
    };

    res.render('issuecreds', { isAuthenticated: req.session.isAuthenticated, claims: claims, configured: isConfigured(req) });

}
exports.getDeleteCredentialsPage = (req, res, next) => {

    const claims = {
        name: req.session.idTokenClaims.name,
        preferred_username: req.session.idTokenClaims.preferred_username,
        oid: req.session.idTokenClaims.oid,
        sub: req.session.idTokenClaims.sub
    };

    res.render('deletecreds', { isAuthenticated: req.session.isAuthenticated, claims: claims, configured: isConfigured(req) });

}
exports.getVpage = (req, res, next) => {

    const claims = {
        name: req.session.idTokenClaims.name,
        preferred_username: req.session.idTokenClaims.preferred_username,
        oid: req.session.idTokenClaims.oid,
        sub: req.session.idTokenClaims.sub
    };

    res.render('verifier', { isAuthenticated: req.session.isAuthenticated, claims: claims, configured: isConfigured(req) });
}
exports.getHolderpage = (req, res, next) => {

    const claims = {
        name: req.session.idTokenClaims.name,
        preferred_username: req.session.idTokenClaims.preferred_username,
        oid: req.session.idTokenClaims.oid,
        sub: req.session.idTokenClaims.sub
    };

    res.render('holder', { isAuthenticated: req.session.isAuthenticated, claims: claims, configured: isConfigured(req) });
}
exports.getExistingCredTypes = (req, res, next) => {

    const claims = {
        name: req.session.idTokenClaims.name,
        preferred_username: req.session.idTokenClaims.preferred_username,
        oid: req.session.idTokenClaims.oid,
        sub: req.session.idTokenClaims.sub
    };

    res.render('existingcredtypes', { isAuthenticated: req.session.isAuthenticated, claims: claims, configured: isConfigured(req) });
}

