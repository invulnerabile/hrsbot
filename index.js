import './banner.js'
import { setupMaster, fork } from 'cluster'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const BASE_DELAY_MS = 3000
const MAX_DELAY_MS = 60000
const STABLE_RUNTIME_MS = 60000

let restartAttempts = 0

setupMaster({ exec: join(__dirname, 'hrs.js') })

function start() {
  const startedAt = Date.now()
  const child = fork()

  child.on('exit', (_, code) => {
    console.log(`hrs.js terminato [${code}]`)

    if (code === 0) {
      restartAttempts = 0
      return
    }

    if (Date.now() - startedAt >= STABLE_RUNTIME_MS) {
      restartAttempts = 0
    }

    const delay = Math.min(
      BASE_DELAY_MS * 2 ** restartAttempts,
      MAX_DELAY_MS
    )

    restartAttempts = Math.min(restartAttempts + 1, 5)

    console.log(`Nuovo tentativo tra ${Math.ceil(delay / 1000)} secondi`)
    setTimeout(start, delay)
  })
}

start()
