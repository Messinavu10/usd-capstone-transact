const axios = require('axios');
const sql = require('mssql');
const qs = require('qs');
const verifiedid = require('./services/verified_id');
const {getSessionStore} = require ('./utils/session');
const getAttributes = require('./getattributes');
const data = require('./services/data');
const serverSideSession = getSessionStore ();

module.exports.sessionStore = serverSideSession;


const config = {
  user: process.env.DB_USERNAME, // better stored in an app setting such as process.env.DB_USER
  password: process.env.DB_PASSWORD, // better stored in an app setting such as process.env.DB_PASSWORD
  server: process.env.DB_HOSTNAME, // better stored in an app setting such as process.env.DB_SERVER
  port: 1433, // optional, defaults to 1433, better stored in an app setting such as process.env.DB_PORT
  database: 'usdtransactvc', // better stored in an app setting such as process.env.DB_NAME
  authentication: {
    type: 'default',
  },
  options: {
    encrypt: true,
  },
};
async function connectAndQuery(email) {
  try {
    console.log(JSON.stringify(config), '\n\n');
    var poolConnection = await sql.connect(config);

    console.log('Reading rows from the Table...');
    var q = `SELECT USERS.userName, USERS.userEmail, ua.attributeName, ua.attributeValue
        FROM USERS
        INNER JOIN UserAttributes AS ua ON USERS.userID = ua.userID
        WHERE USERS.userEmail = '${email}';`;
    console.log(q);
    var resultSet = await poolConnection.request().query(q);

    console.log(`${resultSet.recordset.length} rows returned.`);

    // output column headers
    var columns = '';
    for (var column in resultSet.recordset.columns) {
      columns += column + ', ';
    }
    console.log('%s\t', columns.substring(0, columns.length - 2));

    // ouput row contents from default record set
    var rows = [];
    resultSet.recordset.forEach((row) => {
      rows.push(row);
      console.log(
        '%s\t%s\t%s\t%s',
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

const fetchManager = require('./utils/fetchManager');

const isConfigured = (req) => {
  if (
    req.app.locals.appSettings.credentials.clientId !=
      'REPLACE-WITH-YOUR-APP-CLIENT-ID' &&
    req.app.locals.appSettings.credentials.tenantId !=
      'REPLACE-WITH-YOUR-APP-TENANT-ID' &&
    req.app.locals.appSettings.credentials.clientSecret !=
      'REPLACE-WITH-YOUR-APP-CLIENT-ID-SECRET'
  ) {
    console.log('appSettings is configured');
    return true;
  } else {
    console.log('appSettings is NOT configured');
    return false;
  }
};

exports.getHomePage = async (req, res, next) => {
  let credentialTypes = [];
  var queryRoles = [];

  if (req.session?.idTokenClaims?.emails[0]) {
    credentialTypes = await verifiedid.listCredType();
    queryRoles = await data.getRoles(req.session.idTokenClaims.emails[0]);
  }

  res.render('home', {
    isAuthenticated: req.session.isAuthenticated,
    configured: isConfigured(req),
    roles: queryRoles,
    list: credentialTypes,
  });
};

exports.getIssuerPage = async (req, res, next) => {
  var queryRoles = [];
  let sessionId = req.session.id;

  // Change these to be claims from the SQL query
  const claims = {
    name: req.session.idTokenClaims.name,
    preferred_username: req.session.idTokenClaims.preferred_username,
    oid: req.session.idTokenClaims.oid,
    sub: req.session.idTokenClaims.sub,
  };

  if (req.session?.idTokenClaims?.emails[0]) {
    queryRoles = await data.getRoles(req.session.idTokenClaims.emails[0]);
  }

  let apioutput = await verifiedid.getIssuanceRequest(req, claims);
  const qrcode = apioutput[0];
  const pin = apioutput[1];
 
  serverSideSession.get( sessionId, (error, sessionVal) => {
    var sessionData = {
      "status" : 0,
      "message": "Waiting for QR code to be scanned"
    };
    if ( sessionVal ) {
      sessionVal.sessionData = sessionData;
      serverSideSession.set( sessionId, sessionVal);  
    }
  });

  res.render('issuer', {
    isAuthenticated: req.session.isAuthenticated,
    claims: claims,
    configured: isConfigured(req),
    roles: queryRoles,
    qrlink: qrcode,
    qrpin: pin,
    sessionId: sessionId,
  });
};

// Handles the callback from the phone
exports.postIssuerCallback = async (req, res, next) => {
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
    var issuanceResponse = JSON.parse(body.toString());
    var message = null;
    // there are 2 different callbacks. 1 if the QR code is scanned (or deeplink has been followed)
    // Scanning the QR code makes Authenticator download the specific request from the server
    // the request will be deleted from the server immediately.
    // That's why it is so important to capture this callback and relay this to the UI so the UI can hide
    // the QR code to prevent the user from scanning it twice (resulting in an error since the request is already deleted)
    if (issuanceResponse.requestStatus == 'request_retrieved') {
      message = 'QR Code is scanned. Waiting for issuance to complete...';
      serverSideSession.get(issuanceResponse.state, (error, sessionval) => {
        var sessionData = {
          status: 'request_retrieved',
          message: message,
        };
        sessionval.sessionData = sessionData;
        serverSideSession.set(issuanceResponse.state, sessionval, (error) => {
          res.send();
        });
      });
    }

    // The second callback is when the issuance is completed
    if (issuanceResponse.requestStatus == 'issuance_successful') {
      message = 'Credential successfully issued';
      serverSideSession.get(issuanceResponse.state, (error, sessionval) => {
        var sessionData = {
          status: 'issuance_successful',
          message: message,
        };
        sessionval.sessionData = sessionData;
        serverSideSession.set(issuanceResponse.state, sessionval, (error) => {
          res.send();
        });
      });
    }

    // Optional callback when issuance failed
    if (issuanceResponse.requestStatus == 'issuance_error') {
      message = 'QR Code is scanned. Waiting for issuance to complete...';
      serverSideSession.get(issuanceResponse.state, (error, sessionval) => {
        var sessionData = {
          status: 'issuance_error',
          "message": issuanceResponse.error.message,
          "payload" :issuanceResponse.error.code
        };
        sessionval.sessionData = sessionData;
        serverSideSession.set(issuanceResponse.state, sessionval, (error) => {
          res.send();
        });
      });
    }

  });
};

exports.getIssueanceResponse = (req, res, next) => {
  let id = req.query.id;
  serverSideSession.get( id, (error, sessionval) => {
    if (sessionval && sessionval.sessionData) {
      console.log(`status: ${sessionval.sessionData.status}, message: ${sessionval.sessionData.message}`);
      res.status(200).json(sessionval.sessionData);   
      }
  })
}


exports.getManagePage = (req, res, next) => {
  const claims = {
    name: req.session.idTokenClaims.name,
    preferred_username: req.session.idTokenClaims.preferred_username,
    oid: req.session.idTokenClaims.oid,
    sub: req.session.idTokenClaims.sub,
  };

  res.render('manage', {
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

  res.render('create', {
    isAuthenticated: req.session.isAuthenticated,
    claims: claims,
    configured: isConfigured(req),
  });
};
// exports.getIssueCredentialsPage = (req, res, next) => {
//   const claims = {
//     name: req.session.idTokenClaims.name,
//     preferred_username: req.session.idTokenClaims.preferred_username,
//     oid: req.session.idTokenClaims.oid,
//     sub: req.session.idTokenClaims.sub,
//   };

//   res.render("issuecreds", {
//     isAuthenticated: req.session.isAuthenticated,
//     claims: claims,
//     configured: isConfigured(req),
//   });
// };
exports.getDeleteCredentialsPage = (req, res, next) => {
  const claims = {
    name: req.session.idTokenClaims.name,
    preferred_username: req.session.idTokenClaims.preferred_username,
    oid: req.session.idTokenClaims.oid,
    sub: req.session.idTokenClaims.sub,
  };

  res.render('deletecreds', {
    isAuthenticated: req.session.isAuthenticated,
    claims: claims,
    configured: isConfigured(req),
  });
};
exports.getVerifierListPage = async (req, res, next) => {
  const claims = {
    name: req.session.idTokenClaims.name,
    preferred_username: req.session.idTokenClaims.preferred_username,
    oid: req.session.idTokenClaims.oid,
    sub: req.session.idTokenClaims.sub,
  };

  var queryRoles = [];

  if (req.session?.idTokenClaims?.emails[0]) {
    credentialTypes = await verifiedid.listCredType();
    queryRoles = await data.getRoles(req.session.idTokenClaims.emails[0]);
  }

  res.render('verifierlist', {
    isAuthenticated: req.session.isAuthenticated,
    claims: claims,
    configured: isConfigured(req),
    roles: queryRoles,
    list: credentialTypes,
  });
};
exports.getHolderpage = (req, res, next) => {
  const claims = {
    name: req.session.idTokenClaims.name,
    preferred_username: req.session.idTokenClaims.preferred_username,
    oid: req.session.idTokenClaims.oid,
    sub: req.session.idTokenClaims.sub,
  };

  res.render('holder', {
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

  res.render('existingcredtypes', {
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
  queryAttributes['recordset'].forEach((element) => {
    userAttributes[element.attributeName] = element.attributeValue;
  });

  console.log(userAttributes);

  res.render('profile', {
    isAuthenticated: req.session.isAuthenticated,
    configured: isConfigured(req),
    userAttributes: userAttributes,
  });
};
