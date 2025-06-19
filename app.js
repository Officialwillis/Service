require('dotenv').config();
const { default: makeWASocket, DisconnectReason, useMultiFileAuthState } = require('@adiwajshing/baileys');
const qrcode = require('qrcode-terminal');

const sessionId = process.env.SESSION_ID;
const ownerName = process.env.OWNER_NAME;
const ownerNumber = process.env.OWNER_NUMBER;
const phoneNumber = process.env.PHONE_NUMBER;

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,
  });

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
      if (lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut) {
        startBot();
      } else {
        console.log('Connection closed. You are logged out.');
      }
    }
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('messages.upsert', async (m) => {
    const message = m.messages[0];
    if (message.key && message.key.remoteJid === 'status@broadcast') return;
    if (!message.message) return;

    const userMessage = message.message.conversation || message.message.extendedTextMessage?.text;
    if (!userMessage) return;

    const buttons = [
      {
        buttonId: 'id1',
        buttonText: { displayText: 'Button 1' },
        type: 1,
      },
      {
        buttonId: 'id2',
        buttonText: { displayText: 'Button 2' },
        type: 1,
      },
    ];

    const buttonMessage = {
      text: `Hello! I'm ${ownerName}. How can I assist you today?`,
      footer: 'Select an option',
      buttons: buttons,
      headerType: 1,
    };

    if (userMessage.toLowerCase() === 'hello') {
      await sock.sendMessage(message.key.remoteJid, buttonMessage);
    }

    if (userMessage === 'id1') {
      await sock.sendMessage(message.key.remoteJid, { text: 'You selected Button 1' });
    }

    if (userMessage === 'id2') {
      await sock.sendMessage(message.key.remoteJid, { text: 'You selected Button 2' });
    }
  });
}

startBot();
