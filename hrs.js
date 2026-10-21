import './lib/db.js';
import './config.js';
import { handler } from './handler.js';
import makeWASocket, { useMultiFileAuthState, DisconnectReason, makeCacheableSignalKeyStore } from '@itsliaaa/baileys';
import { fetchLatestWaWebVersion } from '@itsliaaa/baileys/lib/Utils/generics.js';
import qrcode from 'qrcode-terminal';
import pino from 'pino';
import { readdirSync, existsSync, watch } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import readline from 'readline';

const _log = console.log;
const _info = console.info;
const isSignalNoise = (args) => typeof args[0] === 'string' && /^(Closing|Opening|Removing|Migrating)/.test(args[0]);
console.log = (...args) => { if (!isSignalNoise(args)) _log(...args); };
console.info = (...args) => { if (!isSignalNoise(args)) _info(...args); };

const __dirname = dirname(fileURLToPath(import.meta.url));
const plugins = [];

const hasSession = existsSync('./session/creds.json');
let pairingMode = null;
let phoneNumber = null;

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((res) => rl.question(q, (a) => res(a.trim())));

if (!hasSession) {
  const choice = await ask('Come vuoi collegarti? [1] QR  [2] Codice telefono\n> ');
  pairingMode = choice === '2' ? 'code' : 'qr';
  if (pairingMode === 'code') {
    phoneNumber = (await ask('Inserisci il tuo numero: ')).replace(/\D/g, '');
  }
}

async function loadPlugins(dir = join(__dirname, 'plugins')) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      await loadPlugins(full);
    } else if (entry.name.endsWith('.js')) {
      const mod = await import(pathToFileURL(full).href + '?t=' + Date.now());
      if (mod.default) {
        mod.default._file = full;
        plugins.push(mod.default);
      }
    }
  }
}

function watchPlugins(dir = join(__dirname, 'plugins')) {
  watch(dir, { recursive: true }, async (_, filename) => {
    if (!filename || !filename.endsWith('.js')) return;
    const full = join(dir, filename);
    if (!existsSync(full)) return;

    try {
      const mod = await import(pathToFileURL(full).href + '?t=' + Date.now());
      if (!mod.default) return;
      mod.default._file = full;

      const idx = plugins.findIndex((p) => p._file === full);
      if (idx >= 0) plugins[idx] = mod.default;
      else plugins.push(mod.default);

      global.plugins = plugins;
      console.log(`[plugin] ricaricato: ${filename}`);
    } catch (err) {
      console.error(`[plugin] errore ricaricando ${filename}:`, err);
    }
  });
}

async function start() {
  const { state, saveCreds } = await useMultiFileAuthState('./session');
  const { version } = await fetchLatestWaWebVersion();

  const sock = makeWASocket({
    version,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })),
    },
    logger: pino({ level: 'silent' }),
    browser: ['Ubuntu', 'Safari', '20.0.04'],
    markOnlineOnConnect: false,
    syncFullHistory: false,
  });

  sock.ev.on('creds.update', saveCreds);

  let pairingRequested = false;

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr && pairingMode === 'code' && phoneNumber && !pairingRequested && !sock.authState.creds.registered) {
      pairingRequested = true;
      const code = await sock.requestPairingCode(phoneNumber);
      console.log('Codice di collegamento:', code.match(/.{1,4}/g).join('-'));
      console.log('WhatsApp › Dispositivi collegati › Collega un dispositivo, poi inserisci il codice.');
    }

    if (qr && (pairingMode === 'qr' || !pairingMode)) {
      console.log('scansiona il codice qr:');
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'close') {
      const code = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = code !== DisconnectReason.loggedOut;
      console.log('connessione chiusa, codice:', code, '— riconnetto:', shouldReconnect);

      if (code === DisconnectReason.connectionReplaced) {
        console.log('sessione sostituita da un altro dispositivo, bot fermo');
        await global.db.write();
        process.exit(0);
      } else if (shouldReconnect) {
        await global.db.write();
        process.exit(1);
      }
    }

    if (connection === 'open') {
      console.log('connesso a zozzap');
      rl.close();
    }
  });

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    for (const msg of messages) {
      await handler(sock, msg);
    }
  });
}

await loadPlugins();
global.plugins = plugins;
watchPlugins();
start();
