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
import users from "./routes/users";

const app = new Hono<{ Bindings: CloudflareBindings }>();

app.route('allies', allies)
app.route('external-advisers', externalAdvisers)
app.route('categories', categories)
app.route('auth', auth)
app.route('clients', clients)
app.route('owners', owners)
app.route('utilities', utilities)
app.route('attributes', attributes)
app.route('equipments', equipments)
app.route('distributions', distributions)
app.route('properties', properties)
app.route('contactForms', contactForms)
app.route('workWithUsForms', workWithUsForms)
app.route('users', users)

export default app;
