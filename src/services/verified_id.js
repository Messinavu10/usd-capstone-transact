const { default: axios } = require("axios");
const { getExistingCredTypes } = require("../controller");

getIssuanceRequest = async (credTypeId, baseUri, req, sessionStore, claims) => {
    const credType = await getExistingCredTypes (credTypeId);
    const access_token = await getIssuanceAccessToken ();
    const sessionId = req.session.id;
    const payload = {
      includeQRCode: true,
      callback: {
        url: `${baseUri}/issuanceCallback`,
        state: sessionId,
      },
      authority: did,
      registration: {
        clientName: credType.displays[0].card.issuedBy,
      },
      type: credType.name,
      manifest: credType.manifestUrl,
      claims: {
        given_name: 'Megan',
        family_name: 'Bowen',
      },
      pin: {
        value: '3539',
        length: 4,
      },
    };
    let getResponse = await axios ({
      method: 'post',
      url: `https://verifiedid.did.msidentity.com/v1.0/verifiableCredentials/verifiableCredentials/createIssuanceRequest`,
      headers: {
        Authorization: 'Bearer ' + access_token,
        'Content-Type': 'application/json',
      },
      data: payload,
    });
    return getResponse.data;
  };
  

  