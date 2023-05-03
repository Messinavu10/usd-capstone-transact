const sql = require("mssql");

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

const poolConnect = () => {
  return sql.connect(config);
};

const getRole = async (userEmail) => {
  var q = `
    SELECT r.roleName
    FROM USERS AS u
    INNER JOIN userRoles AS ur ON u.userID = ur.userID
    INNER JOIN ROLES AS r ON r.roleID = ur.roleID
    WHERE u.userEmail = '${userEmail}';
    `;
  var poolConnection = await poolConnect();

  var resultSet = await poolConnection.request().query(q);

  console.log(resultSet);
  return resultSet; // array of roles from 0 to 2 roles
};

async function connectAndQuery(email) {
  try {
    console.log(JSON.stringify(config), "\n\n");

    var poolConnection = await poolConnect();

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

// var mainApp = require('./app.js');

// console.log(mainApp);
/**
 * This method is called from the UI to initiate the presentation of the verifiable credential
//  */
// mainApp.app.get("/api/verifier/presentation-request", async (req, res) => {
//   requestTrace(req);
//   var id = req.session.id;
//   // prep a session state of 0
//   mainApp.sessionStore.get(id, (error, session) => {
//     var sessionData = {
//       status: 0,
//       message: "Waiting for QR code to be scanned",
//     };
//     if (session) {
//       session.sessionData = sessionData;
//       mainApp.sessionStore.set(id, session);
//     }
//   });
//   // get the Access Token
//   var accessToken = "";
//   try {
//     const result = await mainApp.msalCca.acquireTokenByClientCredential(
//       mainApp.msalClientCredentialRequest
//     );
//     if (result) {
//       accessToken = result.accessToken;
//     }
//   } catch {
//     console.log("failed to get access token");
//     res.status(401).json({
//       error: "Could not acquire credentials to access your Azure Key Vault",
//     });
//     return;
//   }
//   console.log(`accessToken: ${accessToken}`);
//   // modify the callback method to make it easier to debug
//   // with tools like ngrok since the URI changes all the time
//   // this way you don't need to modify the callback URL in the payload every time
//   // ngrok changes the URI
//   presentationConfig.callback.url = `https://${req.hostname}/api/verifier/presentation-request-callback`;
//   presentationConfig.callback.state = id;

//   console.log("VC Client API Request");
//   var client_api_request_endpoint = `${mainApp.config.msIdentityHostName}verifiableCredentials/createPresentationRequest`;
//   console.log(client_api_request_endpoint);
//   var payload = JSON.stringify(presentationConfig);
//   console.log(payload);
//   const fetchOptions = {
//     method: "POST",
//     body: payload,
//     headers: {
//       "Content-Type": "application/json",
//       "Content-Length": payload.length.toString(),
//       Authorization: `Bearer ${accessToken}`,
//     },
//   };

//   const response = await fetch(client_api_request_endpoint, fetchOptions);
//   var resp = await response.json();

//   // the response from the VC Request API call is returned to the caller (the UI). It contains the URI to the request which Authenticator can download after
//   // it has scanned the QR code. If the payload requested the VC Request service to create the QR code that is returned as well
//   // the javascript in the UI will use that QR code to display it on the screen to the user.
//   resp.id = id; // add id so browser can pull status
//   console.log("VC Client API Response");
//   console.log(resp);
//   res.status(200).json(resp);
// });

module.exports = getRole;
