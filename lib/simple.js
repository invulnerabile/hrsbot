import { fetchGroupMetadata } from './groupCache.js';
import { downloadMediaMessage } from '@itsliaaa/baileys/lib/Utils/messages.js';
import { groupCache } from './groupCache.js';

export async function smsg(sock, msg, text, args) {
  const from = msg.key.remoteJid;
  let sender = msg.key.participantAlt || msg.key.participant || from;

  let participants = [];
  let groupAdmins = [];
  let groupSubject = null;
  const botNumber = sock.user.id.split(':')[0].split('@')[0];

  if (from.endsWith('@g.us')) {
    try {
      const meta = await fetchGroupMetadata(sock, from);
      if (!meta) {
        meta = await sock.groupMetadata(from);
        if (meta) groupCache.set(from, meta);
      }
      groupSubject = meta?.subject || null;
      participants = (meta?.participants || []).map((p) => p.id).filter(Boolean);
      groupAdmins = (meta?.participants || [])
        .filter((p) => p.admin)
        .flatMap((p) => [p.id, p.phoneNumber].filter(Boolean));

      if (sender.endsWith('@lid')) {
        const match = (meta?.participants || []).find((p) => p.id === sender);
        if (match?.phoneNumber) sender = match.phoneNumber;
      }
    } catch {
      participants = [];
      groupAdmins = [];
    }
  }

  if (sender.endsWith('@lid')) {
    const pn = await sock.signalRepository?.lidMapping?.getPNForLID(sender);
    if (pn) sender = pn;
  }

  const isBotAdmin = groupAdmins.some(
    (id) => id.split('@')[0].split(':')[0] === botNumber
  );

  const ctx = msg.message?.extendedTextMessage?.contextInfo;
  let quoted = null;

  if (ctx?.quotedMessage && ctx.stanzaId) {
    const qm = ctx.quotedMessage;
    const mtype = Object.keys(qm)[0];
    const participant = ctx.participant || undefined;

    quoted = {
      id: ctx.stanzaId,
      chat: from,
      participant,
      fromMe: false,
      key: {
        remoteJid: from,
        id: ctx.stanzaId,
        participant,
        fromMe: false,
      },
      text:
        qm.conversation ||
        qm.extendedTextMessage?.text ||
        qm[mtype]?.caption ||
        '',
      mtype,
      mimetype: qm[mtype]?.mimetype,
      fileName: qm[mtype]?.fileName,
      viewOnce: !!qm[mtype]?.viewOnce,
      download: async () => {
        return downloadMediaMessage(
          {
            key: {
              remoteJid: from,
              id: ctx.stanzaId,
              participant,
              fromMe: false,
            },
            message: qm,
          },
          'buffer',
          {}
        );
      },
    };
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
    reply: (t) =>
      sock.sendMessage(from, { text: t }, { quoted: msg }),
  };
}
