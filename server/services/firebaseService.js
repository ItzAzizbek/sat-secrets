const admin = require('firebase-admin');
const dotenv = require('dotenv');
dotenv.config();

// Initialize Firebase Admin
// Using credentials from environment variables if available across standard GOOGLE_APPLICATION_CREDENTIALS
// or explicitly parsing service account from env for flexibility
if (!admin.apps.length) {
    try {
        const serviceAccount = {
             projectId: process.env.FIREBASE_PROJECT_ID,
             clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
             privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        };

        if (serviceAccount.projectId && serviceAccount.clientEmail && serviceAccount.privateKey) {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
            console.log('Firebase initialized with Service Account');
        } else {
             // Fallback to default (e.g. GOOGLE_APPLICATION_CREDENTIALS path)
             admin.initializeApp();
             console.log('Firebase initialized with Default Credentials');
        }
    } catch (error) {
        console.error('Firebase Init Error:', error);
    }
}

exports.db = admin.firestore();
exports.auth = admin.auth();
