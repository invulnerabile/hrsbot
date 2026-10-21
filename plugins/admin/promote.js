import { fakeQuote } from '../../lib/fakequote.js';

async function resolveTarget(m, args) {
  if (m.mentionedJid.length) return m.mentionedJid[0];
  if (m.quoted) return m.quoted.participant;
  if (args[0]) return args[0].replace(/\D/g, '') + '@s.whatsapp.net';
  return null;
}

function matchByNumberOrId(p, num, id) {
  return p.phoneNumber?.split('@')[0] === num || p.id === id;
}

const handler = async (m, { conn, args }) => {
  const target = await resolveTarget(m, args);
  if (!target) return m.reply('𝐂𝐡𝐢 𝐯𝐮𝐨𝐢 𝐩𝐫𝐨𝐦𝐮𝐨𝐯𝐞𝐫𝐞?');

  const meta = await conn.groupMetadata(m.chat);
  const senderNumber = m.sender.split('@')[0];
  const botNumber = conn.user.id.split(':')[0];
  const targetNumber = target.split('@')[0];

  const actorIsAdmin = meta.participants.some((p) => matchByNumberOrId(p, senderNumber, m.sender) && p.admin);
  if (!actorIsAdmin) {
    return m.reply('𝐍𝐨𝐧 𝐬𝐞𝐢 𝐚𝐝𝐦𝐢𝐧.');
  }

  const botIsAdmin = meta.participants.some((p) => matchByNumberOrId(p, botNumber, null) && p.admin);
  if (!botIsAdmin) {
    return m.reply('𝐈𝐥 𝐛𝐨𝐭 𝐧𝐨𝐧 è 𝐚𝐝𝐦𝐢𝐧.');
  }

  const targetInGroup = meta.participants.find((p) => matchByNumberOrId(p, targetNumber, target));
  if (!targetInGroup) {
    return m.reply('𝐐𝐮𝐞𝐬𝐭𝐨 𝐮𝐭𝐞𝐧𝐭𝐞 𝐧𝐨𝐧 𝐞̀ 𝐧𝐞𝐥 𝐠𝐫𝐮𝐩𝐩𝐨.');
  }

  const realTarget = targetInGroup.id;
  const realTargetNumber = targetInGroup.phoneNumber?.split('@')[0] || targetNumber;

  try {
    await conn.groupParticipantsUpdate(m.chat, [realTarget], 'promote');
    await conn.sendMessage(
      m.chat,
      { text: `+${realTargetNumber} 𝐞̀ 𝐨𝐫𝐚 𝐚𝐝𝐦𝐢𝐧.` },
      { quoted: fakeQuote('𝐒𝐲𝐬𝐭𝐞𝐦', '𝐠𝐞𝐬𝐭𝐢𝐨𝐧𝐞 𝐚𝐝𝐦𝐢𝐧') }
    );
  } catch {
    await m.reply('𝐄𝐫𝐫𝐨𝐫𝐞 𝐧𝐞𝐥𝐥𝐚 𝐩𝐫𝐨𝐦𝐨𝐳𝐢𝐨𝐧𝐞.');
  }
};

handler.help = ['promote'];
handler.tags = ['admin'];
handler.command = ['promote', 'promuovi', 'p'];
handler.admin = true;
handler.group = true;

export default handler;
