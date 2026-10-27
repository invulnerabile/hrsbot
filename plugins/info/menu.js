import { fakeQuote } from '../../lib/fakequote.js';
import { dirname, basename } from 'path';
import { fileURLToPath } from 'url';

const PLUGINS_ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

const LABELS = {
  admin: '𝐀𝐃𝐌𝐈𝐍',
  owner: '𝐎𝐖𝐍𝐄𝐑',
  info: '𝐈𝐍𝐅𝐎',
  generale: '𝐆𝐄𝐍𝐄𝐑𝐀𝐋𝐄',
  funzioni: '𝐅𝐔𝐍𝐙𝐈𝐎𝐍𝐈',
}

function groupByFolder() {
  const groups = {};
  for (const p of global.plugins || []) {
    if (!p.help || !p._file) continue;
    const dir = dirname(p._file);
    const folder = dir === PLUGINS_ROOT ? 'generale' : basename(dir);
    (groups[folder] ||= []).push(p.help[0]);
  }
  return groups;
}

const handler = async (m, { conn, args, isOwner }) => {
  const groups = groupByFolder();
  const order = ['info', 'admin', 'funzioni', 'generale', 'owner']
  const folders = [...order.filter((f) => groups[f]), ...Object.keys(groups).filter((f) => !order.includes(f))]
    .filter((f) => f !== 'owner' || isOwner);

  const wanted = args[0]?.toLowerCase();

  if (wanted) {
    if (wanted === 'owner' && !isOwner) return m.reply('𝐂𝐨𝐦𝐚𝐧𝐝𝐨 𝐫𝐢𝐬𝐞𝐫𝐯𝐚𝐭𝐨 𝐚𝐠𝐥𝐢 𝐨𝐰𝐧𝐞𝐫.');
    const list = groups[wanted];
    if (!list) return m.reply('𝐂𝐚𝐭𝐞𝐠𝐨𝐫𝐢𝐚 𝐧𝐨𝐧 𝐭𝐫𝐨𝐯𝐚𝐭𝐚.');
    return m.reply(`*${LABELS[wanted] || wanted.toUpperCase()}*\n` + list.map((c) => `.${c}`).join('\n'));
  }

  await conn.sendMessage(m.chat, {
    text: '𝐇𝐑𝐒𝐁𝐎𝐓',
    footer: '𝐒𝐞𝐥𝐞𝐳𝐢𝐨𝐧𝐚 𝐮𝐧𝐚 𝐜𝐚𝐭𝐞𝐠𝐨𝐫𝐢𝐚',
    title: '𝐌𝐞𝐧𝐮 𝐜𝐨𝐦𝐚𝐧𝐝𝐢',
    buttonText: '𝐀𝐩𝐫𝐢 𝐦𝐞𝐧𝐮',
    sections: [{
      title: 'Categorie',
      rows: folders.map((f) => ({
        title: LABELS[f] || f.toUpperCase(),
        description: `${groups[f].length} comandi`,
        rowId: `.menu ${f}`,
      })),
    }],
  }, { quoted: fakeQuote('Menu comandi') });
};

handler.help = ['menu'];
handler.tags = ['info'];
handler.command = ['menu', 'help'];

export default handler;
