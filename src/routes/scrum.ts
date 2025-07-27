import { Hono } from 'hono';
import jsonError from '../utils/jsonError';
import {jiraRequest} from "../utils/scrum";

export type Env = {
    NEON_DB: string;
};

const scrum = new Hono<{ Bindings: Env }>();

// Get all issues with status filtering
scrum.get('/issues', async (c) => {
    try {
        const projectKey = 'VINM';
        const status = c.req.query('status')
        const assignee = c.req.query('assignee')
        const maxResults = c.req.query('maxResults') || '50'

        let jql = `project = "${projectKey}"`

        if (status) {
            jql += ` AND status = "${status}"`
        }

        if (assignee) {
            jql += ` AND assignee = "${assignee}"`
        }

        jql += ' ORDER BY created DESC'

        const encodedJql = encodeURIComponent(jql)

        const data: any = await jiraRequest(c, `/rest/api/3/search?jql=${encodedJql}&maxResults=${maxResults}&fields=summary,status,assignee,priority,issuetype,created,updated,description`)

        return c.json({
            success: true,
            issues: data.issues,
            total: data.total
        })
    } catch (error: any) {
        console.log(error);
        return jsonError(c, {
            status: 500,
            message: 'Failed to fetch backlog issues',
            code: 'JIRA_CONNECTION_ERROR',
        });
    }
});

scrum.get('/fields', async (c) => {
    try {
        const fields: any = await jiraRequest(c, '/rest/api/3/field')
        const storyPointsField = fields.find((field: any) =>
            field.name.toLowerCase().includes('story point')
        )
        return c.json({ fields, storyPointsField })
    } catch (error) {
        console.error('Error fetching fields:', error)
        return c.json({ error: 'Failed to fetch fields' }, 500)
    }
})

// Get all issues from backlog
scrum.get('/issues/backlog', async (c) => {
    try {
        // const projectKey = c.req.query('project') || 'YOUR_PROJECT_KEY'
        const projectKey = 'VINM';

        // JQL to get backlog issues (not in any sprint)
        const jql = `project = "${projectKey}" AND sprint is EMPTY ORDER BY created DESC`
        const encodedJql = encodeURIComponent(jql)

        const data: any = await jiraRequest(c, `/rest/api/3/search?jql=${encodedJql}&fields=summary,status,assignee,priority,issuetype,created,updated,description,customfield_10016,labels`)


        return c.json({
            success: true,
            issues: data.issues,
            total: data.total
        })
    } catch (error: any) {
        console.log(error);
        return jsonError(c, {
            status: 500,
            message: 'Failed to fetch backlog issues',
            code: 'JIRA_CONNECTION_ERROR',
        });
    }
});

// Get current sprint issues
scrum.get('/issues/current-sprint', async (c) => {
    try {
        // const projectKey = c.req.query('project') || 'YOUR_PROJECT_KEY'
        const boardId = '34'

        // Get active sprints first
        const sprintsData: any = await jiraRequest(c, `/rest/agile/1.0/board/${boardId}/sprint?state=active`)

        if (!sprintsData.values || sprintsData.values.length === 0) {
            return c.json({
                success: true,
                issues: [],
                sprint: null,
                total: 0
            })
        }


        const activeSprint = sprintsData.values[0]

        // Get issues in the active sprint
        const issuesData: any = await jiraRequest(c, `/rest/agile/1.0/sprint/${activeSprint.id}/issue?fields=summary,status,assignee,priority,issuetype,created,updated,description,customfield_10016,labels`)

        return c.json({
            success: true,
            issues: issuesData.issues,
            sprint: activeSprint,
            total: issuesData.total
        })
    } catch (error: any) {
        console.log(error);
        return jsonError(c, {
            status: 500,
            message: 'Failed to fetch backlog issues',
            code: 'JIRA_CONNECTION_ERROR',
        });
    }
});


// Get project info
scrum.get('/issues/:key', async (c) => {
    try {
        const key = c.req.param('key')
        if (!key) {
            return jsonError(c, {
                status: 400,
                message: 'KEY is required',
                code: 'VALIDATION_ERROR',
            });
        }

        const issue: any = await jiraRequest(c, `/rest/api/3/issue/${key}?fields=summary,status,assignee,priority,issuetype,created,updated,description,comment,customfield_10016,labels`)

        return c.json({
            success: true,
            issue
        })
    } catch (error: any) {
        console.log(error);
        return jsonError(c, {
            status: 500,
            message: 'Failed to fetch ally',
            code: 'DATABASE_ERROR',
        });
    }
});

// Get project info
scrum.get('/project', async (c) => {
    try {
        const key = 'VINM';

        const project: any = await jiraRequest(c, `/rest/api/3/project/${key}`)

        return c.json({
            success: true,
            project
        })
    } catch (error: any) {
        console.log(error);
        return jsonError(c, {
            status: 500,
            message: 'Failed to fetch ally',
            code: 'DATABASE_ERROR',
        });
    }
});

// Get project info
scrum.get('/project/metadata', async (c) => {
    try {
        const key = 'VINM';

        // Get project details with issue types
        const project: any = await jiraRequest(c, `/rest/api/3/project/${key}`)

        // Get priorities
        const priorities: any = await jiraRequest(c, '/rest/api/3/priority')

        // Get assignable users for the project
        const users: any = await jiraRequest(c, `/rest/api/3/user/assignable/search?project=${key}&maxResults=50`)

        return c.json({
            success: true,
            metadata: {
                project,
                issueTypes: project.issueTypes?.filter((type: any) => !type.subtask) || [],
                priorities,
                users
            }
        })
    } catch (error: any) {
        console.log(error);
        return jsonError(c, {
            status: 500,
            message: 'Failed to fetch project metadata',
            code: 'JIRA_CONNECTION_ERROR',
        });
    }
});

// Validate issue creation fields before actual creation
scrum.post('/issues/validate', async (c) => {
    try {
        const projectKey = 'VINM';
        const body = await c.req.json()
        const { summary, description, issueType, priority, assignee } = body

        const validationResults = {
            valid: true,
            errors: [] as string[],
            warnings: [] as string[],
            suggestions: {} as any
        }

        // Validate required fields
        if (!summary || summary.trim().length === 0) {
            validationResults.valid = false
            validationResults.errors.push('Summary is required and cannot be empty')
        }

        // Get project metadata for validation
        const project: any = await jiraRequest(c, `/rest/api/3/project/${projectKey}`)
        const availableIssueTypes = project.issueTypes?.filter((type: any) => !type.subtask) || []

        validationResults.suggestions.availableIssueTypes = availableIssueTypes.map((t: any) => ({
            id: t.id,
            name: t.name,
            description: t.description
        }))

        // Validate issue type
        const requestedIssueType = issueType || 'Task'
        const validIssueType = availableIssueTypes.find((type: any) =>
            type.name.toLowerCase() === requestedIssueType.toLowerCase()
        )

        if (!validIssueType) {
            validationResults.valid = false
            validationResults.errors.push(`Issue type '${requestedIssueType}' not found`)
        }

        // Validate priority if provided
        if (priority) {
            try {
                const priorities: any = await jiraRequest(c, '/rest/api/3/priority')
                const validPriority = priorities.find((p: any) =>
                    p.name.toLowerCase() === priority.toLowerCase()
                )
                validationResults.suggestions.availablePriorities = priorities.map((p: any) => ({
                    id: p.id,
                    name: p.name
                }))

                if (!validPriority) {
                    validationResults.warnings.push(`Priority '${priority}' not found, will be ignored`)
                }
            } catch (priorityError) {
                validationResults.warnings.push('Could not validate priority options')
            }
        }

        // Validate assignee if provided
        if (assignee) {
            try {
                const users: any = await jiraRequest(c, `/rest/api/3/user/assignable/search?project=${projectKey}&maxResults=50`)
                const validUser = users.find((u: any) => u.accountId === assignee)
                validationResults.suggestions.availableUsers = users.map((u: any) => ({
                    accountId: u.accountId,
                    displayName: u.displayName,
                    emailAddress: u.emailAddress
                }))

                if (!validUser) {
                    validationResults.warnings.push(`User with accountId '${assignee}' not found or not assignable to this project`)
                }
            } catch (userError) {
                validationResults.warnings.push('Could not validate assignee options')
            }
        }

        return c.json({
            success: true,
            validation: validationResults
        })

    } catch (error: any) {
        console.error('Validation error:', error);
        return jsonError(c, {
            status: 500,
            message: 'Failed to validate issue data',
            code: 'VALIDATION_ERROR',
            details: error.message
        });
    }
});

// Create new issue (for backlog)
scrum.post('/issues', async (c) => {
    try {
        const projectKey = 'VINM';
        const body = await c.req.json()
        const { summary, description, issueType, priority, assignee } = body

        // Validate required fields
        if (!summary) {
            return c.json({
                success: false,
                error: 'Summary is required'
            }, 400)
        }

        // Prepare issue data for Jira API with proper structure
        const issueData: any = {
            fields: {
                project: {
                    key: projectKey
                },
                summary: summary
            }
        }

        // Handle issue type - can be either ID or name
        if (issueType) {
            // Check if issueType looks like an ID (numeric string)
            if (/^\d+$/.test(issueType)) {
                // It's an ID, use it directly
                issueData.fields.issuetype = {
                    id: issueType
                }
            } else {
                // It's a name, validate against project metadata
                const project: any = await jiraRequest(c, `/rest/api/3/project/${projectKey}`)
                const availableIssueTypes = project.issueTypes?.filter((type: any) => !type.subtask) || []
                const validIssueType = availableIssueTypes.find((type: any) =>
                    type.name.toLowerCase() === issueType.toLowerCase()
                )

                if (!validIssueType) {
                    return c.json({
                        success: false,
                        error: `Issue type '${issueType}' not found. Available types: ${availableIssueTypes.map((t: any) => t.name).join(', ')}`
                    }, 400)
                }

                issueData.fields.issuetype = {
                    id: validIssueType.id
                }
            }
        } else {
            // Default to first available issue type
            const project: any = await jiraRequest(c, `/rest/api/3/project/${projectKey}`)
            const availableIssueTypes = project.issueTypes?.filter((type: any) => !type.subtask) || []
            if (availableIssueTypes.length > 0) {
                issueData.fields.issuetype = {
                    id: availableIssueTypes[0].id
                }
            } else {
                return c.json({
                    success: false,
                    error: 'No available issue types found in project'
                }, 400)
            }
        }

        // Add description if provided
        if (description) {
            issueData.fields.description = {
                type: "doc",
                version: 1,
                content: [
                    {
                        type: "paragraph",
                        content: [
                            {
                                type: "text",
                                text: description
                            }
                        ]
                    }
                ]
            }
        }

        // Handle priority - can be either ID or name
        if (priority) {
            // Check if priority looks like an ID (numeric string)
            if (/^\d+$/.test(priority)) {
                // It's an ID, use it directly
                issueData.fields.priority = {
                    id: priority
                }
            } else {
                // It's a name, validate against available priorities
                try {
                    const priorities: any = await jiraRequest(c, '/rest/api/3/priority')
                    const validPriority = priorities.find((p: any) =>
                        p.name.toLowerCase() === priority.toLowerCase()
                    )
                    if (validPriority) {
                        issueData.fields.priority = {
                            id: validPriority.id
                        }
                    } else {
                        console.warn(`Priority '${priority}' not found, ignoring`)
                    }
                } catch (priorityError) {
                    console.warn('Could not fetch priorities:', priorityError)
                }
            }
        }

        // Add assignee if provided
        if (assignee) {
            issueData.fields.assignee = {
                accountId: assignee
            }
        }

        console.log('issueData', issueData)

        console.log('Sending issue data to Jira:', JSON.stringify(issueData, null, 2))

        const response: any = await jiraRequest(c, '/rest/api/3/issue', {
            method: 'POST',
            body: JSON.stringify(issueData)
        })

        return c.json({
            success: true,
            issue: response,
            message: 'Issue created successfully'
        })

    } catch (error: any) {
        console.error('Jira issue creation error:', error);

        // Extract detailed error information from the enhanced error object
        let errorDetails = error.message || 'Unknown error'
        let statusCode = 500

        if (error.details) {
            errorDetails = error.details
            statusCode = error.details.status || 500
        }

        return jsonError(c, {
            status: statusCode,
            message: 'Failed to create Jira issue',
            code: 'JIRA_CREATION_ERROR',
            details: errorDetails
        });
    }
});

scrum.put('/issues/:issueIdOrKey', async (c) => {
    try {
        const issueIdOrKey = c.req.param('issueIdOrKey');
        const body = await c.req.json()
        const { summary, description, issueType, priority, assignee } = body

        // Validate issue ID/Key
        if (!issueIdOrKey) {
            return c.json({
                success: false,
                error: 'Issue ID or Key is required'
            }, 400)
        }

        // Prepare update data for Jira API
        const updateData: any = {
            fields: {}
        }

        // Update summary if provided
        if (summary) {
            updateData.fields.summary = summary
        }

        // Update description if provided
        if (description) {
            updateData.fields.description = {
                type: "doc",
                version: 1,
                content: [
                    {
                        type: "paragraph",
                        content: [
                            {
                                type: "text",
                                text: description
                            }
                        ]
                    }
                ]
            }
        }

        // Handle issue type update - can be either ID or name
        if (issueType) {
            // Check if issueType looks like an ID (numeric string)
            if (/^\d+$/.test(issueType)) {
                // It's an ID, use it directly
                updateData.fields.issuetype = {
                    id: issueType
                }
            } else {
                // It's a name, validate against project metadata
                // First get the current issue to know its project
                const currentIssue: any = await jiraRequest(c, `/rest/api/3/issue/${issueIdOrKey}`)
                const projectKey = currentIssue.fields.project.key

                const project: any = await jiraRequest(c, `/rest/api/3/project/${projectKey}`)
                const availableIssueTypes = project.issueTypes?.filter((type: any) => !type.subtask) || []
                const validIssueType = availableIssueTypes.find((type: any) =>
                    type.name.toLowerCase() === issueType.toLowerCase()
                )

                if (!validIssueType) {
                    return c.json({
                        success: false,
                        error: `Issue type '${issueType}' not found. Available types: ${availableIssueTypes.map((t: any) => t.name).join(', ')}`
                    }, 400)
                }

                updateData.fields.issuetype = {
                    id: validIssueType.id
                }
            }
        }

        // Handle priority update - can be either ID or name
        if (priority) {
            // Check if priority looks like an ID (numeric string)
            if (/^\d+$/.test(priority)) {
                // It's an ID, use it directly
                updateData.fields.priority = {
                    id: priority
                }
            } else {
                // It's a name, validate against available priorities
                try {
                    const priorities: any = await jiraRequest(c, '/rest/api/3/priority')
                    const validPriority = priorities.find((p: any) =>
                        p.name.toLowerCase() === priority.toLowerCase()
                    )
                    if (validPriority) {
                        updateData.fields.priority = {
                            id: validPriority.id
                        }
                    } else {
                        console.warn(`Priority '${priority}' not found, ignoring`)
                    }
                } catch (priorityError) {
                    console.warn('Could not fetch priorities:', priorityError)
                }
            }
        }

        // Update assignee if provided
        if (assignee) {
            updateData.fields.assignee = {
                accountId: assignee
            }
        }

        // Check if there are any fields to update
        if (Object.keys(updateData.fields).length === 0) {
            return c.json({
                success: false,
                error: 'No fields provided to update'
            }, 400)
        }

        console.log('updateData', updateData)
        console.log('Sending update data to Jira:', JSON.stringify(updateData, null, 2))

        // Update the issue
        await jiraRequest(c, `/rest/api/3/issue/${issueIdOrKey}`, {
            method: 'PUT',
            body: JSON.stringify(updateData)
        })

        // Get the updated issue to return
        const updatedIssue: any = await jiraRequest(c, `/rest/api/3/issue/${issueIdOrKey}`)

        return c.json({
            success: true,
            issue: updatedIssue,
            message: 'Issue updated successfully'
        })

    } catch (error: any) {
        console.error('Jira issue update error:', error);

        // Extract detailed error information from the enhanced error object
        let errorDetails = error.message || 'Unknown error'
        let statusCode = 500

        if (error.details) {
            errorDetails = error.details
            statusCode = error.details.status || 500
        }

        return jsonError(c, {
            status: statusCode,
            message: 'Failed to update Jira issue',
            code: 'JIRA_UPDATE_ERROR',
            details: errorDetails
        });
    }
});

// Health check
scrum.get('/health', (c) => {
    return c.json({ status: 'ok', timestamp: new Date().toISOString() })
})

export default scrum;
