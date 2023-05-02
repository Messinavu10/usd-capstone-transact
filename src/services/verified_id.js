const axios = require ('axios');
const qs = require ('qs');
const jmespath = require ('jmespath');
const appSettings = require ('../../appSettings') ();
const msal = require ('@azure/msal-node');
const { getUserAttribute } = require('./data');

let msalConfig = {
  auth: {
    clientId: process.env.VC_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${process.env.VC_TENANT_ID}`,
    clientSecret: process.env.VC_CLIENT_SECRET,
  },
  system: {
    loggerOptions: {
      loggerCallback(loglevel, message, containsPii) {
        console.log(message);
      },
      piiLoggingEnabled: false,
      logLevel: msal.LogLevel.Verbose,
    },
  },
};

// Create msal application object to be used for login and token cache
const msalCca = new msal.ConfidentialClientApplication(msalConfig);

/**
 * There are two tokens we will be getting using MSAL
 * 1. Admin API token: This token is used to get the list of credential types and other calls to the Admin API.
 *    This token requires the scope of 6a8b4b39-c021-437c-b060-5a14a3fd65f3/.default as per the documentation here
 *    https://learn.microsoft.com/en-us/azure/active-directory/verifiable-credentials/issuance-request-api#http-request
 *
 * 2. Issuance and Presentation API token: This token is used to issue and present credentials.
 *    This token requires the scope of 3db474b9-6a0c-4840-96ac-1fceb342124f/.default as per the documentation here
 *    https://learn.microsoft.com/en-us/azure/active-directory/verifiable-credentials/admin-api#application-bearer-tokens
 */
// Config for getting token for VC Admin API
const msalClientCredentialAdmin = {
  scopes: ["6a8b4b39-c021-437c-b060-5a14a3fd65f3/.default"],
  skipCache: false,
};

// Config for getting token for Issuance and Presentation API
const msalClientCredentialRequest = {
  scopes: ["3db474b9-6a0c-4840-96ac-1fceb342124f/.default"],
  skipCache: false,
};

// Get token for Admin API
async function getAdminAccessToken() {
  let adminAccessToken = "";
  try {
    const result = await msalCca.acquireTokenByClientCredential(
      msalClientCredentialAdmin
    );
    if (result) {
      adminAccessToken = result.accessToken;
      //console.log(adminAccessToken);
    }
    return adminAccessToken;
  } catch (e) {
    console.log("failed to get admin access token");
    console.log(e);
  }
}

// Get token for Issuance and Presentation API
async function getIssuanceAccessToken() {
  let issuanceAccessToken = "";
  try {
    const result = await msalCca.acquireTokenByClientCredential(
      msalClientCredentialRequest
    );
    if (result) {
      issuanceAccessToken = result.accessToken;
    }
    return issuanceAccessToken;
  } catch (e) {
    console.log("failed to get issuance access token");
    console.log(e);
  }
}

let authorityId = "";
let did = "";

// Get the did
getAuthority = async () => {
  if (authorityId !== "") {
    return;
  }
  let access_token = await getAdminAccessToken();
  let getResponse = await axios({
    method: "get",
    url: "https://verifiedid.did.msidentity.com/v1.0/verifiableCredentials/authorities",
    headers: {
      Authorization: "Bearer " + access_token,
      "Content-Type": "application/json",
    },
  });
  authorityId = getResponse.data.value[0].id;
  did = getResponse.data.value[0].didModel.did;
};

// Get the list of credential types
listCredType = async () => {
  await getAuthority();
  const access_token = await getAdminAccessToken();
  let results = "";
  let getResponse = await axios({
    method: "get",
    url: `https://verifiedid.did.msidentity.com/v1.0/verifiableCredentials/authorities/${authorityId}/contracts`,
    headers: {
      Authorization: "Bearer " + access_token,
      "Content-Type": "application/json",
    },
  });
  results = jmespath.search(
    getResponse.data.value,
    "[].{id:id, name: name, description: displays[0].card.description,backgroundColor:displays[0].card.backgroundColor, image: displays[0].card.logo.uri, imagealt: displays[0].card.logo.description, issuer: displays[0].card.issuedBy}"
  );
  return results;
};
exports.listCredType = listCredType;

getCredType = async (credTypeId) => {
  await getAuthority();
  const access_token = await getAdminAccessToken();
  let getResponse = await axios({
    method: "get",
    url: `https://verifiedid.did.msidentity.com/v1.0/verifiableCredentials/authorities/${authorityId}/contracts/${credTypeId}`,
    headers: {
      Authorization: "Bearer " + access_token,
      "Content-Type": "application/json",
    },
  });
  return getResponse.data;
};

getIssuanceRequest = async (req, claims) => {
  const pincode = Math.floor (1000 + Math.random () * 9000);
  //console.log(pincode);
  const credType = await getCredType (req.query.credType);
  const access_token = await getIssuanceAccessToken ();
  const sessionId = req.session.id;

  const userAttr = await getUserAttribute(req.session.idTokenClaims.emails[0]);
  // The following is Fake data
  // Get the user attributes from the database query
  const userAttributes = {
    given_name: userAttr.firstName,
    family_name: userAttr.lastName,
    gpa: userAttr.gpa,
    department: userAttr.department,
    major: userAttr.major,
    birthday: userAttr.birthday,
  };
  //



  const payload = {
    includeQRCode: true,
    callback: {
      url: `${appSettings.host.baseUri}/issuer/callback`, //this is the full callback URI which is where the success response is returned to
      state: sessionId,
    },
    authority: did,
    registration: {
      clientName: credType.displays[0].card.issuedBy,
    },
    type: credType.rules.vc.type[0],
    manifest: credType.manifestUrl,
    claims: userAttributes,
    pin: {
      value: pincode.toString (),
      length: 4,
    },
  };
  console.log ('calling axios');
  let getResponse;
  try {
    getResponse = await axios ({
      method: 'post',
      url: `https://verifiedid.did.msidentity.com/v1.0/verifiableCredentials/createIssuanceRequest`,
      headers: {
        Authorization: 'Bearer ' + access_token,
        'Content-Type': 'application/json',
      },
      data: payload,
    });
    return [getResponse.data, pincode];
  } catch (error) {
    console.log (error);
  }
};

exports.getIssuanceRequest = getIssuanceRequest;

getPresentationRequest = async (req, claims) => {
  const pincode = Math.floor (1000 + Math.random () * 9000);
  //console.log(pincode);
  const credType = await getCredType (req.query.credType);
  const access_token = await getIssuanceAccessToken ();
  const sessionId = req.session.id;
  const payload = {
    includeQRCode: true,
    includeReceipt: true,
    authority: did,
    registration: {
      clientName: claims.name,
    },
    callback: {
      url: `${appSettings.host.baseUri}/verifierqr/callback`, //this is the full callback URI which is where the success response is returned to
      state: sessionId,
    },
    requestedCredentials: [
      {
        type: credType.rules.vc.type[0],
        purpose: `Present your credentials to ${claims.name}`,
        acceptedIssuers: [did],
      },
    ],
    configuration: {
      validation: {
        allowRevoked: false,
        validateLinkedDomain: false,
      },
    },
  };
  let getResponse;
  try {
    getResponse = await axios ({
      method: 'post',
      url: `https://verifiedid.did.msidentity.com/v1.0/verifiableCredentials/createPresentationRequest`,
      headers: {
        Authorization: 'Bearer ' + access_token,
        'Content-Type': 'application/json',
      },
      data: payload,
    });
    return getResponse.data;
  } catch (error) {
    console.log (error);
  }
};

exports.getPresentationRequest = getPresentationRequest;
