const axios = require("axios");
const sql = require("mssql");
const qs = require("qs");
const jmespath = require("jmespath");
const verifiedid = require("./services/verified_id");

const getAttributes = require("./getattributes");
const data = require("./services/data");

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
  let credentialTypes = [];
  var queryRoles = [];
  // an array of objects
  //[{ "role": "issuer"},{ "role": "verifier"},] make it an array of strings condensation
  if (req.session?.idTokenClaims?.emails[0]) {
    credentialTypes = await verifiedid.listCredType();
    queryRoles = await getRole(req.session.idTokenClaims.emails[0]); // call the functions
    console.log(queryRoles["recordset"][0]["roleName"]); // {roleName: 'Holder'}
    console.log(queryRoles);
    res.render("home", {
      isAuthenticated: req.session.isAuthenticated,
      configured: isConfigured(req),
      roles: queryRoles["recordset"][0]["roleName"].toLowerCase(),
      list: credentialTypes,
    });
  } else
    res.render("home", {
      isAuthenticated: req.session.isAuthenticated,
      configured: isConfigured(req),
      roles: "",
      list: credentialTypes,
    });
};

exports.getIssuerPage = async (req, res, next) => {
  var queryRoles = [];
  //if (req.session?.idTokenClaims?.emails[0]) {
  //var queryRoles = await getRole(req.session.idTokenClaims.emails[0]); // call the functions
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
  //}//else (res.redirect("/home"));
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
exports.getVerifierPage = async (req, res, next) => {
  const claims = {
    name: req.session.idTokenClaims?.name,
    preferred_username: req.session.idTokenClaims?.preferred_username,
    oid: req.session.idTokenClaims?.oid,
    sub: req.session.idTokenClaims?.sub,
  };


  let credentialTypes = [];
  var queryRoles = [];
  // an array of objects
  //[{ "role": "issuer"},{ "role": "verifier"},] make it an array of strings condensation
  if (req.session?.idTokenClaims?.emails[0]) {
    credentialTypes = await verifiedid.listCredType();
    queryRoles = await getRole(req.session.idTokenClaims.emails[0]); // call the functions
    //console.log(queryRoles["recordset"][0]["roleName"]); // {roleName: 'Holder'}
  }

  // run some code to get the roles
  req.query["credtype"];

  
  if (credentialTypes && claims) {
    res.render("verifier", {
      isAuthenticated: req.session.isAuthenticated,
      configured: isConfigured(req),
      roles: queryRoles,
      list: credentialTypes,
      claims: claims,
      credentialTypes: credentialTypes,
    });
  } else {
    res.render("verifier", {
      isAuthenticated: req.session.isAuthenticated,
      configured: isConfigured(req),
      roles: queryRoles,
      list: [],
      claims: {},
      credentialTypes: credentialTypes,
    });
  }
};




exports.getVerifierPageQR = async (req, res, next) => {
  const claims = {
    name: req.session.idTokenClaims?.name,
    preferred_username: req.session.idTokenClaims?.preferred_username,
    oid: req.session.idTokenClaims?.oid,
    sub: req.session.idTokenClaims?.sub,
  };

  var queryRoles = [];
  var credentialTypes = [];
  var presentationRequest = [];
  // an array of objects
  //[{ "role": "issuer"},{ "role": "verifier"},] make it an array of strings condensation
  if (req.session?.idTokenClaims?.emails[0]) {
    credentialTypes = await verifiedid.listCredType();
    queryRoles = await getRole(req.session.idTokenClaims.emails[0]); // call the functions
    //console.log(queryRoles["recordset"][0]["roleName"]); // {roleName: 'Holder'}
  }

  

  try{
    
    presentationRequest = await verifiedid.getPresentationRequest(req.query.credType, req);
  }
  catch (err){
    console.log("presentationRequest error: ", err);
    
  }
  // res.render("verifierqr", {});
  // console.log("presentationRequest: ", presentationRequest);

  console.log(credentialTypes);
  res.render("verifierqr", {
    isAuthenticated: req.session.isAuthenticated,
    configured: isConfigured(req),
    roles: queryRoles,
    list: credentialTypes,
    claims: claims,
    credentialTypes: credentialTypes,
    query: req.query,
    presentationRequest: presentationRequest,
    sessionId: req.session.id,
  });



};

exports.postVerifierQRCallback = async (req, res, next) => {
  // Collect the payload that was posted
  var body = '';
  req.on('data', function (data) {
    body += data;
  });

  req.on('end', function () {
    console.log(body);
    // Ignoring api-key for now
    // if ( req.headers['api-key'] != apiKey ) {
    //   res.status(401).json({
    //     'error': 'api-key wrong or missing'
    //     });
    //   return;
    // }
    var presentationResponse = JSON.parse(body.toString());
    var message = null;
    // there are 2 different callbacks. 1 if the QR code is scanned (or deeplink has been followed)
    // Scanning the QR code makes Authenticator download the specific request from the server
    // the request will be deleted from the server immediately.
    // That's why it is so important to capture this callback and relay this to the UI so the UI can hide
    // the QR code to prevent the user from scanning it twice (resulting in an error since the request is already deleted)
    if (presentationResponse.requestStatus == 'request_retrieved') {
      message = 'QR Code is scanned. Waiting for validation...';
      serverSideSession.get(presentationResponse.state, (error, sessionval) => {
        var sessionData = {
          status: presentationResponse.requestStatus,
          message: message,
        };
        sessionval.sessionData = sessionData;
        serverSideSession.set(presentationResponse.state, sessionval, (error) => {
          res.send();
        });
      });
    }

    // the 2nd callback is the result with the verified credential being verified.
    // typically here is where the business logic is written to determine what to do with the result
    // the response in this callback contains the claims from the Verifiable Credential(s) being presented by the user
    // In this case the result is put in the in memory cache which is used by the UI when polling for the state so the UI can be updated.
    if (presentationResponse.requestStatus == 'presentation_verified') {
      message = "Presentation received";
      serverSideSession.get(presentationResponse.state, (error, sessionval) => {
        var sessionData = {
          status: presentationResponse.requestStatus,
          message: message,
          payload : presentationResponse.verifiedCredentialsData,
          subject: presentationResponse.subject,
          presentationResponse: presentationResponse
        };
        sessionval.sessionData = sessionData;
        serverSideSession.set(presentationResponse.state, sessionval, (error) => {
          res.send();
        });
      });
    }
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
    configured: isConfigured(req),
  });
};

exports.getProfile = async (req, res, next) => {
  const claims = {
    name: req.session.idTokenClaims.name,
    preferred_username: req.session.idTokenClaims.preferred_username,
    oid: req.session.idTokenClaims.oid,
    sub: req.session.idTokenClaims.sub,
  };

  var queryAttributes = await getAttributes(
    req.session.idTokenClaims.emails[0]
  );

  let userAttributes = {};
  queryAttributes["recordset"].forEach((element) => {
    userAttributes[element.attributeName] = element.attributeValue;
  });

  console.log(userAttributes);

  res.render("profile", {
    isAuthenticated: req.session.isAuthenticated,
    configured: isConfigured(req),
    userAttributes: userAttributes,
  });
};
