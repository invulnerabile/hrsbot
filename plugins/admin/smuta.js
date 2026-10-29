import { chatDB } from '../../lib/db.js'
import { fakeQuote } from '../../lib/fakequote.js'
import { fetchGroupMetadata } from '../../lib/groupCache.js'
import { findGroupParticipant, sameGroupParticipant } from '../../lib/groupParticipants.js'

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
  chat.mutedUsers ||= []

  const invia = (testo) => conn.sendMessage(m.chat, { text: testo }, { quoted: fakeQuote('Smuta') })

  const rawTarget = resolveTarget(m, args)
  if (!rawTarget) return invia('𝐂𝐡𝐢 𝐯𝐮𝐨𝐢 𝐬𝐦𝐮𝐭𝐚𝐫𝐞?')

  const meta = await fetchGroupMetadata(conn, m.chat)
  if (!meta) return invia('❌ 𝐍𝐨𝐧 𝐫𝐢𝐞𝐬𝐜𝐨 𝐚 𝐥𝐞𝐠𝐠𝐞𝐫𝐞 𝐢 𝐩𝐚𝐫𝐭𝐞𝐜𝐢𝐩𝐚𝐧𝐭𝐢 𝐝𝐞𝐥 𝐠𝐫𝐮𝐩𝐩𝐨.')

  const participant = findGroupParticipant(meta, rawTarget)
  if (!participant?.id) return invia('𝐐𝐮𝐞𝐬𝐭𝐚 𝐩𝐞𝐫𝐬𝐨𝐧𝐚 𝐧𝐨𝐧 𝐫𝐢𝐬𝐮𝐥𝐭𝐚 𝐧𝐞𝐥 𝐠𝐫𝐮𝐩𝐩𝐨.')

  const target = participant.id
  const isMuted = chat.mutedUsers.some((id) => sameGroupParticipant(meta, id, target))
  if (!isMuted) return invia('𝐐𝐮𝐞𝐬𝐭𝐚 𝐩𝐞𝐫𝐬𝐨𝐧𝐚 𝐧𝐨𝐧 è 𝐦𝐮𝐭𝐚𝐭𝐚.')

  chat.mutedUsers = chat.mutedUsers.filter((id) => !sameGroupParticipant(meta, id, target))
  return conn.sendMessage(m.chat, {
    text: `🔊 @${target.split('@')[0]} 𝐬𝐦𝐮𝐭𝐚𝐭𝐨.`,
    mentions: [target],
  }, { quoted: fakeQuote('Smuta') })
}

handler.help = ['smuta @utente']
handler.tags = ['admin']
handler.command = ['smuta']
handler.mod = true
handler.group = true

export default handler
