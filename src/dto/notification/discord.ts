import { z } from 'zod';

export const NotificationContentSchema = z.object({
    name: z.string().min(1),
    value: z.string().min(1)
});

export const NotificationPayloadSchema = z.object({
    contents: z.array(NotificationContentSchema),
    error: z.string().optional(),
    type: z.enum(['onboarding', 'error', 'purchase'])
});

export type NotificationContent = z.infer<typeof NotificationContentSchema>;
export type NotificationPayload = z.infer<typeof NotificationPayloadSchema>;
