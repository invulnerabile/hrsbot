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
  chat.warns ||= {}

  const invia = (testo, mentions = []) => conn.sendMessage(m.chat, { text: testo, mentions }, { quoted: fakeQuote('Unwarn') })

  const rawTarget = resolveTarget(m, args)
  if (!rawTarget) return invia('𝐀 𝐜𝐡𝐢 𝐯𝐮𝐨𝐢 𝐭𝐨𝐠𝐥𝐢𝐞𝐫𝐞 𝐮𝐧 𝐰𝐚𝐫𝐧?')

  const meta = await fetchGroupMetadata(conn, m.chat)
  if (!meta) return invia('❌ 𝐍𝐨𝐧 𝐫𝐢𝐞𝐬𝐜𝐨 𝐚 𝐥𝐞𝐠𝐠𝐞𝐫𝐞 𝐢 𝐩𝐚𝐫𝐭𝐞𝐜𝐢𝐩𝐚𝐧𝐭𝐢 𝐝𝐞𝐥 𝐠𝐫𝐮𝐩𝐩𝐨.')

  const participant = findGroupParticipant(meta, rawTarget)
  if (!participant?.id) return invia('𝐐𝐮𝐞𝐬𝐭𝐚 𝐩𝐞𝐫𝐬𝐨𝐧𝐚 𝐧𝐨𝐧 𝐞̀ 𝐧𝐞𝐥 𝐠𝐫𝐮𝐩𝐩𝐨.')

  const target = participant.id
  if (!chat.warns[target]) return invia('𝐐𝐮𝐞𝐬𝐭𝐚 𝐩𝐞𝐫𝐬𝐨𝐧𝐚 𝐧𝐨𝐧 𝐡𝐚 𝐰𝐚𝐫𝐧.')

  chat.warns[target] -= 1
  if (chat.warns[target] <= 0) delete chat.warns[target]

  return invia(`✅ 𝐖𝐚𝐫𝐧 𝐫𝐢𝐦𝐨𝐬𝐬𝐨 𝐚 @${target.split('@')[0]}.\n𝐖𝐚𝐫𝐧 𝐫𝐢𝐦𝐚𝐬𝐭𝐢: ${chat.warns[target] || 0}`, [target])
}

handler.help = ['unwarn <@|risposta|numero>']
handler.tags = ['admin']
handler.command = ['unwarn', 'delwarn']
handler.admin = true
handler.group = true

export default handler
