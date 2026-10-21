export function printMessage(m, chatName) {
  const who = m.sender.split('@')[0];
  const where = m.isGroup ? chatName || m.chat.split('@')[0] : 'privato';
  const preview = m.text?.length > 60 ? m.text.slice(0, 60) + '…' : m.text;
  console.log(`[${where}] ${who}: ${preview || '(media)'}`);
}
