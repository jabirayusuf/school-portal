import app from './app'
import { config } from './config'
import prisma from './prisma'

async function start(): Promise<void> {
  try {
    await prisma.$connect()
    app.listen(config.port, () => {
      console.log(`BATMS server running on http://localhost:${config.port}`)
    })
  } catch (err) {
    console.error('Failed to start server:', err)
    process.exit(1)
  }
}

void start()
