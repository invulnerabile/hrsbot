import { fakeQuote } from '../../lib/fakequote.js';
import { performance } from 'perf_hooks';
import os from 'os';

const startedAt = Date.now();

function formatUptime(ms) {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const min = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${h}h ${min}m ${sec}s`;
}

const handler = async (m, { conn }) => {
  const t0 = performance.now();
  const t1 = performance.now();
  const speed = (t1 - t0).toFixed(4);

  const totalMem = (os.totalmem() / 1024 / 1024).toFixed(0);
  const usedMem = ((os.totalmem() - os.freemem()) / 1024 / 1024).toFixed(0);
  const heap = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1);
  const heapTotal = (process.memoryUsage().heapTotal / 1024 / 1024).toFixed(1);

  const text = [
    `*Attivo da*: ${formatUptime(Date.now() - startedAt)}`,
    `*Velocità*: ${speed} secondi`,
    `*RAM server*: ${usedMem} MB / ${totalMem} MB`,
    `*Memoria processo*: ${heap} MB / ${heapTotal} MB`,
  ].join('\n');

  await conn.sendMessage(m.chat, {
    text,
    buttons: [{ buttonId: '.ds', buttonText: { displayText: 'Pulisci sessioni' }, type: 1 }],
    headerType: 1,
  }, { quoted: fakeQuote('Stato bot') });
};

handler.help = ['ping'];
handler.tags = ['info'];
handler.command = ['ping'];

export default handler;
