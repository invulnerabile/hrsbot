import { fetchGroupMetadata } from '../../lib/groupCache.js'
import { fakeQuote } from '../../lib/fakequote.js'
import { findGroupParticipant } from '../../lib/groupParticipants.js'

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
  const target = resolveTarget(m, args)
  if (!target) return m.reply('𝐓𝐚𝐠𝐠𝐚, 𝐫𝐢𝐬𝐩𝐨𝐧𝐝𝐢 𝐨 𝐬𝐜𝐫𝐢𝐯𝐢 𝐢𝐥 𝐧𝐮𝐦𝐞𝐫𝐨 𝐝𝐢 𝐜𝐡𝐢 𝐫𝐞𝐭𝐫𝐨𝐜𝐞𝐝𝐞𝐫𝐞.')

  const meta = await fetchGroupMetadata(conn, m.chat)
  if (!meta) return m.reply('𝐍𝐨𝐧 𝐫𝐢𝐞𝐬𝐜𝐨 𝐚 𝐥𝐞𝐠𝐠𝐞𝐫𝐞 𝐢 𝐩𝐚𝐫𝐭𝐞𝐜𝐢𝐩𝐚𝐧𝐭𝐢 𝐝𝐞𝐥 𝐠𝐫𝐮𝐩𝐩𝐨.')

  const targetInGroup = findGroupParticipant(meta, target)
  if (!targetInGroup?.id) return m.reply('𝐐𝐮𝐞𝐬𝐭𝐚 𝐩𝐞𝐫𝐬𝐨𝐧𝐚 𝐧𝐨𝐧 𝐫𝐢𝐬𝐮𝐥𝐭𝐚 𝐧𝐞𝐥 𝐠𝐫𝐮𝐩𝐩𝐨.')

  const realTarget = targetInGroup.id

  try {
    await conn.groupParticipantsUpdate(m.chat, [realTarget], 'demote')
    await conn.sendMessage(
      m.chat,
      { text: '@' + realTarget.split('@')[0] + ' 𝐧𝐨𝐧 è 𝐩𝐢ù 𝐚𝐝𝐦𝐢𝐧.', mentions: [realTarget] },
      { quoted: fakeQuote('Sistema', 'Gestione admin') }
    )
  } catch {
    throw new Error('𝐫𝐞𝐭𝐫𝐨𝐜𝐞𝐬𝐬𝐢𝐨𝐧𝐞 𝐟𝐚𝐥𝐥𝐢𝐭𝐚.')
  }
}

handler.help = ['demote']
handler.tags = ['admin']
handler.command = ['demote', 'retrocedi', 'd', 'r']
handler.admin = true
handler.botAdmin = true
handler.group = true

export default handler
