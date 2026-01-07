const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Data file paths
const DATA_DIR = path.join(__dirname, 'data');
const TASKS_FILE = path.join(DATA_DIR, 'tasks.json');
const RULES_FILE = path.join(DATA_DIR, 'automation-rules.json');
const ANALYTICS_FILE = path.join(DATA_DIR, 'analytics.json');

// Initialize data directory and files
async function initializeData() {
    try {
        await fs.mkdir(DATA_DIR, { recursive: true });
        
        // Initialize tasks file
        try {
            await fs.access(TASKS_FILE);
        } catch {
            await fs.writeFile(TASKS_FILE, JSON.stringify([]));
        }
        
        // Initialize rules file
        try {
            await fs.access(RULES_FILE);
        } catch {
            await fs.writeFile(RULES_FILE, JSON.stringify([]));
        }
        
        // Initialize analytics file
        try {
            await fs.access(ANALYTICS_FILE);
        } catch {
            await fs.writeFile(ANALYTICS_FILE, JSON.stringify({
                totalTasksCreated: 0,
                totalTasksCompleted: 0,
                totalAutomationRuns: 0,
                averageCompletionTime: 0,
                lastUpdated: new Date().toISOString()
            }));
        }
        
        console.log('Data files initialized successfully');
    } catch (error) {
        console.error('Error initializing data:', error);
    }
}

// Helper functions for data operations
async function readData(filePath) {
    try {
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error reading ${filePath}:`, error);
        return [];
    }
}

async function writeData(filePath, data) {
    try {
        await fs.writeFile(filePath, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error(`Error writing ${filePath}:`, error);
        return false;
    }
}

// AI-powered task prioritization
function calculateTaskPriority(task) {
    let score = 0;
    
    // Priority-based scoring
    const priorityScores = { high: 100, medium: 50, low: 25 };
    score += priorityScores[task.priority] || 0;
    
    // Deadline proximity scoring
    if (task.deadline) {
        const daysUntilDeadline = (new Date(task.deadline) - new Date()) / (1000 * 60 * 60 * 24);
        if (daysUntilDeadline < 1) score += 50;
        else if (daysUntilDeadline < 3) score += 30;
        else if (daysUntilDeadline < 7) score += 15;
    }
    
    // Keyword analysis
    const urgentKeywords = ['urgent', 'critical', 'asap', 'emergency', 'important'];
    const text = `${task.title} ${task.description || ''}`.toLowerCase();
    urgentKeywords.forEach(keyword => {
        if (text.includes(keyword)) score += 20;
    });
    
    return score;
}

// Intelligent task categorization
function categorizeTask(task) {
    const text = `${task.title} ${task.description || ''}`.toLowerCase();
    
    const categories = {
        development: ['code', 'develop', 'implement', 'build', 'program', 'api', 'database', 'backend', 'frontend'],
        testing: ['test', 'qa', 'bug', 'debug', 'fix', 'quality', 'verify'],
        design: ['design', 'ui', 'ux', 'mockup', 'prototype', 'wireframe', 'interface'],
        deployment: ['deploy', 'release', 'launch', 'publish', 'production', 'server'],
        maintenance: ['maintain', 'update', 'upgrade', 'refactor', 'optimize', 'performance']
    };
    
    let bestCategory = task.category || 'development';
    let maxMatches = 0;
    
    for (const [category, keywords] of Object.entries(categories)) {
        const matches = keywords.filter(keyword => text.includes(keyword)).length;
        if (matches > maxMatches) {
            maxMatches = matches;
            bestCategory = category;
        }
    }
    
    return bestCategory;
}

// Apply automation rules to task
async function applyAutomationRules(task) {
    const rules = await readData(RULES_FILE);
    const appliedRules = [];
    
    for (const rule of rules) {
        if (!rule.enabled) continue;
        
        let shouldApply = false;
        
        // Check trigger
        if (rule.trigger === 'new-task') {
            shouldApply = true;
        }
        
        // Check condition
        if (rule.condition && shouldApply) {
            const text = `${task.title} ${task.description || ''}`.toLowerCase();
            const condition = rule.condition.toLowerCase();
            
            // Simple condition parsing
            if (condition.includes('priority') && condition.includes(task.priority)) {
                shouldApply = true;
            } else if (condition.includes('contains')) {
                const keywords = condition.match(/"([^"]+)"/g);
                if (keywords) {
                    shouldApply = keywords.some(kw => text.includes(kw.replace(/"/g, '').toLowerCase()));
                }
            }
        }
        
        // Apply action
        if (shouldApply) {
            switch (rule.action) {
                case 'prioritize':
                    const score = calculateTaskPriority(task);
                    if (score > 100) task.priority = 'high';
                    else if (score > 50) task.priority = 'medium';
                    else task.priority = 'low';
                    break;
                    
                case 'categorize':
                    task.category = categorizeTask(task);
                    break;
                    
                case 'assign':
                    task.assigned = 'Auto-assigned';
                    break;
            }
            
            rule.executions = (rule.executions || 0) + 1;
            appliedRules.push(rule.name);
        }
    }
    
    await writeData(RULES_FILE, rules);
    return appliedRules;
}

// Update analytics
async function updateAnalytics(event, data) {
    const analytics = await readData(ANALYTICS_FILE);
    
    switch (event) {
        case 'task-created':
            analytics.totalTasksCreated++;
            break;
        case 'task-completed':
            analytics.totalTasksCompleted++;
            break;
        case 'automation-run':
            analytics.totalAutomationRuns++;
            break;
    }
    
    analytics.lastUpdated = new Date().toISOString();
    await writeData(ANALYTICS_FILE, analytics);
}

// API Routes

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Tasks endpoints
app.get('/api/tasks', async (req, res) => {
    try {
        const tasks = await readData(TASKS_FILE);
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }
});

app.get('/api/tasks/:id', async (req, res) => {
    try {
        const tasks = await readData(TASKS_FILE);
        const task = tasks.find(t => t.id === req.params.id);
        if (task) {
            res.json(task);
        } else {
            res.status(404).json({ error: 'Task not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch task' });
    }
});

app.post('/api/tasks', async (req, res) => {
    try {
        const tasks = await readData(TASKS_FILE);
        const newTask = {
            ...req.body,
            id: req.body.id || Date.now().toString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        // Apply AI-powered automation
        const appliedRules = await applyAutomationRules(newTask);
        
        // Auto-categorize if not specified
        if (!newTask.category) {
            newTask.category = categorizeTask(newTask);
        }
        
        tasks.unshift(newTask);
        await writeData(TASKS_FILE, tasks);
        await updateAnalytics('task-created');
        
        res.status(201).json({
            task: newTask,
            appliedRules,
            message: 'Task created successfully'
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create task' });
    }
});

app.put('/api/tasks/:id', async (req, res) => {
    try {
        const tasks = await readData(TASKS_FILE);
        const index = tasks.findIndex(t => t.id === req.params.id);
        
        if (index === -1) {
            return res.status(404).json({ error: 'Task not found' });
        }
        
        const wasCompleted = tasks[index].status === 'completed';
        const isNowCompleted = req.body.status === 'completed';
        
        tasks[index] = {
            ...tasks[index],
            ...req.body,
            updatedAt: new Date().toISOString()
        };
        
        await writeData(TASKS_FILE, tasks);
        
        if (!wasCompleted && isNowCompleted) {
            await updateAnalytics('task-completed');
        }
        
        res.json({ task: tasks[index], message: 'Task updated successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update task' });
    }
});

app.delete('/api/tasks/:id', async (req, res) => {
    try {
        const tasks = await readData(TASKS_FILE);
        const filteredTasks = tasks.filter(t => t.id !== req.params.id);
        
        if (tasks.length === filteredTasks.length) {
            return res.status(404).json({ error: 'Task not found' });
        }
        
        await writeData(TASKS_FILE, filteredTasks);
        res.json({ message: 'Task deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete task' });
    }
});

// Automation rules endpoints
app.get('/api/automation-rules', async (req, res) => {
    try {
        const rules = await readData(RULES_FILE);
        res.json(rules);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch automation rules' });
    }
});

app.post('/api/automation-rules', async (req, res) => {
    try {
        const rules = await readData(RULES_FILE);
        const newRule = {
            ...req.body,
            id: req.body.id || Date.now().toString(),
            createdAt: new Date().toISOString(),
            executions: 0,
            successRate: 100
        };
        
        rules.unshift(newRule);
        await writeData(RULES_FILE, rules);
        
        res.status(201).json({ rule: newRule, message: 'Rule created successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create automation rule' });
    }
});

app.put('/api/automation-rules/:id', async (req, res) => {
    try {
        const rules = await readData(RULES_FILE);
        const index = rules.findIndex(r => r.id === req.params.id);
        
        if (index === -1) {
            return res.status(404).json({ error: 'Rule not found' });
        }
        
        rules[index] = {
            ...rules[index],
            ...req.body,
            updatedAt: new Date().toISOString()
        };
        
        await writeData(RULES_FILE, rules);
        res.json({ rule: rules[index], message: 'Rule updated successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update automation rule' });
    }
});

app.delete('/api/automation-rules/:id', async (req, res) => {
    try {
        const rules = await readData(RULES_FILE);
        const filteredRules = rules.filter(r => r.id !== req.params.id);
        
        if (rules.length === filteredRules.length) {
            return res.status(404).json({ error: 'Rule not found' });
        }
        
        await writeData(RULES_FILE, filteredRules);
        res.json({ message: 'Rule deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete automation rule' });
    }
});

// Analytics endpoint
app.get('/api/analytics', async (req, res) => {
    try {
        const analytics = await readData(ANALYTICS_FILE);
        const tasks = await readData(TASKS_FILE);
        const rules = await readData(RULES_FILE);
        
        // Calculate additional metrics
        const completedTasks = tasks.filter(t => t.status === 'completed');
        const automatedTasks = tasks.filter(t => t.automated);
        const totalExecutions = rules.reduce((sum, r) => sum + (r.executions || 0), 0);
        
        res.json({
            ...analytics,
            currentStats: {
                totalTasks: tasks.length,
                completedTasks: completedTasks.length,
                automatedTasks: automatedTasks.length,
                activeRules: rules.filter(r => r.enabled).length,
                totalAutomationExecutions: totalExecutions,
                completionRate: tasks.length > 0 ? (completedTasks.length / tasks.length * 100).toFixed(1) : 0,
                automationRate: tasks.length > 0 ? (automatedTasks.length / tasks.length * 100).toFixed(1) : 0
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch analytics' });
    }
});

// AI Insights endpoint
app.get('/api/insights', async (req, res) => {
    try {
        const tasks = await readData(TASKS_FILE);
        const insights = [];
        
        // Analyze task distribution
        const categories = {};
        tasks.forEach(task => {
            categories[task.category] = (categories[task.category] || 0) + 1;
        });
        
        // Find most common category
        const mostCommonCategory = Object.entries(categories)
            .sort((a, b) => b[1] - a[1])[0];
        
        if (mostCommonCategory) {
            insights.push({
                type: 'trend',
                title: 'Task Category Trend',
                description: `Most tasks are in ${mostCommonCategory[0]} (${mostCommonCategory[1]} tasks). Consider creating specialized automation rules for this category.`
            });
        }
        
        // Analyze completion times
        const completedWithDates = tasks.filter(t => 
            t.status === 'completed' && t.createdAt && t.updatedAt
        );
        
        if (completedWithDates.length > 0) {
            const avgTime = completedWithDates.reduce((sum, task) => {
                const created = new Date(task.createdAt);
                const updated = new Date(task.updatedAt);
                return sum + (updated - created);
            }, 0) / completedWithDates.length;
            
            const avgDays = (avgTime / (1000 * 60 * 60 * 24)).toFixed(1);
            
            insights.push({
                type: 'performance',
                title: 'Average Completion Time',
                description: `Tasks are completed in an average of ${avgDays} days. Automation could help reduce this time.`
            });
        }
        
        // Priority analysis
        const highPriorityPending = tasks.filter(t => 
            t.priority === 'high' && t.status !== 'completed'
        ).length;
        
        if (highPriorityPending > 0) {
            insights.push({
                type: 'alert',
                title: 'High Priority Items',
                description: `${highPriorityPending} high-priority tasks require attention. Consider delegating or automating similar tasks.`
            });
        }
        
        res.json(insights);
    } catch (error) {
        res.status(500).json({ error: 'Failed to generate insights' });
    }
});

// Start server
async function startServer() {
    await initializeData();
    
    app.listen(PORT, () => {
        console.log('╔════════════════════════════════════════════════════════════╗');
        console.log('║  Smart Task Automation & Optimization Platform - Backend  ║');
        console.log('╠════════════════════════════════════════════════════════════╣');
        console.log(`║  Server running on: http://localhost:${PORT}                  ║`);
        console.log(`║  API endpoint: http://localhost:${PORT}/api                   ║`);
        console.log('║  Status: ONLINE                                            ║');
        console.log('╚════════════════════════════════════════════════════════════╝');
    });
}

startServer();

module.exports = app;
