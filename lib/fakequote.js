export function fakeQuote(name, text) {
  return {
    key: {
      participant: '0@s.whatsapp.net',
      fromMe: false,
      id: 'FAKE' + Date.now(),
      remoteJid: 'status@broadcast',
    },
    message: {
      conversation: text,
    },
    pushName: name,
  };
}
