import { printMessage } from './lib/print.js';
import { smsg } from './lib/simple.js';
import { fetchGroupMetadata } from './lib/groupCache.js';
import { sameGroupParticipant } from './lib/groupParticipants.js';

const PREFIX = global.prefix[0];

function matches(h, cmd) {
  const list = Array.isArray(h.command) ? h.command : [h.command];
  return list.some((c) => (c instanceof RegExp ? c.test(cmd) : c === cmd));
}

export async function handler(sock, msg) {
  if (!msg.message || msg.key.fromMe) return;

  const text = msg.message.conversation || msg.message.extendedTextMessage?.text || msg.message.buttonsResponseMessage?.selectedButtonId || msg.message.listResponseMessage?.singleSelectReply?.selectedRowId || '';

  const isCommand = text.startsWith(PREFIX);
  const [cmd, ...args] = isCommand ? text.slice(PREFIX.length).trim().split(/\s+/) : [];
  const plugin = isCommand ? global.plugins.find((p) => matches(p, cmd.toLowerCase())) : null;

  const m = await smsg(sock, msg, text, args);
  let chatName;
  let groupMeta;
  if (m.isGroup) {
    groupMeta = await fetchGroupMetadata(sock, m.chat);
    chatName = groupMeta?.subject || m.chat.split('@')[0];
  }

  const senderId = m.sender.split('@')[0].split(':')[0];
  const ownerEntry = global.owner.find(([number]) => String(number) === senderId);
  const isOwner = Boolean(ownerEntry);
  const isAlwaysAdmin = Boolean(ownerEntry?.[2]);
  printMessage(m, chatName, isOwner);

  if (!plugin) return;

  const isGroupAdmin = Boolean(
    m.isGroup && m.groupAdmins?.some((id) => sameGroupParticipant(groupMeta, id, m.sender))
  );
  const isPrivileged = isOwner || isAlwaysAdmin || isGroupAdmin;
  if (m.isGroup && !isPrivileged) {
    const mutedUsers = global.db?.data?.chats?.[m.chat]?.mutedUsers || [];
    const isMuted = mutedUsers.some((id) => sameGroupParticipant(groupMeta, id, m.sender));
    if (isMuted) {
      return m.reply('🔇 Sei mutato e non puoi usare i comandi del bot finché un admin non ti smuta.');
    }
  }

  if (plugin.owner && !isOwner) {
    return m.reply('𝐂𝐨𝐦𝐚𝐧𝐝𝐨 𝐫𝐢𝐬𝐞𝐫𝐯𝐚𝐭𝐨 𝐚𝐠𝐥𝐢 𝐨𝐰𝐧𝐞𝐫.');
  }
  if (plugin.admin && !m.groupAdmins?.includes(m.sender) && !isAlwaysAdmin) {
    return m.reply('𝐂𝐨𝐦𝐚𝐧𝐝𝐨 𝐫𝐢𝐬𝐞𝐫𝐯𝐚𝐭𝐨 𝐚𝐠𝐥𝐢 𝐚𝐝𝐦𝐢𝐧.');
  }
  if (plugin.botAdmin && !m.isBotAdmin) {
    return m.reply('𝐃𝐞𝐯𝐨 𝐞𝐬𝐬𝐞𝐫𝐞 𝐚𝐝𝐦𝐢𝐧 𝐩𝐞𝐫 𝐞𝐬𝐞𝐠𝐮𝐢𝐫𝐞 𝐪𝐮𝐞𝐬𝐭𝐨 𝐜𝐨𝐦𝐚𝐧𝐝𝐨.');
  }
  if (plugin.group && !m.isGroup) {
    return m.reply('𝐐𝐮𝐞𝐬𝐭𝐨 𝐜𝐨𝐦𝐚𝐧𝐝𝐨 𝐟𝐮𝐧𝐳𝐢𝐨𝐧𝐚 𝐬𝐨𝐥𝐨 𝐧𝐞𝐢 𝐠𝐫𝐮𝐩𝐩𝐢.');
  }

  const extra = { conn: sock, args, usedPrefix: PREFIX, isOwner, isAlwaysAdmin };

  try {
    await plugin(m, extra);
  } catch (err) {
    console.error('[plugin] errore:', err);
    await m.reply('*errore*');
  }
}
