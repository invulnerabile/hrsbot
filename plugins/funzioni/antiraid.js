import { fetchGroupMetadata } from '../../lib/groupCache.js'
import { chatDB } from '../../lib/db.js'
import { fakeQuote } from '../../lib/fakequote.js'
import { resolveSender } from '../../lib/groupAuth.js'

const STATUS_TYPES = ['groupStatusMessageV2', 'groupStatusMessage']
const PAYMENT_TYPES = ['requestPaymentMessage', 'sendPaymentMessage', 'declinePaymentRequestMessage', 'cancelPaymentRequestMessage', 'paymentInviteMessage']
const BOT_TYPES = [
  'buttonsMessage',
  'listMessage',
  'templateMessage',
  'interactiveMessage',
  'highlyStructuredMessage',
  'groupInviteMessage',
  'productMessage',
  'catalogSnapshotMessage',
  'orderMessage',
]

function unwrap(message) {
  let node = message
  if (node?.ephemeralMessage) node = node.ephemeralMessage.message
  if (node?.viewOnceMessage) node = node.viewOnceMessage.message
  if (node?.viewOnceMessageV2) node = node.viewOnceMessageV2.message
  if (node?.viewOnceMessageV2Extension) node = node.viewOnceMessageV2Extension.message
  return node
}

function detectType(message) {
  const node = unwrap(message)
  if (!node) return null
  for (const t of STATUS_TYPES) if (node[t]) return { category: 'status' }
  for (const t of PAYMENT_TYPES) if (node[t]) return { category: 'payment' }
  for (const t of BOT_TYPES) if (node[t]) return { category: 'bot' }
  return null
}

const handler = async (m, { conn, args }) => {
  const chat = chatDB(m.chat)
  const azione = args[0]?.toLowerCase()

  const invia = (testo) => conn.sendMessage(m.chat, { text: testo }, { quoted: fakeQuote('Antiraid') })

  if (azione === 'on') {
    if (chat.antiraid) return invia('𝐀𝐧𝐭𝐢𝐫𝐚𝐢𝐝 𝐠𝐢à 𝐚𝐭𝐭𝐢𝐯𝐨.')
    chat.antiraid = true
    return invia('𝐀𝐧𝐭𝐢𝐫𝐚𝐢𝐝 𝐚𝐭𝐭𝐢𝐯𝐚𝐭𝐨.')
  }

  if (azione === 'off') {
    if (!chat.antiraid) return invia('𝐀𝐧𝐭𝐢𝐫𝐚𝐢𝐝 𝐠𝐢à 𝐝𝐢𝐬𝐚𝐭𝐭𝐢𝐯𝐚𝐭𝐨.')
    chat.antiraid = false
    return invia('𝐀𝐧𝐭𝐢𝐫𝐚𝐢𝐝 𝐝𝐢𝐬𝐚𝐭𝐭𝐢𝐯𝐚𝐭𝐨.')
  }

  return invia(`𝐀𝐧𝐭𝐢𝐫𝐚𝐢𝐝 è attualmente ${chat.antiraid ? '𝐚𝐭𝐭𝐢𝐯𝐨' : '𝐝𝐢𝐬𝐚𝐭𝐭𝐢𝐯𝐚𝐭𝐨'}.`)
}

handler.help = ['antiraid <on|off>']
handler.tags = ['funzioni']
handler.command = ['antiraid']
handler.admin = true
handler.group = true

export default handler

export async function before(sock, msg) {
  const chat = msg.key.remoteJid
  if (!chat?.endsWith('@g.us')) return
  if (msg.key.fromMe) return

  const chatData = global.db.data.chats?.[chat]
  if (!chatData?.antiraid) return

  const result = detectType(msg.message)
  if (!result) return

  const meta = await fetchGroupMetadata(sock, chat)
  if (!meta) return

  const { isBotAdmin, isSenderAdmin, isOwner, sender } = await resolveSender(sock, meta, msg)
  if (!isBotAdmin) return
  if (isSenderAdmin || isOwner) return

  if (result.category === 'status' || result.category === 'bot') {
    await sock.sendMessage(chat, { delete: msg.key })
    return
  }

  await sock.sendMessage(chat, { delete: msg.key }).catch(() => {})
  await sock.groupParticipantsUpdate(chat, [sender], 'remove')
  await sock.sendMessage(chat, {
    text: `🚫 @${sender.split('@')[0]} 𝐦𝐞𝐬𝐬𝐚𝐠𝐠𝐢 𝐝𝐢 𝐩𝐚𝐠𝐚𝐦𝐞𝐧𝐭𝐨 𝐧𝐨𝐧 𝐬𝐨𝐧𝐨 𝐜𝐨𝐧𝐬𝐞𝐧𝐭𝐢𝐭𝐢 𝐧𝐞𝐢 𝐠𝐫𝐮𝐩𝐩𝐢.`,
    mentions: [sender],
  }, { quoted: fakeQuote('Antiraid') })
}
