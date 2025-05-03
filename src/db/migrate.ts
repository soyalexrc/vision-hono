import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { migrate } from 'drizzle-orm/neon-http/migrator';
import { config } from 'dotenv';

config({
    path: '.dev.vars',
})

const sql = neon(process.env.NEON_DB!);

const db = drizzle(sql);

const main = async () => {
    try {
        await migrate(db, { migrationsFolder: './drizzle' });
        console.log('Migration completed successfully');
    } catch (error) {
        console.error('Error during migration:', error);
        process.exit(1);
    }
};

main();
