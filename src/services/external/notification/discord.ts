// R2 Service helper class
import {NotificationContent, NotificationPayload} from "../../../dto/notification/discord";

export class DiscordNotificationService {
    private webhookUrl!: string;

    constructor(url: string) {
        this.webhookUrl = url;
    }

    private async sendEmbed(embed: any): Promise<void> {
        const url = this.webhookUrl;

        if (!url) {
            console.warn(`No webhook URL set`);
            return;
        }

        try {
            console.log(`Sending Discord notification...`);

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ embeds: [embed] })
            });

            if (!response.ok) {
                throw new Error(`HTTP error ${response.status}`);
            }

            console.log(`✅ Discord notification sent`);
        } catch (err) {
            console.error(`❌ Failed to send Discord notification`, err);
        }
    }

    async crash(contents: NotificationContent[], error?: Error) {
        await this.sendEmbed({
            title: '💥 Crash Report',
            description: `An error occurred:\n\`\`\`ts\n${error?.message ?? 'Unknown error'}\n\`\`\``,
            fields: contents,
            timestamp: new Date().toISOString(),
            color: 0xff0000,
        });
    }

}
