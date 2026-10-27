const personas = [
  { name: 'Gestione', participant: '19875501427931@bot' },
  { name: 'Sistema', participant: '19875502738462@bot' },
  { name: 'Assistente', participant: '19875503649573@bot' },
  { name: 'Centro Notifiche', participant: '19875504950684@bot' },
]

function randomPersona() {
  return personas[Math.floor(Math.random() * personas.length)]
}

export function fakeQuote(text, name) {
  const persona = name ? { name, participant: '19875500000000@bot' } : randomPersona()
  const canale = global.canale || { id: '120363418473920156@newsletter', nome: 'HrsBot' }

  return {
    key: {
      participant: persona.participant,
      fromMe: false,
      id: 'FAKE' + Date.now(),
      remoteJid: 'status@broadcast',
    },
    message: {
      conversation: text,
      contextInfo: {
        forwardingScore: 1,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: canale.id,
          newsletterName: canale.nome,
          serverMessageId: 1,
        },
      },
    },
    pushName: persona.name,
  }
}
