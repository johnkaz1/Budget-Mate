const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Connect to MySQL
const db = mysql.createConnection({
    host: '192.168.1.144',
    user: 'budgetuser',
    password: 'Brasa123!',
    database: 'budget_tracker'
});

db.connect(err => {
    if(err) throw err;
    console.log('Connected to MySQL as budgetuser!');
});

// ----------------- User Authentication -----------------

// Signup endpoint
app.post('/signup', (req, res) => {
    const { username, password } = req.body;
    if(!username || !password) return res.status(400).send({message:'Username and password required'});

    const checkSql = 'SELECT * FROM users WHERE username=?';
    db.query(checkSql, [username], (err, results) => {
        if(err) return res.status(500).send(err);
        if(results.length > 0) return res.status(400).send({message:'Username already exists'});

        const insertSql = 'INSERT INTO users (username, password_hash) VALUES (?, ?)';
        db.query(insertSql, [username, password], (err, result) => {
            if(err) return res.status(500).send(err);
            res.json({ id: result.insertId, username });
        });
    });
});

// Login endpoint
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if(!username || !password) return res.status(400).send({message:'Username and password required'});

    const sql = 'SELECT * FROM users WHERE username=? AND password_hash=?';
    db.query(sql, [username, password], (err, results) => {
        if(err) return res.status(500).send(err);
        if(results.length === 0) return res.status(401).send({ message: 'Invalid username or password' });
        res.json({ id: results[0].id, username: results[0].username });
    });
});

// ----------------- Transactions CRUD -----------------

// Get all transactions for a user
app.get('/transactions/:userId', (req, res) => {
    const userId = req.params.userId;
    db.query('SELECT * FROM transactions WHERE user_id=? ORDER BY date DESC', [userId], (err, results) => {
        if(err) return res.status(500).send(err);
        res.json(results);
    });
});

// Add transaction
app.post('/transactions', (req, res) => {
    const { amount, category, type, date, description, user_id } = req.body;
    const sql = 'INSERT INTO transactions (amount, category, type, date, description, user_id) VALUES (?, ?, ?, ?, ?, ?)';
    db.query(sql, [amount, category, type, date, description, user_id], (err, result) => {
        if(err) return res.status(500).send(err);
        res.json({ id: result.insertId, ...req.body });
    });
});

// Delete transaction
app.delete('/transactions/:id', (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM transactions WHERE id=?', [id], (err) => {
        if(err) return res.status(500).send(err);
        res.json({ message: 'Deleted successfully' });
    });
});

// Update transaction
app.put('/transactions/:id', (req, res) => {
    const { id } = req.params;
    const { amount, category, type, date, description } = req.body;
    const sql = 'UPDATE transactions SET amount=?, category=?, type=?, date=?, description=? WHERE id=?';
    db.query(sql, [amount, category, type, date, description, id], (err) => {
        if(err) return res.status(500).send(err);
        res.json({ message: 'Updated successfully' });
    });
});

// Start server
app.listen(3000, () => console.log('Server running on port 3000'));
