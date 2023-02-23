const fetchManager = require('./utils/fetchManager');

const isConfigured = (req) => {
    
    if (req.app.locals.appSettings.credentials.clientId != 'REPLACE-WITH-YOUR-APP-CLIENT-ID' &&
        req.app.locals.appSettings.credentials.tenantId != 'REPLACE-WITH-YOUR-APP-TENANT-ID' &&
        req.app.locals.appSettings.credentials.clientSecret != 'REPLACE-WITH-YOUR-APP-CLIENT-ID-SECRET') {
        console.log("appSettings is configured")
        return true;
    } else {
        console.log("appSettings is NOT configured")
        return false;
    }
}

exports.getHomePage = (req, res, next) => {

    res.render('home', { isAuthenticated: req.session.isAuthenticated, configured: isConfigured(req) });
}

exports.getIdPage = (req, res, next) => {
    const claims = {
        name: req.session.idTokenClaims.name,
        preferred_username: req.session.idTokenClaims.preferred_username,
        oid: req.session.idTokenClaims.oid,
        sub: req.session.idTokenClaims.sub
    };

    res.render('id', { isAuthenticated: req.session.isAuthenticated, claims: claims, configured: isConfigured(req) });
}

exports.getIssuerPage = (req, res, next) => {

    const claims = {
        name: req.session.idTokenClaims.name,
        preferred_username: req.session.idTokenClaims.preferred_username,
        oid: req.session.idTokenClaims.oid,
        sub: req.session.idTokenClaims.sub
    };

    res.render('issuer', { isAuthenticated: req.session.isAuthenticated, claims: claims, configured: isConfigured(req) });

}
exports.getManagePage = (req, res, next) => {

    const claims = {
        name: req.session.idTokenClaims.name,
        preferred_username: req.session.idTokenClaims.preferred_username,
        oid: req.session.idTokenClaims.oid,
        sub: req.session.idTokenClaims.sub
    };

    res.render('manage', { isAuthenticated: req.session.isAuthenticated, claims: claims, configured: isConfigured(req) });

}
exports.getCreatePage = (req, res, next) => {

    const claims = {
        name: req.session.idTokenClaims.name,
        preferred_username: req.session.idTokenClaims.preferred_username,
        oid: req.session.idTokenClaims.oid,
        sub: req.session.idTokenClaims.sub
    };

    res.render('create', { isAuthenticated: req.session.isAuthenticated, claims: claims, configured: isConfigured(req) });

}
exports.getIssueCredentialsPage = (req, res, next) => {

    const claims = {
        name: req.session.idTokenClaims.name,
        preferred_username: req.session.idTokenClaims.preferred_username,
        oid: req.session.idTokenClaims.oid,
        sub: req.session.idTokenClaims.sub
    };

    res.render('issuecreds', { isAuthenticated: req.session.isAuthenticated, claims: claims, configured: isConfigured(req) });

}
exports.getDeleteCredentialsPage = (req, res, next) => {

    const claims = {
        name: req.session.idTokenClaims.name,
        preferred_username: req.session.idTokenClaims.preferred_username,
        oid: req.session.idTokenClaims.oid,
        sub: req.session.idTokenClaims.sub
    };

    res.render('deletecreds', { isAuthenticated: req.session.isAuthenticated, claims: claims, configured: isConfigured(req) });

}