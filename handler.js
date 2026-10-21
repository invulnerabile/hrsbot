import { printMessage } from './lib/print.js';
import { smsg } from './lib/simple.js';

const PREFIX = global.prefix[0];

function matches(h, cmd) {
  const list = Array.isArray(h.command) ? h.command : [h.command];
  return list.some((c) => (c instanceof RegExp ? c.test(cmd) : c === cmd));
}

export async function handler(sock, msg) {
  if (!msg.message || msg.key.fromMe) return;

  const text = msg.message.conversation || msg.message.extendedTextMessage?.text || msg.message.buttonsResponseMessage?.selectedButtonId || '';
  if (!text.startsWith(PREFIX)) return;

  const [cmd, ...args] = text.slice(PREFIX.length).trim().split(/\s+/);
  const plugin = global.plugins.find((p) => matches(p, cmd.toLowerCase()));
  if (!plugin) return;

  const m = await smsg(sock, msg, text, args);
  let chatName;
  if (m.isGroup) {
    const meta = await sock.groupMetadata(m.chat);
    chatName = meta.subject;
  }
printMessage(m, chatName);
 const senderNumber = m.sender.split('@')[0].split(':')[0];
  const isOwner = global.owner.some(([number]) => String(number) === senderNumber);

  if (plugin.owner && !isOwner) {
    return m.reply('𝐂𝐨𝐦𝐚𝐧𝐝𝐨 𝐫𝐢𝐬𝐞𝐫𝐯𝐚𝐭𝐨 𝐚𝐠𝐥𝐢 𝐨𝐰𝐧𝐞𝐫.');
  }
  if (plugin.admin && !m.groupAdmins?.includes(m.sender) && !isOwner) {
    return m.reply('𝐂𝐨𝐦𝐚𝐧𝐝𝐨 𝐫𝐢𝐬𝐞𝐫𝐯𝐚𝐭𝐨 𝐚𝐠𝐥𝐢 𝐚𝐝𝐦𝐢𝐧.');
  }
  if (plugin.botAdmin && !m.isBotAdmin) {
    return m.reply('𝐃𝐞𝐯𝐨 𝐞𝐬𝐬𝐞𝐫𝐞 𝐚𝐝𝐦𝐢𝐧 𝐩𝐞𝐫 𝐞𝐬𝐞𝐠𝐮𝐢𝐫𝐞 𝐪𝐮𝐞𝐬𝐭𝐨 𝐜𝐨𝐦𝐚𝐧𝐝𝐨.');
  }
  if (plugin.group && !m.isGroup) {
    return m.reply('𝐐𝐮𝐞𝐬𝐭𝐨 𝐜𝐨𝐦𝐚𝐧𝐝𝐨 𝐟𝐮𝐧𝐳𝐢𝐨𝐧𝐚 𝐬𝐨𝐥𝐨 𝐧𝐞𝐢 𝐠𝐫𝐮𝐩𝐩𝐢.');
  }

  const extra = { conn: sock, args, usedPrefix: PREFIX, isOwner };

  try {
    await plugin(m, extra);
  } catch (err) {
    console.error('[plugin] errore:', err);
    const detail = err.userMessage || err.message || 'operazione non riuscita.';
    await m.reply('*errore*');
  }
}
