var admin = require('firebase-admin');
require('dotenv').config();

admin.initializeApp({
	credential: admin.credential.cert({
		project_id: process.env.FIREBASE_PROJECT_ID,
		private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
		private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'), // Correctly formatting private_key
		client_email: process.env.FIREBASE_CLIENT_EMAIL,
		client_id: process.env.FIREBASE_CLIENT_ID,
		auth_uri: process.env.FIREBASE_AUTH_URI,
		token_uri: process.env.FIREBASE_TOKEN_URI,
		auth_provider_x509_cert_url:
			process.env.FIREBASE_AUTH_PROVIDER_CERT_URL,
		client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL,
	}),
	databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`,
});

const db = admin.firestore();

console.log('Firebase connected successfully');

module.exports = { db };
