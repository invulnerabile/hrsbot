import NodeCache from 'node-cache'

export const groupCache = new NodeCache({
  stdTTL: 300,
  checkperiod: 60,
  useClones: false,
  deleteOnExpire: true,
  maxKeys: 2000,
})

const pendingMetadata = new Map()
const generations = new Map()

function loadGroupMetadata(sock, jid, force = false) {
  if (!jid) return Promise.resolve(null)

  if (!force && pendingMetadata.has(jid)) {
    return pendingMetadata.get(jid)
  }

  const generation = generations.get(jid) ?? 0

  const request = Promise.resolve()
    .then(() => sock.groupMetadata(jid))
    .then((meta) => {
      if (meta && (generations.get(jid) ?? 0) === generation) {
        groupCache.set(jid, meta)
      }
      return meta ?? null
    })
    .catch(() => null)
    .finally(() => {
      if (pendingMetadata.get(jid) === request) {
        pendingMetadata.delete(jid)
      }
    })

  pendingMetadata.set(jid, request)
  return request
}

export async function fetchGroupMetadata(sock, jid) {
  if (!jid) return null

  const cached = groupCache.get(jid)
  if (cached) return cached

  return loadGroupMetadata(sock, jid)
}

function refreshGroupMetadata(sock, jid) {
  if (!jid) return

  generations.set(jid, (generations.get(jid) ?? 0) + 1)
  groupCache.del(jid)

  void loadGroupMetadata(sock, jid, true)
}

export function attachGroupCache(sock) {
  sock.ev.on('groups.update', (updates) => {
    for (const update of updates ?? []) {
      if (update?.id) refreshGroupMetadata(sock, update.id)
    }
  })

  sock.ev.on('group-participants.update', (event) => {
    if (event?.id) refreshGroupMetadata(sock, event.id)
  })
}
