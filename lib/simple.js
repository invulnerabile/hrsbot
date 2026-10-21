
import { downloadMediaMessage } from '@itsliaaa/baileys/lib/Utils/messages.js';

export async function smsg(sock, msg, text, args) {
  const from = msg.key.remoteJid;

  let sender = msg.key.participantAlt || msg.key.participant || from;
  if (sender.endsWith('@lid')) {
    const pn = await sock.signalRepository?.lidMapping?.getPNForLID(sender);
    if (pn) sender = pn;
  }

  let participants = [];
  let groupAdmins = [];
  const botNumber = sock.user.id.split(':')[0].split('@')[0];

  if (from.endsWith('@g.us')) {
    const meta = await sock.groupMetadata(from);
    participants = meta.participants.map((p) => p.id);
    groupAdmins = meta.participants
      .filter((p) => p.admin)
      .flatMap((p) => [p.id, p.phoneNumber].filter(Boolean));
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
    const participantAlt = ctx.remoteJid ? undefined : undefined;

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
    isBotAdmin,
    groupAdmins,
    mentionedJid:
      msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [],
    isGroup: from.endsWith('@g.us'),
    reply: (t) =>
      sock.sendMessage(from, { text: t }, { quoted: msg }),
  };
}
