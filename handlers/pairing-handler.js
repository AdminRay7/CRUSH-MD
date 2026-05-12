const PairingCodeModel = require('../models/PairingCode');
const UserModel = require('../models/User');

class PairingHandler {
    constructor(sock) {
        this.sock = sock;
    }

    async generatePairingCode(phoneNumber, userId = null) {
        try {
            // Clean phone number (remove + and spaces)
            const cleanNumber = phoneNumber.replace(/[^0-9]/g, '');
            
            // Create pairing code
            const pairing = await PairingCodeModel.create(cleanNumber, userId);
            
            console.log(`🔑 Generated pairing code ${pairing.code} for ${cleanNumber}`);
            
            return {
                success: true,
                code: pairing.code,
                expiresAt: pairing.expiresAt,
                message: `Your 8-digit pairing code is: ${pairing.code}\nExpires in 4 minutes.`
            };
        } catch (error) {
            console.error('Error generating pairing code:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async verifyPairingCode(code, phoneNumber, deviceInfo) {
        try {
            const cleanNumber = phoneNumber.replace(/[^0-9]/g, '');
            const cleanCode = code.replace(/[^0-9]/g, '');
            
            const verification = await PairingCodeModel.verify(cleanCode, cleanNumber, deviceInfo);
            
            if (verification.valid) {
                // Update user with paired device
                await UserModel.addPairedDevice(verification.userId || verification.phoneNumber, deviceInfo);
                console.log(`✅ Pairing code ${cleanCode} verified for ${cleanNumber}`);
            }
            
            return verification;
        } catch (error) {
            console.error('Error verifying pairing code:', error);
            return { valid: false, reason: 'Verification error' };
        }
    }

    async getActiveCodes(phoneNumber) {
        try {
            const cleanNumber = phoneNumber.replace(/[^0-9]/g, '');
            return await PairingCodeModel.getActiveCodes(cleanNumber);
        } catch (error) {
            console.error('Error getting active codes:', error);
            return [];
        }
    }
}

module.exports = PairingHandler;
