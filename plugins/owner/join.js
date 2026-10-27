const handler = async (m, { conn, args }) => {
  const input = (args || []).join(' ').trim()
  const match = input.match(/chat\.whatsapp\.com\/([A-Za-z0-9]{20,32})/i)

  if (!match) {
    return m.reply('𝐋𝐢𝐧𝐤 𝐝𝐢 𝐢𝐧𝐯𝐢𝐭𝐨 𝐧𝐨𝐧 𝐯𝐚𝐥𝐢𝐝𝐨.')
  }

  try {
    await conn.groupAcceptInvite(match[1])
    return await m.reply('𝐈𝐥 𝐛𝐨𝐭 𝐞̀ 𝐞𝐧𝐭𝐫𝐚𝐭𝐨 𝐧𝐞𝐥 𝐠𝐫𝐮𝐩𝐩𝐨.')
  } catch (error) {
    const statusCode = error?.data?.statusCode
      ?? error?.data
      ?? error?.output?.statusCode
      ?? error?.statusCode

    const reason = String(error?.message || error || '').toLowerCase()

    if (
      Number(statusCode) === 409 ||
      /already.*(participant|member|group)|already.*joined|participant.*already|conflict/.test(reason)
    ) {
      return await m.reply('𝐈𝐥 𝐛𝐨𝐭 𝐞̀ 𝐠𝐢𝐚̀ 𝐧𝐞𝐥 𝐠𝐫𝐮𝐩𝐩𝐨.')
    }

    console.error('[join] Errore durante l’ingresso nel gruppo:', error)

    return await m.reply('𝐍𝐨𝐧 𝐞̀ 𝐬𝐭𝐚𝐭𝐨 𝐩𝐨𝐬𝐬𝐢𝐛𝐢𝐥𝐞 𝐞𝐧𝐭𝐫𝐚𝐫𝐞 𝐧𝐞𝐥 𝐠𝐫𝐮𝐩𝐩𝐨.')
  }
}

handler.help = ['join <link gruppo>']
handler.tags = ['owner']
handler.command = ['join', 'entra']
handler.owner = true

export default handler
