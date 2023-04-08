const getRoutes = (mainController, authProvider, router)=>{
    
    // app routes
    router.get('/', (req, res, next) => res.redirect('/home'));
    router.get('/home', mainController.getHomePage);

    // authentication routes
    router.get('/signin', authProvider.signIn);
    router.get('/signout', authProvider.signOut);
    router.get('/redirect', authProvider.handleRedirect);

    // secure routes
    router.get('/issuer', mainController.getIssuerPage);
    router.get('/manage', mainController.getManagePage);
    router.get('/create',  mainController.getCreatePage);
    router.get('/issuecreds', mainController.getIssueCredentialsPage); 
    router.get('/deletecreds', mainController.getDeleteCredentialsPage);
    // router.get('/verifier/callback', mainController.getCallbackpage);
    router.get('/verifier', mainController.getVpage);
    router.get('/holder', mainController.getHolderpage);
    router.get('/existingcredtypes', mainController.getExistingCredTypes);
    router.get('/profile', mainController.getProfile);
    //will add isauthenticated after testing


    // 404
    router.get('*', (req, res) => res.status(404).redirect('/404.html'));
    
    return router;
}

module.exports = getRoutes;