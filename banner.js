import cfonts from 'cfonts';
import os from 'os';

process.stdout.write('\x1B[3J\x1B[H\x1B[2J');

cfonts.say('HRSBOT', {
  font: 'block',
  colors: ['cyan', 'magenta'],
  align: 'center',
});

console.log(`RAM usata: ${((os.totalmem() - os.freemem()) / 1024 / 1024).toFixed(0)} MB / ${(os.totalmem() / 1024 / 1024).toFixed(0)} MB`);
console.log('-'.repeat(50));
