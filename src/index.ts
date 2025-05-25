import { Hono } from "hono";
import allies from "./routes/allies";
import externalAdvisers from "./routes/external-advisers";
import categories from "./routes/categories";
import auth from "./routes/auth";
import clients from "./routes/client";
import owners from "./routes/owner";
import utilities from "./routes/porperties/utilities";
import attributes from "./routes/porperties/attributes";
import equipments from "./routes/porperties/equipments";
import distributions from "./routes/porperties/distributions";
import properties from "./routes/porperties";
import contactForms from "./routes/contact";
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
    // 'ally',
    'external-advisers',
    'users',
];

for (const route of protectedRoutes) {
    app.use(route, authMiddleware);
}

app.use('*', cors({
    origin: '*', // or specify allowed origins like: 'https://your-frontend.com'
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowHeaders: ['Content-Type', 'Authorization'],
}))

app.route('ally', allies);
app.route('external-adviser', externalAdvisers);
app.route('category', categories);
app.route('auth', auth);
app.route('client', clients);
app.route('owner', owners);
app.route('utility', utilities);
app.route('attribute', attributes);
app.route('equipment', equipments);
app.route('distribution', distributions);
app.route('property', properties);
app.route('service', services);
app.route('contactForm', contactForms);
app.route('workWithUsForm', workWithUsForms);
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
