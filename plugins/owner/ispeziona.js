import * as baileys from '@itsliaaa/baileys';

const normalizeJid = (value) => {
  if (value == null) return null;

  const jid = String(value).trim();
  if (!jid) return null;

  if (jid.includes('@')) {
    try {
      return baileys.jidNormalizedUser(jid);
    } catch {
      return jid;
    }
  }

  const number = jid.replace(/\D/g, '');
  return number ? `${number}@s.whatsapp.net` : null;
};

const isLid = (jid) => typeof jid === 'string' && jid.endsWith('@lid');

const formatContact = (jid) => {
  const normalized = normalizeJid(jid);

  if (!normalized) return 'Sconosciuto';

  if (isLid(normalized)) {
    return `LID ${normalized.split('@')[0]} (numero non disponibile)`;
  }

  const number = normalized.split('@')[0].split(':')[0];

  return `wa.me/${number}`;
};

const formatCreation = (timestamp) => {
  if (timestamp == null || timestamp === '') return 'Sconosciuto';

  const value = Number(timestamp);

  if (!Number.isFinite(value) || value <= 0) {
    return 'Sconosciuto';
  }

  const date = new Date(value * 1000);

  if (Number.isNaN(date.getTime())) return 'Sconosciuto';

  return date.toLocaleString('it-IT', {
    timeZone: 'Europe/Rome'
  });
};

const nodeText = (content) => {
  if (content == null) return null;
  if (typeof content === 'string') return content;
  if (Buffer.isBuffer(content)) return content.toString('utf8');

  if (content instanceof Uint8Array) {
    return Buffer.from(content).toString('utf8');
  }

  return String(content);
};

const resolveJid = async (value, conn, participants = []) => {
  const jid = normalizeJid(value);

  if (!jid || !isLid(jid)) return jid;

  const participant = participants.find((item) => {
    const attrs = item?.attrs || item;

    return [
      attrs?.jid,
      attrs?.lid,
      attrs?.id
    ].some((candidate) => {
      const normalized = normalizeJid(candidate);
      return normalized === jid;
    });
  });

  if (participant) {
    const attrs = participant.attrs || participant;

    const pn =
      attrs.phone_number ||
      attrs.phoneNumber ||
      (
        attrs.jid && !isLid(normalizeJid(attrs.jid))
          ? attrs.jid
          : null
      );

    const normalizedPn = normalizeJid(pn);

    if (normalizedPn && !isLid(normalizedPn)) {
      return normalizedPn;
    }
  }

  try {
    const mapping = conn.signalRepository?.lidMapping;

    const result = await mapping?.getPNForLID?.(jid);

    const mapped =
      typeof result === 'string'
        ? result
        : result?.pn || result?.jid || null;

    const normalizedMapped = normalizeJid(mapped);

    if (normalizedMapped && !isLid(normalizedMapped)) {
      return normalizedMapped;
    }
  } catch {}

  return jid;
};

const extractGroupMetadata = async (result, conn) => {
  const group = baileys.getBinaryNodeChild(result, 'group');

  if (!group?.attrs?.id) {
    throw new Error('WhatsApp non ha restituito i metadati del gruppo.');
  }

  const attrs = group.attrs;

  const participants =
    baileys.getBinaryNodeChildren(group, 'participant') || [];

  const descriptionNode =
    baileys.getBinaryNodeChild(group, 'description');

  const descriptionBody = descriptionNode
    ? baileys.getBinaryNodeChild(descriptionNode, 'body')
    : null;

  const ownerJid = await resolveJid(
    attrs.creator_pn || attrs.creator,
    conn,
    participants
  );

  const admins = await Promise.all(
    participants
      .filter(({ attrs: participantAttrs = {} }) =>
        participantAttrs.type === 'admin' ||
        participantAttrs.type === 'superadmin'
      )
      .map(async ({ attrs: participantAttrs }) => {
        const jid = await resolveJid(
          participantAttrs.phone_number ||
          participantAttrs.jid ||
          participantAttrs.lid,
          conn,
          participants
        );

        return formatContact(jid);
      })
  );

  const size = attrs.size != null && attrs.size !== ''
    ? Number(attrs.size)
    : participants.length || null;

  return {
    id: attrs.id.includes('@')
      ? attrs.id
      : baileys.jidEncode(attrs.id, 'g.us'),

    subject: attrs.subject || attrs.name || null,
    creation: formatCreation(attrs.creation),
    owner: formatContact(ownerJid),
    size: Number.isFinite(size) ? size : null,
    admins,
    desc: nodeText(descriptionBody?.content)
  };
};

const normalizeGroupMetadata = async (metadata, fallbackId, conn) => {
  if (!metadata) {
    throw new Error('Metadati del gruppo non disponibili.');
  }

  const participants = Array.isArray(metadata.participants)
    ? metadata.participants
    : [];

  const ownerJid = await resolveJid(
    metadata.ownerPn ||
    metadata.owner_pn ||
    metadata.creator_pn ||
    metadata.owner ||
    metadata.creator,
    conn,
    participants
  );

  const admins = await Promise.all(
    participants
      .filter((participant) => {
        const admin = participant.admin || participant.attrs?.type;

        return (
          admin === 'admin' ||
          admin === 'superadmin' ||
          participant.isAdmin === true ||
          participant.isSuperAdmin === true
        );
      })
      .map(async (participant) => {
        const jid = await resolveJid(
          participant.phoneNumber ||
          participant.phone_number ||
          participant.attrs?.phone_number ||
          participant.id ||
          participant.jid ||
          participant.attrs?.jid,
          conn,
          participants
        );

        return formatContact(jid);
      })
  );

  const rawSize = metadata.size;
  const size = rawSize != null
    ? Number(rawSize)
    : participants.length || null;

  return {
    id: metadata.id || fallbackId,
    subject: metadata.subject || null,
    creation: formatCreation(metadata.creation),
    owner: formatContact(ownerJid),
    size: Number.isFinite(size) ? size : null,
    admins,
    desc: metadata.desc || metadata.description || null
  };
};

const getGroupById = async (conn, jid) => {
  let lastError;

  try {
    const result = await conn.query({
      tag: 'iq',
      attrs: {
        type: 'get',
        xmlns: 'w:g2',
        to: jid
      },
      content: [
        {
          tag: 'query',
          attrs: {
            request: 'interactive'
          }
        }
      ]
    });

    const data = await extractGroupMetadata(result, conn);

    if (data.subject) return data;

    lastError = new Error('La risposta non contiene il nome del gruppo.');
  } catch (error) {
    lastError = error;
  }

  try {
    if (typeof conn.groupMetadata === 'function') {
      const metadata = await conn.groupMetadata(jid);
      const data = await normalizeGroupMetadata(metadata, jid, conn);

      if (data.subject) return data;
    }
  } catch (error) {
    lastError = error;
  }

  throw new Error(
    `Metadati non disponibili. Verifica l'ID e l'accesso del bot al gruppo. ${
      lastError?.message || ''
    }`.trim()
  );
};

let handler = async (m, { conn, args }) => {
  const input = String(args.join(' ')).trim();

  const groupJid = input.match(
    /([0-9]+(?:-[0-9]+)*@g\.us)/i
  )?.[1];

  const inviteCode = input.match(
    /chat\.whatsapp\.com\/(?:invite\/)?([0-9A-Za-z]{20,24})/i
  )?.[1];

  if (!groupJid && !inviteCode) {
    return m.reply('𝐈𝐍𝐒𝐄𝐑𝐈𝐒𝐂𝐈 𝐔𝐍 𝐋𝐈𝐍𝐊 𝐃’𝐈𝐍𝐕𝐈𝐓𝐎 𝐎 𝐔𝐍 𝐈𝐃 𝐃𝐄𝐋 𝐆𝐑𝐔𝐏𝐏𝐎 (@𝐠.𝐮𝐬)');
  }

  let data;

  try {
    if (groupJid) {
      data = await getGroupById(conn, groupJid);
    } else {
      const result = await conn.query({
        tag: 'iq',
        attrs: {
          type: 'get',
          xmlns: 'w:g2',
          to: '@g.us'
        },
        content: [
          {
            tag: 'invite',
            attrs: {
              code: inviteCode
            }
          }
        ]
      });

      data = await extractGroupMetadata(result, conn);

      if (!data.subject) {
        throw new Error('𝐖𝐇𝐀𝐓𝐒𝐀𝐏𝐏 𝐍𝐎𝐍 𝐇𝐀 𝐑𝐄𝐒𝐓𝐈𝐓𝐔𝐈𝐓𝐎 𝐈 𝐌𝐄𝐓𝐀𝐃𝐀𝐓𝐈 𝐃𝐄𝐋 𝐆𝐑𝐔𝐏𝐏𝐎. 𝐕𝐞𝐫𝐢𝐟𝐢𝐜𝐚 𝐢𝐥 𝐥𝐢𝐧𝐤 𝐝’𝐢𝐧𝐯𝐢𝐭𝐨.');
      }
    }
  } catch (e) {
    return m.reply(typeof e === 'string' ? e : (e.message || String(e)));
  }

  const txt = [
    '𝐈𝐍𝐅𝐎𝐑𝐌𝐀𝐙𝐈𝐎𝐍𝐈 𝐆𝐑𝐔𝐏𝐏𝐎',
    `➣ 𝐈𝐃: ${data.id || 'Sconosciuto'}`,
    `➣ 𝐍𝐨𝐦𝐞: ${data.subject || 'Sconosciuto'}`,
    `➣ 𝐂𝐫𝐞𝐚𝐭𝐨 𝐢𝐥: ${data.creation}`,
    `➣ 𝐂𝐫𝐞𝐚𝐭𝐨𝐫𝐞: ${data.owner}`,
    `➣ 𝐍𝐮𝐦𝐞𝐫𝐨 𝐦𝐞𝐦𝐛𝐫𝐢: ${data.size ?? 'Sconosciuto'}`,
    `➣ 𝐀𝐦𝐦𝐢𝐧𝐢𝐬𝐭𝐫𝐚𝐭𝐨𝐫𝐢: ${data.admins.length ? data.admins.join(', ') : 'Non disponibili'}`,
    `➣ 𝐃𝐞𝐬𝐜𝐫𝐢𝐳𝐢𝐨𝐧𝐞: ${data.desc || 'Nessuna descrizione'}`
  ].join('\n');

  const pp = await conn.profilePictureUrl(data.id, 'image')
    .catch(() => null);

  if (pp) {
    return conn.sendMessage(
      m.chat,
      {
        image: { url: pp },
        caption: txt
      },
      { quoted: m }
    );
  }

  return m.reply(txt);
};

handler.command = ['ispeziona'];
handler.help = ['ispeziona <link|id@g.us>'];
handler.tags = ['owner'];
handler.owner = true;

export default handler
