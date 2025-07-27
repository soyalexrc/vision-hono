import {Context} from "hono";

export async function jiraRequest(c: Context, endpoint: string, options: any = {}) {
    const auth = btoa(`${c.env.JIRA_EMAIL}:${c.env.JIRA_API_TOKEN}`)

    const response = await fetch(`${c.env.JIRA_BASE_URL}${endpoint}`, {
        method: options.method || 'GET',
        headers: {
            'Authorization': `Basic ${auth}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            ...options.headers,
        },
        body: options.body,
    })

    if (!response.ok) {
        let errorDetails = `${response.status} ${response.statusText}`
        
        try {
            // Try to get detailed error information from Jira API response
            const errorBody = await response.text()
            console.error(`Jira API Error - ${response.status}:`, errorBody)
            
            // Try to parse JSON error details
            try {
                const errorJson = JSON.parse(errorBody)
                if (errorJson.errorMessages || errorJson.errors) {
                    errorDetails = {
                        status: response.status,
                        statusText: response.statusText,
                        errorMessages: errorJson.errorMessages || [],
                        fieldErrors: errorJson.errors || {},
                        rawResponse: errorBody
                    }
                }
            } catch (parseError) {
                // If not JSON, include the raw text
                errorDetails = {
                    status: response.status,
                    statusText: response.statusText,
                    rawResponse: errorBody
                }
            }
        } catch (readError) {
            console.error('Could not read error response body:', readError)
        }
        
        const error = new Error(`Jira API error: ${response.status} ${response.statusText}`)
        // Attach detailed error info to the error object
        error.details = errorDetails
        throw error
    }

    return response.json()
}
