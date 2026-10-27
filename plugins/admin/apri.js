import { fakeQuote } from '../../lib/fakequote.js'

const handler = async (m, { conn }) => {
  const invia = (testo) => conn.sendMessage(m.chat, { text: testo }, { quoted: fakeQuote('Apri') })

  try {
    await conn.groupSettingUpdate(m.chat, 'not_announcement')
  } catch {
    return invia('❌ 𝐍𝐨𝐧 𝐬𝐨𝐧𝐨 𝐫𝐢𝐮𝐬𝐜𝐢𝐭𝐨 𝐚𝐝 𝐚𝐩𝐫𝐢𝐫𝐞 𝐢𝐥 𝐠𝐫𝐮𝐩𝐩𝐨.')
  }
  return invia('🔓 𝐆𝐫𝐮𝐩𝐩𝐨 𝐚𝐩𝐞𝐫𝐭𝐨, 𝐭𝐮𝐭𝐭𝐢 𝐩𝐨𝐬𝐬𝐨𝐧𝐨 𝐬𝐜𝐫𝐢𝐯𝐞𝐫𝐞.')
}

handler.help = ['apri']
handler.tags = ['admin']
handler.command = ['apri']
handler.admin = true
handler.botAdmin = true
handler.group = true

export default handler
