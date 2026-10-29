import { chatDB } from '../../lib/db.js'
import { fakeQuote } from '../../lib/fakequote.js'
import { findGroupParticipant } from '../../lib/groupParticipants.js'
import { fetchGroupMetadata } from '../../lib/groupCache.js'

function resolveTarget(m, args) {
  if (m.mentionedJid?.length) return m.mentionedJid[0]
  if (m.quoted?.participant) return m.quoted.participant
  if (args[0]) {
    const number = args[0].replace(/\D/g, '')
    return number ? `${number}@s.whatsapp.net` : null
  }
  return null
}

const handler = async (m, { conn, args }) => {
  const chat = chatDB(m.chat)
  chat.moderators ||= []

  const invia = (testo, mentions = []) => conn.sendMessage(m.chat, { text: testo, mentions }, { quoted: fakeQuote('Addmod') })

  const rawTarget = resolveTarget(m, args)
  if (!rawTarget) return invia('𝐂𝐡𝐢 𝐯𝐮𝐨𝐢 𝐫𝐞𝐧𝐝𝐞𝐫𝐞 𝐦𝐨𝐝?')

  const meta = await fetchGroupMetadata(conn, m.chat)
  if (!meta) return invia('❌ 𝐍𝐨𝐧 𝐫𝐢𝐞𝐬𝐜𝐨 𝐚 𝐥𝐞𝐠𝐠𝐞𝐫𝐞 𝐢 𝐩𝐚𝐫𝐭𝐞𝐜𝐢𝐩𝐚𝐧𝐭𝐢 𝐝𝐞𝐥 𝐠𝐫𝐮𝐩𝐩𝐨.')

  const participant = findGroupParticipant(meta, rawTarget)
  if (!participant?.id) return invia('𝐐𝐮𝐞𝐬𝐭𝐚 𝐩𝐞𝐫𝐬𝐨𝐧𝐚 𝐧𝐨𝐧 𝐫𝐢𝐬𝐮𝐥𝐭𝐚 𝐧𝐞𝐥 𝐠𝐫𝐮𝐩𝐩𝐨.')

  const target = participant.id
  if (chat.moderators.includes(target)) return invia('𝐆𝐢à 𝐦𝐨𝐝𝐞𝐫𝐚𝐭𝐨𝐫𝐞.')

  chat.moderators.push(target)
  return invia(`🛡️ @${target.split('@')[0]} 𝐚𝐠𝐠𝐢𝐮𝐧𝐭𝐨 𝐜𝐨𝐦𝐞 𝐦𝐨𝐝𝐞𝐫𝐚𝐭𝐨𝐫𝐞.`, [target])
}

handler.help = ['addmod @utente']
handler.tags = ['admin']
handler.command = ['addmod']
handler.admin = true
handler.group = true

export default handler
