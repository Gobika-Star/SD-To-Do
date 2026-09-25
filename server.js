const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();
const PORT = 3000;
const JWT_SECRET = 'super_secret_session_token_key_123'; // In production, use environment variables

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Mock Databases (In-Memory)
const users = [];
let todos = [];

// --- MIDDLEWARE: PROTECT SECURE ROUTES ---
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Access denied. Token missing.' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid or expired token.' });
        req.user = user;
        next();
    });
};

// --- AUTHENTICATION API ENDPOINTS ---

// REGISTER ROUTE
app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ error: 'All fields are required.' });

        const userExists = users.find(u => u.email === email);
        if (userExists) return res.status(400).json({ error: 'User already exists.' });

        const hashedPassword = await bcrypt.hash(password, 10);
        users.push({ id: Date.now(), email, password: hashedPassword });

        res.status(201).json({ success: true, message: 'User registered successfully!' });
    } catch (err) {
        res.status(500).json({ error: 'Registration failed.' });
    }
});

// LOGIN ROUTE
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email);
    if (!user) return res.status(400).json({ error: 'User not found.' });

    try {
        if (await bcrypt.compare(password, user.password)) {
            // Generate Session Token passing user metadata safely
            const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
            res.json({ success: true, token, email: user.email });
        } else {
            res.status(400).json({ error: 'Invalid password credentials.' });
        }
    } catch {
        res.status(500).json({ error: 'Login engine failure.' });
    }
});

// --- PROTECTED TO-DO CRUD API ENDPOINTS (Requires valid JWT) ---

// GET: Fetch User-Specific Tasks
app.get('/api/todos', authenticateToken, (req, res) => {
    const userTodos = todos.filter(t => t.userId === req.user.userId);
    res.json(userTodos);
});

// POST: Add a new task linked to the active user
app.post('/api/todos', authenticateToken, (req, res) => {
    const { title } = req.body;
    if (!title || title.trim() === '') return res.status(400).json({ error: 'Title required.' });

    const newTodo = {
        id: Date.now(),
        userId: req.user.userId,
        title: title.trim(),
        completed: false
    };

    todos.push(newTodo);
    res.status(201).json(newTodo);
});

// PUT: Toggle completion state
app.put('/api/todos/:id', authenticateToken, (req, res) => {
    const id = parseInt(req.params.id);
    const todo = todos.find(t => t.id === id && t.userId === req.user.userId);

    if (!todo) return res.status(404).json({ error: 'Task not found.' });
    todo.completed = !todo.completed;
    res.json(todo);
});

// DELETE: Remove task
app.delete('/api/todos/:id', authenticateToken, (req, res) => {
    const id = parseInt(req.params.id);
    todos = todos.filter(t => !(t.id === id && t.userId === req.user.userId));
    res.json({ success: true });
});

// Fallback Page Routing Links
app.get('/dashboard', (req, res) => res.sendFile(path.join(__dirname, 'public/dashboard.html')));

app.listen(PORT, () => console.log(`Secure server online at http://localhost:${PORT}`));
