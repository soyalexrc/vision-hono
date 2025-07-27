import { Hono } from 'hono';
import jsonError from '../utils/jsonError';
import {DiscordNotificationService} from "../services/external/notification/discord";
import {NotificationPayloadSchema} from "../dto/notification/discord";

export type Env = {
    NEON_DB: string;
    DISCORD_WEBHOOK_URL: string;
};

const external = new Hono<{ Bindings: Env }>();

external.post('/notify-discord', async (c) => {
    try {
        const body = await c.req.json();

        const parsed = NotificationPayloadSchema.safeParse(body)

        if (!parsed.success) {
            return c.json({
                success: false,
                error: {
                    message: 'Invalid notification payload',
                    details: parsed.error.format()
                }
            }, 400);
        }

        const { contents, error, type } = body;
        const discordNotificationService = new DiscordNotificationService(c.env.DISCORD_WEBHOOK_URL);

        await discordNotificationService.crash(
            contents,
            error ? new Error(error) : new Error('Unknown error'),
        );

        return c.json({
            success: true,
            message: 'Notification sent successfully',
            type,
        });

    } catch (error: any) {
        return jsonError(c, {
            status: 500,
            message: 'Failed to sent message to discord',
            code: 'DISCORD_ERROR',
        });
    }
})

export default external;
