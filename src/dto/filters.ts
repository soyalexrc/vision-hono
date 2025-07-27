import { z } from 'zod';

// Base schema with transformation for numbers
export const FiltersSchema = z.object({
    // Pagination fields - converted to numbers
    // pageIndex: z.string().optional().transform((val) => val ? Number(val) : undefined)
    //     .refine((val) => val === undefined || (!isNaN(val) && Number.isInteger(val)), {
    //         message: "pageIndex must be a valid integer"
    //     }),
    //
    // pageSize: z.string().optional().transform((val) => val ? Number(val) : undefined)
    //     .refine((val) => val === undefined || (!isNaN(val) && Number.isInteger(val)), {
    //         message: "pageSize must be a valid integer"
    //     }),

    // All other fields as optional strings
    service_id: z.string().optional(),
    sendToEmail: z.string().optional(),
    requestedBy: z.string().optional(),
    code: z.string().optional(),
    isInvestor: z.string().optional(),
    subService_id: z.string().optional(),
    transactionType: z.string().optional(),
    isPotentialInvestor: z.string().optional(),
    currency: z.string().optional(),
    wayToPay: z.string().optional(),
    entity: z.string().optional(),
    service: z.string().optional(),
    serviceType: z.string().optional(),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    property_id: z.string().optional(),
    owner_id: z.string().optional(),
    client_id: z.string().optional(),
    person: z.string().optional(),
    operationType: z.string().optional(),
    contactFrom: z.string().optional(),
    status: z.string().optional(),
    state: z.string().optional(),
    municipality: z.string().optional(),
    city: z.string().optional(),
    propertyType: z.string().optional(),
    requirementStatus: z.string().optional(),
});

export type FiltersDto = z.infer<typeof FiltersSchema>;
