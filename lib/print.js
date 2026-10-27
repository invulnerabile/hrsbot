import chalk from 'chalk';

function messageType(raw) {
  const key = Object.keys(raw.message || {})[0] || '';
  return key.replace(/Message$/, '') || 'testo';
}

function role(m, isOwner) {
  if (isOwner) return chalk.magentaBright('OWNER');
  if (m.groupAdmins?.includes(m.sender)) return chalk.yellowBright('ADMIN');
  return chalk.gray('USER');
}

export function printMessage(m, chatName, isOwner) {
  const who = m.sender.split('@')[0];
  const where = m.isGroup ? chatName || m.chat.split('@')[0] : 'privato';
  const type = messageType(m.raw);
  const preview = m.text?.length > 60 ? m.text.slice(0, 60) + '…' : m.text;

  const lines = [
    chalk.red('┌─ HRSBOT'),
    `${chalk.red('│')} ${chalk.green('chi')} ${who} ${role(m, isOwner)}`,
    `${chalk.red('│')} ${chalk.green('dove')} ${where}${m.isGroup ? chalk.gray(' (gruppo)') : chalk.gray(' (privato)')}`,
    `${chalk.red('│')} ${chalk.green('tipo')} ${type}`,
    `${chalk.red('│')} ${chalk.green('msg')} ${preview || chalk.gray('(media)')}`,
  ];

  if (m.quoted) {
    lines.push(`${chalk.red('│')} ${chalk.green('risposta a')} ${m.quoted.text?.slice(0, 40) || m.quoted.mtype}`);
  }

  lines.push(chalk.red('└─────────'));
  console.log(lines.join('\n'));
}
