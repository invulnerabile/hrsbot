# HRSBot

A JavaScript WhatsApp bot built on top of [`@itsliaaa/baileys`](https://www.npmjs.com/package/@itsliaaa/baileys).

> **Status: beta** — expect bugs, incomplete features, and breaking changes. This project is not intended to be treated as production-ready software.

## Contents

- [What it does](#what-it-does)
- [Requirements](#requirements)
- [Installation](#installation)
- [Configuration](#configuration)
- [Linking WhatsApp](#linking-whatsapp)
- [Running the bot](#running-the-bot)
- [Included plugins](#included-plugins)
- [Data and session storage](#data-and-session-storage)
- [Security notes](#security-notes)
- [Troubleshooting](#troubleshooting)
- [License](#license)

## What it does

HRSBot provides a plugin-based structure for WhatsApp automation. It currently includes a small set of administration, information, and owner utilities.

The project is in active development. Commands, plugin interfaces, and connection behavior may change between beta releases.

## Requirements

- Linux, macOS, or another environment supported by the project dependencies
- Node.js 20 or newer
- npm
- A WhatsApp account that you are allowed to link to the bot

Use a supported, up-to-date Node.js release. The underlying WhatsApp library is a third-party project; compatibility with WhatsApp Web is not guaranteed.

## Installation

Clone the repository and install its dependencies:

```sh
git clone https://github.com/vhorus/hrsbot.git
cd hrsbot
npm install
```

Create your local configuration from the example:

```sh
cp config.js.example config.js
```

The example file is a template. The bot imports `config.js` at startup, so this file must exist before running the bot.

## Configuration

Open `config.js` and edit the owner and command prefix settings.

Example:

```js
global.owner = [
  ['393xxxxxxxxx', 'owner', true]
];

global.prefix = ['.'];
```

Replace the sample number with the WhatsApp number to be treated as the bot owner. Use the international country code and digits only: do not include a leading `+`, spaces, or punctuation. Replace `owner` with the display name you want to use.

`global.prefix` is an array, so you can configure one or more command prefixes. The example uses `.`.

Keep your real `config.js` private. Only `config.js.example` is intended to be committed.

## Linking WhatsApp

On the first launch, if no saved session is found, HRSBot asks how you want to link the account:

- **QR code:** choose `1`, then scan the QR code from WhatsApp.
- **Pairing code:** choose `2`, enter the phone number with its country code and digits only, then follow the instructions printed in the terminal.

In WhatsApp, open **Settings → Linked devices → Link a device**. Complete the process using the QR code or pairing-code flow shown by the bot.

Treat QR codes and pairing codes as credentials: anyone who obtains them during the linking window may be able to link a device to your account.

## Running the bot

Start HRSBot from the project directory:

```sh
npm start
```

The launcher starts `hrs.js` and restarts the child process after an unexpected non-zero exit. Stop the bot with `Ctrl+C`.

## Included plugins

Plugins are loaded recursively from `plugins/`. A plugin can export a default handler, and the running process watches the plugin directory for JavaScript changes.

Current plugin files:

| Path | Purpose |
| --- | --- |
| `plugins/admin/delete.js` | Administration command |
| `plugins/admin/demote.js` | Administration command |
| `plugins/admin/hidetag.js` | Administration command |
| `plugins/admin/promote.js` | Administration command |
| `plugins/info/ping.js` | Information command |
| `plugins/owner/deletesession.js` | Owner utility |

Plugin behavior and permissions depend on each plugin's implementation. Review a plugin before enabling it, especially if it can change group settings, remove messages, or affect the login session.

## Data and session storage

HRSBot uses local files at runtime:

- `session/` stores WhatsApp authentication data.
- `database.json` stores bot data managed through `lowdb`.
- `temp/` and `tmp/` are reserved for temporary files when used.

These files are local runtime state, not source files. Back them up securely if needed, but never commit or share the WhatsApp session. The repository's `.gitignore` excludes the private configuration, session, database, dependencies, and temporary directories.

## Security notes

- Never publish `config.js`, `session/`, pairing codes, QR codes, or authentication credentials.
- Do not run the bot using a WhatsApp account you do not own or have permission to use.
- Review third-party code and plugins before running them.
- Keep Node.js and npm dependencies updated, and inspect dependency changes before upgrading.
- This project uses an unofficial third-party WhatsApp library. Changes to WhatsApp may cause disconnections or break functionality.

## Troubleshooting

**The bot asks me to link WhatsApp again.**
Check whether `session/` exists and whether the account is still linked under WhatsApp's Linked devices settings. Do not delete the session unless you intend to link the account again.

**A plugin does not load.**
Check the terminal output for an import error and confirm that the plugin exports its handler as the default export.

**The connection fails or repeatedly reconnects.**
Confirm that the server has internet access and that your installed Node.js version is supported by the dependencies. WhatsApp Web compatibility can change independently of this project.

## License

No reuse license has been granted at this stage. Until a license is added to the repository, do not assume that public access grants permission to copy, modify, redistribute, or use this code.