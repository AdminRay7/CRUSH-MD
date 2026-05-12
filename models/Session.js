const db = require('../database/mongodb');

class SessionModel {
    constructor() {
        this.collection = null;
    }

    async getCollection() {
        if (!this.collection) {
            const database = db.getDB();
            this.collection = database.collection('sessions');
        }
        return this.collection;
    }

    async saveSession(sessionId, sessionData) {
        const collection = await this.getCollection();
        
        const session = {
            sessionId: sessionId,
            data: sessionData,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        await collection.updateOne(
            { sessionId: sessionId },
            { $set: session },
            { upsert: true }
        );

        return session;
    }

    async loadSession(sessionId) {
        const collection = await this.getCollection();
        const session = await collection.findOne({ sessionId: sessionId });
        return session ? session.data : null;
    }

    async deleteSession(sessionId) {
        const collection = await this.getCollection();
        await collection.deleteOne({ sessionId: sessionId });
    }

    async getAllSessions() {
        const collection = await this.getCollection();
        return await collection.find({}).toArray();
    }
}

module.exports = new SessionModel();
