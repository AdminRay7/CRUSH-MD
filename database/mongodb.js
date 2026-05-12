const { MongoClient } = require('mongodb');
require('dotenv').config();

class MongoDB {
    constructor() {
        this.client = null;
        this.db = null;
        this.isConnected = false;
    }

    async connect() {
        try {
            const uri = process.env.MONGO_URI;
            const dbName = process.env.MONGO_DATABASE;

            this.client = new MongoClient(uri, {
                maxPoolSize: 10,
                serverSelectionTimeoutMS: 5000
            });

            await this.client.connect();
            this.db = this.client.db(dbName);
            this.isConnected = true;

            console.log('✅ MongoDB Connected Successfully!');
            console.log(`📁 Database: ${dbName}`);

            // Create collections and indexes
            await this.createCollections();
            
            return this.db;
        } catch (error) {
            console.error('❌ MongoDB Connection Failed:', error.message);
            this.isConnected = false;
            throw error;
        }
    }

    async createCollections() {
        // Users Collection
        const usersCollection = this.db.collection('users');
        await usersCollection.createIndex({ userId: 1 }, { unique: true });
        await usersCollection.createIndex({ phoneNumber: 1 });
        await usersCollection.createIndex({ createdAt: -1 });

        // Sessions Collection
        const sessionsCollection = this.db.collection('sessions');
        await sessionsCollection.createIndex({ sessionId: 1 }, { unique: true });
        await sessionsCollection.createIndex({ updatedAt: -1 });

        // Pairing Codes Collection
        const pairingCollection = this.db.collection('pairing_codes');
        await pairingCollection.createIndex({ code: 1 });
        await pairingCollection.createIndex({ phoneNumber: 1 });
        await pairingCollection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
        await pairingCollection.createIndex({ isUsed: 1 });

        // Bot Settings Collection
        const settingsCollection = this.db.collection('settings');
        await settingsCollection.createIndex({ key: 1 }, { unique: true });

        console.log('📊 Collections and indexes created/verified');
    }

    getDB() {
        if (!this.isConnected) {
            throw new Error('Database not connected. Call connect() first.');
        }
        return this.db;
    }

    async disconnect() {
        if (this.client) {
            await this.client.close();
            this.isConnected = false;
            console.log('🔌 MongoDB Disconnected');
        }
    }
}

module.exports = new MongoDB();
