const { auth } = require('../services/firebaseService');

const authAdmin = async (req, res, next) => {
    try {
        const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(email => email.trim().toLowerCase());

        // 1. Check for Admin Secret (Service-to-Service or Dev)
        // Strictly check process.env.ADMIN_SECRET to be safe.
        const adminSecret = req.headers['x-admin-secret'];
        if (process.env.ADMIN_SECRET && adminSecret && adminSecret === process.env.ADMIN_SECRET) {
            // Secret matches, allow access
            return next();
        }

        // 2. Check for Firebase ID Token
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split('Bearer ')[1];

            try {
                const decodedToken = await auth.verifyIdToken(token);
                const userEmail = (decodedToken.email || '').toLowerCase();

                if (userEmail && adminEmails.includes(userEmail)) {
                    req.user = decodedToken; // Attach user info to request
                    return next();
                } else {
                     return res.status(403).json({ error: 'Unauthorized: Not an admin' });
                }
            } catch (authError) {
                console.warn('Admin Auth Token Verification Failed:', authError.message);
                // If token is invalid, we fall through to denial
                return res.status(401).json({ error: 'Invalid token' });
            }
        }

        // 3. Fallback / Denial
        return res.status(401).json({ error: 'Admin access denied' });
    } catch (error) {
        console.error('Admin Middleware Error:', error);
        return res.status(500).json({ error: 'Internal Server Error during Auth' });
    }
};

module.exports = authAdmin;
