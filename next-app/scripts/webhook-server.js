#!/usr/bin/env node

/**
 * Simple Webhook Server for Git-based Deployment
 * Listens for GitHub webhooks and triggers deployment
 */

const http = require('http');
const crypto = require('crypto');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
    port: process.env.WEBHOOK_PORT || 9000,
    secret: process.env.WEBHOOK_SECRET || 'your-webhook-secret',
    deployScript: path.join(__dirname, 'git-deploy.sh'),
    logFile: '/var/log/jeval-frontend/webhook.log',
    allowedBranches: ['main', 'production', 'staging']
};

// Logging function
function log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;
    
    console.log(logMessage.trim());
    
    // Write to log file
    try {
        fs.appendFileSync(CONFIG.logFile, logMessage);
    } catch (err) {
        console.error('Failed to write to log file:', err.message);
    }
}

// Verify GitHub webhook signature
function verifySignature(payload, signature) {
    if (!signature) {
        return false;
    }
    
    const hmac = crypto.createHmac('sha256', CONFIG.secret);
    hmac.update(payload);
    const calculatedSignature = `sha256=${hmac.digest('hex')}`;
    
    return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(calculatedSignature)
    );
}

// Execute deployment script
function executeDeploy(branch, environment = 'production') {
    return new Promise((resolve, reject) => {
        log(`Starting deployment for branch: ${branch}, environment: ${environment}`);
        
        const process = spawn('bash', [CONFIG.deployScript, branch, environment], {
            stdio: ['pipe', 'pipe', 'pipe'],
            cwd: path.dirname(CONFIG.deployScript)
        });
        
        let stdout = '';
        let stderr = '';
        
        process.stdout.on('data', (data) => {
            stdout += data.toString();
            log(`DEPLOY: ${data.toString().trim()}`);
        });
        
        process.stderr.on('data', (data) => {
            stderr += data.toString();
            log(`DEPLOY ERROR: ${data.toString().trim()}`);
        });
        
        process.on('close', (code) => {
            if (code === 0) {
                log(`Deployment completed successfully for branch: ${branch}`);
                resolve({ success: true, stdout, stderr });
            } else {
                log(`Deployment failed for branch: ${branch}, exit code: ${code}`);
                reject({ success: false, code, stdout, stderr });
            }
        });
        
        process.on('error', (error) => {
            log(`Deployment process error: ${error.message}`);
            reject({ success: false, error: error.message });
        });
    });
}

// Handle webhook request
async function handleWebhook(req, res) {
    try {
        // Parse request body
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        
        req.on('end', async () => {
            try {
                // Verify signature
                const signature = req.headers['x-hub-signature-256'];
                if (!verifySignature(body, signature)) {
                    log('Invalid webhook signature');
                    res.writeHead(401, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Invalid signature' }));
                    return;
                }
                
                // Parse payload
                const payload = JSON.parse(body);
                const event = req.headers['x-github-event'];
                
                log(`Received ${event} event from GitHub`);
                
                // Only handle push events
                if (event !== 'push') {
                    log(`Ignoring ${event} event`);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ message: 'Event ignored' }));
                    return;
                }
                
                // Extract branch name
                const ref = payload.ref;
                if (!ref.startsWith('refs/heads/')) {
                    log('Not a branch push, ignoring');
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ message: 'Not a branch push' }));
                    return;
                }
                
                const branch = ref.replace('refs/heads/', '');
                
                // Check if branch is allowed for deployment
                if (!CONFIG.allowedBranches.includes(branch)) {
                    log(`Branch ${branch} not allowed for deployment`);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ message: 'Branch not allowed' }));
                    return;
                }
                
                // Determine environment based on branch
                let environment = 'production';
                if (branch === 'staging') {
                    environment = 'staging';
                } else if (branch === 'develop') {
                    environment = 'development';
                }
                
                log(`Triggering deployment for branch: ${branch}, environment: ${environment}`);
                
                // Execute deployment (don't wait for completion)
                executeDeploy(branch, environment)
                    .then(result => {
                        log('Deployment completed successfully');
                    })
                    .catch(error => {
                        log(`Deployment failed: ${error.error || error.stderr || 'Unknown error'}`);
                    });
                
                // Respond immediately
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                    message: 'Deployment triggered',
                    branch: branch,
                    environment: environment
                }));
                
            } catch (error) {
                log(`Error processing webhook: ${error.message}`);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Internal server error' }));
            }
        });
        
    } catch (error) {
        log(`Error handling webhook: ${error.message}`);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal server error' }));
    }
}

// Handle health check
function handleHealth(req, res) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    }));
}

// Create HTTP server
const server = http.createServer((req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-GitHub-Event, X-Hub-Signature-256');
    
    // Handle OPTIONS request
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    const url = req.url;
    const method = req.method;
    
    log(`${method} ${url} - ${req.headers['user-agent'] || 'Unknown'}`);
    
    // Route requests
    if (url === '/webhook' && method === 'POST') {
        handleWebhook(req, res);
    } else if (url === '/health' && method === 'GET') {
        handleHealth(req, res);
    } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found' }));
    }
});

// Start server
server.listen(CONFIG.port, () => {
    log(`Webhook server listening on port ${CONFIG.port}`);
    log(`Webhook URL: http://your-server:${CONFIG.port}/webhook`);
    log(`Health check: http://your-server:${CONFIG.port}/health`);
    
    // Ensure log directory exists
    const logDir = path.dirname(CONFIG.logFile);
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
    }
});

// Handle process termination
process.on('SIGTERM', () => {
    log('Received SIGTERM, shutting down gracefully');
    server.close(() => {
        log('Webhook server stopped');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    log('Received SIGINT, shutting down gracefully');
    server.close(() => {
        log('Webhook server stopped');
        process.exit(0);
    });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    log(`Uncaught exception: ${error.message}`);
    log(error.stack);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    log(`Unhandled rejection at: ${promise}, reason: ${reason}`);
    process.exit(1);
});