import { lidCache, msgRetryCounterCache, getMessage, rememberMessage } from './lib/caches.js';
import './lib/db.js';
import './config.js';
import { handler } from './handler.js';
import { startTelegramAdmin } from './lib/telegram.js';
import { groupCache, attachGroupCache } from './lib/groupCache.js';
import makeWASocket, { useMultiFileAuthState, DisconnectReason, makeCacheableSignalKeyStore } from '@itsliaaa/baileys';
import { fetchLatestWaWebVersion } from '@itsliaaa/baileys/lib/Utils/generics.js';
import qrcode from 'qrcode-terminal';
import pino from 'pino';
import { readdirSync, existsSync, watch } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import readline from 'readline';

const _log = console.log;
const _warn = console.warn;
const _info = console.info;
const isSignalNoise = (args) => typeof args[0] === 'string' && /^(Closing|Opening|Removing|Migrating)/.test(args[0]);
console.log = (...args) => { if (!isSignalNoise(args)) _log(...args); };
console.warn = (...args) => { if (!isSignalNoise(args)) _warn(...args); };
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
      const plugin = mod.default || (mod.before ? {} : null);
      if (!plugin) continue;
      if (mod.before) plugin.before = mod.before;
      plugin._file = full;
      plugins.push(plugin);
    }
  }
}

function watchPlugins(dir = join(__dirname, 'plugins')) {
  watch(dir, { recursive: true }, async (_, filename) => {
    if (!filename || !filename.endsWith('.js')) return;
    const full = join(dir, filename);

    if (!existsSync(full)) {
      const idx = plugins.findIndex((p) => p._file === full);
      if (idx >= 0) {
        plugins.splice(idx, 1);
        global.plugins = plugins;
      }
      return;
    }

    try {
      const mod = await import(pathToFileURL(full).href + '?t=' + Date.now());
      const plugin = mod.default || (mod.before ? {} : null);
      if (!plugin) return;
      if (mod.before) plugin.before = mod.before;
      plugin._file = full;

      const idx = plugins.findIndex((p) => p._file === full);
      if (idx >= 0) plugins[idx] = plugin;
      else plugins.push(plugin);

      global.plugins = plugins;
    } catch (err) {
      console.error(err);
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
    shouldSyncHistoryMessage: ({ syncType }) => syncType !== 2,
    defaultQueryTimeoutMs: 60000,
    connectTimeoutMs: 60000,
    keepAliveIntervalMs: 30000,
    retryRequestDelayMs: 500,
    maxMsgRetryCount: 5,
    transactionOpts: {
      maxCommitRetries: 5,
      delayBetweenTriesMs: 500,
    },
    msgRetryCounterCache,
    lidCache,
    getMessage,
    cachedGroupMetadata: async (jid) => groupCache.get(jid),
  });

  sock.ev.on('creds.update', saveCreds);
  attachGroupCache(sock);

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

      if (code === DisconnectReason.loggedOut) {
        console.log('sessione disconnessa, serve una nuova scansione');
        await global.db.write();
        process.exit(0);
      } else if (code === DisconnectReason.forbidden) {
        console.log('numero bannato da WhatsApp, mi fermo, non riprovo');
        await global.db.write();
        process.exit(0);
      } else if (code === DisconnectReason.connectionReplaced) {
        console.log('sessione sostituita da un altro dispositivo, bot fermo');
        await global.db.write();
        process.exit(0);
      } else {
        console.log('connessione chiusa, codice:', code, '— riconnetto');
        await global.db.write();
        process.exit(1);
      }
    }

    if (connection === 'open') {
      console.log('[WhatsApp] bot connesso.');
      rl.close();
      if (global.telegram?.token && global.telegram?.ownerId) {
        startTelegramAdmin(sock);
      }
    }
  });

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    for (const msg of messages) {
      rememberMessage(msg);
      for (const plugin of global.plugins || []) {
        if (typeof plugin.before !== 'function') continue;
        try {
          await plugin.before(sock, msg);
        } catch (err) {
          console.error(err);
        }
      }
      await handler(sock, msg);
    }
  });
}

await loadPlugins();
global.plugins = plugins;
watchPlugins();
start();
