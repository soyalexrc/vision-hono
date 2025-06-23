import {getOrCacheTransactionTypeId} from "../../services/cashflow";
import {calculateSumByTransactionTypeAndCurrency} from "./close-cashflow";
import {cashFlowSourceEntity} from "../../db/schema";
import {sql} from 'drizzle-orm';

export async function getUtilidadPorServicio(db: any, dateFrom: string, dateTo: string) {
    try {
        let query = `
      SELECT 
        COALESCE(NULLIF(cfp.service, ''), 'Sin Servicio') as service_name,
        c.code as currency_code,
        SUM(CASE 
          WHEN tt.name = 'Ingreso' THEN CAST(cfp.amount AS DECIMAL)
          ELSE 0 
        END) as total_ingreso,
        SUM(CASE 
          WHEN tt.name = 'Egreso' THEN CAST(cfp.amount AS DECIMAL)
          ELSE 0 
        END) as total_egreso,
        SUM(CASE 
          WHEN tt.name = 'Cuenta por pagar' THEN CAST(cfp."totalDue" AS DECIMAL)
          ELSE 0 
        END) as total_cuentas_por_pagar
      FROM "CashFlowPayment" cfp
      INNER JOIN "CashFlow" cf ON cfp.cashflow = cf.id
      INNER JOIN "CashFlowCurrency" c ON cfp.currency = c.id
      INNER JOIN "CashFlowTransactionType" tt ON cfp."transactionType" = tt.id
      WHERE cf."isTemporalTransaction" = false
        AND cf.date BETWEEN '${dateFrom}' AND '${dateTo}'
      GROUP BY cfp.service, c.code
      ORDER BY cfp.service, c.code
    `;

        // console.log('Executing utilidad por servicio query:', query);
        const results = await db.execute(sql.raw(query));
        // console.log('Raw results from getUtilidadPorServicio:', results);

        const servicios: Record<string, any> = {};

        results?.rows?.forEach((row: any) => {
            const serviceName = row.service_name || 'Sin Servicio';
            const currencyCode = row.currency_code;

            if (!servicios[serviceName]) {
                servicios[serviceName] = {
                    ingreso: { bs: 0, usd: 0, eur: 0 },
                    egreso: { bs: 0, usd: 0, eur: 0 },
                    cuentasPorPagar: { bs: 0, usd: 0, eur: 0 },
                    utilidad: { bs: 0, usd: 0, eur: 0 }
                };
            }

            let currencyKey = 'bs';
            if (currencyCode === 'USD' || currencyCode === '$') currencyKey = 'usd';
            else if (currencyCode === 'EUR' || currencyCode === '€') currencyKey = 'eur';
            else if (currencyCode === 'BOB' || currencyCode === 'BS' || currencyCode === 'Bs') currencyKey = 'bs';

            const ingreso = Math.round((parseFloat(row.total_ingreso || 0)) * 100) / 100;
            const egreso = Math.round((parseFloat(row.total_egreso || 0)) * 100) / 100;
            const cuentasPorPagar = Math.round((parseFloat(row.total_cuentas_por_pagar || 0)) * 100) / 100;

            servicios[serviceName].ingreso[currencyKey] = ingreso;
            servicios[serviceName].egreso[currencyKey] = egreso;
            servicios[serviceName].cuentasPorPagar[currencyKey] = cuentasPorPagar;
            servicios[serviceName].utilidad[currencyKey] = Math.round((ingreso - egreso - cuentasPorPagar) * 100) / 100;
        });

        return servicios;

    } catch (error) {
        console.error('Error calculating utilidad por servicio:', error);
        return {};
    }
}

// Helper function to get breakdown by wayToPay for an entity
async function getDesglosePorWayToPay(db: any, entityId: number, dateFrom: string, dateTo: string) {
    try {
        let query = `
          SELECT 
            wtp.name as way_to_pay_name,
            c.code as currency_code,
            SUM(CASE 
              WHEN tt.name = 'Ingreso' THEN CAST(cfp.amount AS DECIMAL)
              ELSE 0 
            END) as total_ingreso,
            SUM(CASE 
              WHEN tt.name = 'Egreso' THEN CAST(cfp.amount AS DECIMAL)
              ELSE 0 
            END) as total_egreso,
            SUM(CASE 
              WHEN tt.name = 'Cuenta por pagar' THEN CAST(cfp."totalDue" AS DECIMAL)
              ELSE 0 
            END) as total_cuentas_por_pagar
          FROM "CashFlowPayment" cfp
          INNER JOIN "CashFlow" cf ON cfp.cashflow = cf.id
          INNER JOIN "CashFlowCurrency" c ON cfp.currency = c.id
          INNER JOIN "CashFlowTransactionType" tt ON cfp."transactionType" = tt.id
          INNER JOIN "CashFlowWayToPay" wtp ON cfp."wayToPay" = wtp.id
          WHERE cf."isTemporalTransaction" = false
            AND cf.date BETWEEN '${dateFrom}' AND '${dateTo}'
            AND cfp.entity = ${entityId}
          GROUP BY wtp.name, c.code
          ORDER BY wtp.name, c.code
        `;

        const results = await db.execute(sql.raw(query));
        const desglose: Record<string, any> = {};

        results?.rows?.forEach((row: any) => {
            const wayToPayName = row.way_to_pay_name || 'Sin Forma de Pago';
            const currencyCode = row.currency_code;

            if (!desglose[wayToPayName]) {
                desglose[wayToPayName] = {
                    ingreso: { bs: 0, usd: 0, eur: 0 },
                    egreso: { bs: 0, usd: 0, eur: 0 },
                    cuentasPorPagar: { bs: 0, usd: 0, eur: 0 },
                    disponibilidad: { bs: 0, usd: 0, eur: 0 }
                };
            }

            let currencyKey = 'bs';
            if (currencyCode === 'USD' || currencyCode === '$') currencyKey = 'usd';
            else if (currencyCode === 'EUR' || currencyCode === '€') currencyKey = 'eur';
            else if (currencyCode === 'BOB' || currencyCode === 'BS' || currencyCode === 'Bs') currencyKey = 'bs';

            const ingreso = Math.round((parseFloat(row.total_ingreso || 0)) * 100) / 100;
            const egreso = Math.round((parseFloat(row.total_egreso || 0)) * 100) / 100;
            const cuentasPorPagar = Math.round((parseFloat(row.total_cuentas_por_pagar || 0)) * 100) / 100;

            desglose[wayToPayName].ingreso[currencyKey] = ingreso;
            desglose[wayToPayName].egreso[currencyKey] = egreso;
            desglose[wayToPayName].cuentasPorPagar[currencyKey] = cuentasPorPagar;
            desglose[wayToPayName].disponibilidad[currencyKey] = Math.round((ingreso - egreso - cuentasPorPagar) * 100) / 100;
        });

        return desglose;

    } catch (error) {
        console.error('Error calculating desglose por way to pay:', error);
        return {};
    }
}

export async function getTotals(db: any, filtersDto: any) {
    const {dateFrom, dateTo} = filtersDto;

    try {
        // Get transaction type IDs
        const ingresoTypeId = await getOrCacheTransactionTypeId(db, 'Ingreso');
        const egresoTypeId = await getOrCacheTransactionTypeId(db, 'Egreso');
        const cuentaPorCobrarTypeId = await getOrCacheTransactionTypeId(db, 'Cuenta por cobrar');
        const cuentaPorPagarTypeId = await getOrCacheTransactionTypeId(db, 'Cuenta por pagar');

        // 1. FLUJO DE CAJA BÁSICO
        const ingreso = await calculateSumByTransactionTypeAndCurrency(
            db, ingresoTypeId, 'amount', false, dateFrom, dateTo
        );

        const egreso = await calculateSumByTransactionTypeAndCurrency(
            db, egresoTypeId, 'amount', false, dateFrom, dateTo
        );

        // 2. CUENTAS POR COBRAR Y PAGAR
        const cuentasPorCobrarIngreso = await calculateSumByTransactionTypeAndCurrency(
            db, ingresoTypeId, 'pendingToCollect', false, dateFrom, dateTo
        );
        const cuentasPorCobrarPending = await calculateSumByTransactionTypeAndCurrency(
            db, cuentaPorCobrarTypeId, 'pendingToCollect', false, dateFrom, dateTo
        );
        const cuentasPorCobrar = {
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
        const cuentasPorPagar = {
            bs: (cuentasPorPagarIngreso.bs as number) + (cuentasPorPagarPending.bs as number),
            usd: (cuentasPorPagarIngreso.usd as number) + (cuentasPorPagarPending.usd as number),
            eur: (cuentasPorPagarIngreso.eur as number) + (cuentasPorPagarPending.eur as number),
        };

        // 3. UTILIDAD = INGRESO - EGRESO - CUENTAS POR PAGAR
        const utilidad = {
            bs: Math.round(((ingreso.bs as number) - (egreso.bs as number) - cuentasPorPagar.bs)),
            usd: Math.round(((ingreso.usd as number) - (egreso.usd as number) - cuentasPorPagar.usd)),
            eur: Math.round(((ingreso.eur as number) - (egreso.eur as number) - cuentasPorPagar.eur))
        };

        // 4. DISPONIBILIDAD = INGRESO - EGRESO
        const disponibilidad = {
            bs: Math.round((ingreso.bs as number) - (egreso.bs as number)),
            usd: Math.round((ingreso.usd as number) - (egreso.usd as number)),
            eur: Math.round((ingreso.eur as number) - (egreso.eur as number))
        };

        // 5. DISPONIBILIDAD DISTRIBUIDA POR ENTIDAD
        const entities = await db.select().from(cashFlowSourceEntity);
        const disponibilidadPorEntidad: Record<string, any> = {};

        for (const entity of entities) {
            const ingresoEntity = await calculateSumByTransactionTypeAndCurrency(
                db, ingresoTypeId, 'amount', false, dateFrom, dateTo, entity.id
            );
            const egresoEntity = await calculateSumByTransactionTypeAndCurrency(
                db, egresoTypeId, 'amount', false, dateFrom, dateTo, entity.id
            );
            const cuentasPorPagarEntity = await calculateSumByTransactionTypeAndCurrency(
                db, cuentaPorPagarTypeId, 'totalDue', false, dateFrom, dateTo, entity.id
            );

            const desglosePorWayToPay = await getDesglosePorWayToPay(db, entity.id, dateFrom, dateTo);

            const entityKey = entity.name || `entity_${entity.id}`;
            disponibilidadPorEntidad[entityKey] = {
                bs: Math.round(((ingresoEntity.bs as number) - (egresoEntity.bs as number) - (cuentasPorPagarEntity.bs as number)) * 100) / 100,
                usd: Math.round(((ingresoEntity.usd as number) - (egresoEntity.usd as number) - (cuentasPorPagarEntity.usd as number)) * 100) / 100,
                eur: Math.round(((ingresoEntity.eur as number) - (egresoEntity.eur as number) - (cuentasPorPagarEntity.eur as number)) * 100) / 100,
                desglosePorWayToPay: desglosePorWayToPay
            };
        }

        // 6. UTILIDAD POR SERVICIO
        const utilidadPorServicio = await getUtilidadPorServicio(db, dateFrom, dateTo);

        return {
            // Flujo de caja básico
            flujoDeEfectivo: {
                ingreso,
                egreso,
                disponibilidad,
            },
            // Cuentas
            cuentas: {
                cuentasPorCobrar,
                cuentasPorPagar,
            },
            // Análisis
            analisis: {
                utilidad,
                disponibilidadPorEntidad,
                utilidadPorServicio,
            },
            // Resumen
            resumen: {
                ingresoTotal: ingreso,
                egresoTotal: egreso,
                utilidadNeta: utilidad,
                disponibilidadTotal: disponibilidad,
            }
        };

    } catch (error) {
        console.error('Error in getCompleteCashFlowTotals:', error);
        throw new Error(`Error calculando totales: ${JSON.stringify(error)}`);
    }
}
