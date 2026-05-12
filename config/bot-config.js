module.exports = {
    botName: process.env.BOT_NAME || 'CRUSH RAY',
    botVersion: process.env.BOT_VERSION || '2.1.1',
    ownerName: process.env.OWNER_NAME || 'RYAN KE',
    ownerNumber: process.env.OWNER_NUMBER || '254794376595',
    
    // Pairing settings
    pairingCodeExpiry: parseInt(process.env.PAIRING_CODE_EXPIRY_MINUTES) * 60 * 1000 || 240000,
    
    // Message templates
    welcomeMessage: (userName) => {
        return `⚡ *CRUSH RAY - THE LAST KEY* ⚡\n\n` +
               `👋 Welcome ${userName}!\n\n` +
               `🤖 WhatsApp Bot Pairing System\n` +
               `📱 Type .help to see available commands\n\n` +
               `_Developed by RYAN KE © 2025_`;
    },
    
    pairingInstructions: (code, phoneNumber) => {
        return `🔐 *PAIRING CODE*\n\n` +
               `📱 Number: +${phoneNumber}\n` +
               `🔢 Code: *${code}*\n` +
               `⏰ Valid for: 4 minutes\n\n` +
               `*How to pair:*\n` +
               `1️⃣ Open WhatsApp on your phone\n` +
               `2️⃣ Go to Settings → Linked Devices\n` +
               `3️⃣ Tap "Link with code (8-digit)"\n` +
               `4️⃣ Enter: ${code}\n\n` +
               `✅ Your device will be linked!`;
    }
};
