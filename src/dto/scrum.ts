export type JiraIssue = {
    id: string
    key: string
    fields: {
        summary: string
        status: {
            name: string
            statusCategory: {
                name: string
                colorName: string
            }
        }
        assignee?: {
            displayName: string
            emailAddress: string
        }
        priority: {
            name: string
            iconUrl: string
        }
        issuetype: {
            name: string
            iconUrl: string
        }
        created: string
        updated: string
        description?: any
        sprint?: any[]
    }
}
