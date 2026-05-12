const db = require('../database/mongodb');

class UserModel {
    constructor() {
        this.collection = null;
    }

    async getCollection() {
        if (!this.collection) {
            const database = db.getDB();
            this.collection = database.collection('users');
        }
        return this.collection;
    }

    async createOrUpdate(userData) {
        const collection = await this.getCollection();
        const now = new Date();

        const user = {
            userId: userData.id,
            name: userData.name || 'Unknown',
            phoneNumber: userData.phoneNumber || '',
            pushName: userData.pushName || '',
            profilePicture: userData.profilePicture || null,
            isPremium: false,
            credits: 0,
            totalMessages: 0,
            pairedDevices: [],
            lastActive: now,
            createdAt: userData.createdAt || now,
            updatedAt: now
        };

        const result = await collection.updateOne(
            { userId: user.userId },
            { $set: user },
            { upsert: true }
        );

        return user;
    }

    async findByUserId(userId) {
        const collection = await this.getCollection();
        return await collection.findOne({ userId: userId });
    }

    async findByPhoneNumber(phoneNumber) {
        const collection = await this.getCollection();
        return await collection.findOne({ phoneNumber: phoneNumber });
    }

    async updateCredits(userId, amount) {
        const collection = await this.getCollection();
        return await collection.updateOne(
            { userId: userId },
            { 
                $inc: { credits: amount },
                $set: { updatedAt: new Date() }
            }
        );
    }

    async incrementMessages(userId) {
        const collection = await this.getCollection();
        return await collection.updateOne(
            { userId: userId },
            { 
                $inc: { totalMessages: 1 },
                $set: { lastActive: new Date() }
            }
        );
    }

    async addPairedDevice(userId, deviceInfo) {
        const collection = await this.getCollection();
        return await collection.updateOne(
            { userId: userId },
            { 
                $push: { 
                    pairedDevices: {
                        ...deviceInfo,
                        pairedAt: new Date()
                    }
                },
                $set: { updatedAt: new Date() }
            }
        );
    }

    async getAllUsers(limit = 100) {
        const collection = await this.getCollection();
        return await collection.find({}).sort({ createdAt: -1 }).limit(limit).toArray();
    }

    async getStats() {
        const collection = await this.getCollection();
        const totalUsers = await collection.countDocuments();
        const premiumUsers = await collection.countDocuments({ isPremium: true });
        
        return { totalUsers, premiumUsers };
    }
}

module.exports = new UserModel();
