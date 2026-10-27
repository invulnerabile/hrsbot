import { fetchGroupMetadata } from '../../lib/groupCache.js';
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
  if (!target) return m.reply('𝐂𝐡𝐢 𝐯𝐮𝐨𝐢 𝐫𝐢𝐦𝐮𝐨𝐯𝐞𝐫𝐞?');

  const meta = await fetchGroupMetadata(conn, m.chat);
  const targetNumber = target.split('@')[0];
  const targetInGroup = meta.participants.find((p) => matchByNumberOrId(p, targetNumber, target));
  if (!targetInGroup) return m.reply('𝐐𝐮𝐞𝐬𝐭𝐚 𝐩𝐞𝐫𝐬𝐨𝐧𝐚 𝐧𝐨𝐧 𝐫𝐢𝐬𝐮𝐥𝐭𝐚 𝐧𝐞𝐥 𝐠𝐫𝐮𝐩𝐩𝐨.');

  const botNumber = conn.user.id.split(':')[0];
  if (targetInGroup.phoneNumber?.split('@')[0] === botNumber || targetInGroup.id.split('@')[0] === botNumber) {
    return m.reply('𝐍𝐨𝐧 𝐩𝐨𝐬𝐬𝐨 𝐫𝐢𝐦𝐮𝐨𝐯𝐞𝐫𝐞 𝐦𝐞 𝐬𝐭𝐞𝐬𝐬𝐨.');
  }

  const realTarget = targetInGroup.id;

  try {
    await conn.groupParticipantsUpdate(m.chat, [realTarget], 'remove');
    await conn.sendMessage(
      m.chat,
      { text: '@' + realTarget.split('@')[0] + ' 𝐞̀ 𝐬𝐭𝐚𝐭𝐨 𝐫𝐢𝐦𝐨𝐬𝐬𝐨 𝐝𝐚𝐥 𝐠𝐫𝐮𝐩𝐩𝐨.', mentions: [realTarget] },
      { quoted: fakeQuote('Gestione admin') }
    );
  } catch {
    throw new Error('𝐫𝐢𝐦𝐨𝐳𝐢𝐨𝐧𝐞 𝐟𝐚𝐥𝐥𝐢𝐭𝐚.');
  }
};

handler.help = ['kick'];
handler.tags = ['admin'];
handler.command = ['kick', 'rimuovi'];
handler.admin = true;
handler.botAdmin = true;
handler.group = true;

export default handler;
