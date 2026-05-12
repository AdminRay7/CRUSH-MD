// ============================================
// CRUSH RAY - WHATSAPP BOT WITH MONGODB
// THE LAST KEY - PAIRING SYSTEM
// DEVELOPED BY RYAN KE © 2025
// VERSION 2.1.1
// ============================================

require('dotenv').config();
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, Browsers } = require('@whiskeySockets/baileys');
const { Boom } = require('@whiskeySockets/baileys');
const express = require('express');
const cors = require('cors');
const P = require('pino');

// Import modules
const db = require('./database/mongodb');
const PairingCodeModel = require('./models/PairingCode');
const SessionModel = require('./models/Session');
const UserModel = require('./models/User');
const AuthHandler = require('./handlers/auth-handler');
const PairingHandler = require('./handlers/pairing-handler');
const MessageHandler = require('./handlers/message-handler');
const botConfig = require('./config/bot-config');
const helpers = require('./utils/helpers');

// Express app for web interface
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Global bot instance
let sock = null;
let isBotRunning = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;

// ========== WEB INTERFACE (Pairing Site) ==========
app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>CRUSH RAY - WhatsApp Bot Pairing</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
                background: radial-gradient(circle at 20% 30%, #0a0f1e, #03060c);
                font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 1.5rem;
            }
            .pair-card {
                max-width: 520px;
                width: 100%;
                background: rgba(12, 18, 28, 0.75);
                backdrop-filter: blur(16px);
                border-radius: 3rem;
                border: 1px solid rgba(75, 130, 200, 0.25);
                padding: 2rem;
            }
            h1 {
                font-size: 1.8rem;
                background: linear-gradient(135deg, #F0F9FF, #5F9EFF);
                background-clip: text;
                -webkit-background-clip: text;
                color: transparent;
                text-align: center;
            }
            .badge {
                background: #1e293b;
                border-radius: 100px;
                padding: 0.3rem 1rem;
                font-size: 0.75rem;
                color: #94a3b8;
                text-align: center;
                display: inline-block;
                width: 100%;
                margin-bottom: 1rem;
            }
            .phone-input-wrapper {
                display: flex;
                background: #0f1622e6;
                border-radius: 2rem;
                border: 1px solid #2c3f58;
                margin: 1rem 0;
            }
            .country-code {
                background: #1e2a3e;
                padding: 0.8rem 1rem;
                border-radius: 2rem 0 0 2rem;
                font-weight: 600;
                color: #cbd5e6;
            }
            .phone-input {
                flex: 1;
                background: transparent;
                border: none;
                padding: 0.85rem;
                color: #eef4ff;
                outline: none;
                font-size: 1rem;
            }
            .pair-btn {
                width: 100%;
                background: linear-gradient(95deg, #1f3b62, #0e2a48);
                border: none;
                padding: 1rem;
                border-radius: 3rem;
                font-weight: 700;
                color: white;
                cursor: pointer;
                margin-top: 1rem;
            }
            .result-section {
                margin-top: 1.5rem;
                background: #050b12b3;
                border-radius: 1.5rem;
                padding: 1rem;
                text-align: center;
            }
            .pairing-code {
                font-size: 2rem;
                font-family: monospace;
                letter-spacing: 5px;
                background: #010a12;
                padding: 0.5rem;
                border-radius: 1rem;
                color: #e0f2fe;
                margin: 0.5rem 0;
            }
            .footer {
                margin-top: 1.5rem;
                text-align: center;
                font-size: 0.7rem;
                color: #3a618b;
                border-top: 1px dashed #1f3c57;
                padding-top: 1rem;
            }
            .status {
                text-align: center;
                margin-top: 1rem;
                font-size: 0.8rem;
            }
            .online { color: #4ade80; }
            .offline { color: #f87171; }
        </style>
    </head>
    <body>
        <div class="pair-card">
            <div class="badge">⚡ CRUSH RAY · THE LAST KEY</div>
            <h1>WHATSAPP BOT<br>PAIRING SYSTEM</h1>
            <div class="status">
                Bot Status: <span id="botStatus" class="offline">Loading...</span>
            </div>
            <div class="phone-input-wrapper">
                <span class="country-code">+</span>
                <input type="tel" id="phoneNumber" class="phone-input" placeholder="255712345678">
            </div>
            <button class="pair-btn" id="pairBtn">🔑 GET 8-DIGIT PAIRING CODE</button>
            <div id="resultArea" class="result-section" style="display: none;">
                <div>✦ PAIRING CODE ✦</div>
                <div id="pairCode" class="pairing-code">--------</div>
                <div id="pairMessage" style="font-size: 0.75rem; color: #7c9bc2; margin-top: 0.5rem;"></div>
            </div>
            <div class="footer">
                <span>&lt;/&gt; DEVELOPED BY RYAN KE © 2025</span>
                <span>VERSION 2.1.1</span>
            </div>
        </div>

        <script>
            async function checkBotStatus() {
                try {
                    const res = await fetch('/api/status');
                    const data = await res.json();
                    const statusSpan = document.getElementById('botStatus');
                    if (data.running) {
                        statusSpan.innerHTML = '🟢 ONLINE';
                        statusSpan.className = 'online';
                    } else {
                        statusSpan.innerHTML = '🔴 OFFLINE';
                        statusSpan.className = 'offline';
                    }
                } catch(e) {
                    document.getElementById('botStatus').innerHTML = '⚠️ Unknown';
                }
            }

            document.getElementById('pairBtn').addEventListener('click', async () => {
                const phone = document.getElementById('phoneNumber').value.trim();
                if (!phone) {
                    alert('Please enter WhatsApp number with country code');
                    return;
                }

                const btn = document.getElementById('pairBtn');
                btn.innerHTML = '⏳ GENERATING...';
                btn.disabled = true;

                try {
                    const res = await fetch('/api/generate-pairing', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ phoneNumber: phone })
                    });
                    const data = await res.json();

                    if (data.success) {
                        document.getElementById('resultArea').style.display = 'block';
                        document.getElementById('pairCode').innerHTML = data.code;
                        document.getElementById('pairMessage').innerHTML = 
                            '✅ Code valid for 4 minutes<br>Open WhatsApp → Settings → Linked Devices → Link with code';
                    } else {
                        alert('Error: ' + data.error);
                    }
                } catch (err) {
                    alert('Network error: ' + err.message);
                } finally {
                    btn.innerHTML = '🔑 GET 8-DIGIT PAIRING CODE';
                    btn.disabled = false;
                }
            });

            checkBotStatus();
            setInterval(checkBotStatus, 10000);
        </script>
    </body>
    </html>
    `);
});

// API Routes
app.get('/api/status', (req, res) => {
    res.json({ 
        running: isBotRunning,
        botName: botConfig.botName,
        version: botConfig.botVersion 
    });
});

app.post('/api/generate-pairing', async (req, res) => {
    try {
        const { phoneNumber } = req.body;
        if (!phoneNumber) {
            return res.status(400).json({ success: false, error: 'Phone number required' });
        }

        const cleanNumber = helpers.formatPhoneNumber(phoneNumber);
        const pairing = await PairingCodeModel.create(cleanNumber);
        
        res.json({
            success: true,
            code: pairing.code,
            expiresAt: pairing.expiresAt
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ========== WHATSAPP BOT CONNECTION ==========
async function startBot() {
    try {
        // Connect to MongoDB first
        await db.connect();
        
        // Load existing session
        const sessionId = process.env.SESSION_ID || 'crush_ray_session';
        let savedCreds = await SessionModel.loadSession(sessionId);
        
        // Initialize auth state
        const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
        
        // Create socket connection
        sock = makeWASocket({
            printQRInTerminal: true,
            auth: state,
            browser: Browsers.macOS('Desktop'),
            logger: P({ level: 'silent' }),
            defaultQueryTimeoutMs: 60000,
            keepAliveIntervalMs: 10000
        });
        
        // Auth handler
        const authHandler = new AuthHandler(sock);
        const pairingHandler = new PairingHandler(sock);
        const messageHandler = new MessageHandler(sock, pairingHandler);
        
        // Connection events
        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;
            
            if (qr) {
                console.log('📱 Scan QR code to login (or use pairing code)');
            }
            
            if (connection === 'close') {
                const statusCode = lastDisconnect?.error?.output?.statusCode;
                const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
                
                console.log(`❌ Connection closed: ${statusCode || reason}`);
                isBotRunning = false;
                
                if (statusCode === DisconnectReason.loggedOut) {
                    console.log('🔄 Session expired, clearing auth...');
                    await SessionModel.deleteSession(sessionId);
                }
                
                // Reconnect
                reconnectAttempts++;
                if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
                    console.log(`🔄 Reconnecting in ${reconnectAttempts * 2} seconds...`);
                    setTimeout(() => startBot(), reconnectAttempts * 2000);
                } else {
                    console.log('❌ Max reconnection attempts reached');
                }
            }
            
            if (connection === 'open') {
                console.log('✅ CRUSH RAY Bot is ONLINE!');
                isBotRunning = true;
                reconnectAttempts = 0;
                
                // Send startup message to owner
                if (botConfig.ownerNumber) {
                    const ownerJid = botConfig.ownerNumber + '@s.whatsapp.net';
                    await sock.sendMessage(ownerJid, { 
                        text: `⚡ *CRUSH RAY BOT ONLINE* ⚡\n\n` +
                              `🤖 Status: Active\n` +
                              `📱 Version: ${botConfig.botVersion}\n` +
                              `👨‍💻 Developer: ${botConfig.ownerName}\n\n` +
                              `_Ready to handle pairing requests!_`
                    }).catch(e => console.log('Owner notification failed'));
                }
            }
        });
        
        // Save credentials to MongoDB
        sock.ev.on('creds.update', async (creds) => {
            console.log('💾 Saving credentials...');
            await SessionModel.saveSession(sessionId, creds);
        });
        
        // Handle incoming messages
        sock.ev.on('messages.upsert', async ({ messages }) => {
            const msg = messages[0];
            if (!msg.message || msg.key.fromMe) return;
            
            const sender = msg.key.remoteJid;
            await messageHandler.handleMessage(msg, sender);
        });
        
        // Cleanup expired pairing codes every hour
        setInterval(async () => {
            const deleted = await PairingCodeModel.cleanupExpired();
            if (deleted > 0) console.log(`🧹 Cleaned up ${deleted} expired pairing codes`);
        }, 60 * 60 * 1000);
        
    } catch (error) {
        console.error('❌ Failed to start bot:', error);
        setTimeout(() => startBot(), 5000);
    }
}

// ========== START APPLICATION ==========
app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════╗
║     ⚡ CRUSH RAY - THE LAST KEY ⚡     ║
║                                        ║
║   WhatsApp Bot Pairing System          ║
║   Version: 2.1.1                       ║
║   Developer: RYAN KE                   ║
║                                        ║
║   Web Interface: http://localhost:${PORT}  ║
║   MongoDB: Connected ✓                 ║
╚════════════════════════════════════════╝
    `);
});

// Start the bot
startBot();

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down CRUSH RAY Bot...');
    if (sock) {
        await sock.end();
    }
    await db.disconnect();
    process.exit(0);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (error) => {
    console.error('Unhandled Rejection:', error);
});
