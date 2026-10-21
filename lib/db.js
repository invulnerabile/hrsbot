import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';

const adapter = new JSONFile('./database.json');
const db = new Low(adapter, { users: {}, chats: {}, settings: {} });

await db.read();
db.data ||= { users: {}, chats: {}, settings: {} };

global.db = db;

export function userDB(jid) {
  db.data.users[jid] ||= { warn: 0, banned: false };
  return db.data.users[jid];
}

export function chatDB(jid) {
  db.data.chats[jid] ||= { welcome: true };
  return db.data.chats[jid];
}

setInterval(() => {
  db.write().catch((err) => console.error('[db] errore scrittura:', err));
}, 30000);
