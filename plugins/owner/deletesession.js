import { existsSync, promises as fsPromises } from 'fs';
import path from 'path';

const handler = async (m, { conn }) => {
  const folder = './session/';
  if (!existsSync(folder)) return m.reply(`𝐂𝐚𝐫𝐭𝐞𝐥𝐥𝐚 ${folder} 𝐧𝐨𝐧 𝐭𝐫𝐨𝐯𝐚𝐭𝐚.`);

  const files = await fsPromises.readdir(folder);
  let deleted = 0;
  for (const file of files) {
    if (file === 'creds.json') continue;
    await fsPromises.unlink(path.join(folder, file));
    deleted++;
  }
  await m.reply(`𝐇𝐨 𝐞𝐥𝐢𝐦𝐢𝐧𝐚𝐭𝐨 ${deleted} 𝐟𝐢𝐥𝐞.`);
};

handler.help = ['ds'];
handler.tags = ['admin'];
handler.command = ['ds', 'deletesession'];
handler.owner = true;

export default handler;
