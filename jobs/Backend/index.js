const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors()); // Enable CORS

// MySQL connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',  // Your MySQL username
    password: 'Swati@1234',  // Your MySQL password
    database: 'freelance_jobs'
});

// Connect to the database
db.connect(err => {
    if (err) {
        console.error('Error connecting to the database:', err);
        return;
    }
    console.log('Connected to the MySQL database.');
});

// API route to fetch all jobs
app.get('/jobs', (req, res) => {
    const sql = 'SELECT * FROM jobs';
    db.query(sql, (err, result) => {
        if (err) throw err;
        res.json(result); // Send jobs as JSON response
    });
});

// API route to search jobs by title (case-insensitive)
app.get('/jobs/search/:title', (req, res) => {
    const title = req.params.title.toLowerCase();  // Convert search input to lowercase
    const sql = 'SELECT * FROM jobs WHERE LOWER(title) LIKE ?';
    db.query(sql, [`%${title}%`], (err, result) => {
        if (err) throw err;
        res.json(result);
    });
});

// API route to fetch jobs by category
app.get('/jobs/category/:category', (req, res) => {
    const category = req.params.category;
    const sql = 'SELECT * FROM jobs WHERE category = ?';
    db.query(sql, [category], (err, result) => {
        if (err) throw err;
        res.json(result);
    });
});

// New API route to search across title, description, and category
app.get('/search', (req, res) => {
    const searchTerm = req.query.q.toLowerCase(); // Case-insensitive search
    const sql = `SELECT * FROM jobs WHERE LOWER(title) LIKE ? OR LOWER(description) LIKE ? OR LOWER(category) LIKE ?`;
    db.query(sql, [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`], (err, results) => {
        if (err) throw err;
        res.json(results);
    });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
