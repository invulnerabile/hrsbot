import './banner.js';
import { setupMaster, fork } from 'cluster';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function start() {
  setupMaster({ exec: join(__dirname, 'hrs.js') });
  const child = fork();

  child.on('exit', (_, code) => {
    console.log(`hrs.js terminato [${code}]`);
    if (code !== 0) setTimeout(start, 3000);
  });
}

start();
