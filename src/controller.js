const axios = require("axios");
// const sql = require('mssql');
const qs = require("qs");
const jmespath = require("jmespath");
// const verifiedid = require('./services/verified_id');

const sql = require("mssql");

// create another service file.
const getRole = require("./services");

const config = {
  user: process.env.DB_USERNAME, // better stored in an app setting such as process.env.DB_USER
  password: process.env.DB_PASSWORD, // better stored in an app setting such as process.env.DB_PASSWORD
  server: process.env.DB_HOSTNAME, // better stored in an app setting such as process.env.DB_SERVER
  port: 1433, // optional, defaults to 1433, better stored in an app setting such as process.env.DB_PORT
  database: "usdtransactvc", // better stored in an app setting such as process.env.DB_NAME
  authentication: {
    type: "default",
  },
  options: {
    encrypt: true,
  },
};
async function connectAndQuery(email) {
  try {
    console.log(JSON.stringify(config), "\n\n");
    var poolConnection = await sql.connect(config);

    console.log("Reading rows from the Table...");
    var q = `SELECT USERS.userName, USERS.userEmail, ua.attributeName, ua.attributeValue
        FROM USERS
        INNER JOIN UserAttributes AS ua ON USERS.userID = ua.userID
        WHERE USERS.userEmail = '${email}';`;
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
    resultSet.recordset.forEach((row) => {
      rows.push(row);
      console.log(
        "%s\t%s\t%s\t%s",
        row.userName,
        row.userEmail,
        row.attributeName,
        row.attributeValue
      );
    });

    // close connection only when we're certain application is finished
    poolConnection.close();
  } catch (err) {
    console.error(err.message);
  }
  return rows;
}

const fetchManager = require("./utils/fetchManager");

const isConfigured = (req) => {
  if (
    req.app.locals.appSettings.credentials.clientId !=
      "REPLACE-WITH-YOUR-APP-CLIENT-ID" &&
    req.app.locals.appSettings.credentials.tenantId !=
      "REPLACE-WITH-YOUR-APP-TENANT-ID" &&
    req.app.locals.appSettings.credentials.clientSecret !=
      "REPLACE-WITH-YOUR-APP-CLIENT-ID-SECRET"
  ) {
    console.log("appSettings is configured");
    return true;
  } else {
    console.log("appSettings is NOT configured");
    return false;
  }
};

exports.getHomePage = async (req, res, next) => {
  // an array of objects
  //[{ "role": "issuer"},{ "role": "verifier"},] make it an array of strings condensation
  if (req.session?.idTokenClaims?.emails[0]) {
    var queryRoles = await getRole(req.session.idTokenClaims.emails[0]); // call the functions
    console.log(queryRoles["recordset"][0]["roleName"]); // {roleName: 'Holder'}

    res.render("home", {
      isAuthenticated: req.session.isAuthenticated,
      configured: isConfigured(req),
      queryRoles: queryRoles["recordset"][0]["roleName"],
    });
  } else {
    res.render("home", {
      isAuthenticated: req.session.isAuthenticated,
      configured: isConfigured(req),
      queryRoles: "",
    });
  }
};

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
      attributes: attributes,
    };
    res.render("issuer", {
      isAuthenticated: req.session.isAuthenticated,
      claims: claims,
      configured: isConfigured(req),
    });
  });
};
exports.getManagePage = (req, res, next) => {
  const claims = {
    name: req.session.idTokenClaims.name,
    preferred_username: req.session.idTokenClaims.preferred_username,
    oid: req.session.idTokenClaims.oid,
    sub: req.session.idTokenClaims.sub,
  };

  res.render("manage", {
    isAuthenticated: req.session.isAuthenticated,
    claims: claims,
    configured: isConfigured(req),
  });
};
exports.getCreatePage = (req, res, next) => {
  const claims = {
    name: req.session.idTokenClaims.name,
    preferred_username: req.session.idTokenClaims.preferred_username,
    oid: req.session.idTokenClaims.oid,
    sub: req.session.idTokenClaims.sub,
  };

  res.render("create", {
    isAuthenticated: req.session.isAuthenticated,
    claims: claims,
    configured: isConfigured(req),
  });
};
exports.getIssueCredentialsPage = (req, res, next) => {
  const claims = {
    name: req.session.idTokenClaims.name,
    preferred_username: req.session.idTokenClaims.preferred_username,
    oid: req.session.idTokenClaims.oid,
    sub: req.session.idTokenClaims.sub,
  };

  res.render("issuecreds", {
    isAuthenticated: req.session.isAuthenticated,
    claims: claims,
    configured: isConfigured(req),
  });
};
exports.getDeleteCredentialsPage = (req, res, next) => {
  const claims = {
    name: req.session.idTokenClaims.name,
    preferred_username: req.session.idTokenClaims.preferred_username,
    oid: req.session.idTokenClaims.oid,
    sub: req.session.idTokenClaims.sub,
  };

  res.render("deletecreds", {
    isAuthenticated: req.session.isAuthenticated,
    claims: claims,
    configured: isConfigured(req),
  });
};
exports.getVpage = (req, res, next) => {
  const claims = {
    name: req.session.idTokenClaims.name,
    preferred_username: req.session.idTokenClaims.preferred_username,
    oid: req.session.idTokenClaims.oid,
    sub: req.session.idTokenClaims.sub,
  };

  res.render("verifier", {
    isAuthenticated: req.session.isAuthenticated,
    claims: claims,
    configured: isConfigured(req),
  });
};
exports.getHolderpage = (req, res, next) => {
  const claims = {
    name: req.session.idTokenClaims.name,
    preferred_username: req.session.idTokenClaims.preferred_username,
    oid: req.session.idTokenClaims.oid,
    sub: req.session.idTokenClaims.sub,
  };

  res.render("holder", {
    isAuthenticated: req.session.isAuthenticated,
    claims: claims,
    configured: isConfigured(req),
  });
};
exports.getExistingCredTypes = (req, res, next) => {
  const claims = {
    name: req.session.idTokenClaims.name,
    preferred_username: req.session.idTokenClaims.preferred_username,
    oid: req.session.idTokenClaims.oid,
    sub: req.session.idTokenClaims.sub,
  };

  res.render("existingcredtypes", {
    isAuthenticated: req.session.isAuthenticated,
    claims: claims,
    configured: isConfigured(req),
  });
};

// callback route
exports.getCallbackpage = (req, res, next) => {
  var body = "";
  req.on("data", function (data) {
    body += data;
  });
  req.on("end", function () {
    requestTrace(req);
    console.log(body);
    if (req.headers["api-key"] != apiKey) {
      res.status(401).json({
        error: "api-key wrong or missing",
      });
      return;
    }
    var presentationResponse = JSON.parse(body.toString());
    // there are 2 different callbacks. 1 if the QR code is scanned (or deeplink has been followed)
    // Scanning the QR code makes Authenticator download the specific request from the server
    // the request will be deleted from the server immediately.
    // That's why it is so important to capture this callback and relay this to the UI so the UI can hide
    // the QR code to prevent the user from scanning it twice (resulting in an error since the request is already deleted)
    if (presentationResponse.requestStatus == "request_retrieved") {
      mainApp.sessionStore.get(presentationResponse.state, (error, session) => {
        var cacheData = {
          status: presentationResponse.requestStatus,
          message: "QR Code is scanned. Waiting for validation...",
        };
        session.sessionData = cacheData;
        mainApp.sessionStore.set(
          presentationResponse.state,
          session,
          (error) => {
            res.send();
          }
        );
      });
    }
    // the 2nd callback is the result with the verified credential being verified.
    // typically here is where the business logic is written to determine what to do with the result
    // the response in this callback contains the claims from the Verifiable Credential(s) being presented by the user
    // In this case the result is put in the in memory cache which is used by the UI when polling for the state so the UI can be updated.
    if (presentationResponse.requestStatus == "presentation_verified") {
      mainApp.sessionStore.get(presentationResponse.state, (error, session) => {
        var cacheData = {
          status: presentationResponse.requestStatus,
          message: "Presentation received",
          payload: presentationResponse.verifiedCredentialsData,
          subject: presentationResponse.subject,
          firstName:
            presentationResponse.verifiedCredentialsData[0].claims.firstName,
          lastName:
            presentationResponse.verifiedCredentialsData[0].claims.lastName,
          presentationResponse: presentationResponse,
        };
        session.sessionData = cacheData;
        mainApp.sessionStore.set(
          presentationResponse.state,
          session,
          (error) => {
            res.send();
          }
        );
      });
    }
  });
  res.send();
};

// this is the route that is called by the UI when the user clicks the "Verify" button
// this route will create a presentation request and return the QR code to the UI
exports.getRequestpage = (req, res, next) => {
  var body = "";
  req.on("data", function (data) {
    body += data;
  });
  req.on("end", function () {
    requestTrace(req);
    console.log(body);
    if (req.headers["api-key"] != apiKey) {
      res.status(401).json({
        error: "api-key wrong or missing",
      });
      return;
    }
    var presentationResponse = JSON.parse(body.toString());
    // there are 2 different callbacks. 1 if the QR code is scanned (or deeplink has been followed)
    // Scanning the QR code makes Authenticator download the specific request from the server
    // the request will be deleted from the server immediately.
    // That's why it is so important to capture this callback and relay this to the UI so the UI can hide
    // the QR code to prevent the user from scanning it twice (resulting in an error since the request is already deleted)
    if (presentationResponse.requestStatus == "request_retrieved") {
      mainApp.sessionStore.get(presentationResponse.state, (error, session) => {
        var cacheData = {
          status: presentationResponse.requestStatus,
          message: "QR Code is scanned. Waiting for validation...",
        };
        session.sessionData = cacheData;
        mainApp.sessionStore.set(
          presentationResponse.state,
          session,
          (error) => {
            res.send();
          }
        );
      });
    }
    // the 2nd callback is the result with the verified credential being verified.
    // typically here is where the business logic is written to determine what to do with the result
    // the response in this callback contains the claims from the Verifiable Credential(s) being presented by the user
    // In this case the result is put in the in memory cache which is used by the UI when polling for the state so the UI can be updated.
    if (presentationResponse.requestStatus == "presentation_verified") {
      mainApp.sessionStore.get(presentationResponse.state, (error, session) => {
        var cacheData = {
          status: presentationResponse.requestStatus,
          message: "Presentation received",
          payload: presentationResponse.verifiedCredentialsData,
          subject: presentationResponse.subject,
          firstName:
            presentationResponse.verifiedCredentialsData[0].claims.firstName,
          lastName:
            presentationResponse.verifiedCredentialsData[0].claims.lastName,
          presentationResponse: presentationResponse,
        };
        session.sessionData = cacheData;
        mainApp.sessionStore.set(
          presentationResponse.state,
          session,
          (error) => {
            res.send();
          }
        );
      });
    }
  });
  res.send();
};

exports.getResponsepage = (req, res, next) => {
  var id = req.query.id;
  requestTrace(req);
  mainApp.sessionStore.get(id, (error, session) => {
    if (session && session.sessionData) {
      console.log(
        `status: ${session.sessionData.status}, message: ${session.sessionData.message}`
      );
      if (session.sessionData.status == "presentation_verified") {
        delete session.sessionData.presentationResponse; // browser don't need this
      }
      res.status(200).json(session.sessionData);
    }
  });
};



// Get token for Admin API
async function getAdminAccessToken () {
  let adminAccessToken = '';
  try {
    const result = await msalCca.acquireTokenByClientCredential (
      msalClientCredentialAdmin
      );
      if (result) {
        adminAccessToken = result.accessToken;
      }
      return adminAccessToken;
    } catch (e) {
      console.log ('failed to get admin access token');
      console.log (e);
    }
  }
  
  let msalConfig = {
    auth: {
      clientId: process.env.VC_CLIENT_ID,
      authority: `https://login.microsoftonline.com/${process.env.VC_TENANT_ID}`,
      clientSecret: process.env.VC_CLIENT_SECRET,
    },
    system: {
      loggerOptions: {
        loggerCallback (loglevel, message, containsPii) {
          console.log (message);
        },
        piiLoggingEnabled: false,
        logLevel: msal.LogLevel.Verbose,
      },
    },
  };
  
  // Create msal application object to be used for login and token cache
  const msalCca = new msal.ConfidentialClientApplication (msalConfig);
  
  let authorityId = "";
  let did = "";
  
  // Get the did
  exports.getPresentation = async () => {
    if (authorityId !== "") {
      return;
    }
    let access_token = await getAdminAccessToken();
    let getResponse = await axios({
      method: "post",
      // replace url with presentation request endpoint
      url: "https://verifiedid.did.msidentity.com/v1.0/verifiableCredentials/createPresentationRequest",
      headers: {
        Authorization: "Bearer " + access_token,
        "Content-Type": "application/json",
      },
    });
    authorityId = getResponse.data.value[0].id;
    did = getResponse.data.value[0].didModel.did;
  };