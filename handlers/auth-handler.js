const { Boom } = require('@whiskeySockets/baileys');
const UserModel = require('../models/User');
const SessionModel = require('../models/Session');

class AuthHandler {
    constructor(sock) {
        this.sock = sock;
    }

    async handleCredentials(sessionId) {
        try {
            const savedSession = await SessionModel.loadSession(sessionId);
            
            if (savedSession) {
                console.log('📂 Loading existing session from MongoDB');
                return savedSession;
            }
            
            console.log('🆕 No existing session found, will create new one');
            return null;
        } catch (error) {
            console.error('Error loading session:', error);
            return null;
        }
    }

    async saveCredentials(sessionId, creds) {
        try {
            await SessionModel.saveSession(sessionId, creds);
            console.log('💾 Session saved to MongoDB');
        } catch (error) {
            console.error('Error saving session:', error);
        }
    }

    async handleUser(firstMessage, userJid) {
        try {
            const [userId] = userJid.split('@');
            const pushName = firstMessage.pushName || 'User';
            const phoneNumber = userId;
            
            const user = await UserModel.createOrUpdate({
                id: userId,
                name: pushName,
                phoneNumber: phoneNumber,
                pushName: pushName
            });
            
            return user;
        } catch (error) {
            console.error('Error handling user:', error);
            return null;
        }
    }
}

module.exports = AuthHandler;
