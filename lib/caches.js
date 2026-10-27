import NodeCache from 'node-cache'

export const lidCache = new NodeCache({ stdTTL: 86400, useClones: false })
export const msgRetryCounterCache = new NodeCache({ stdTTL: 600, useClones: false })
export const messageStore = new NodeCache({ stdTTL: 3600, useClones: false, maxKeys: 5000 })

export function rememberMessage(msg) {
  if (!msg?.key?.remoteJid || !msg?.key?.id || !msg.message) return
  messageStore.set(`${msg.key.remoteJid}:${msg.key.id}`, msg.message)
}

export async function getMessage(key) {
  if (!key?.remoteJid || !key?.id) return undefined
  return messageStore.get(`${key.remoteJid}:${key.id}`)
}
