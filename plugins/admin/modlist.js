import { chatDB } from '../../lib/db.js'
import { fakeQuote } from '../../lib/fakequote.js'

const handler = async (m, { conn }) => {
  const chat = chatDB(m.chat)
  chat.moderators ||= []

  const invia = (testo, mentions = []) => conn.sendMessage(m.chat, { text: testo, mentions }, { quoted: fakeQuote('Modlist') })

  if (!chat.moderators.length) return invia('𝐍𝐞𝐬𝐬𝐮𝐧 𝐦𝐨𝐝𝐞𝐫𝐚𝐭𝐨𝐫𝐞 𝐢𝐧 𝐪𝐮𝐞𝐬𝐭𝐨 𝐠𝐫𝐮𝐩𝐩𝐨.')

  return invia(
    `𝐌𝐨𝐝𝐞𝐫𝐚𝐭𝐨𝐫𝐢:\n${chat.moderators.map((id) => `@${id.split('@')[0]}`).join('\n')}`,
    chat.moderators
  )
}

handler.help = ['modlist']
handler.tags = ['admin']
handler.command = ['modlist']
handler.group = true

export default handler
