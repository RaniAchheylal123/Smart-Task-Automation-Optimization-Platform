// API Configuration
const API_URL = 'http://localhost:3000/api';

// State Management
const state = {
    tasks: [],
    automationRules: [],
    activities: [],
    currentView: 'dashboard'
};

// Utility Functions
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

const showToast = (message, type = 'success') => {
    const container = $('#toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span>${message}</span>
    `;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
};

const addActivity = (text, type = 'info') => {
    const activity = {
        text,
        type,
        timestamp: new Date()
    };
    state.activities.unshift(activity);
    renderActivities();
};

// API Functions
const api = {
    async get(endpoint) {
        try {
            const response = await fetch(`${API_URL}${endpoint}`);
            if (!response.ok) throw new Error('Network response was not ok');
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            showToast('Failed to fetch data. Running in offline mode.', 'error');
            return null;
        }
    },
    
    async post(endpoint, data) {
        try {
            const response = await fetch(`${API_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!response.ok) throw new Error('Network response was not ok');
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            showToast('Failed to save data. Running in offline mode.', 'error');
            return null;
        }
    },
    
    async put(endpoint, data) {
        try {
            const response = await fetch(`${API_URL}${endpoint}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!response.ok) throw new Error('Network response was not ok');
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            showToast('Failed to update data. Running in offline mode.', 'error');
            return null;
        }
    },
    
    async delete(endpoint) {
        try {
            const response = await fetch(`${API_URL}${endpoint}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Network response was not ok');
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            showToast('Failed to delete data. Running in offline mode.', 'error');
            return null;
        }
    }
};

// Check server status
async function checkServerStatus() {
    try {
        const response = await fetch(`${API_URL}/health`, { method: 'GET', timeout: 5000 });
        if (response.ok) {
            $('#server-status').textContent = 'Server Online';
            $('#server-status').classList.add('online');
            return true;
        }
    } catch (error) {
        $('#server-status').textContent = 'Offline Mode';
        $('#server-status').classList.remove('online');
        return false;
    }
}

// Render Functions
function renderStats() {
    const totalTasks = state.tasks.length;
    const automatedTasks = state.tasks.filter(t => t.automated).length;
    const completedTasks = state.tasks.filter(t => t.status === 'completed').length;
    const successRate = totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(1) : 0;
    const timeSaved = totalTasks * 2.5;
    
    $('#total-tasks').textContent = totalTasks;
    $('#automated-tasks').textContent = automatedTasks;
    $('#success-rate').textContent = `${successRate}%`;
    $('#time-saved').textContent = `${timeSaved.toFixed(0)}h`;
}

function renderPerformanceChart() {
    const chartContainer = $('#performance-chart');
    chartContainer.innerHTML = '';
    
    const days = 7;
    const data = Array.from({ length: days }, (_, i) => ({
        day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
        value: Math.floor(Math.random() * 50) + 30
    }));
    
    const maxValue = Math.max(...data.map(d => d.value));
    
    data.forEach(item => {
        const bar = document.createElement('div');
        bar.className = 'chart-bar';
        bar.style.height = `${(item.value / maxValue) * 100}%`;
        bar.title = `${item.day}: ${item.value} tasks`;
        chartContainer.appendChild(bar);
    });
}

function renderDistributionChart() {
    const chartContainer = $('#distribution-chart');
    chartContainer.innerHTML = '';
    
    const categories = {};
    state.tasks.forEach(task => {
        categories[task.category] = (categories[task.category] || 0) + 1;
    });
    
    const maxValue = Math.max(...Object.values(categories), 1);
    
    Object.entries(categories).forEach(([cat, count]) => {
        const bar = document.createElement('div');
        bar.className = 'chart-bar';
        bar.style.height = `${(count / maxValue) * 100}%`;
        bar.title = `${cat}: ${count} tasks`;
        chartContainer.appendChild(bar);
    });
}

function renderActivities() {
    const container = $('#activity-list');
    container.innerHTML = '';
    
    const recentActivities = state.activities.slice(0, 10);
    
    if (recentActivities.length === 0) {
        container.innerHTML = '<div class="activity-item"><p>No recent activity</p></div>';
        return;
    }
    
    recentActivities.forEach(activity => {
        const item = document.createElement('div');
        item.className = 'activity-item';
        item.innerHTML = `
            <div class="activity-icon ${activity.type}">
                ${activity.type === 'success' ? '✓' : activity.type === 'warning' ? '!' : 'i'}
            </div>
            <div class="activity-content">
                <p><strong>${activity.text}</strong></p>
                <span class="activity-time">${formatDate(activity.timestamp)}</span>
            </div>
        `;
        container.appendChild(item);
    });
}

function renderTasks() {
    const container = $('#tasks-grid');
    const searchTerm = $('#search-tasks').value.toLowerCase();
    const priorityFilter = $('#filter-priority').value;
    const statusFilter = $('#filter-status').value;
    
    let filteredTasks = state.tasks.filter(task => {
        const matchesSearch = task.title.toLowerCase().includes(searchTerm) || 
                            task.description.toLowerCase().includes(searchTerm);
        const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
        const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
        return matchesSearch && matchesPriority && matchesStatus;
    });
    
    container.innerHTML = '';
    
    if (filteredTasks.length === 0) {
        container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted);">No tasks found. Create your first task!</p>';
        return;
    }
    
    filteredTasks.forEach(task => {
        const card = document.createElement('div');
        card.className = 'task-card';
        card.innerHTML = `
            <div class="task-header">
                <div>
                    <h3 class="task-title">${task.title}</h3>
                    <p class="task-description">${task.description || 'No description'}</p>
                </div>
            </div>
            <div class="task-meta">
                <span class="badge priority-${task.priority}">${task.priority.toUpperCase()}</span>
                <span class="badge status-${task.status}">${task.status.replace('-', ' ').toUpperCase()}</span>
                <span class="badge">${task.category}</span>
                ${task.automated ? '<span class="badge" style="background: rgba(139, 92, 246, 0.2); color: #c4b5fd;">AUTO</span>' : ''}
            </div>
            ${task.deadline ? `<p style="font-size: 0.875rem; color: var(--text-muted); margin-bottom: 1rem;">Deadline: ${formatDate(task.deadline)}</p>` : ''}
            <div class="task-actions">
                <button class="btn-icon" onclick="updateTaskStatus('${task.id}')" title="Update Status">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M9 11l3 3 8-8"/>
                    </svg>
                </button>
                <button class="btn-icon" onclick="deleteTask('${task.id}')" title="Delete">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z"/>
                    </svg>
                </button>
            </div>
        `;
        container.appendChild(card);
    });
}

function renderAutomationRules() {
    const container = $('#automation-grid');
    container.innerHTML = '';
    
    if (state.automationRules.length === 0) {
        container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted);">No automation rules yet. Create your first rule!</p>';
        return;
    }
    
    state.automationRules.forEach(rule => {
        const card = document.createElement('div');
        card.className = 'rule-card';
        card.innerHTML = `
            <div class="rule-header">
                <h3 class="rule-name">${rule.name}</h3>
                <button class="rule-toggle ${rule.enabled ? 'active' : ''}" onclick="toggleRule('${rule.id}')"></button>
            </div>
            <div class="rule-details">
                <p><strong>Trigger:</strong> ${rule.trigger.replace('-', ' ')}</p>
                <p><strong>Action:</strong> ${rule.action.replace('-', ' ')}</p>
                ${rule.condition ? `<p><strong>Condition:</strong> ${rule.condition}</p>` : ''}
            </div>
            <div class="rule-stats">
                <div class="rule-stat">
                    <div class="rule-stat-label">Executions</div>
                    <div class="rule-stat-value">${rule.executions || 0}</div>
                </div>
                <div class="rule-stat">
                    <div class="rule-stat-label">Success Rate</div>
                    <div class="rule-stat-value">${rule.successRate || 100}%</div>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

function renderInsights() {
    const container = $('#insights-list');
    container.innerHTML = '';
    
    const insights = generateInsights();
    
    insights.forEach(insight => {
        const item = document.createElement('div');
        item.className = 'insight-item';
        item.innerHTML = `
            <h4>${insight.title}</h4>
            <p>${insight.description}</p>
        `;
        container.appendChild(item);
    });
}

function generateInsights() {
    const insights = [];
    
    const highPriorityTasks = state.tasks.filter(t => t.priority === 'high' && t.status !== 'completed').length;
    if (highPriorityTasks > 0) {
        insights.push({
            title: 'High Priority Tasks Detected',
            description: `You have ${highPriorityTasks} high priority tasks pending. Consider automating similar tasks to improve efficiency.`
        });
    }
    
    const automationRate = state.tasks.length > 0 
        ? ((state.tasks.filter(t => t.automated).length / state.tasks.length) * 100).toFixed(0)
        : 0;
    
    if (automationRate < 50) {
        insights.push({
            title: 'Automation Opportunity',
            description: `Only ${automationRate}% of your tasks are automated. Increase automation to save more time and reduce manual effort.`
        });
    } else {
        insights.push({
            title: 'Excellent Automation Rate',
            description: `${automationRate}% of your tasks are automated. You're on the right track to maximum efficiency!`
        });
    }
    
    const overdueCount = state.tasks.filter(t => {
        if (!t.deadline) return false;
        return new Date(t.deadline) < new Date() && t.status !== 'completed';
    }).length;
    
    if (overdueCount > 0) {
        insights.push({
            title: 'Overdue Tasks Alert',
            description: `${overdueCount} tasks are overdue. Set up deadline alerts to stay on track.`
        });
    }
    
    if (insights.length === 0) {
        insights.push({
            title: 'All Systems Optimal',
            description: 'Your task management is running smoothly. Keep up the great work!'
        });
    }
    
    return insights;
}

// Event Handlers
function switchView(viewName) {
    $$('.view').forEach(v => v.classList.remove('active'));
    $$('.nav-btn').forEach(b => b.classList.remove('active'));
    
    $(`#${viewName}-view`).classList.add('active');
    $(`.nav-btn[data-view="${viewName}"]`).classList.add('active');
    
    state.currentView = viewName;
    
    if (viewName === 'analytics') {
        renderInsights();
        renderDistributionChart();
    }
}

function openModal(modalId) {
    $(`#${modalId}`).classList.add('active');
}

function closeModal(modalId) {
    $(`#${modalId}`).classList.remove('active');
}

async function createTask(taskData) {
    const newTask = {
        id: Date.now().toString(),
        ...taskData,
        status: 'pending',
        createdAt: new Date().toISOString()
    };
    
    const result = await api.post('/tasks', newTask);
    if (result || !navigator.onLine) {
        state.tasks.unshift(newTask);
        renderTasks();
        renderStats();
        renderDistributionChart();
        addActivity(`Created task: ${newTask.title}`, 'success');
        showToast('Task created successfully!', 'success');
    }
}

async function deleteTask(taskId) {
    if (!confirm('Are you sure you want to delete this task?')) return;
    
    const result = await api.delete(`/tasks/${taskId}`);
    if (result || !navigator.onLine) {
        state.tasks = state.tasks.filter(t => t.id !== taskId);
        renderTasks();
        renderStats();
        renderDistributionChart();
        addActivity('Deleted a task', 'warning');
        showToast('Task deleted successfully!', 'success');
    }
}

async function updateTaskStatus(taskId) {
    const task = state.tasks.find(t => t.id === taskId);
    if (!task) return;
    
    const statusOrder = ['pending', 'in-progress', 'completed'];
    const currentIndex = statusOrder.indexOf(task.status);
    task.status = statusOrder[(currentIndex + 1) % statusOrder.length];
    
    const result = await api.put(`/tasks/${taskId}`, task);
    if (result || !navigator.onLine) {
        renderTasks();
        renderStats();
        addActivity(`Updated task status: ${task.title}`, 'success');
        showToast('Task status updated!', 'success');
    }
}

async function createAutomationRule(ruleData) {
    const newRule = {
        id: Date.now().toString(),
        ...ruleData,
        enabled: true,
        executions: 0,
        successRate: 100,
        createdAt: new Date().toISOString()
    };
    
    const result = await api.post('/automation-rules', newRule);
    if (result || !navigator.onLine) {
        state.automationRules.unshift(newRule);
        renderAutomationRules();
        addActivity(`Created automation rule: ${newRule.name}`, 'success');
        showToast('Automation rule created successfully!', 'success');
    }
}

async function toggleRule(ruleId) {
    const rule = state.automationRules.find(r => r.id === ruleId);
    if (!rule) return;
    
    rule.enabled = !rule.enabled;
    
    const result = await api.put(`/automation-rules/${ruleId}`, rule);
    if (result || !navigator.onLine) {
        renderAutomationRules();
        addActivity(`${rule.enabled ? 'Enabled' : 'Disabled'} rule: ${rule.name}`, 'info');
        showToast(`Rule ${rule.enabled ? 'enabled' : 'disabled'}!`, 'info');
    }
}

// Initialize App
async function init() {
    console.log('Initializing Smart Task Automation Platform...');
    
    // Check server status
    const serverOnline = await checkServerStatus();
    
    // Load data from server or use demo data
    if (serverOnline) {
        const tasks = await api.get('/tasks');
        const rules = await api.get('/automation-rules');
        
        if (tasks) state.tasks = tasks;
        if (rules) state.automationRules = rules;
    } else {
        // Load demo data for offline mode
        state.tasks = [
            {
                id: '1',
                title: 'Implement user authentication',
                description: 'Add JWT-based authentication system',
                priority: 'high',
                status: 'in-progress',
                category: 'development',
                automated: false,
                deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                createdAt: new Date().toISOString()
            },
            {
                id: '2',
                title: 'Design dashboard mockups',
                description: 'Create UI/UX designs for admin dashboard',
                priority: 'medium',
                status: 'pending',
                category: 'design',
                automated: true,
                deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
                createdAt: new Date().toISOString()
            }
        ];
        
        state.automationRules = [
            {
                id: '1',
                name: 'Auto-prioritize urgent tasks',
                trigger: 'new-task',
                action: 'prioritize',
                condition: 'contains "urgent" or "critical"',
                enabled: true,
                executions: 45,
                successRate: 98
            }
        ];
    }
    
    // Initial render
    renderStats();
    renderPerformanceChart();
    renderDistributionChart();
    renderTasks();
    renderAutomationRules();
    renderActivities();
    renderInsights();
    
    addActivity('System initialized successfully', 'success');
    
    // Setup event listeners
    setupEventListeners();
    
    console.log('App initialized successfully!');
}

function setupEventListeners() {
    // Navigation
    $$('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => switchView(btn.dataset.view));
    });
    
    // Modals
    $('#create-task-btn').addEventListener('click', () => openModal('task-modal'));
    $('#create-rule-btn').addEventListener('click', () => openModal('rule-modal'));
    
    $$('.close-modal').forEach(btn => {
        btn.addEventListener('click', () => closeModal(btn.dataset.modal));
    });
    
    // Close modal on outside click
    $$('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });
    
    // Forms
    $('#task-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const taskData = {
            title: formData.get('title'),
            description: formData.get('description'),
            priority: formData.get('priority'),
            category: formData.get('category'),
            deadline: formData.get('deadline'),
            automated: formData.get('automate') === 'on'
        };
        await createTask(taskData);
        e.target.reset();
        closeModal('task-modal');
    });
    
    $('#rule-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const ruleData = {
            name: formData.get('name'),
            trigger: formData.get('trigger'),
            action: formData.get('action'),
            condition: formData.get('condition')
        };
        await createAutomationRule(ruleData);
        e.target.reset();
        closeModal('rule-modal');
    });
    
    // Filters
    $('#search-tasks').addEventListener('input', renderTasks);
    $('#filter-priority').addEventListener('change', renderTasks);
    $('#filter-status').addEventListener('change', renderTasks);
}

// Make functions globally available
window.deleteTask = deleteTask;
window.updateTaskStatus = updateTaskStatus;
window.toggleRule = toggleRule;

// Start the app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
