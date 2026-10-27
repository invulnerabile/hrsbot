function participantIds(participant) {
  return [participant?.id, participant?.phoneNumber, participant?.lid].filter(
    (id) => typeof id === 'string' && id.length > 0
  )
}

function phoneNumberFromJid(jid) {
  if (typeof jid !== 'string') return null
  const value = jid.trim()
  if (/^\d+$/.test(value)) return value
  const match = value.match(/^(\d+)(?::\d+)?@(s\.whatsapp\.net|c\.us)$/)
  return match?.[1] || null
}

export function sameJid(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false
  if (a === b) return true

  const phoneA = phoneNumberFromJid(a)
  const phoneB = phoneNumberFromJid(b)
  return Boolean(phoneA && phoneB && phoneA === phoneB)
}

export function findGroupParticipant(meta, jid) {
  if (!meta || typeof jid !== 'string') return null
  return meta.participants?.find((participant) =>
    participantIds(participant).some((id) => sameJid(id, jid))
  ) || null
}

export function sameGroupParticipant(meta, a, b) {
  if (sameJid(a, b)) return true
  const participantA = findGroupParticipant(meta, a)
  const participantB = findGroupParticipant(meta, b)
  return Boolean(participantA && participantB && participantA === participantB)
}
