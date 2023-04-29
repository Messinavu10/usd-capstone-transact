const session = require ('express-session');
// Set up a simple server side session store.
// The session store will briefly cache issuance requests
// to facilitate QR code scanning.
const sessionStore = new session.MemoryStore ();
exports.getSessionStore = () => {
  return sessionStore;
};
