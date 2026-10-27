import { fakeQuote } from '../../lib/fakequote.js'

const handler = async (m, { conn }) => {
  const invia = (testo) => conn.sendMessage(m.chat, { text: testo }, { quoted: fakeQuote('Chiudi') })

  try {
    await conn.groupSettingUpdate(m.chat, 'announcement')
  } catch {
    return invia('❌ 𝐍𝐨𝐧 𝐬𝐨𝐧𝐨 𝐫𝐢𝐮𝐬𝐜𝐢𝐭𝐨 𝐚 𝐜𝐡𝐢𝐮𝐝𝐞𝐫𝐞 𝐢𝐥 𝐠𝐫𝐮𝐩𝐩𝐨.')
  }
  return invia('🔒 𝐆𝐫𝐮𝐩𝐩𝐨 𝐜𝐡𝐢𝐮𝐬𝐨, 𝐬𝐨𝐥𝐨 𝐠𝐥𝐢 𝐚𝐝𝐦𝐢𝐧 𝐩𝐨𝐬𝐬𝐨𝐧𝐨 𝐬𝐜𝐫𝐢𝐯𝐞𝐫𝐞.')
}

handler.help = ['chiudi']
handler.tags = ['admin']
handler.command = ['chiudi']
handler.admin = true
handler.botAdmin = true
handler.group = true

export default handler
