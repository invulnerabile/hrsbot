import { lidCache } from './caches.js'

export async function resolveSender(sock, meta, msg) {
  const botNumber = sock.user.id.split(':')[0].split('@')[0]
  const isBotAdmin = meta.participants.some((p) => {
    const ids = [p.id, p.phoneNumber, p.lid].filter(Boolean).map((v) => v.split('@')[0].split(':')[0])
    return ids.includes(botNumber) && p.admin
  })

  const participant = msg.key.participant || msg.key.remoteJid
  const participantAlt = msg.key.participantAlt

  const participantEntry = meta.participants.find((p) =>
    [p.id, p.phoneNumber, p.lid].includes(participant) ||
    (participantAlt && [p.id, p.phoneNumber, p.lid].includes(participantAlt))
  )

  if (participantEntry?.lid && participantEntry?.phoneNumber) {
    lidCache.set(participantEntry.lid, participantEntry.phoneNumber)
  }

  const senderIds = [participant, participantAlt, participantEntry?.id, participantEntry?.lid, participantEntry?.phoneNumber].filter(Boolean)
  const ownerNumber = global.owner?.[0]?.[0]
  const isOwner = Boolean(ownerNumber && senderIds.some((id) => id.split('@')[0].split(':')[0] === ownerNumber))

  return {
    isBotAdmin,
    isSenderAdmin: Boolean(participantEntry?.admin),
    isOwner,
    sender: participantEntry?.id || participant,
  }
}
