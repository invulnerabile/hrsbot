import { fakeQuote } from '../../lib/fakequote.js';

const handler = async (m, { conn }) => {
  if (!m.isGroup)
    return m.reply('𝐐𝐮𝐞𝐬𝐭𝐨 𝐜𝐨𝐦𝐚𝐧𝐝𝐨 𝐟𝐮𝐧𝐳𝐢𝐨𝐧𝐚 𝐬𝐨𝐥𝐨 𝐧𝐞𝐢 𝐠𝐫𝐮𝐩𝐩𝐢.');

  const testo =
    '𝐌𝐢 𝐚𝐯𝐞𝐭𝐞 𝐜𝐚𝐠𝐚𝐭𝐨 𝐢 𝐜𝐨𝐠𝐥𝐢𝐨𝐧𝐢, 𝐦𝐞 𝐧𝐞 𝐯𝐚𝐝𝐨, 𝐩𝐚𝐠𝐥𝐢𝐚𝐜𝐜𝐢 🤡';

  await conn.sendMessage(
    m.chat,
    { text: testo },
    { quoted: fakeQuote('Messaggio di uscita') }
  );

  await conn.groupLeave(m.chat);
};

handler.help = ['out'];
handler.tags = ['owner'];
handler.command = ['out'];
handler.owner = true;
handler.group = true;

export default handler;
