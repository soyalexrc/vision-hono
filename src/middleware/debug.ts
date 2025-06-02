import { MiddlewareHandler } from "hono";

export const debugMiddleware: MiddlewareHandler = async (c, next) => {
    const startTime = Date.now();
    const requestId = Math.random().toString(36).substring(7);

    console.log(`\n=== DEBUG MIDDLEWARE [${requestId}] ===`)
    console.log('🚀 REQUEST START')
    console.log('Method:', c.req.method)
    console.log('URL:', c.req.url)
    console.log('Path:', c.req.path)
    console.log('Query:', c.req.query())
    console.log('Raw headers:', Object.fromEntries(c.req.raw.headers.entries()))
    console.log('Authorization via c.req.header:', c.req.header('Authorization'))
    console.log('authorization via c.req.header:', c.req.header('authorization'))
    console.log('Content-Type:', c.req.header('Content-Type'))
    console.log('Origin:', c.req.header('Origin'))
    console.log('User-Agent:', c.req.header('User-Agent'))

    // Log request body for POST/PUT/PATCH requests
    if (['POST', 'PUT', 'PATCH'].includes(c.req.method)) {
        try {
            // Clone the request to avoid consuming the body
            const clonedReq = c.req.raw.clone()
            const body = await clonedReq.text()
            console.log('Request Body:', body || '[Empty]')
        } catch (err) {
            console.log('Request Body: [Unable to read]', err)
        }
    }

    console.log('------------------------')

    // Intercept the response
    let responseStatus: number | undefined;
    let responseHeaders: Record<string, string> = {};
    let responseBody: string | undefined;

    try {
        await next()

        // Get response details after next() completes
        responseStatus = c.res?.status

        // Get response headers
        if (c.res?.headers) {
            responseHeaders = Object.fromEntries(c.res.headers.entries())
        }

        // Try to get response body (this is tricky with Hono)
        if (c.res) {
            try {
                // Clone response to avoid consuming the body
                const clonedRes = c.res.clone()
                responseBody = await clonedRes.text()
            } catch (err) {
                responseBody = '[Unable to read response body]'
            }
        }

    } catch (error) {
        console.log('❌ ERROR during request processing:', error)
        responseStatus = 500
        throw error // Re-throw to maintain error handling
    } finally {
        const endTime = Date.now()
        const duration = endTime - startTime

        console.log('📤 RESPONSE')
        console.log('Status:', responseStatus || 'Unknown')
        console.log('Duration:', `${duration}ms`)
        console.log('Response Headers:', responseHeaders)

        // Log response body (truncate if too long)
        if (responseBody) {
            const truncatedBody = responseBody.length > 1000
                ? responseBody.substring(0, 1000) + '... [truncated]'
                : responseBody
            console.log('Response Body:', truncatedBody)
        }

        // Log status-specific info
        if (responseStatus && responseStatus >= 400) {
            console.log('⚠️  ERROR RESPONSE')
        } else if (responseStatus && responseStatus >= 200 && responseStatus < 300) {
            console.log('✅ SUCCESS RESPONSE')
        }

        console.log(`=== END DEBUG [${requestId}] - ${duration}ms ===\n`)
    }
}

// Alternative version with more granular control
// export const detailedDebugMiddleware: MiddlewareHandler = async (c, next) => {
//     const startTime = performance.now();
//     const requestId = crypto.randomUUID().substring(0, 8);
//
//     // Request logging
//     console.log(`\n🔍 [${requestId}] ========== REQUEST ==========`)
//     console.log(`📍 ${c.req.method} ${c.req.url}`)
//     console.log(`🛤️  Path: ${c.req.path}`)
//     console.log(`❓ Query:`, JSON.stringify(c.req.query(), null, 2))
//
//     // Headers logging
//     console.log(`📋 Headers:`)
//     const headers = Object.fromEntries(c.req.raw.headers.entries())
//     Object.entries(headers).forEach(([key, value]) => {
//         console.log(`   ${key}: ${value}`)
//     })
//
//     // Auth specific logging
//     const authHeader = c.req.header('Authorization')
//     if (authHeader) {
//         console.log(`🔐 Auth: ${authHeader.substring(0, 20)}...`)
//     } else {
//         console.log(`🚫 No Authorization header`)
//     }
//
//     // Body logging for non-GET requests
//     if (c.req.method !== 'GET') {
//         try {
//             const body = await c.req.raw.clone().text()
//             console.log(`📝 Body: ${body || '[Empty]'}`)
//         } catch {
//             console.log(`📝 Body: [Unable to read]`)
//         }
//     }
//
//     console.log(`========================================`)
//
//     // Response interceptor
//     const originalJson = c.json.bind(c)
//     const originalText = c.text.bind(c)
//
//     // Override c.json to log responses
//     c.json = (object: any, init?: ResponseInit) => {
//         console.log(`\n📤 [${requestId}] ========== RESPONSE ==========`)
//         console.log(`📊 Status: ${init?.status || 200}`)
//         console.log(`📋 Response Headers:`, init?.headers || {})
//         console.log(`📄 JSON Response:`, JSON.stringify(object, null, 2))
//
//         const endTime = performance.now()
//         console.log(`⏱️  Duration: ${(endTime - startTime).toFixed(2)}ms`)
//         console.log(`========================================\n`)
//
//         return originalJson(object, init)
//     }
//
//     // Override c.text to log text responses
//     c.text = (text: string, init?: ResponseInit) => {
//         console.log(`\n📤 [${requestId}] ========== RESPONSE ==========`)
//         console.log(`📊 Status: ${init?.status || 200}`)
//         console.log(`📄 Text Response: ${text}`)
//
//         const endTime = performance.now()
//         console.log(`⏱️  Duration: ${(endTime - startTime).toFixed(2)}ms`)
//         console.log(`========================================\n`)
//
//         return originalText(text, init)
//     }
//
//     try {
//         await next()
//     } catch (error) {
//         console.log(`\n❌ [${requestId}] ========== ERROR ==========`)
//         console.log(`💥 Error:`, error)
//         console.log(`⏱️  Duration: ${(performance.now() - startTime).toFixed(2)}ms`)
//         console.log(`==========================================\n`)
//         throw error
//     }
// }

// Simple version focused on auth debugging
export const authDebugMiddleware: MiddlewareHandler = async (c, next) => {
    console.log(`\n🔐 AUTH DEBUG - ${c.req.method} ${c.req.path}`)
    console.log(`Authorization header:`, c.req.header('Authorization') || 'MISSING')
    console.log(`All headers:`, Object.fromEntries(c.req.raw.headers.entries()))

    await next()

    console.log(`Response status:`, c.res?.status)
    console.log(`🔐 AUTH DEBUG END\n`)
}
