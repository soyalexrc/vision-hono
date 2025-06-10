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
    client,
    externalPerson,
    user
} from "../../db/schema";
import {count, eq, inArray, sql as rawSql} from "drizzle-orm";
import {AllyDto} from "../../dto/ally.dto";
import {CashFlowPersonDto} from "../../dto/cashflow/person";
import {CashFlowPropertyDto} from "../../dto/cashflow/property";
import {CashFlowDto} from "../../dto/cashflow";

export type Env = {
    NEON_DB: string;
};

const cashflowRoutes = new Hono<{ Bindings: Env }>();

// GET /allies
cashflowRoutes.get('/', async (c) => {
    try {
        const sql = neon(c.env.NEON_DB);
        const db = drizzle(sql);
        const data = await db.execute(rawSql`
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
                                       -- Currency data
                                           'currencyData', CASE
                                                               WHEN cfp.currency IS NOT NULL THEN
                                                                   JSON_BUILD_OBJECT(
                                                                           'id', curr.id,
                                                                           'name', curr.name,
                                                                           'code', curr.code
                                                                       -- Add other currency fields you need
                                                                   )
                                                               ELSE NULL
                                               END,
                                       -- Entity data
                                           'entityData', CASE
                                                             WHEN cfp.entity IS NOT NULL THEN
                                                                 JSON_BUILD_OBJECT(
                                                                         'id', ent.id,
                                                                         'name', ent.name
                                                                     -- Add other entity fields you need
                                                                 )
                                                             ELSE NULL
                                               END,
                                       -- Way to Pay data
                                           'wayToPayData', CASE
                                                             WHEN cfp."wayToPay" IS NOT NULL THEN
                                                                 JSON_BUILD_OBJECT(
                                                                         'id', wtp.id,
                                                                         'name', wtp.name
                                                                     -- Add other entity fields you need
                                                                 )
                                                             ELSE NULL
                                               END,
                                       -- Transaction Type data
                                           'transactionTypeData', CASE
                                                                      WHEN cfp."transactionType" IS NOT NULL THEN
                                                                          JSON_BUILD_OBJECT(
                                                                                  'id', tt.id,
                                                                                  'name', tt.name
                                                                              -- Add other transaction type fields you need
                                                                          )
                                                                      ELSE NULL
                                               END
                                   )
                           ) FILTER(WHERE cfp.id IS NOT NULL),
                           '[]'::json
                   ) as payments,
                   (
                       SELECT COALESCE(JSON_AGG(currency_total), '[]'::json)
                       FROM (
                                SELECT
                                    JSON_BUILD_OBJECT(
                                            'currency', cfp2.currency,
                                            'currency_code', curr2.code,
                                            'total_amount', SUM(cfp2.amount)
                                    ) as currency_total
                                FROM ${cashFlowPayment} cfp2
                                         LEFT JOIN ${cashFlowCurrency} curr2 ON cfp2.currency = curr2.id
                                WHERE cfp2.cashflow = cf.id
                                GROUP BY cfp2.currency, curr2.code
                            ) currency_totals
                   ) as total_amount,
                -- Property data
                   CASE
                       WHEN cf.property IS NOT NULL THEN
                           JSON_BUILD_OBJECT(
                                   'id', prop.id,
                                   'name', prop.name,
                                   'location', prop.location
                               -- Add other property fields you need
                           )
                       ELSE NULL
                       END as propertyData,
                   -- Client data
                   CASE
                       WHEN cf.client IS NOT NULL THEN
                           JSON_BUILD_OBJECT(
                                   'id', client.id,
                                   'name', client.name
                               -- Add other client fields you need
                           )
                       ELSE NULL
                       END as clientData,
                   -- External person data
                   CASE
                       WHEN cf.person IS NOT NULL THEN
                           JSON_BUILD_OBJECT(
                                   'id', ep.id,
                                   'name', ep.name,
                                   'source', ep.source
                               -- Add other external person fields you need
                           )
                       ELSE NULL
                       END as personData
            FROM ${cashFlow} cf
                     LEFT JOIN ${cashFlowPayment} cfp ON cf.id = cfp.cashflow
                     LEFT JOIN ${cashFlowProperty} prop ON cf.property = prop.id
                     LEFT JOIN ${client} client ON cf.client = client.id
                     LEFT JOIN ${user} u ON cf.user = u.id
                     LEFT JOIN ${externalPerson} ep ON cf.person = ep.id
                     LEFT JOIN ${cashFlowCurrency} curr ON cfp.currency = curr.id
                     LEFT JOIN ${cashFlowSourceEntity} ent ON cfp.entity = ent.id
                     LEFT JOIN ${cashFlowTransactionType} tt ON cfp."transactionType" = tt.id
                     LEFT JOIN ${cashFlowWayToPay} wtp ON cfp."wayToPay" = wtp.id
            GROUP BY cf.id, prop.id, client.id, u.id, ep.id
        `);

        return c.json({data: data.rows});
    } catch (error: any) {
        console.log(error);
        return jsonError(c, {
            status: 500,
            message: 'Failed to fetch allies',
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


// GET BY ID /allies/:id
cashflowRoutes.get('/:id', async (c) => {
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
        const data = await db.select().from(ally).where(eq(ally.id, Number(id)));
        return c.json({
            data: data[0],
        });
    } catch (error: any) {
        console.log(error);
        return jsonError(c, {
            status: 500,
            message: 'Failed to fetch ally',
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
            createdBy: rest.createdBy,
        }).returning();

        if (payments && payments.length > 0 && newCashFlow) {
            const paymentData = payments.map((payment: any) => ({
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


// PATCH /allies/:allieId
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
        const parsed = AllyDto.partial().safeParse(body); // PATCH = partial update

        if (!parsed.success) {
            return jsonError(c, {
                message: 'Validation failed',
                status: 400,
                code: 'VALIDATION_ERROR',
            });
        }
        const sql = neon(c.env.NEON_DB);
        const db = drizzle(sql);
        const updatedAlly = await db.update(ally).set(parsed.data).where(eq(ally.id, Number(id))).returning();
        return c.json({data: updatedAlly[0]});
    } catch (error: any) {
        return jsonError(c, {
            status: 500,
            message: 'Failed to update ally',
            code: 'DATABASE_ERROR',
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
export default cashflowRoutes;
