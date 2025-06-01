import { Hono } from "hono";
import allies from "./routes/allies";
import externalAdvisers from "./routes/external-advisers";
import categories from "./routes/categories";
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
import jsonError from "./utils/jsonError";
import { authMiddleware } from "./middleware/auth";
import { cors } from 'hono/cors'

const app = new Hono<{ Bindings: CloudflareBindings }>();

const protectedRoutes = [
    'owners',
    'clients',
    'ally',
    'config',
    'external-advisers',
    'users',
];

for (const route of protectedRoutes) {
    app.use(route, authMiddleware);
}

app.use('*', cors({
    origin: ['http://localhost:8083', 'https://admin.visioninmobiliaria.com.ve'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
}))

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
app.route('contactForm', contactForms);
app.route('workWithUsForm', workWithUsForms);
app.route('r2', r2)
app.route('user', users);

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

export default main;
