import type { Config } from 'drizzle-kit';

export default {
    schema: './src/db/schema.ts',
    out: './drizzle',
    dialect: 'postgresql',
    dbCredentials: {
        connectionString: "postgresql://neondb_owner:npg_3CWoYLGxR1Jk@ep-shy-night-a4v8hz05-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require",
        host: 'ep-shy-night-a4v8hz05-pooler.us-east-1.aws.neon.tech',
        port: 5432,
        database: 'neondb',
        ssl: 'require',
        user: 'neondb_owner',
        password: 'npg_3CWoYLGxR1Jk'
    },
} satisfies Config;
