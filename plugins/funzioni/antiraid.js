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

const UNDECRYPT_WINDOW_MS = 12000
const UNDECRYPT_THRESHOLD = 3
const EDIT_WINDOW_MS = 4000
const CLEAN_INTERVAL = 60000

const pendingUndecrypt = new Map()
const recentSends = new Map()
const recentKicks = new Map()

function baseNum(jid) {
  return typeof jid === 'string' ? jid.split('@')[0].split(':')[0] : null
}

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

async function isBotAdminIn(sock, meta) {
  const botNumber = sock.user.id.split(':')[0].split('@')[0]
  return Boolean(meta?.participants?.some((p) => {
    const ids = [p.id, p.phoneNumber, p.lid].filter(Boolean).map((v) => v.split('@')[0].split(':')[0])
    return ids.includes(botNumber) && p.admin
  }))
}

async function kickSpammer(sock, chat, sender, meta, reason) {
  const key = `${chat}|${baseNum(sender)}`
  const now = Date.now()
  if (recentKicks.has(key) && now - recentKicks.get(key) < 30000) return
  recentKicks.set(key, now)

  if (!(await isBotAdminIn(sock, meta))) return

  await sock.sendMessage(chat, {
    text: `🚫 @${baseNum(sender)} 𝐫𝐢𝐦𝐨𝐬𝐬𝐨 𝐝𝐚𝐥𝐥'𝐚𝐧𝐭𝐢𝐫𝐚𝐢𝐝: ${reason}`,
    mentions: [sender],
  }, { quoted: fakeQuote('Antiraid') }).catch(() => {})

  await sock.groupParticipantsUpdate(chat, [sender], 'remove').catch(() => {})
}

function trackUndecrypt(chat, sender, msgId) {
  if (!chat?.endsWith?.('@g.us') || !sender) return
  const s = baseNum(sender)
  if (!s) return
  if (!pendingUndecrypt.has(chat)) pendingUndecrypt.set(chat, new Map())
  const map = pendingUndecrypt.get(chat)
  const cur = map.get(s) || { count: 0, last: 0, msgIds: new Set() }
  if (msgId && cur.msgIds.has(msgId)) return
  if (msgId) cur.msgIds.add(msgId)
  cur.count += 1
  cur.last = Date.now()
  map.set(s, cur)
}

function resolveUndecrypt(chat, sender, msgId) {
  const map = pendingUndecrypt.get(chat)
  if (!map) return
  const s = baseNum(sender)
  const cur = map.get(s)
  if (!cur) return
  if (msgId) cur.msgIds.delete(msgId)
  cur.count = Math.max(0, cur.count - 1)
  if (cur.count === 0) map.delete(s)
}

function trackSend(chat, sender, text, msgId) {
  if (!chat?.endsWith?.('@g.us') || !sender) return
  const s = baseNum(sender)
  if (!recentSends.has(chat)) recentSends.set(chat, new Map())
  recentSends.get(chat).set(s, { lastText: text || '', lastId: msgId, ts: Date.now() })
}

function isSuspiciousEdit(chat, sender, editText, editKeyId) {
  const map = recentSends.get(chat)
  if (!map) return false
  const s = baseNum(sender)
  const prev = map.get(s)
  if (!prev) return false
  if (Date.now() - prev.ts > EDIT_WINDOW_MS) return false
  if (prev.lastText && editText && prev.lastText !== editText) return true
  if (prev.lastId && editKeyId && prev.lastId === editKeyId) return true
  return false
}

let pendingSockRef = null

setInterval(() => {
  const now = Date.now()
  for (const [chat, map] of pendingUndecrypt) {
    for (const [s, cur] of map) {
      if (now - cur.last < UNDECRYPT_WINDOW_MS) continue
      if (cur.count >= UNDECRYPT_THRESHOLD) {
        if (pendingSockRef) {
          fetchGroupMetadata(pendingSockRef, chat).then((meta) => {
            kickSpammer(pendingSockRef, chat, s + '@s.whatsapp.net', meta, '𝐦𝐞𝐬𝐬𝐚𝐠𝐠𝐢 𝐧𝐚𝐬𝐜𝐨𝐬𝐭𝐢')
          })
        }
        map.delete(s)
      } else if (now - cur.last > UNDECRYPT_WINDOW_MS * 3) {
        map.delete(s)
      }
    }
    if (map.size === 0) pendingUndecrypt.delete(chat)
  }
  for (const [k, t] of recentKicks) {
    if (now - t > 120000) recentKicks.delete(k)
  }
}, CLEAN_INTERVAL).unref?.()

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
  pendingSockRef = sock

  const chat = msg.key.remoteJid
  if (!chat?.endsWith('@g.us')) return
  if (msg.key.fromMe) return

  const sender = msg.key.participantAlt || msg.key.participant || msg.key.remoteJid

  if (!msg.message && msg.messageStubType == null && msg.key?.id) {
    trackUndecrypt(chat, sender, msg.key.id)
    return
  }

  if (msg.message && msg.key?.id) {
    resolveUndecrypt(chat, sender, msg.key.id)
  }

  const proto = msg.message?.protocolMessage
  if (proto && (proto.type === 14 || proto.type === 'MESSAGE_EDIT')) {
    const edited = proto.editedMessage
    let editText = ''
    if (edited) {
      editText =
        edited.conversation ||
        edited.extendedTextMessage?.text ||
        edited.imageMessage?.caption ||
        edited.videoMessage?.caption ||
        ''
    }
    const editKeyId = proto.key?.id

    const chatData = global.db.data.chats?.[chat]
    if (chatData?.antiraid && isSuspiciousEdit(chat, sender, editText, editKeyId)) {
      const meta = await fetchGroupMetadata(sock, chat)
      const { isOwner, isSenderAdmin } = await resolveSender(sock, meta, msg)
      if (!isOwner && !isSenderAdmin) {
        await kickSpammer(sock, chat, sender, meta, '𝐦𝐨𝐝𝐢𝐟𝐢𝐜𝐚 𝐧𝐚𝐬𝐜𝐨𝐬𝐭𝐚')
      }
    }
    return
  }

  if (msg.message) {
    const text =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      msg.message.imageMessage?.caption ||
      msg.message.videoMessage?.caption ||
      ''
    trackSend(chat, sender, text, msg.key?.id)
  }

  const chatData = global.db.data.chats?.[chat]
  if (!chatData?.antiraid) return

  const result = detectType(msg.message)
  if (!result) return

  const meta = await fetchGroupMetadata(sock, chat)
  if (!meta) return

  const { isBotAdmin, isSenderAdmin, isOwner, sender: resolvedSender } = await resolveSender(sock, meta, msg)
  if (!isBotAdmin) return
  if (isSenderAdmin || isOwner) return

  if (result.category === 'status' || result.category === 'bot') {
    await sock.sendMessage(chat, { delete: msg.key })
    return
  }

  await sock.sendMessage(chat, { delete: msg.key }).catch(() => {})
  await sock.groupParticipantsUpdate(chat, [resolvedSender], 'remove')
  await sock.sendMessage(chat, {
    text: `🚫 @${resolvedSender.split('@')[0]} 𝐦𝐞𝐬𝐬𝐚𝐠𝐠𝐢 𝐝𝐢 𝐩𝐚𝐠𝐚𝐦𝐞𝐧𝐭𝐨 𝐧𝐨𝐧 𝐬𝐨𝐧𝐨 𝐜𝐨𝐧𝐬𝐞𝐧𝐭𝐢𝐭𝐢 𝐧𝐞𝐢 𝐠𝐫𝐮𝐩𝐩𝐢.`,
    mentions: [resolvedSender],
  }, { quoted: fakeQuote('Antiraid') })
}
