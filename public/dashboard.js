const token = localStorage.getItem('todo_token');

function handleLogout() {
    localStorage.removeItem('todo_token');
    localStorage.removeItem('user_email');
    window.location.href = '/';
}

async function apiRequest(url, options = {}) {
    const response = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
            Authorization: `Bearer ${token}`
        }
    });

    if (response.status === 401 || response.status === 403) {
        handleLogout();
        throw new Error('Your session has expired. Please log in again.');
    }

    return response;
}

function showTaskError(message) {
    const existingError = document.querySelector('.task-error');
    if (existingError) existingError.remove();

    const error = document.createElement('p');
    error.className = 'task-error';
    error.textContent = message;
    document.querySelector('.task-form').after(error);
    setTimeout(() => error.remove(), 4000);
}

function renderTasks(tasks) {
    const taskList = document.getElementById('task-list');
    const taskBadge = document.getElementById('task-badge');
    taskList.replaceChildren();
    taskBadge.textContent = `${tasks.length} Task${tasks.length === 1 ? '' : 's'}`;

    if (tasks.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        emptyState.textContent = 'No dashboard tasks found. Create one above!';
        taskList.appendChild(emptyState);
        return;
    }

    tasks.forEach(task => {
        const row = document.createElement('li');
        row.className = `task-row ${task.completed ? 'completed' : ''}`;

        const taskLeft = document.createElement('div');
        taskLeft.className = 'task-left';
        taskLeft.addEventListener('click', () => toggleTask(task.id));

        const checkbox = document.createElement('div');
        checkbox.className = 'checkbox';

        const taskText = document.createElement('span');
        taskText.className = 'task-text';
        taskText.textContent = task.title;
        taskLeft.append(checkbox, taskText);

        const deleteButton = document.createElement('button');
        deleteButton.className = 'delete-btn';
        deleteButton.type = 'button';
        deleteButton.textContent = '✕';
        deleteButton.addEventListener('click', () => deleteTask(task.id));

        row.append(taskLeft, deleteButton);
        taskList.appendChild(row);
    });
}

async function loadTasks() {
    const response = await apiRequest('/api/todos');
    const tasks = await response.json();
    if (!response.ok) throw new Error(tasks.error || 'Could not load tasks.');
    renderTasks(tasks);
}

async function toggleTask(id) {
    try {
        const response = await apiRequest(`/api/todos/${id}`, { method: 'PUT' });
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Could not update task.');
        }
        await loadTasks();
    } catch (error) {
        showTaskError(error.message);
    }
}

async function deleteTask(id) {
    try {
        const response = await apiRequest(`/api/todos/${id}`, { method: 'DELETE' });
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Could not delete task.');
        }
        await loadTasks();
    } catch (error) {
        showTaskError(error.message);
    }
}

async function initializeDashboard() {
    if (!token) {
        handleLogout();
        return;
    }

    const email = localStorage.getItem('user_email') || 'Active Account';
    document.getElementById('user-display-email').textContent = email;
    document.getElementById('avatar').textContent = email.charAt(0).toUpperCase();

    document.getElementById('task-form').addEventListener('submit', async event => {
        event.preventDefault();
        const input = document.getElementById('task-input');
        const title = input.value.trim();
        if (!title) return;

        try {
            const response = await apiRequest('/api/todos', {
                method: 'POST',
                body: JSON.stringify({ title })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Could not add task.');

            input.value = '';
            await loadTasks();
        } catch (error) {
            showTaskError(error.message);
        }
    });

    try {
        await loadTasks();
    } catch (error) {
        showTaskError(error.message);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeDashboard);
} else {
    initializeDashboard();
}
