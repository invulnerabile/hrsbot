import { chatDB } from '../../lib/db.js'
import { fakeQuote } from '../../lib/fakequote.js'
import { findGroupParticipant } from '../../lib/groupParticipants.js'
import { fetchGroupMetadata } from '../../lib/groupCache.js'

const SOGLIA = 3

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

  const invia = (testo, mentions = []) => conn.sendMessage(m.chat, { text: testo, mentions }, { quoted: fakeQuote('Warn') })

  const rawTarget = resolveTarget(m, args)
  if (!rawTarget) return invia('𝐂𝐡𝐢 𝐯𝐮𝐨𝐢 𝐚𝐯𝐯𝐞𝐫𝐭𝐢𝐫𝐞?')

  const meta = await fetchGroupMetadata(conn, m.chat)
  if (!meta) return invia('❌ 𝐍𝐨𝐧 𝐫𝐢𝐞𝐬𝐜𝐨 𝐚 𝐥𝐞𝐠𝐠𝐞𝐫𝐞 𝐢 𝐩𝐚𝐫𝐭𝐞𝐜𝐢𝐩𝐚𝐧𝐭𝐢 𝐝𝐞𝐥 𝐠𝐫𝐮𝐩𝐩𝐨.')

  const participant = findGroupParticipant(meta, rawTarget)
  if (!participant?.id) return invia('𝐐𝐮𝐞𝐬𝐭𝐚 𝐩𝐞𝐫𝐬𝐨𝐧𝐚 𝐧𝐨𝐧 𝐞̀ 𝐧𝐞𝐥 𝐠𝐫𝐮𝐩𝐩𝐨.')

  const target = participant.id
  const motivo = args.slice(1).join(' ') || 'non specificato'

  chat.warns[target] = (chat.warns[target] || 0) + 1
  const count = chat.warns[target]

  if (count >= SOGLIA) {
    delete chat.warns[target]
    await conn.sendMessage(m.chat, {
      text: `🚫 @${target.split('@')[0]} 𝐫𝐢𝐦𝐨𝐬𝐬𝐨 𝐝𝐨𝐩𝐨 ${SOGLIA} 𝐰𝐚𝐫𝐧.`,
      mentions: [target],
    }, { quoted: fakeQuote('Warn') })
    return conn.groupParticipantsUpdate(m.chat, [target], 'remove')
  }

  return invia(`⚠️ @${target.split('@')[0]} 𝐡𝐚 𝐫𝐢𝐜𝐞𝐯𝐮𝐭𝐨 𝐮𝐧 𝐰𝐚𝐫𝐧.\n𝐌𝐨𝐭𝐢𝐯𝐨: ${motivo}\n𝐖𝐚𝐫𝐧: ${count}/${SOGLIA}`, [target])
}

handler.help = ['warn <@|risposta|numero> [motivo]']
handler.tags = ['admin']
handler.command = ['warn', 'ammonisci']
handler.admin = true
handler.botAdmin = true
handler.group = true

export default handler
