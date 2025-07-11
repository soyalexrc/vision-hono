import {Hono} from 'hono';
import jsonError from '../../utils/jsonError';
import {neon,} from "@neondatabase/serverless";
import {drizzle} from "drizzle-orm/neon-http";
import {
    ally,
    cashFlow,
    cashFlowCurrency,
    cashFlowPayment,
    cashFlowProperty, cashFlowSourceEntity, cashFlowTransactionType, cashFlowWayToPay,
    client, externalAdviser,
    externalPerson,
    user
} from "../../db/schema";
import {count, eq, inArray, sql as rawSql} from "drizzle-orm";
import {AllyDto} from "../../dto/ally.dto";
import {CashFlowPersonDto} from "../../dto/cashflow/person";
import {CashFlowPropertyDto} from "../../dto/cashflow/property";
import {CashFlowDto} from "../../dto/cashflow";
import {generateCashFlowClose, generateCashFlowCloseV2} from "../../services/cashflow";
import {getTotals, getUtilidadPorServicio} from "../../utils/cashflow/totals";
import {verifyJWT} from "../../utils/jwt";

export type Env = {
    NEON_DB: string;
};

const cashflowRoutes = new Hono<{ Bindings: Env }>();

// GET /allies
cashflowRoutes.get('/', async (c) => {
    try {
        const sql = neon(c.env.NEON_DB);
        const db = drizzle(sql);

        // Get query parameters
        const dateFrom = c.req.query('dateFrom');
        const dateTo = c.req.query('dateTo');

        // Build the complete SQL query as a string
        let query = `
            SELECT cf.*,
                   COALESCE(
                           JSON_AGG(
                                   JSON_BUILD_OBJECT(
                                           'id', cfp.id,
                                           'cashflow', cfp.cashflow,
                                           'canon', cfp.canon,
                                           'contract', cfp.contract,
                                           'guarantee', cfp.guarantee,
                                           'serviceType', cfp."serviceType",
                                           'reason', cfp.reason,
                                           'service', cfp.service,
                                           'taxPayer', cfp."taxPayer",
                                           'amount', cfp.amount,
                                           'currency', cfp.currency,
                                           'wayToPay', cfp."wayToPay",
                                           'transactionType', cfp."transactionType",
                                           'totalDue', cfp."totalDue",
                                           'incomeByThird', cfp."incomeByThird",
                                           'entity', cfp.entity,
                                           'pendingToCollect', cfp."pendingToCollect",
                                           'observation', cfp.observation,
                                           'currencyData', CASE
                                                               WHEN cfp.currency IS NOT NULL THEN
                                                                   JSON_BUILD_OBJECT(
                                                                           'id', curr.id,
                                                                           'name', curr.name,
                                                                           'code', curr.code
                                                                   )
                                                               ELSE NULL
                                               END,
                                           'entityData', CASE
                                                             WHEN cfp.entity IS NOT NULL THEN
                                                                 JSON_BUILD_OBJECT(
                                                                         'id', ent.id,
                                                                         'name', ent.name
                                                                 )
                                                             ELSE NULL
                                               END,
                                           'wayToPayData', CASE
                                                               WHEN cfp."wayToPay" IS NOT NULL THEN
                                                                   JSON_BUILD_OBJECT(
                                                                           'id', wtp.id,
                                                                           'name', wtp.name
                                                                   )
                                                               ELSE NULL
                                               END,
                                           'transactionTypeData', CASE
                                                                      WHEN cfp."transactionType" IS NOT NULL THEN
                                                                          JSON_BUILD_OBJECT(
                                                                                  'id', tt.id,
                                                                                  'name', tt.name
                                                                          )
                                                                      ELSE NULL
                                               END
                                   )
                           ) FILTER(WHERE cfp.id IS NOT NULL),
                           '[]' ::json
                   )                                                           as payments,
                   (SELECT COALESCE(JSON_AGG(currency_total), '[]'::json)
                    FROM (SELECT JSON_BUILD_OBJECT(
                                         'currency', cfp2.currency,
                                         'currency_code', curr2.code,
                                         'total_income', SUM(CASE WHEN cfp2."transactionType" = 1 THEN cfp2.amount ELSE 0 END),
                                         'total_outcome', SUM(CASE WHEN cfp2."transactionType" = 3 THEN cfp2.amount ELSE 0 END),
                                         'total_pending_to_collect', SUM(cfp2."pendingToCollect"),
                                         'total_due', SUM(cfp2."totalDue")
                                 ) as currency_total
                          FROM "CashFlowPayment" cfp2
                                   LEFT JOIN "CashFlowCurrency" curr2 ON cfp2.currency = curr2.id
                          WHERE cfp2.cashflow = cf.id
                          GROUP BY cfp2.currency, curr2.code) currency_totals) as total_amount,
                   CASE
                       WHEN cf.property IS NOT NULL THEN
                           JSON_BUILD_OBJECT(
                                   'id', prop.id,
                                   'name', prop.name,
                                   'location', prop.location
                           )
                       ELSE NULL
                       END                                                     as propertyData,
                   CASE
                       WHEN cf.client IS NOT NULL THEN
                           JSON_BUILD_OBJECT(
                                   'id', client.id,
                                   'name', client.name
                           )
                       ELSE NULL
                       END                                                     as clientData,
                   CASE
                       WHEN cf.person IS NOT NULL THEN
                           JSON_BUILD_OBJECT(
                                   'id', ep.id,
                                   'name', ep.name,
                                   'source', ep.source
                           )
                       ELSE NULL
                       END                                                     as personData
            FROM "CashFlow" cf
                     LEFT JOIN "CashFlowPayment" cfp ON cf.id = cfp.cashflow
                     LEFT JOIN "CashFlowProperty" prop ON cf.property = prop.id
                     LEFT JOIN "Client" client ON cf.client = client.id
                     LEFT JOIN "User" u ON cf.user = u.id
                     LEFT JOIN "ExternalPerson" ep ON cf.person = ep.id
                     LEFT JOIN "CashFlowCurrency" curr ON cfp.currency = curr.id
                     LEFT JOIN "CashFlowSourceEntity" ent ON cfp.entity = ent.id
                     LEFT JOIN "CashFlowTransactionType" tt ON cfp."transactionType" = tt.id
                     LEFT JOIN "CashFlowWayToPay" wtp ON cfp."wayToPay" = wtp.id
            WHERE 1 = 1
        `;

        // Add date conditions
        if (dateFrom && dateTo) {
            query += ` AND cf.date BETWEEN '${dateFrom}' AND '${dateTo}'`;
        } else if (dateFrom) {
            query += ` AND cf.date >= '${dateFrom}'`;
        } else if (dateTo) {
            query += ` AND cf.date <= '${dateTo}'`;
        }

        query += ` GROUP BY cf.id, prop.id, client.id, u.id, ep.id ORDER BY cf.date DESC`;

        // Execute with sql.raw instead of rawSql template
        const data = await db.execute(rawSql.raw(query));

        return c.json({
            data: data.rows,
            meta: {
                dateFrom,
                dateTo,
                count: data.rows.length
            }
        });
    } catch (error: any) {
        console.log(error);
        return jsonError(c, {
            status: 500,
            message: 'Failed to fetch cashflows',
            code: 'DATABASE_ERROR',
            details: error.message || 'An unexpected error occurred',
        });
    }
});

cashflowRoutes.get('/getById/:id', async (c) => {
    try {
        const id = c.req.param('id');
        if (!id) {
            return jsonError(c, {
                status: 400,
                message: 'ID is required',
                code: 'VALIDATION_ERROR',
            });
        }

        const sql = neon(c.env.NEON_DB);
        const db = drizzle(sql);
        const data = await db.select().from(cashFlow).where(eq(cashFlow.id, Number(id)));
        if (data.length === 0) {
            return jsonError(c, {
                status: 404,
                message: 'Cashflow not found',
                code: 'NOT_FOUND',
            });
        }
        const cashflow = data[0];
        const payments = await db.select().from(cashFlowPayment).where(eq(cashFlowPayment.cashflow, cashflow.id));

        return c.json({
            cashflow,
            payments
        })
    } catch (error: any) {
        console.log(error);
        return jsonError(c, {
            status: 500,
            message: 'Failed to fetch cashflow by ID',
            code: 'DATABASE_ERROR',
            details: error.message || 'An unexpected error occurred',
        });
    }
});

cashflowRoutes.get('/person', async (c) => {
    try {
        const sql = neon(c.env.NEON_DB);
        const db = drizzle(sql);
        const data = await db.select().from(externalPerson)
        return c.json({data});
    } catch (error: any) {
        console.log(error);
        return jsonError(c, {
            status: 500,
            message: 'Failed to fetch allies',
            code: 'DATABASE_ERROR',
        });
    }
});

cashflowRoutes.get('/property', async (c) => {
    try {
        const sql = neon(c.env.NEON_DB);
        const db = drizzle(sql);
        const data = await db.select().from(cashFlowProperty)
        return c.json({data});
    } catch (error: any) {
        console.log(error);
        return jsonError(c, {
            status: 500,
            message: 'Failed to fetch allies',
            code: 'DATABASE_ERROR',
        });
    }
});

cashflowRoutes.get('/cashClosing', async (c) => {
    try {
        const sql = neon(c.env.NEON_DB);
        const db = drizzle(sql);
        const [data, countResult] = await Promise.all([
            db.select().from(ally),
            db.select({count: count()}).from(ally)
        ]);

        const countRows = countResult[0]?.count || 0;

        return c.json({
            data,
            count: countRows
        });
    } catch (error: any) {
        console.log(error);
        return jsonError(c, {
            status: 500,
            message: 'Failed to fetch allies',
            code: 'DATABASE_ERROR',
        });
    }
});

cashflowRoutes.get('/temporalTransaction', async (c) => {
    try {
        const sql = neon(c.env.NEON_DB);
        const db = drizzle(sql);
        const [data, countResult] = await Promise.all([
            db.select().from(ally),
            db.select({count: count()}).from(ally)
        ]);

        const countRows = countResult[0]?.count || 0;

        return c.json({
            data,
            count: countRows
        });
    } catch (error: any) {
        console.log(error);
        return jsonError(c, {
            status: 500,
            message: 'Failed to fetch allies',
            code: 'DATABASE_ERROR',
        });
    }
});

cashflowRoutes.get('/cashClosing', async (c) => {
    try {
        const sql = neon(c.env.NEON_DB);
        const db = drizzle(sql);
        const [data, countResult] = await Promise.all([
            db.select().from(ally),
            db.select({count: count()}).from(ally)
        ]);

        const countRows = countResult[0]?.count || 0;

        return c.json({
            data,
            count: countRows
        });
    } catch (error: any) {
        console.log(error);
        return jsonError(c, {
            status: 500,
            message: 'Failed to fetch allies',
            code: 'DATABASE_ERROR',
        });
    }
});

cashflowRoutes.get('/total', async (c) => {
    try {
        const sql = neon(c.env.NEON_DB);
        const db = drizzle(sql);
        const [data, countResult] = await Promise.all([
            db.select().from(ally),
            db.select({count: count()}).from(ally)
        ]);

        const countRows = countResult[0]?.count || 0;

        return c.json({
            data,
            count: countRows
        });
    } catch (error: any) {
        console.log(error);
        return jsonError(c, {
            status: 500,
            message: 'Failed to fetch allies',
            code: 'DATABASE_ERROR',
        });
    }
});

cashflowRoutes.get('/totalAvailable', async (c) => {
    try {
        const sql = neon(c.env.NEON_DB);
        const db = drizzle(sql);
        const [data, countResult] = await Promise.all([
            db.select().from(ally),
            db.select({count: count()}).from(ally)
        ]);

        const countRows = countResult[0]?.count || 0;

        return c.json({
            data,
            count: countRows
        });
    } catch (error: any) {
        console.log(error);
        return jsonError(c, {
            status: 500,
            message: 'Failed to fetch allies',
            code: 'DATABASE_ERROR',
        });
    }
});

cashflowRoutes.get('/totalAvailableByEntity', async (c) => {
    try {
        const sql = neon(c.env.NEON_DB);
        const db = drizzle(sql);
        const [data, countResult] = await Promise.all([
            db.select().from(ally),
            db.select({count: count()}).from(ally)
        ]);

        const countRows = countResult[0]?.count || 0;

        return c.json({
            data,
            count: countRows
        });
    } catch (error: any) {
        console.log(error);
        return jsonError(c, {
            status: 500,
            message: 'Failed to fetch allies',
            code: 'DATABASE_ERROR',
        });
    }
});


// POST /allies
cashflowRoutes.post('/', async (c) => {
    try {
        const body = await c.req.json();
        console.log(body);
        const parsed = CashFlowDto.safeParse(body);

        if (!parsed.success) {
            return jsonError(c, {
                message: 'Validation failed',
                status: 400,
                code: 'VALIDATION_ERROR',
                details: parsed.error.errors,
            });
        }

        const {payments, ...rest} = parsed.data;

        const sql = neon(c.env.NEON_DB);
        const db = drizzle(sql);
        const [newCashFlow] = await db.insert(cashFlow).values({
            ...rest,
            client: null,
            owner: null,
            temporalTransactionId: null,
            createdBy: rest.createdBy,
        }).returning();

        console.log('newCashFlow', newCashFlow)

        if (payments && payments.length > 0 && newCashFlow) {
            const paymentData = payments.map(({id, ...payment}: any) => ({
                ...payment,
                cashflow: newCashFlow.id, // Assuming cashFlowId is the foreign key
            }));
            await db.insert(cashFlowPayment).values(paymentData);
        }

        return c.json({message: 'Informacion registrada correctamente'});
    } catch (error: any) {
        return jsonError(c, {
            status: 500,
            message: 'Failed to create cashflow',
            code: 'DATABASE_ERROR',
            details: error.message || 'An unexpected error occurred',
        });
    }
});

cashflowRoutes.post('/person', async (c) => {
    try {
        const body = await c.req.json();
        console.log(body);
        const parsed = CashFlowPersonDto.safeParse(body);

        if (!parsed.success) {
            return jsonError(c, {
                message: 'Validation failed',
                status: 400,
                code: 'VALIDATION_ERROR',
            });
        }

        const sql = neon(c.env.NEON_DB);
        const db = drizzle(sql);
        const newAlly = await db.insert(externalPerson).values(parsed.data).returning();
        return c.json({data: newAlly[0]});
    } catch (error: any) {
        return jsonError(c, {
            status: 500,
            message: 'Failed to create ally',
            code: 'DATABASE_ERROR',
        });
    }
});

cashflowRoutes.post('/property', async (c) => {
    try {
        const body = await c.req.json();
        console.log(body);
        const parsed = CashFlowPropertyDto.safeParse(body);

        if (!parsed.success) {
            return jsonError(c, {
                message: 'Validation failed',
                status: 400,
                code: 'VALIDATION_ERROR',
            });
        }


        const sql = neon(c.env.NEON_DB);
        const db = drizzle(sql);
        const newAlly = await db.insert(cashFlowProperty).values(parsed.data).returning();
        return c.json({data: newAlly[0]});
    } catch (error: any) {
        return jsonError(c, {
            status: 500,
            message: 'Failed to create ally',
            code: 'DATABASE_ERROR',
        });
    }
});

cashflowRoutes.post('/temporalTransaction', async (c) => {
    try {
        const body = await c.req.json();
        console.log(body);
        const parsed = AllyDto.safeParse(body);

        if (!parsed.success) {
            return jsonError(c, {
                message: 'Validation failed',
                status: 400,
                code: 'VALIDATION_ERROR',
            });
        }


        const sql = neon(c.env.NEON_DB);
        const db = drizzle(sql);
        const newAlly = await db.insert(ally).values(parsed.data).returning();
        return c.json({data: newAlly[0]});
    } catch (error: any) {
        return jsonError(c, {
            status: 500,
            message: 'Failed to create ally',
            code: 'DATABASE_ERROR',
        });
    }
});


cashflowRoutes.patch('/:id', async (c) => {
    try {
        const id = c.req.param('id');

        if (!id) {
            return jsonError(c, {
                status: 400,
                message: 'ID is required',
                code: 'VALIDATION_ERROR',
            });
        }

        const body = await c.req.json();
        const parsed = CashFlowDto.safeParse(body);

        if (!parsed.success) {
            return jsonError(c, {
                message: 'Validation failed',
                status: 400,
                code: 'VALIDATION_ERROR',
                details: parsed.error.errors,
            });
        }

        const {payments, ...rest} = parsed.data;

        const sql = neon(c.env.NEON_DB);
        const db = drizzle(sql);
        const updated = await db
            .update(cashFlow)
            .set({
                ...rest,
                client: null,
                owner: null,
                temporalTransactionId: null,
                updatedby: rest.updatedby
            })
            .where(eq(cashFlow.id, Number(id)))
            .returning();


        if (payments && payments.length > 0) {
            // Process all payments in parallel
            await Promise.all(payments.map(async (payment) => {
                if (payment.id && payment.id > 0) {
                    // Update existing payment
                    await db
                        .update(cashFlowPayment)
                        .set(payment)
                        .where(eq(cashFlowPayment.id, payment.id));
                } else {
                    // Create new payment
                    await db
                        .insert(cashFlowPayment)
                        .values({
                            ...payment,
                            cashflow: Number(id)
                        });
                }
            }));
        }

        return c.json({message: 'Informacion actualizada correctamente'});
    } catch (error: any) {
        return jsonError(c, {
            status: 500,
            message: 'Failed to update cashflow',
            code: 'DATABASE_ERROR',
            details: error.message || 'An unexpected error occurred',
        });
    }
});

// DELETE /allies/:id
cashflowRoutes.delete('/:id', async (c) => {
    try {
        const id = c.req.param('id');

        if (!id) {
            return jsonError(c, {
                status: 400,
                message: 'Ally ID is required',
                code: 'VALIDATION_ERROR',
            });
        }

        const sql = neon(c.env.NEON_DB);
        const db = drizzle(sql);

        const foundedAlly = await db.select().from(ally).where(eq(ally.id, Number(id)));

        if (foundedAlly.length < 1) {
            return jsonError(c, {
                status: 404,
                message: 'Ally not found',
                code: 'NOT_FOUND',
            });
        }

        const result = await db
            .update(ally)
            .set({status: 'deleted'})
            .where(eq(ally.id, Number(id)))
            .returning();

        return c.json({
            data: result[0],
            message: 'Ally marked as deleted successfully',
        });
    } catch (error: any) {
        console.error('Error deleting ally:', error);
        return jsonError(c, {
            status: 500,
            message: 'Failed to delete ally',
            code: 'DATABASE_ERROR',
        });
    }
});

// POST /allies/remove-many
cashflowRoutes.post('/remove-many', async (c) => {
    try {
        const body = await c.req.json();
        const ids = body.ids;

        if (!Array.isArray(ids) || ids.length === 0) {
            return jsonError(c, {
                status: 400,
                message: 'At least one ID must be provided',
                code: 'VALIDATION_ERROR',
            });
        }

        const sql = neon(c.env.NEON_DB);
        const db = drizzle(sql);

        const foundAllies = await db
            .select({id: ally.id})
            .from(ally)
            .where(inArray(ally.id, ids));

        const foundIds = foundAllies.map((a) => a.id);

        if (foundIds.length === 0) {
            return jsonError(c, {
                status: 404,
                message: 'No allies found to delete',
                code: 'NOT_FOUND',
            });
        }

        const result = await db
            .update(ally)
            .set({status: 'deleted'})
            .where(inArray(ally.id, foundIds))
            .returning();

        return c.json({
            data: result,
            updatedCount: result.length,
            notFoundIds: ids.filter((id) => !foundIds.includes(id)),
            message: 'Allies marked as deleted successfully',
        });
    } catch (error: any) {
        console.error('Error removing allies:', error);
        return jsonError(c, {
            status: 500,
            message: 'Failed to delete allies',
            code: 'DATABASE_ERROR',
        });
    }
});

// PATCH /allies/restore/:id
cashflowRoutes.post('/restore', async (c) => {
    try {
        const body = await c.req.json();
        const id = body.id;

        if (!id) {
            return jsonError(c, {
                status: 400,
                message: 'Ally ID is required',
                code: 'VALIDATION_ERROR',
            });
        }

        const sql = neon(c.env.NEON_DB);
        const db = drizzle(sql);

        const foundedAlly = await db.select().from(ally).where(eq(ally.id, Number(id)));

        if (foundedAlly.length < 1) {
            return jsonError(c, {
                status: 404,
                message: 'Ally not found',
                code: 'NOT_FOUND',
            });
        }

        const result = await db
            .update(ally)
            .set({status: 'active'})
            .where(eq(ally.id, Number(id)))
            .returning();

        if (result.length < 1) {
            return jsonError(c, {
                status: 404,
                message: 'Failed to restore ally',
                code: 'NOT_FOUND',
            });
        }

        return c.json({
            data: result[0],
            message: 'Ally restored successfully',
        });
    } catch (error: any) {
        console.error('Error restoring ally:', error);
        return jsonError(c, {
            status: 500,
            message: 'Failed to restore ally',
            code: 'DATABASE_ERROR',
        });
    }
});

// Hono route handler
cashflowRoutes.post('/generate-cash-flow-close', async (c) => {

    try {
        const body = await c.req.json();
        let date: any = null;
        if (body.date) {
            date = body.date;
        }
        const sql = neon(c.env.NEON_DB);
        const db = drizzle(sql);
        const result = await generateCashFlowCloseV2(db, c.env, date);
        return c.json(result);
    } catch (error: any) {
        console.error('Error generating cash flow close:', error);
        return jsonError(c, {
            status: 500,
            message: 'Failed to generate cash flow close',
            code: 'DATABASE_ERROR',
            details: error instanceof Error ? error.message : 'An unexpected error occurred',
        });
    }


});

cashflowRoutes.get('/cashflow-close', async (c) => {
    try {
        const sql = neon(c.env.NEON_DB);
        const db = drizzle(sql);        
        const result = await generateCashFlowCloseV2(db, c.env, null, false);
        return c.json(result);
    } catch (error: any) {
        console.error('Error generating cash flow close:', error);
        return jsonError(c, {
            status: 500,
            message: 'Failed to generate cash flow close',
            code: 'DATABASE_ERROR',
            details: error instanceof Error ? error.message : 'An unexpected error occurred',
        });
    }
});

cashflowRoutes.get('/totals', async (c) => {
    try {
        // Parse and validate body
        const query = c.req.query();
        const dateFrom = query.dateFrom;
        const dateTo = query.dateTo;

        if (!dateFrom || !dateTo) {
            return jsonError(c, {
                status: 400,
                message: 'Both dateFrom and dateTo are required',
                code: 'VALIDATION_ERROR',
            })
        }

        const authHeader = c.req.header('Authorization');
        // decode the token with jose
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return jsonError(c, {
                status: 401,
                message: 'Unauthorized',
                code: 'UNAUTHORIZED',
            });
        }

        const token = authHeader.split(' ')[1];
        const decodedToken = await verifyJWT(token);

        // Get database connection
        const connectionString = c.env.NEON_DB;
        const sql = neon(connectionString);
        const db = drizzle(sql);

        let result = {};

        // Call getTotals function
        const data = await getTotals(db, {dateFrom, dateTo});

        if (decodedToken.id !== 13) {
            result = {
                ...data,
                analisis: {
                    ...data.analisis,
                    disponibilidadPorEntidad: Object.fromEntries(
                        Object.entries(data.analisis.disponibilidadPorEntidad || {})
                            .filter(([key]) => !['Tesorería', 'Banesco Panamá', 'Oficina San Carlos', 'Ingreso a Cuenta de Terceros'].includes(key))
                    )
                }
            }
        } else {
            result = data;
        }

        return c.json(result, 200);

    } catch (error) {
        console.error('Route error:', error);
        return jsonError(c, {
            status: 500,
            message: 'Failed to fetch totals',
            code: 'DATABASE_ERROR',
            details: error instanceof Error ? error.message : 'An unexpected error occurred',
        })
    }
});

// Ruta específica para utilidad por servicio
cashflowRoutes.post('/utilidad-por-servicio', async (c) => {
    try {
        const connectionString = c.env.NEON_DB;
        const sql = neon(connectionString);
        const db = drizzle(sql);

        const body = await c.req.json();
        const {dateFrom, dateTo} = body;

        if (!dateFrom || !dateTo) {
            return c.json({
                message: 'Both dateFrom and dateTo are required',
                error: true,
            }, 400);
        }

        const utilidadPorServicio = await getUtilidadPorServicio(db, dateFrom, dateTo);

        return c.json({utilidadPorServicio}, 200);

    } catch (error) {
        console.error('Route error:', error);
        return c.json({
            message: error instanceof Error ? error.message : 'Error calculando utilidad por servicio',
            error: true,
        }, 500);
    }
});

// Debug route to check data structure
cashflowRoutes.get('/debug-services', async (c) => {
    try {
        const connectionString = c.env.NEON_DB;
        const sql = neon(connectionString);
        const db = drizzle(sql);

        // Check unique service strings in payments
        const servicesFromPayments = await db.execute(rawSql.raw(`
            SELECT DISTINCT cfp.service,
                            COUNT(*) as count
            FROM "CashFlowPayment" cfp
            GROUP BY cfp.service
            ORDER BY count DESC
        `));

        // Check if there are payments with services
        const paymentsWithServices = await db
            .select({
                paymentId: cashFlowPayment.id,
                service: cashFlowPayment.service,
                amount: cashFlowPayment.amount,
            })
            .from(cashFlowPayment)
            .where(rawSql`${cashFlowPayment.service} IS NOT NULL AND ${cashFlowPayment.service} != ''`)
            .limit(10);

        // Check transaction types
        const transactionTypes = await db.select().from(cashFlowTransactionType);

        // Check currencies
        const currencies = await db.select().from(cashFlowCurrency);

        return c.json({
            servicesFromPayments,
            paymentsWithServices,
            transactionTypes,
            currencies,
            totalPaymentsWithServices: paymentsWithServices.length,
        });

    } catch (error) {
        console.error('Debug route error:', error);
        return c.json({
            message: error instanceof Error ? error.message : 'Error en debug',
            error: true,
        }, 500);
    }
});

export default cashflowRoutes;
