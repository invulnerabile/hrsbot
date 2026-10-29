import { fetchGroupMetadata, groupCache } from './groupCache.js'
import { downloadMediaMessage } from '@itsliaaa/baileys/lib/Utils/messages.js'

export async function smsg(sock, msg, text, args) {
  const from = msg.key.remoteJid
  
  const botNumber = sock.user?.id?.split(':')[0].split('@')[0] || ''
  const botJid = botNumber ? botNumber + '@s.whatsapp.net' : ''
  const botLidNum = sock.user?.lid ? sock.user.lid.split(':')[0].split('@')[0] : null

  let sender = msg.key.fromMe 
    ? botJid 
    : (msg.key.participantAlt || msg.key.participant || null)

  let participants = []
  let groupAdmins = []
  let groupSubject = null

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
          [participant.id, participant.phoneNumber, participant.lid].filter(Boolean)
        )

      if (sender.endsWith('@lid')) {
        const match = (meta?.participants || []).find(
          (participant) => participant.id === sender || participant.lid === sender
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
    
    const qParticipantNum = (participant || '').split('@')[0].split(':')[0]
    const isQuotedFromMe = qParticipantNum === botNumber || (botLidNum && qParticipantNum === botLidNum)

    // Se è un messaggio fromMe, il participant DEVE essere undefined per permettere la revoca
    const quotedParticipant = isQuotedFromMe ? undefined : participant

    quoted = {
      id: ctx.stanzaId,
      chat: from,
      participant: quotedParticipant,
      fromMe: isQuotedFromMe,
      key: {
        remoteJid: from,
        id: ctx.stanzaId,
        participant: quotedParticipant,
        fromMe: isQuotedFromMe
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
              participant: quotedParticipant,
              fromMe: isQuotedFromMe
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
