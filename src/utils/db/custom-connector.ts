import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from '../../db/schema';

// Define types for Hyperdrive
interface HyperdriveQueryResult {
    results: any[];
    rowCount?: number;
    fields?: any[];
}

interface Hyperdrive {
    fetch(options: { text: string; args?: any[] }): Promise<HyperdriveQueryResult>;
}

/**
 * Custom PostgreSQL driver adapter for Cloudflare Hyperdrive
 * This mimics the postgres.js interface that Drizzle expects
 */
class HyperdriveAdapter {
    private hyperdrive: Hyperdrive;
    public options: any;
    public parsers: any;
    public readonly types: any;
    public endings: any;

    constructor(hyperdrive: Hyperdrive) {
        this.hyperdrive = hyperdrive;

        // Initialize required properties that postgres.js driver would have
        this.options = {};
        this.parsers = {
            // Basic parsers that postgres.js would provide
            bool: (val: any) => val === true || val === 't' || val === 'true' || val === 'TRUE',
            int8: (val: any) => Number(val),
            float8: (val: any) => Number(val),
            date: (val: any) => val instanceof Date ? val : new Date(val),
            timestamp: (val: any) => val instanceof Date ? val : new Date(val),
            numeric: (val: any) => Number(val),
            // Add more parsers as needed
        };

        // These are needed to mimic postgres.js interface
        this.types = {
            // Type information
            registerTypeParser: () => {},
            builtins: {},
        };

        this.endings = {};
    }

    // This is the main query method drizzle will use
    async query(query: string, params: any[] = []): Promise<any[]> {
        try {
            const { results } = await this.hyperdrive.fetch({
                text: query,
                args: params
            });
            return results;
        } catch (error) {
            console.error('Query error in HyperdriveAdapter:', error);
            throw error;
        }
    }

    // Mock the transaction method
    async begin(): Promise<{ queryObject: any, release: () => void }> {
        // Begin transaction - not fully supported, but we mock the interface
        await this.query('BEGIN', []);

        const release = async () => {
            await this.query('COMMIT', []);
        };

        const queryObject = async (query: string, params: any[] = []) => {
            return this.query(query, params);
        };

        return { queryObject, release };
    }

    // Mock end method
    async end(): Promise<void> {
        // Nothing to do for Hyperdrive
        return Promise.resolve();
    }
}

/**
 * Creates a Drizzle ORM instance that works with Cloudflare Hyperdrive
 */
export function createDb(hyperdrive: Hyperdrive) {
    // Create our adapter that mimics postgres.js
    const adapter = new HyperdriveAdapter(hyperdrive);

    // We need to trick drizzle into thinking this is a postgres.js instance
    // @ts-ignore - Intentionally passing our adapter as if it were postgres.js
    return drizzle(adapter, { schema });
}
