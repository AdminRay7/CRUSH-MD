const UserModel = require('../models/User');
const PairingHandler = require('./pairing-handler');

class MessageHandler {
    constructor(sock, pairingHandler) {
        this.sock = sock;
        this.pairingHandler = pairingHandler;
    }

    async handleMessage(message, userJid) {
        try {
            const body = message.message?.conversation || 
                         message.message?.extendedTextMessage?.text || 
                         '';
            
            const lowerBody = body.toLowerCase().trim();
            
            // User tracking
            const [userId] = userJid.split('@');
            await UserModel.incrementMessages(userId);
            
            // Command handlers
            if (lowerBody === '.ping') {
                await this.sock.sendMessage(userJid, { text: '🏓 Pong! Bot is active!' });
                return;
            }
            
            if (lowerBody === '.stats') {
                const stats = await UserModel.getStats();
                const user = await UserModel.findByUserId(userId);
                await this.sock.sendMessage(userJid, { 
                    text: `📊 *CRUSH RAY BOT STATS*\n\n` +
                          `👥 Total Users: ${stats.totalUsers}\n` +
                          `⭐ Premium Users: ${stats.premiumUsers}\n` +
                          `💎 Your Credits: ${user?.credits || 0}\n` +
                          `📨 Total Messages: ${user?.totalMessages || 0}\n\n` +
                          `_Powered by RYAN KE_`
                });
                return;
            }
            
            if (lowerBody === '.help' || lowerBody === '.menu') {
                await this.sock.sendMessage(userJid, { 
                    text: `⚡ *CRUSH RAY - THE LAST KEY* ⚡\n\n` +
                          `*Commands:*\n` +
                          `• .ping - Check bot status\n` +
                          `• .stats - View your stats\n` +
                          `• .pair <number> - Get pairing code\n` +
                          `• .help - Show this menu\n\n` +
                          `*Version:* ${process.env.BOT_VERSION}\n` +
                          `*Developer:* ${process.env.OWNER_NAME}\n\n` +
                          `_Bot is online and ready!_`
                });
                return;
            }
            
            // Pairing command: .pair 255712345678
            if (lowerBody.startsWith('.pair')) {
                const parts = body.split(' ');
                if (parts.length < 2) {
                    await this.sock.sendMessage(userJid, { 
                        text: '❌ Usage: .pair <phone_number>\nExample: .pair 255712345678' 
                    });
                    return;
                }
                
                const phoneNumber = parts[1];
                const result = await this.pairingHandler.generatePairingCode(phoneNumber, userId);
                
                if (result.success) {
                    await this.sock.sendMessage(userJid, { 
                        text: `🔐 *PAIRING CODE GENERATED*\n\n` +
                              `📱 Number: +${phoneNumber}\n` +
                              `🔢 Code: *${result.code}*\n` +
                              `⏰ Expires in: 4 minutes\n\n` +
                              `Open WhatsApp → Settings → Linked Devices → Link with Code\n\n` +
                              `_Keep this code secure!_`
                    });
                } else {
                    await this.sock.sendMessage(userJid, { 
                        text: `❌ Failed to generate code: ${result.error}`
                    });
                }
                return;
            }
            
        } catch (error) {
            console.error('Error handling message:', error);
        }
    }
}

module.exports = MessageHandler;
