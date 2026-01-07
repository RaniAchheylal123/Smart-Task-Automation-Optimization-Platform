# 🔌 API Testing Examples

## Quick API Test Commands

### Health Check
```bash
curl http://localhost:3000/api/health
```

### Get All Tasks
```bash
curl http://localhost:3000/api/tasks
```

### Create a Task
```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Build authentication system",
    "description": "Implement JWT-based auth with refresh tokens",
    "priority": "high",
    "category": "development",
    "automated": true,
    "deadline": "2026-01-15"
  }'
```

### Get All Automation Rules
```bash
curl http://localhost:3000/api/automation-rules
```

### Create an Automation Rule
```bash
curl -X POST http://localhost:3000/api/automation-rules \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Auto-prioritize urgent tasks",
    "trigger": "new-task",
    "action": "prioritize",
    "condition": "contains \"urgent\" or \"critical\"",
    "enabled": true
  }'
```

### Get Analytics
```bash
curl http://localhost:3000/api/analytics
```

### Get AI Insights
```bash
curl http://localhost:3000/api/insights
```

### Update a Task Status
```bash
# First get a task ID from the /api/tasks endpoint
# Then use it here (replace {TASK_ID})
curl -X PUT http://localhost:3000/api/tasks/{TASK_ID} \
  -H "Content-Type: application/json" \
  -d '{
    "status": "completed"
  }'
```

### Delete a Task
```bash
# Replace {TASK_ID} with actual task ID
curl -X DELETE http://localhost:3000/api/tasks/{TASK_ID}
```

---

## JavaScript Fetch Examples

### Create Task from Frontend
```javascript
async function createTask() {
  const response = await fetch('http://localhost:3000/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Design landing page',
      description: 'Create responsive landing page mockups',
      priority: 'medium',
      category: 'design',
      automated: false
    })
  });
  const data = await response.json();
  console.log('Created:', data);
}
```

### Get All Tasks
```javascript
async function getTasks() {
  const response = await fetch('http://localhost:3000/api/tasks');
  const tasks = await response.json();
  console.log('Tasks:', tasks);
}
```

### Update Task
```javascript
async function updateTask(taskId, updates) {
  const response = await fetch(`http://localhost:3000/api/tasks/${taskId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  });
  const data = await response.json();
  console.log('Updated:', data);
}
```

---

## Expected Response Formats

### Health Check Response
```json
{
  "status": "ok",
  "timestamp": "2026-01-07T12:00:00.000Z"
}
```

### Task Creation Response
```json
{
  "task": {
    "id": "1704628800000",
    "title": "Build authentication system",
    "description": "Implement JWT-based auth",
    "priority": "high",
    "category": "development",
    "automated": true,
    "status": "pending",
    "createdAt": "2026-01-07T12:00:00.000Z",
    "updatedAt": "2026-01-07T12:00:00.000Z"
  },
  "appliedRules": ["Auto-prioritize urgent tasks"],
  "message": "Task created successfully"
}
```

### Analytics Response
```json
{
  "totalTasksCreated": 15,
  "totalTasksCompleted": 12,
  "totalAutomationRuns": 45,
  "averageCompletionTime": 2.5,
  "lastUpdated": "2026-01-07T12:00:00.000Z",
  "currentStats": {
    "totalTasks": 15,
    "completedTasks": 12,
    "automatedTasks": 10,
    "activeRules": 3,
    "totalAutomationExecutions": 45,
    "completionRate": "80.0",
    "automationRate": "66.7"
  }
}
```

---

## Testing Scenarios

### Scenario 1: Task Workflow
1. Create a high-priority task with "urgent" keyword
2. Watch automation rules apply automatically
3. Update task status to "in-progress"
4. Complete the task
5. Check analytics to see updated metrics

### Scenario 2: Automation Testing
1. Create automation rule for high-priority tasks
2. Create multiple tasks with different priorities
3. Verify rules are applied correctly
4. Check rule execution counts in analytics

### Scenario 3: AI Features
1. Create tasks with various keywords
2. Check auto-categorization accuracy
3. Review AI-generated insights
4. Verify priority calculations

---

## Common Status Codes

- `200 OK` - Successful GET/PUT/DELETE
- `201 Created` - Successful POST
- `404 Not Found` - Resource doesn't exist
- `500 Internal Server Error` - Server error

---

**Happy Testing! 🚀**
