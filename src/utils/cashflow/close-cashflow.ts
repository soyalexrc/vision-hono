import { sql, and, eq, between, inArray } from 'drizzle-orm';
import { cashFlow, cashFlowPayment, cashFlowTransactionType, cashFlowCurrency, cashFlowSourceEntity } from '../../db/schema';

export async function calculateSumByTransactionTypeAndCurrency(
    db: any, // Neon DB connection
    transactionTypeId: number, // Now using ID instead of string
    column: 'amount' | 'pendingToCollect' | 'totalDue' | 'incomeByThird',
    returnString: boolean,
    dateFrom?: string,
    dateTo?: string,
    entityId?: number, // Now using ID instead of string
) {
    // Build the where conditions for cashFlow
    const cashFlowConditions = [];

    // Add date filter if provided
    if (dateFrom && dateTo) {
        cashFlowConditions.push(between(cashFlow.date, dateFrom, dateTo));
    }

    // Add temporal transaction filter
    cashFlowConditions.push(eq(cashFlow.isTemporalTransaction, false));

    // Build where conditions for cashFlowPayment
    const paymentConditions = [
        eq(cashFlowPayment.transactionType, transactionTypeId),
    ];

    // Add entity filter if provided
    if (entityId) {
        paymentConditions.push(eq(cashFlowPayment.entity, entityId));
    }

    // Execute the query with proper joins
    const results = await db
        .select({
            currencyId: cashFlowPayment.currency,
            currencyCode: cashFlowCurrency.code, // Assuming currency table has a 'code' field
            sum: sql<number>`SUM(CAST(${cashFlowPayment[column]} AS DECIMAL))`,
        })
        .from(cashFlowPayment)
        .innerJoin(cashFlow, eq(cashFlowPayment.cashflow, cashFlow.id))
        .innerJoin(cashFlowCurrency, eq(cashFlowPayment.currency, cashFlowCurrency.id))
        .where(
            and(
                ...cashFlowConditions,
                ...paymentConditions
            )
        )
        .groupBy(cashFlowPayment.currency, cashFlowCurrency.code);

    // Process results - map currency codes to our expected format
    const sumsByCurrency: Record<string, number> = {};

    console.log('results', results)

    results.forEach((result: any) => {
        if (result.currencyCode && result.sum !== null) {
            // Map currency codes to your expected format
            let currencyKey = result.currencyCode;
            if (result.currencyCode === 'USD') currencyKey = '$';
            else if (result.currencyCode === 'EUR') currencyKey = '€';
            else if (result.currencyCode === 'VEF' || result.currencyCode === 'BS') currencyKey = 'Bs';

            sumsByCurrency[currencyKey] = parseFloat(result.sum.toString()) || 0;
        }
    });

    return {
        bs: sumsByCurrency['Bs']
            ? (returnString ? sumsByCurrency['Bs'].toString() : sumsByCurrency['Bs'])
            : (returnString ? '0' : 0),
        usd: sumsByCurrency['$']
            ? (returnString ? sumsByCurrency['$'].toString() : sumsByCurrency['$'])
            : (returnString ? '0' : 0),
        eur: sumsByCurrency['€']
            ? (returnString ? sumsByCurrency['€'].toString() : sumsByCurrency['€'])
            : (returnString ? '0' : 0),
    };
}

// Helper function to get transaction type ID by name
export async function getTransactionTypeId(db: any, typeName: string): Promise<number | null> {
    const result = await db
        .select({ id: cashFlowTransactionType.id })
        .from(cashFlowTransactionType)
        .where(eq(cashFlowTransactionType.name, typeName)) // Assuming 'name' field
        .limit(1);

    return result[0]?.id || null;
}

// Helper function to get entity ID by name
export async function getEntityId(db: any, entityName: string): Promise<number | null> {
    const result = await db
        .select({ id: cashFlowSourceEntity.id })
        .from(cashFlowSourceEntity)
        .where(eq(cashFlowSourceEntity.name, entityName)) // Assuming 'name' field
        .limit(1);

    return result[0]?.id || null;
}

// Alternative: Raw SQL version for better performance
// export async function calculateSumByTransactionTypeAndCurrencySQL(
//     db: any,
//     transactionTypeId: number,
//     column: string,
//     returnString: boolean,
//     dateFrom?: string,
//     dateTo?: string,
//     entityId?: number,
// ) {
//     let query = `
//         SELECT
//             c.code as currency,
//             SUM(CAST(cfp.${column} AS DECIMAL)) as sum
//         FROM "CashFlowPayment" cfp
//             INNER JOIN "CashFlow" cf ON cfp.cashflow = cf.id
//             INNER JOIN "CashFlowCurrency" c ON cfp.currency = c.id
//         WHERE
//             cfp."transactionType" = $1
//           AND cf."isTemporalTransaction" = false
//     `;
//
//     const params: any[] = [transactionTypeId];
//     let paramIndex = 2;
//
//     if (dateFrom && dateTo) {
//         query += ` AND cf.date BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
//         params.push(dateFrom, dateTo);
//         paramIndex += 2;
//     }
//
//     if (entityId) {
//         query += ` AND cfp.entity = $${paramIndex}`;
//         params.push(entityId);
//     }
//
//     query += ` GROUP BY c.code`;
//
//     const results = await db.execute(sql.raw(query, params));
//
//     const sumsByCurrency: Record<string, number> = {};
//     results.forEach((result: any) => {
//         if (result.currency && result.sum !== null) {
//             // Map currency codes
//             let currencyKey = result.currency;
//             if (result.currency === 'USD') currencyKey = '$';
//             else if (result.currency === 'EUR') currencyKey = '€';
//             else if (result.currency === 'BOB' || result.currency === 'BS') currencyKey = 'Bs';
//
//             sumsByCurrency[currencyKey] = parseFloat(result.sum) || 0;
//         }
//     });
//
//     return {
//         bs: sumsByCurrency['Bs']
//             ? (returnString ? sumsByCurrency['Bs'].toString() : sumsByCurrency['Bs'])
//             : (returnString ? '0' : 0),
//         usd: sumsByCurrency['$']
//             ? (returnString ? sumsByCurrency['$'].toString() : sumsByCurrency['$'])
//             : (returnString ? '0' : 0),
//         eur: sumsByCurrency['€']
//             ? (returnString ? sumsByCurrency['€'].toString() : sumsByCurrency['€'])
//             : (returnString ? '0' : 0),
//     };
// }
