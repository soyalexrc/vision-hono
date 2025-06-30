import { eq, between, and } from 'drizzle-orm';
import { closeCashFlow, cashFlow, cashFlowSourceEntity } from '../../db/schema';
import {
    calculateSumByTransactionTypeAndCurrency,
    getEntityId,
    getTransactionTypeId
} from "../../utils/cashflow/close-cashflow";
import {getTotals} from "../../utils/cashflow/totals";


// Cache for transaction type and entity IDs to avoid repeated queries
let transactionTypeCache: Record<string, number> = {};
let entityCache: Record<string, number> = {};

export async function getOrCacheTransactionTypeId(db: any, typeName: string): Promise<number> {
    if (!transactionTypeCache[typeName]) {
        const id = await getTransactionTypeId(db, typeName);
        if (id === null) {
            throw new Error(`Transaction type '${typeName}' not found`);
        }
        transactionTypeCache[typeName] = id;
    }
    return transactionTypeCache[typeName];
}

export async function getOrCacheEntityId(db: any, entityName: string): Promise<number> {
    if (!entityCache[entityName]) {
        const id = await getEntityId(db, entityName);
        if (id === null) {
            throw new Error(`Entity '${entityName}' not found`);
        }
        entityCache[entityName] = id;
    }
    return entityCache[entityName];
}

export async function generateCashFlowClose(db: any, env: any, date?: any) {
    const day = date ? new Date(date) : new Date();
    const startDate = new Date(day);
    const endDate = new Date(day);

    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(19, 0, 0, 0);

    const startDateTimeString = startDate.toISOString();
    const endDateTimeString = endDate.toISOString();

    console.log({
        startDateTimeString,
        endDateTimeString,
    });

    try {
        // Get transaction type IDs
        const ingresoTypeId = await getOrCacheTransactionTypeId(db, 'Ingreso');
        console.log('ingresoTypeId', ingresoTypeId);
        const egresoTypeId = await getOrCacheTransactionTypeId(db, 'Egreso');
        console.log('egresoTypeId', egresoTypeId);
        const ingresoCuentaTercerosTypeId = await getOrCacheTransactionTypeId(db, 'Ingreso a cuenta de terceros');
        console.log('ingresoCuentaTercerosTypeId', ingresoCuentaTercerosTypeId);
        const cuentaPorCobrarTypeId = await getOrCacheTransactionTypeId(db, 'Cuenta por cobrar');
        console.log('cuentaPorCobrarTypeId', cuentaPorCobrarTypeId);
        const cuentaPorPagarTypeId = await getOrCacheTransactionTypeId(db, 'Cuenta por pagar');
        console.log('cuentaPorPagarTypeId', cuentaPorPagarTypeId);

        const data = [];

        for (let i = 0; i < 2; i++) {
            const dateFrom = i === 0 ? startDateTimeString : undefined;
            const dateTo = i === 0 ? endDateTimeString : undefined;

            const ingreso = await calculateSumByTransactionTypeAndCurrency(
                db, ingresoTypeId, 'amount', true, dateFrom, dateTo
            );
            const egreso = await calculateSumByTransactionTypeAndCurrency(
                db, egresoTypeId, 'amount', true, dateFrom, dateTo
            );

            const total = {
                bs: parseFloat(ingreso.bs.toString()) - parseFloat(egreso.bs.toString()),
                usd: parseFloat(ingreso.usd.toString()) - parseFloat(egreso.usd.toString()),
                eur: parseFloat(ingreso.eur.toString()) - parseFloat(egreso.eur.toString()),
            };

            const ingresoCuentaTerceros = await calculateSumByTransactionTypeAndCurrency(
                db, ingresoCuentaTercerosTypeId, 'amount', true, dateFrom, dateTo
            );

            const cuentasPorCobrarIngreso = await calculateSumByTransactionTypeAndCurrency(
                db, ingresoTypeId, 'pendingToCollect', false, dateFrom, dateTo
            );
            const cuentasPorCobrarPending = await calculateSumByTransactionTypeAndCurrency(
                db, cuentaPorCobrarTypeId, 'pendingToCollect', false, dateFrom, dateTo
            );
            const cuentasPorCobrarTotal = {
                bs: (cuentasPorCobrarIngreso.bs as number) + (cuentasPorCobrarPending.bs as number),
                usd: (cuentasPorCobrarIngreso.usd as number) + (cuentasPorCobrarPending.usd as number),
                eur: (cuentasPorCobrarIngreso.eur as number) + (cuentasPorCobrarPending.eur as number),
            };

            const cuentasPorPagarIngreso = await calculateSumByTransactionTypeAndCurrency(
                db, ingresoTypeId, 'totalDue', false, dateFrom, dateTo
            );
            const cuentasPorPagarPending = await calculateSumByTransactionTypeAndCurrency(
                db, cuentaPorPagarTypeId, 'totalDue', false, dateFrom, dateTo
            );
            const cuentasPorPagarTotal = {
                bs: (cuentasPorPagarIngreso.bs as number) + (cuentasPorPagarPending.bs as number),
                usd: (cuentasPorPagarIngreso.usd as number) + (cuentasPorPagarPending.usd as number),
                eur: (cuentasPorPagarIngreso.eur as number) + (cuentasPorPagarPending.eur as number),
            };

            data.push({
                ingreso,
                egreso,
                totalDisponible: total,
                cuentasPorPagar: cuentasPorPagarTotal,
                cuentasPorCobrar: cuentasPorCobrarTotal,
                ingresoCuentaTerceros,
            });
        }

        // Get temporal transactions
        const temporalTransactionsRaw = await db
            .select()
            .from(cashFlow)
            .where(
                and(
                    eq(cashFlow.isTemporalTransaction, true),
                    between(cashFlow.createdAt, startDateTimeString, endDateTimeString)
                )
            );

        console.log('temporalTransactionsRaw', temporalTransactionsRaw);

        // Group temporal transactions by temporalTransactionId
        const groupedTransactions = new Map();
        temporalTransactionsRaw.forEach((transaction: any) => {
            const id = transaction.temporalTransactionId;
            if (id && !groupedTransactions.has(id)) {
                groupedTransactions.set(id, []);
            }
            if (id) {
                groupedTransactions.get(id).push(transaction);
            }
        });

        const temporalTransactions = Array.from(groupedTransactions.entries()).map(([id, transactions]) => {
            // You'll need to get payment details for amount and currency
            // This might require additional queries to CashFlowPayment table
            return {
                id: id.toString(),
                date: transactions[0].createdAt,
                amount: `Loading...`, // You'll need to fetch from CashFlowPayment
                origin: transactions[0].location || '',
                destiny: transactions[1]?.location || '',
                createdBy: transactions[0].createdBy,
                createdAt: transactions[0].createdAt,
            };
        });

        // Get all entities for calculations
        const entities = await db.select().from(cashFlowSourceEntity);

        // Get total available by entities today
        const getTotalAvailableByEntitiesToday = async () => {
            const total: any = {};

            for (const entity of entities) {
                const ingreso = await calculateSumByTransactionTypeAndCurrency(
                    db, ingresoTypeId, 'amount', false, startDateTimeString, endDateTimeString, entity.id
                );
                const ingresoCuentaTerceros = await calculateSumByTransactionTypeAndCurrency(
                    db, ingresoCuentaTercerosTypeId, 'amount', false, startDateTimeString, endDateTimeString, entity.id
                );
                const egreso = await calculateSumByTransactionTypeAndCurrency(
                    db, egresoTypeId, 'amount', false, startDateTimeString, endDateTimeString, entity.id
                );

                // Use entity.id or entity.name as key, adjust based on your entity structure
                const entityKey = entity.name || `entity_${entity.id}`;
                total[entityKey] = {
                    bs: (ingreso.bs as number) + (ingresoCuentaTerceros.bs as number) - (egreso.bs as number),
                    usd: (ingreso.usd as number) + (ingresoCuentaTerceros.usd as number) - (egreso.usd as number),
                    eur: (ingreso.eur as number) + (ingresoCuentaTerceros.eur as number) - (egreso.eur as number),
                };
            }

            return total;
        };
        const totalAvailableByEntitiesToday = await getTotalAvailableByEntitiesToday();

        // Get total available by entities (all time)
        const getTotalAvailableByEntities = async () => {
            const total: any = {};

            for (const entity of entities) {
                const ingreso = await calculateSumByTransactionTypeAndCurrency(
                    db, ingresoTypeId, 'amount', false, undefined, undefined, entity.id
                );
                const ingresoCuentaTerceros = await calculateSumByTransactionTypeAndCurrency(
                    db, ingresoCuentaTercerosTypeId, 'amount', false, undefined, undefined, entity.id
                );
                const egreso = await calculateSumByTransactionTypeAndCurrency(
                    db, egresoTypeId, 'amount', false, undefined, undefined, entity.id
                );

                const entityKey = entity.name || `entity_${entity.id}`;
                total[entityKey] = {
                    bs: (ingreso.bs as number) + (ingresoCuentaTerceros.bs as number) - (egreso.bs as number),
                    usd: (ingreso.usd as number) + (ingresoCuentaTerceros.usd as number) - (egreso.usd as number),
                    eur: (ingreso.eur as number) + (ingresoCuentaTerceros.eur as number) - (egreso.eur as number),
                };
            }

            return total;
        };
        const totalAvailableByEntities = await getTotalAvailableByEntities();

        // Save to database
        const register = await db.insert(closeCashFlow).values({
            data: {
                totals: data,
                temporalTransactions,
                totalAvailableByEntities,
                totalAvailableByEntitiesToday,
            },
        }).returning();

        // Send email notification
        try {
            // const emailData = {
            //     to: ['alexcarvajal2404@gmail.com', 'mgonzalezh11@gmail.com'],
            //     from: env.MAIL_FROM,
            //     subject: 'Cierre de caja',
            //     html: `Se genero un nuevo cierre de caja entre las: ${startDateTimeString} y ${endDateTimeString}`,
            // };
            //
            // await sendEmail(emailData, env);
            console.log('Email sent successfully!');
        } catch (emailError) {
            console.error('Email error:', emailError);
        }

        console.log(register);
        return register;

    } catch (error) {
        console.error('Error:', error);

    }
}

export async function generateCashFlowCloseV2(db: any, env: any, date?: any, insert = true) {
    console.log('date', date);
    const day = date ? new Date(date) : new Date();
    const startDate = new Date(day);
    const endDate = new Date(day);

    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(19, 0, 0, 0);

    const startDateTimeString = startDate.toISOString();
    const endDateTimeString = endDate.toISOString();

    console.log({
        startDateTimeString,
        endDateTimeString,
    })

    // Send email notification
    try {

        if (!insert) {
            const data =  await db.select().from(closeCashFlow);
            return data;
        }
        const data = await getTotals(db, { dateFrom: startDateTimeString, dateTo: endDateTimeString })

        const register = await db.insert(closeCashFlow).values({
            data: {
                totals: data,
            },
            date: day,
        }).returning();
        // const emailData = {
        //     to: ['alexcarvajal2404@gmail.com', 'mgonzalezh11@gmail.com'],
        //     from: env.MAIL_FROM,
        //     subject: 'Cierre de caja',
        //     html: `Se genero un nuevo cierre de caja entre las: ${startDateTimeString} y ${endDateTimeString}`,
        // };
        //
        // await sendEmail(emailData, env);
        console.log('Email sent successfully!');

        console.log(register);
        return register;
    } catch (emailError) {
        console.error('Email error:', emailError);
    }
}

// Email sending function (implement based on your email service)
export async function sendEmail(emailData: any, env: any) {
    // Example using MailChannels (free for Cloudflare Workers)
    const response = await fetch('https://api.mailchannels.net/tx/v1/send', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            personalizations: [{
                to: emailData.to.map((email: string) => ({ email })),
            }],
            from: { email: emailData.from },
            subject: emailData.subject,
            content: [{
                type: 'text/html',
                value: emailData.html,
            }],
        }),
    });

    if (!response.ok) {
        throw new Error(`Email service error: ${response.statusText}`);
    }
}
