import { printMessage } from './lib/print.js'
import { smsg } from './lib/simple.js'
import { fetchGroupMetadata } from './lib/groupCache.js'
import { findGroupParticipant, sameGroupParticipant } from './lib/groupParticipants.js'

const PREFIX = global.prefix[0]

function matches(handler, command) {
  const commands = Array.isArray(handler.command)
    ? handler.command
    : [handler.command]

  return commands.some((item) =>
    item instanceof RegExp ? item.test(command) : item === command
  )
}

export async function handler(sock, msg) {
  if (!msg.message || msg.key.fromMe) return

  const text =
    msg.message.conversation ||
    msg.message.extendedTextMessage?.text ||
    msg.message.buttonsResponseMessage?.selectedButtonId ||
    msg.message.listResponseMessage?.singleSelectReply?.selectedRowId ||
    ''

  const isCommand = text.startsWith(PREFIX)
  const [cmd, ...args] = isCommand
    ? text.slice(PREFIX.length).trim().split(/\s+/)
    : []

  const plugin = isCommand
    ? global.plugins.find((item) => matches(item, cmd.toLowerCase()))
    : null

  const m = await smsg(sock, msg, text, args)

  let groupMeta = null
  let chatName

  if (m.isGroup) {
    try {
      groupMeta = await fetchGroupMetadata(sock, m.chat)
    } catch {}

    chatName = groupMeta?.subject || m.chat.split('@')[0]
  }

  const senderId = m.sender.split('@')[0].split(':')[0]
  const ownerEntry = global.owner?.find(
    ([number]) => String(number) === senderId
  )

  const isOwner = Boolean(ownerEntry)
  const isAlwaysAdmin = Boolean(ownerEntry?.[2])

  printMessage(m, chatName, isOwner)

  if (!plugin) return

  if (plugin.group && !m.isGroup) {
    return m.reply('𝐐𝐮𝐞𝐬𝐭𝐨 𝐜𝐨𝐦𝐚𝐧𝐝𝐨 𝐟𝐮𝐧𝐳𝐢𝐨𝐧𝐚 𝐬𝐨𝐥𝐨 𝐧𝐞𝐢 𝐠𝐫𝐮𝐩𝐩𝐢.')
  }

  if (plugin.owner && !isOwner) {
    return m.reply('𝐂𝐨𝐦𝐚𝐧𝐝𝐨 𝐫𝐢𝐬𝐞𝐫𝐯𝐚𝐭𝐨 𝐚𝐠𝐥𝐢 𝐨𝐰𝐧𝐞𝐫.')
  }

  if ((plugin.admin || plugin.botAdmin) && !m.isGroup) {
    return m.reply('𝐐𝐮𝐞𝐬𝐭𝐨 𝐜𝐨𝐦𝐚𝐧𝐝𝐨 𝐫𝐢𝐜𝐡𝐢𝐞𝐝𝐞 𝐮𝐧 𝐠𝐫𝐮𝐩𝐩𝐨.')
  }

  let permissionMeta = groupMeta

  if (m.isGroup && (plugin.admin || plugin.botAdmin)) {
    try {
      permissionMeta = await sock.groupMetadata(m.chat)

      if (!Array.isArray(permissionMeta?.participants)) {
        throw new Error('Metadati non validi')
      }
    } catch {
      return m.reply(
        '𝐈𝐦𝐩𝐨𝐬𝐬𝐢𝐛𝐢𝐥𝐞 𝐯𝐞𝐫𝐢𝐟𝐢𝐜𝐚𝐫𝐞 𝐢 𝐩𝐞𝐫𝐦𝐞𝐬𝐬𝐢. 𝐂𝐨𝐦𝐚𝐧𝐝𝐨 𝐚𝐧𝐧𝐮𝐥𝐥𝐚𝐭𝐨.'
      )
    }
  }

  const senderParticipant = findGroupParticipant(permissionMeta, m.sender)
  const isGroupAdmin = Boolean(senderParticipant?.admin)

  const botParticipant = findGroupParticipant(
    permissionMeta,
    sock.user?.id
  )

  const isBotAdminNow = Boolean(botParticipant?.admin)

  const isPrivileged = isOwner || isAlwaysAdmin || isGroupAdmin

  if (m.isGroup && !isPrivileged) {
    const mutedUsers =
      global.db?.data?.chats?.[m.chat]?.mutedUsers || []

    const isMuted = mutedUsers.some((id) =>
      sameGroupParticipant(permissionMeta, id, m.sender)
    )

    if (isMuted) {
      return m.reply(
        '🔇 Sei mutato e non puoi usare i comandi del bot finché un admin non ti smuta.'
      )
    }
  }

  if (plugin.admin && !isPrivileged) {
    return m.reply('𝐂𝐨𝐦𝐚𝐧𝐝𝐨 𝐫𝐢𝐬𝐞𝐫𝐯𝐚𝐭𝐨 𝐚𝐠𝐥𝐢 𝐚𝐝𝐦𝐢𝐧 𝐝𝐞𝐥 𝐠𝐫𝐮𝐩𝐩𝐨.')
  }

  if (plugin.botAdmin && !isBotAdminNow) {
    return m.reply(
      '𝐃𝐞𝐯𝐨 𝐞𝐬𝐬𝐞𝐫𝐞 𝐚𝐝𝐦𝐢𝐧 𝐩𝐞𝐫 𝐞𝐬𝐞𝐠𝐮𝐢𝐫𝐞 𝐪𝐮𝐞𝐬𝐭𝐨 𝐜𝐨𝐦𝐚𝐧𝐝𝐨.'
    )
  }

  const extra = {
    conn: sock,
    args,
    usedPrefix: PREFIX,
    isOwner,
    isAlwaysAdmin
  }

  try {
    await plugin(m, extra)
  } catch (err) {
    console.error('[plugin] errore:', err)
    await m.reply('*errore*')
  }
}
