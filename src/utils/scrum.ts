import {Context} from "hono";

export async function jiraRequest(c: Context, endpoint: string) {
    const auth = btoa(`${c.env.JIRA_EMAIL}:${c.env.JIRA_API_TOKEN}`)

    console.log('auth', auth)

    const response = await fetch(`${c.env.JIRA_BASE_URL}${endpoint}`, {
        headers: {
            'Authorization': `Basic ${auth}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        },
    })

    if (!response.ok) {
        throw new Error(`Jira API error: ${response.status} ${response.statusText}`)
    }

    return response.json()
}
