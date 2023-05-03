var bodyParser = require ('body-parser');
var parser = bodyParser.urlencoded ({extended: false});

const getRoutes = (mainController, authProvider, router) => {
  // app routes
  router.get ('/', (req, res, next) => res.redirect ('/home'));
  router.get ('/home', mainController.getHomePage);

  // authentication routes
  router.get ('/signin', authProvider.signIn);
  router.get ('/signout', authProvider.signOut);
  router.get ('/redirect', authProvider.handleRedirect);

  // secure routes
  router.post ('/issuer/callback', mainController.postIssuerCallback);
  router.get ('/issuer', mainController.getIssuerPage);
  router.post ('/verifierqr/callback', mainController.postVerifierQRCallback);
  router.get ('/verifierqr', mainController.getVerifierQRPage);
  router.get ('/verifier-response', mainController.getVerifierResponse);
  router.get ('/verifierlist', mainController.getVerifierListPage);
  router.get ('/issuance-response', mainController.getIssueanceResponse);
  router.get ('/profile', mainController.getProfile);
  //will add isauthenticated after testing

  // 404
  router.get ('*', (req, res) => res.status (404).redirect ('/404.html'));

  return router;
};

module.exports = getRoutes;
