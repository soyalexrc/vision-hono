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

// Get all issues from backlog
scrum.get('/issues/backlog', async (c) => {
    try {
        // const projectKey = c.req.query('project') || 'YOUR_PROJECT_KEY'
        const projectKey = 'VINM';

        // JQL to get backlog issues (not in any sprint)
        const jql = `project = "${projectKey}" AND sprint is EMPTY ORDER BY created DESC`
        const encodedJql = encodeURIComponent(jql)

        const data: any = await jiraRequest(c, `/rest/api/3/search?jql=${encodedJql}&fields=summary,status,assignee,priority,issuetype,created,updated,description`)


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
        const issuesData: any = await jiraRequest(c, `/rest/agile/1.0/sprint/${activeSprint.id}/issue?fields=summary,status,assignee,priority,issuetype,created,updated,description`)

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

        const issue: any = await jiraRequest(c, `/rest/api/3/issue/${key}?fields=summary,status,assignee,priority,issuetype,created,updated,description,comment`)

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
scrum.get('/project/:key', async (c) => {
    try {
        const key = c.req.param('key')
        if (!key) {
            return jsonError(c, {
                status: 400,
                message: 'KEY is required',
                code: 'VALIDATION_ERROR',
            });
        }

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

// Health check
scrum.get('/health', (c) => {
    return c.json({ status: 'ok', timestamp: new Date().toISOString() })
})

export default scrum;
