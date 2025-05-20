import type { Config } from 'drizzle-kit';

export default {
    schema: './src/db/schema.ts',
    out: './drizzle/migrations',
    dialect: 'postgresql',
    dbCredentials: {
        url: 'postgresql://neondb_owner:npg_3CWoYLGxR1Jk@ep-shy-night-a4v8hz05-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require'
    }
} satisfies Config;
