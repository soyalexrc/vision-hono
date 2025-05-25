import type { Config } from 'drizzle-kit';

export default {
    schema: './src/db/schema.ts',
    out: './drizzle/migrations',
    dialect: 'postgresql',
    dbCredentials: {
        // url: process.env.NEON_DB!
        url: 'postgresql://neondb_owner:npg_IaVWT9Mbv4NO@ep-hidden-art-a4ppmdze-pooler.us-east-1.aws.neon.tech/vision_main?sslmode=require'
    }
} satisfies Config;
