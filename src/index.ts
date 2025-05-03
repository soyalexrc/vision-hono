import { Hono } from "hono";
import allies from "./routes/allies";
import externalAdvisers from "./routes/external-advisers";
import categories from "./routes/categories";
import auth from "./routes/auth";

const app = new Hono<{ Bindings: CloudflareBindings }>();

app.route('allies', allies)
app.route('externalAdvisers', externalAdvisers)
app.route('categories', categories)
app.route('auth', auth)

export default app;
