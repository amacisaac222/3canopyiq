import type { Config } from 'drizzle-kit'

export default {
  schema: './src/schema.ts',
  out: './migrations',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL || 'postgresql://canopyiq:canopyiq@localhost:5432/canopyiq',
  },
  verbose: true,
  strict: true,
} satisfies Config