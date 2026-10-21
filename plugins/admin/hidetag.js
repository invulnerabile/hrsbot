const handler = async (m, { conn, args }) => {
  if (!m.participants?.length) return m.reply('𝐈𝐦𝐩𝐨𝐬𝐬𝐢𝐛𝐢𝐥𝐞 𝐥𝐞𝐠𝐠𝐞𝐫𝐞 𝐢 𝐩𝐚𝐫𝐭𝐞𝐜𝐢𝐩𝐚𝐧𝐭𝐢.');

  const text = args.join(' ');
  const q = m.quoted;

  if (q?.viewOnce) {
    return m.reply('𝐍𝐨𝐧 𝐩𝐨𝐬𝐬𝐨 𝐭𝐚𝐠𝐠𝐚𝐫𝐞 𝐜𝐨𝐧𝐭𝐞𝐧𝐮𝐭𝐢 𝐚𝐝 𝟏𝐯𝐬.');
  }

  const send = (content) => conn.sendMessage(m.chat, { ...content, mentions: m.participants }, { quoted: m.raw });

  if (q?.mtype === 'imageMessage') {
    return send({ image: await q.download(), caption: text || q.text || '' });
  }
  if (q?.mtype === 'videoMessage') {
    return send({ video: await q.download(), caption: text || q.text || '' });
  }
  if (q?.mtype === 'stickerMessage') {
    return send({ sticker: await q.download() });
  }
  if (q?.mtype === 'audioMessage') {
    return send({ audio: await q.download(), mimetype: 'audio/mp4' });
  }
  if (q?.mtype === 'documentMessage') {
    return send({ document: await q.download(), mimetype: q.mimetype, fileName: q.fileName, caption: text || q.text || '' });
  }

  if (!text && !q) return m.reply('𝐂𝐨𝐬𝐚 𝐯𝐮𝐨𝐢 𝐭𝐚𝐠𝐠𝐚𝐫𝐞?');
  return send({ text: text || q?.text || '' });
};

handler.help = ['tag'];
handler.tags = ['admin'];
handler.command = ['tag', 'hidetag'];
handler.admin = true;
handler.group = true;

export default handler;
