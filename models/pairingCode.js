const db = require('../database/mongodb');

class PairingCodeModel {
    constructor() {
        this.collection = null;
    }

    async getCollection() {
        if (!this.collection) {
            const database = db.getDB();
            this.collection = database.collection('pairing_codes');
        }
        return this.collection;
    }

    generateCode() {
        return Math.floor(10000000 + Math.random() * 90000000).toString();
    }

    async create(phoneNumber, userId = null) {
        const collection = await this.getCollection();
        const code = this.generateCode();
        const expiryMinutes = parseInt(process.env.PAIRING_CODE_EXPIRY_MINUTES) || 4;
        
        const pairingCode = {
            code: code,
            phoneNumber: phoneNumber,
            userId: userId,
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + expiryMinutes * 60 * 1000),
            isUsed: false,
            usedAt: null,
            usedByDevice: null
        };

        await collection.insertOne(pairingCode);
        
        // Auto-delete after 1 hour if not used (TTL index will handle)
        
        return pairingCode;
    }

    async verify(code, phoneNumber, deviceInfo = null) {
        const collection = await this.getCollection();
        
        const pairingCode = await collection.findOne({
            code: code,
            phoneNumber: phoneNumber,
            isUsed: false,
            expiresAt: { $gt: new Date() }
        });

        if (!pairingCode) {
            return { valid: false, reason: 'Invalid or expired code' };
        }

        // Mark as used
        await collection.updateOne(
            { _id: pairingCode._id },
            { 
                $set: { 
                    isUsed: true, 
                    usedAt: new Date(),
                    usedByDevice: deviceInfo
                }
            }
        );

        return { 
            valid: true, 
            userId: pairingCode.userId,
            phoneNumber: pairingCode.phoneNumber 
        };
    }

    async getActiveCodes(phoneNumber) {
        const collection = await this.getCollection();
        return await collection.find({
            phoneNumber: phoneNumber,
            isUsed: false,
            expiresAt: { $gt: new Date() }
        }).toArray();
    }

    async cleanupExpired() {
        const collection = await this.getCollection();
        const result = await collection.deleteMany({
            expiresAt: { $lt: new Date() }
        });
        return result.deletedCount;
    }
}

module.exports = new PairingCodeModel();
