var admin = require('firebase-admin');
require('dotenv').config();
var serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
	credential: admin.credential.cert(serviceAccount),
	databaseURL: process.env.DATABASE_URL,
});

const db = admin.firestore();

console.log('Firebase connected successfully');

module.exports = { db };
