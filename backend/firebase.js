var admin = require('firebase-admin');

var serviceAccount = require('path/to/serviceAccountKey.json');

admin.initializeApp({
	credential: admin.credential.cert(serviceAccount),
	databaseURL: 'kittyzenbot.firebaseio.com', // TODO replace w env var
});

const db = admin.firestore();

module.exports = { db };
