const axios = require('axios');
const sql = require('mssql');
const qs = require('qs');
const jmespath = require('jmespath');
const verifiedid = require('./services/verified_id');

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
  let credentialTypes = 
  [];
  var queryRoles = [];

    if (req.session?.idTokenClaims?.emails[0]) {    
      credentialTypes = await verifiedid.listCredType();
      queryRoles = await data.getRoles(req.session.idTokenClaims.emails[0]);
    } 
  
    res.render("home", {
      isAuthenticated: req.session.isAuthenticated,
      configured: isConfigured(req),
      roles: queryRoles,
      list: credentialTypes
    });
};

exports.getIssuerPage = async (req, res, next) => {
  var queryRoles = [];

  const claims = {
    name: req.session.idTokenClaims.name,
    preferred_username: req.session.idTokenClaims.preferred_username,
    oid: req.session.idTokenClaims.oid,
    sub: req.session.idTokenClaims.sub,
  };
  //console.log(claims.name);

  if (req.session?.idTokenClaims?.emails[0]) {    
    credentialTypes = await verifiedid.listCredType();
    queryRoles = await data.getRoles(req.session.idTokenClaims.emails[0]);
  }

  let apioutput = await verifiedid.getIssuanceRequest(req, claims);
  const qrcode = apioutput[0];
  const pin = apioutput[1];
  //qrcodeoutput = await verifiedid.getIssuanceRequest(req, claims);
  //console.log(qrcode);
  //console.log(pin);
  
  res.render("issuer", {
    isAuthenticated: req.session.isAuthenticated,
    claims: claims,
    configured: isConfigured(req),
    roles: queryRoles,
    qrlink: qrcode,
    qrpin:pin
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

  res.render("deletecreds", {
    isAuthenticated: req.session.isAuthenticated,
    claims: claims,
    configured: isConfigured(req),
  });
};
exports.getVerifierPage = async (req, res, next) => {
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

  res.render("verifier", {
    isAuthenticated: req.session.isAuthenticated,
    claims: claims,
    configured: isConfigured(req),
    roles: queryRoles
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
      sub: req.session.idTokenClaims.sub
  };

  res.render('existingcredtypes', { 
    isAuthenticated: req.session.isAuthenticated,
    configured: isConfigured(req)
  });
}

exports.getProfile = async (req, res, next) => {

  const claims = {
      name: req.session.idTokenClaims.name,
      preferred_username: req.session.idTokenClaims.preferred_username,
      oid: req.session.idTokenClaims.oid,
      sub: req.session.idTokenClaims.sub
  };

  var queryAttributes = await getAttributes(req.session.idTokenClaims.emails[0]);

  let userAttributes = {};
  queryAttributes["recordset"].forEach( (element)  => {
    userAttributes[element.attributeName] = element.attributeValue;
  });

  console.log(userAttributes);

  res.render('profile', { 
    isAuthenticated: req.session.isAuthenticated,
    configured: isConfigured(req),
    userAttributes: userAttributes
  });
}