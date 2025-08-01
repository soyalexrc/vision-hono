import { Hono } from "hono";
import allies from "./routes/allies";
import externalAdvisers from "./routes/external-advisers";
import categories from "./routes/categories";
import cashflow from "./routes/cashflow";
import entities from "./routes/cashflow/entities";
import transactionTypes from "./routes/cashflow/transaction-types";
import waysToPay from "./routes/cashflow/ways-to-pay";
import externalRoutes from "./routes/external";
import currencies from "./routes/cashflow/currencies";
import auth from "./routes/auth";
import clients from "./routes/client";
import config from "./routes/app-config";
import owners from "./routes/owner";
import utilities from "./routes/properties/utilities";
import attributes from "./routes/properties/attributes";
import equipments from "./routes/properties/equipments";
import adjacencies from "./routes/properties/adjacencies";
import distributions from "./routes/properties/distributions";
import properties from "./routes/properties";
import contactForms from "./routes/contact";
import r2 from "./routes/r2";
import workWithUsForms from "./routes/work-with-us";
import services from "./routes/service";
import users from "./routes/users";
import scrum from "./routes/scrum";
import jsonError from "./utils/jsonError";
import { authMiddleware } from "./middleware/auth";
import { cors } from 'hono/cors'
import {debugMiddleware} from "./middleware/debug";
import {neon} from "@neondatabase/serverless";
import {generateCashFlowClose, generateCashFlowCloseV2} from "./services/cashflow";
import {drizzle} from "drizzle-orm/neon-http";

const app = new Hono<{ Bindings: CloudflareBindings }>();

// 1. CORS MUST come first - before any other middleware
app.use('*', cors({
    origin: ['http://localhost:8083', 'http://localhost:3000', 'https://visioninmobiliaria.com.ve', 'https://admin.visioninmobiliaria.com.ve'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
    credentials: true,
    exposeHeaders: ['Authorization'], // Add this if you need to expose auth headers
}))

// 2. Add preflight handling explicitly (sometimes needed)
// app.options('*', (c) => c.text('', 204))

// 3. Public routes (these should come BEFORE protected routes)
app.get('/', (c) => c.text('API is running'))
app.get('/health', (c) => c.json({ status: 'ok' }))


const protectedRoutes = [
    'owner',
    'client',
    'ally',
    'cashflow',
    'scrum',
    'config',
    'external-adviser',
    'user',
];

// Apply auth middleware to protected routes with proper patterns
for (const route of protectedRoutes) {
    // This applies to all HTTP methods and sub-routes under each route
    app.use(`/${route}/*`, authMiddleware)
    app.use(`/${route}`, authMiddleware) // Also protect the base route
}

app.use('*', debugMiddleware);

app.route('ally', allies);
app.route('config', config);
app.route('external-adviser', externalAdvisers);
app.route('category', categories);
app.route('auth', auth);
app.route('client', clients);
app.route('owner', owners);
app.route('utility', utilities);
app.route('adjacency', adjacencies);
app.route('attribute', attributes);
app.route('equipment', equipments);
app.route('distribution', distributions);
app.route('property', properties);
app.route('service', services);
app.route('cashflow', cashflow);
app.route('entities', entities);
app.route('transaction-types', transactionTypes);
app.route('ways-to-pay', waysToPay);
app.route('currencies', currencies);
app.route('contactForm', contactForms);
app.route('workWithUsForm', workWithUsForms);
app.route('external', externalRoutes);
app.route('r2', r2)
app.route('user', users);
app.route('scrum', scrum);

app.onError((err, c) => {
    console.error('Unhandled Error:', err);

    if (err.name === 'ZodError') {
        return jsonError(c, {
            message: 'Validation failed',
            status: 400,
            code: 'VALIDATION_ERROR',
            details: (err as any).errors,
        });
    }

    return jsonError(c, {
        message: 'Internal server error',
        status: 500,
        code: 'INTERNAL_ERROR',
    });
});

// Mount under /api/v1
const main = new Hono<{ Bindings: CloudflareBindings }>();
main.route('/api/v1', app);



export default {
    fetch: main.fetch,
    async scheduled(controller: ScheduledController, env: any, ctx: ExecutionContext) {
        const connectionString = env.NEON_DB;

        if (!connectionString) {
            console.error('NEON_DB connection string is not set in environment variables.');
            return;
        }

        const sql = neon(connectionString);
        const db = drizzle(sql);
        switch (controller.cron) {
            // case '0 23 * * 1-5':
            //     await generateCashFlowClose(db, env);
            // break;
            case '45 16 * * 1-5':
                await generateCashFlowCloseV2(db, env);
                break
            default :
                console.warn(`No scheduled task for cron: ${controller.cron}`);
                break;
        }
    },
};
