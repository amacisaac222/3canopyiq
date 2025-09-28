import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config()

async function runMigrations() {
  console.log('🚀 Starting database migration...')

  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set')
  }

  const sql = postgres(connectionString, { max: 1 })
  const db = drizzle(sql)

  try {
    console.log('📦 Running migrations...')
    await migrate(db, { migrationsFolder: resolve(__dirname, './migrations') })
    console.log('✅ Migrations completed successfully!')
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  } finally {
    await sql.end()
  }
}

// Run migrations if this file is executed directly
if (require.main === module) {
  runMigrations().catch((err) => {
    console.error('Failed to run migrations:', err)
    process.exit(1)
  })
}

export { runMigrations }