import { fetchGroupMetadata } from '../../lib/groupCache.js'
import { chatDB } from '../../lib/db.js'
import { fakeQuote } from '../../lib/fakequote.js'
import { resolveSender } from '../../lib/groupAuth.js'

const INVITE_REGEX = /chat\.whatsapp\.com\/(?:invite\/)?([a-zA-Z0-9]{15,24})/gi

function extractInviteCodes(message) {
  if (!message) return []
  let node = message
  if (node.ephemeralMessage) node = node.ephemeralMessage.message
  if (node.viewOnceMessage) node = node.viewOnceMessage.message
  if (node.viewOnceMessageV2) node = node.viewOnceMessageV2.message
  if (node.viewOnceMessageV2Extension) node = node.viewOnceMessageV2Extension.message
  if (!node) return []

  const codes = []
  const scan = (text) => {
    if (typeof text !== 'string' || !text) return
    for (const match of text.matchAll(INVITE_REGEX)) codes.push(match[1])
  }

  scan(node.conversation)
  scan(node.extendedTextMessage?.text)

  const poll = node.pollCreationMessage || node.pollCreationMessageV2 || node.pollCreationMessageV3
  if (poll) {
    scan(poll.name)
    for (const opt of poll.options || []) scan(opt.optionName)
  }

  scan(node.contactMessage?.vcard)
  for (const c of node.contactsArrayMessage?.contacts || []) scan(c.vcard)

  const loc = node.locationMessage || node.liveLocationMessage
  if (loc) {
    scan(loc.name)
    scan(loc.address)
    scan(loc.url)
  }

  const status = node.groupStatusMessageV2 || node.groupStatusMessage
  if (status?.message) codes.push(...extractInviteCodes(status.message))

  return codes
}

const handler = async (m, { conn, args }) => {
  const chat = chatDB(m.chat)
  const azione = args[0]?.toLowerCase()

  const invia = (testo) => conn.sendMessage(m.chat, { text: testo }, { quoted: fakeQuote('Antilink') })

  if (azione === 'on') {
    if (chat.antilink) return invia('𝐀𝐧𝐭𝐢𝐥𝐢𝐧𝐤 𝐠𝐢à 𝐚𝐭𝐭𝐢𝐯𝐨.')
    chat.antilink = true
    return invia('𝐀𝐧𝐭𝐢𝐥𝐢𝐧𝐤 𝐚𝐭𝐭𝐢𝐯𝐚𝐭𝐨.')
  }

  if (azione === 'off') {
    if (!chat.antilink) return invia('𝐀𝐧𝐭𝐢𝐥𝐢𝐧𝐤 𝐠𝐢à 𝐝𝐢𝐬𝐚𝐭𝐭𝐢𝐯𝐚𝐭𝐨.')
    chat.antilink = false
    return invia('𝐀𝐧𝐭𝐢𝐥𝐢𝐧𝐤 𝐝𝐢𝐬𝐚𝐭𝐭𝐢𝐯𝐚𝐭𝐨.')
  }

  return invia(`𝐀𝐧𝐭𝐢𝐥𝐢𝐧𝐤 è attualmente ${chat.antilink ? '𝐚𝐭𝐭𝐢𝐯𝐨' : '𝐝𝐢𝐬𝐚𝐭𝐭𝐢𝐯𝐚𝐭𝐨'}.`)
}

handler.help = ['antilink <on|off>']
handler.tags = ['funzioni']
handler.command = ['antilink']
handler.admin = true
handler.group = true

export default handler

export async function before(sock, msg) {
  const chat = msg.key.remoteJid
  if (!chat?.endsWith('@g.us')) return
  if (msg.key.fromMe) return

  const chatData = global.db.data.chats?.[chat]
  if (!chatData?.antilink) return

  const quotedMessage = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage
  const quotedCodesRaw = quotedMessage ? extractInviteCodes(quotedMessage) : []
  const ownCodesRaw = extractInviteCodes(msg.message)

  if (!quotedCodesRaw.length && !ownCodesRaw.length) return

  const meta = await fetchGroupMetadata(sock, chat)
  if (!meta) return

  const { isBotAdmin, isSenderAdmin, isOwner, sender } = await resolveSender(sock, meta, msg)
  if (!isBotAdmin) return
  if (isSenderAdmin || isOwner) return

  const ownCode = await sock.groupInviteCode(chat).catch(() => null)
  const quotedForeign = quotedCodesRaw.filter((c) => c !== ownCode)

  if (quotedForeign.length) {
    await sock.sendMessage(chat, { delete: msg.key })
    return
  }

  const ownForeign = ownCodesRaw.filter((c) => c !== ownCode)
  if (!ownForeign.length) return

  await sock.sendMessage(chat, { delete: msg.key })
  await sock.groupParticipantsUpdate(chat, [sender], 'remove')
  await sock.sendMessage(chat, {
    text: `🚫 @${sender.split('@')[0]} 𝐥𝐢𝐧𝐤 𝐝𝐢 𝐚𝐥𝐭𝐫𝐢 𝐠𝐫𝐮𝐩𝐩𝐢 𝐧𝐨𝐧 𝐬𝐨𝐧𝐨 𝐜𝐨𝐧𝐬𝐞𝐧𝐭𝐢𝐭𝐢.`,
    mentions: [sender],
  }, { quoted: fakeQuote('Antilink') })
}
