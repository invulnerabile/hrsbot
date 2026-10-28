import { fetchGroupMetadata } from '../../lib/groupCache.js'

const handler = async (m, { conn }) => {
  try {
    const metadata = await fetchGroupMetadata(conn, m.chat)
    const inviteCode = await conn.groupInviteCode(m.chat)
    const inviteLink = 'https://chat.whatsapp.com/' + inviteCode

    const msg = {
      viewOnceMessage: {
        message: {
          interactiveMessage: {
            header: {
              title: '🔗𝐋𝐈𝐍𝐊 𝐆𝐑𝐔𝐏𝐏𝐎',
              hasMediaAttachment: false,
            },
            body: {
              text: `${metadata.subject}\n\n*Membri:* ${metadata.participants.length}\n\n*${inviteLink}*`,
            },
            nativeFlowMessage: {
              buttons: [
                {
                  name: 'cta_copy',
                  buttonParamsJson: JSON.stringify({
                    display_text: '📎 𝐂𝐨𝐩𝐢𝐚 𝐥𝐢𝐧𝐤',
                    id: inviteLink,
                    copy_code: inviteLink,
                  }),
                },
              ],
            },
          },
        },
      },
    }

    await conn.relayMessage(m.chat, msg, {})
  } catch (err) {
    console.error(err)
  }
}

handler.help = ['link']
handler.tags = ['info']
handler.command = ['link', 'invito']
handler.group = true
handler.botAdmin = true

export default handler
