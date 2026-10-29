import { chatDB } from '../../lib/db.js'
import { fakeQuote } from '../../lib/fakequote.js'
import { resolveSender } from '../../lib/groupAuth.js'
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

  const invia = (testo) => conn.sendMessage(m.chat, { text: testo }, { quoted: fakeQuote('Muta') })

  const rawTarget = resolveTarget(m, args)
  if (!rawTarget) return invia('𝐂𝐡𝐢 𝐯𝐮𝐨𝐢 𝐦𝐮𝐭𝐚𝐫𝐞?')

  const meta = await fetchGroupMetadata(conn, m.chat)
  if (!meta) return invia('❌ 𝐍𝐨𝐧 𝐫𝐢𝐞𝐬𝐜𝐨 𝐚 𝐥𝐞𝐠𝐠𝐞𝐫𝐞 𝐢 𝐩𝐚𝐫𝐭𝐞𝐜𝐢𝐩𝐚𝐧𝐭𝐢 𝐝𝐞𝐥 𝐠𝐫𝐮𝐩𝐩𝐨.')

  const participant = findGroupParticipant(meta, rawTarget)
  if (!participant?.id) return invia('𝐐𝐮𝐞𝐬𝐭𝐚 𝐩𝐞𝐫𝐬𝐨𝐧𝐚 𝐧𝐨𝐧 𝐫𝐢𝐬𝐮𝐥𝐭𝐚 𝐧𝐞𝐥 𝐠𝐫𝐮𝐩𝐩𝐨.')

  const target = participant.id
  if (chat.mutedUsers.some((id) => sameGroupParticipant(meta, id, target))) {
    return invia('𝐐𝐮𝐞𝐬𝐭𝐚 𝐩𝐞𝐫𝐬𝐨𝐧𝐚 è 𝐠𝐢à 𝐦𝐮𝐭𝐚𝐭𝐚.')
  }

  chat.mutedUsers.push(target)
  return conn.sendMessage(m.chat, {
    text: `🔇 @${target.split('@')[0]} 𝐦𝐮𝐭𝐚𝐭𝐨, 𝐢 𝐬𝐮𝐨𝐢 𝐦𝐞𝐬𝐬𝐚𝐠𝐠𝐢 𝐯𝐞𝐫𝐫𝐚𝐧𝐧𝐨 𝐞𝐥𝐢𝐦𝐢𝐧𝐚𝐭𝐢.`,
    mentions: [target],
  }, { quoted: fakeQuote('Muta') })
}

handler.help = ['muta @utente']
handler.tags = ['admin']
handler.command = ['muta']
handler.mod = true
handler.botAdmin = true
handler.group = true

export default handler

export async function before(sock, msg) {
  const chat = msg.key.remoteJid
  if (!chat?.endsWith('@g.us')) return
  if (msg.key.fromMe) return

  const chatData = global.db.data.chats?.[chat]
  if (!chatData?.mutedUsers?.length) return

  const meta = await fetchGroupMetadata(sock, chat)
  if (!meta) return

  const { isBotAdmin, isSenderAdmin, isOwner, sender } = await resolveSender(sock, meta, msg)
  if (!isBotAdmin) return

  const isConfiguredOwner = (global.owner || []).some(([number]) =>
    sameGroupParticipant(meta, sender, `${String(number)}@s.whatsapp.net`)
  )
  if (isSenderAdmin || isOwner || isConfiguredOwner) return

  const muted = chatData.mutedUsers.some((id) => sameGroupParticipant(meta, id, sender))
  if (!muted) return

  try {
    await sock.sendMessage(chat, { delete: msg.key })
  } catch (err) {
    console.error('[muta] impossibile eliminare il messaggio:', err?.message || err)
  }
}
