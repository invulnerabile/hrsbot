import { fetchGroupMetadata, groupCache } from './groupCache.js'
import { downloadMediaMessage } from '@itsliaaa/baileys/lib/Utils/messages.js'

export async function smsg(sock, msg, text, args) {
  const from = msg.key.remoteJid
  let sender = msg.key.participantAlt || msg.key.participant || from

  let participants = []
  let groupAdmins = []
  let groupSubject = null

  const botNumber = sock.user.id.split(':')[0].split('@')[0]

  if (from.endsWith('@g.us')) {
    try {
      let meta = await fetchGroupMetadata(sock, from)

      if (!meta) {
        meta = await sock.groupMetadata(from)
        if (meta) groupCache.set(from, meta)
      }

      groupSubject = meta?.subject || null
      participants = (meta?.participants || [])
        .map((participant) => participant.id)
        .filter(Boolean)

      groupAdmins = (meta?.participants || [])
        .filter((participant) => participant.admin)
        .flatMap((participant) =>
          [participant.id, participant.phoneNumber].filter(Boolean)
        )

      if (sender.endsWith('@lid')) {
        const match = (meta?.participants || []).find(
          (participant) => participant.id === sender
        )

        if (match?.phoneNumber) sender = match.phoneNumber
      }
    } catch {
      participants = []
      groupAdmins = []
    }
  }

  if (sender.endsWith('@lid')) {
    try {
      const pn = await sock.signalRepository?.lidMapping?.getPNForLID(sender)
      if (pn) sender = pn
    } catch {}
  }

  const isBotAdmin = groupAdmins.some(
    (id) => id.split('@')[0].split(':')[0] === botNumber
  )

  const ctx = msg.message?.extendedTextMessage?.contextInfo
  let quoted = null

  if (ctx?.quotedMessage && ctx.stanzaId) {
    const quotedMessage = ctx.quotedMessage
    const mtype = Object.keys(quotedMessage)[0]
    const participant = ctx.participant || undefined

    quoted = {
      id: ctx.stanzaId,
      chat: from,
      participant,
      fromMe: false,
      key: {
        remoteJid: from,
        id: ctx.stanzaId,
        participant,
        fromMe: false
      },
      text:
        quotedMessage.conversation ||
        quotedMessage.extendedTextMessage?.text ||
        quotedMessage[mtype]?.caption ||
        '',
      mtype,
      mimetype: quotedMessage[mtype]?.mimetype,
      fileName: quotedMessage[mtype]?.fileName,
      viewOnce: Boolean(quotedMessage[mtype]?.viewOnce),
      download: async () =>
        downloadMediaMessage(
          {
            key: {
              remoteJid: from,
              id: ctx.stanzaId,
              participant,
              fromMe: false
            },
            message: quotedMessage
          },
          'buffer',
          {}
        )
    }
  }

  return {
    chat: from,
    sender,
    quoted,
    text,
    args,
    timestamp: msg.messageTimestamp,
    raw: msg,
    participants,
    groupSubject,
    isBotAdmin,
    groupAdmins,
    mentionedJid:
      msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [],
    isGroup: from.endsWith('@g.us'),
    reply: (message) =>
      sock.sendMessage(from, { text: message }, { quoted: msg })
  }
}
