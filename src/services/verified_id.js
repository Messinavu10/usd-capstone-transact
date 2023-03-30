const axios = require('axios');
const qs = require('qs');
const jmespath = require('jmespath');









exports.listCredType = async () => {
  let access_token = '';
  let get_response = '';
  let results = '';
  let postResponse = await axios({
    method: 'post',
    url: 'https://login.microsoftonline.com/7b79d002-1780-49a7-804f-8437a1f0222d/oauth2/v2.0/token',
    headers: { 'content-Type': 'application/x-www-form-urlencoded' },
    data: qs.stringify({
      grant_type: 'client_credentials',
      client_secret: 'rL98Q~JlmJeu5.ZOATdEalWxANHbsyD9WB4aUbmx',
      client_id: '4af44c25-ae3f-4436-b42e-53eda45413cd',
      redirect_uri: 'http://localhost',
      scope: '6a8b4b39-c021-437c-b060-5a14a3fd65f3/.default'
    })
  })


  access_token = postResponse.data.access_token;
  //console.log(access_token);
  let getResponse = await axios({
    method: 'get',
    url: 'https://verifiedid.did.msidentity.com/v1.0/verifiableCredentials/authorities/6dd1670d-05da-da07-006e-6655fe15ccb3/contracts',
    headers: { 'Authorization': ('Bearer ' + access_token) }
  })

  get_response = getResponse.data.value;
  results = jmespath.search(get_response, '[].name');
  console.log(results);
  
  return results;

  //     .catch(function (error) {
  //       if (error.response) {
  //         // The request was made and the server responded with a status code
  //         // that falls out of the range of 2xx
  //         console.log(error.response.data);
  //         console.log(error.response.status);
  //         console.log(error.response.headers);
  //       } else if (error.request) {
  //         // The request was made but no response was received
  //         // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
  //         // http.ClientRequest in node.js
  //         console.log(error.request);
  //       } else {
  //         // Something happened in setting up the request that triggered an Error
  //         console.log('Error', error.message);
  //       }
  //       console.log(error.config);
  //     });
  // })
  // .catch(function (error) {
  //   if (error.response) {
  //     // The request was made and the server responded with a status code
  //     // that falls out of the range of 2xx
  //     console.log(error.response.data);
  //     console.log(error.response.status);
  //     console.log(error.response.headers);
  //   } else if (error.request) {
  //     // The request was made but no response was received
  //     // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
  //     // http.ClientRequest in node.js
  //     console.log(error.request);
  //   } else {
  //     // Something happened in setting up the request that triggered an Error
  //     console.log('Error', error.message);
  //   }
  //   console.log(error.config);
  // });

}
