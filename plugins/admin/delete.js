
const handler = async (m, { conn }) => {
  const q = m.quoted;

  if (!q) {
    return m.reply(
      '𝐑𝐢𝐬𝐩𝐨𝐧𝐝𝐢 𝐚𝐥 𝐦𝐞𝐬𝐬𝐚𝐠𝐠𝐢𝐨 𝐝𝐚 𝐞𝐥𝐢𝐦𝐢𝐧𝐚𝐫𝐞.'
    );
  }

  await conn.sendMessage(m.chat, {
    delete: q.key,
  });

  await conn.sendMessage(m.chat, {
    delete: m.raw.key,
  });
};

handler.help = ['del'];
handler.tags = ['admin'];
handler.command = ['del', 'delete'];
handler.admin = true;
handler.botAdmin = true;
handler.group = true;

export default handler;
