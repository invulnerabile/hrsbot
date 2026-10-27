import { chatDB } from '../../lib/db.js'
import { fakeQuote } from '../../lib/fakequote.js'

const FUNZIONI = [
  { key: 'antilink', label: '𝐀𝐧𝐭𝐢𝐥𝐢𝐧𝐤' },
  { key: 'antiraid', label: '𝐀𝐧𝐭𝐢𝐫𝐚𝐢𝐝' },
]

const handler = async (m, { conn }) => {
  const chat = chatDB(m.chat)
  const righe = FUNZIONI.map((f) => `${chat[f.key] ? '🟢' : '🔴'} ${f.label}`).join('\n')

  await conn.sendMessage(m.chat, { text: `𝐅𝐮𝐧𝐳𝐢𝐨𝐧𝐢 𝐝𝐢 𝐠𝐫𝐮𝐩𝐩𝐨\n\n${righe}` }, { quoted: fakeQuote('Funzioni') })
}

handler.help = ['funzioni']
handler.tags = ['funzioni']
handler.command = ['funzioni']
handler.admin = true
handler.group = true

export default handler
