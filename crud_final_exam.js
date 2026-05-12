const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();
const app = express();

// MIDDLEWARE
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));

// DATABASE CONNECTION
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    // ADD THIS LINE BELOW
    ssl: { rejectUnauthorized: false } 
});

// CONNECT & INITIALIZE TABLE
db.connect((err) => {
    if (err) {
        console.log('Database Connection Failed:', err);
    } else {
        console.log('Connected to Aiven Database');
        
        // Auto-create table if it doesn't exist
        const createTableSql = `
            CREATE TABLE IF NOT EXISTS students (
                id INT AUTO_INCREMENT PRIMARY KEY,
                student_id VARCHAR(50) NOT NULL,
                full_name VARCHAR(100) NOT NULL,
                course VARCHAR(100) NOT NULL,
                year_level VARCHAR(20) NOT NULL,
                email VARCHAR(100) NOT NULL
            )
        `;
        db.query(createTableSql, (err) => {
            if (err) console.log('Table creation error:', err);
            else console.log('Students table is ready.');
        });
    }
});

// --- ROUTES ---

// HOME PAGE
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views/index.html'));
});

// ADD STUDENT PAGE
app.get('/add', (req, res) => {
    res.sendFile(path.join(__dirname, 'views/add.html'));
});

// SAVE STUDENT (CREATE)
app.post('/save', (req, res) => {
    const { student_id, full_name, course, year_level, email } = req.body;
    const sql = `INSERT INTO students (student_id, full_name, course, year_level, email) VALUES (?, ?, ?, ?, ?)`;

    db.query(sql, [student_id, full_name, course, year_level, email], (err) => {
        if (err) {
            console.log(err);
            res.send('Insert Failed');
        } else {
            res.redirect('/students');
        }
    });
});

// VIEW STUDENTS (READ)
app.get('/students', (req, res) => {
    const sql = 'SELECT * FROM students';
    db.query(sql, (err, results) => {
        if (err) {
            res.send('Error Fetching Students');
        } else {
            let tableRows = results.map(student => `
                <tr>
                    <td>${student.id}</td>
                    <td>${student.student_id}</td>
                    <td>${student.full_name}</td>
                    <td>${student.course}</td>
                    <td>${student.year_level}</td>
                    <td>${student.email}</td>
                    <td>
                        <a href="/edit/${student.id}" style="color: blue;">Edit</a> | 
                        <a href="/delete/${student.id}" style="color: red;" onclick="return confirm('Delete this record?')">Delete</a>
                    </td>
                </tr>`).join('');

            res.send(`
                <html>
                <head><title>Student Records</title><link rel="stylesheet" href="/style.css"></head>
                <body>
                    <div class="container">
                        <h1>Student Records</h1>
                        <nav><a href="/">Home</a> | <a href="/add">Add Student</a></nav>
                        <table border="1" style="width:100%; margin-top: 20px; border-collapse: collapse;">
                            <tr>
                                <th>ID</th><th>Student ID</th><th>Full Name</th><th>Course</th><th>Year Level</th><th>Email</th><th>Actions</th>
                            </tr>
                            ${tableRows}
                        </table>
                    </div>
                </body>
                </html>
            `);
        }
    });
});

// EDIT PAGE (FOR UPDATE)
app.get('/edit/:id', (req, res) => {
    const sql = 'SELECT * FROM students WHERE id = ?';
    db.query(sql, [req.params.id], (err, result) => {
        if (err || result.length === 0) res.send('Student not found');
        else {
            const s = result[0];
            res.send(`
                <html>
                <head><title>Edit Student</title><link rel="stylesheet" href="/style.css"></head>
                <body>
                    <div class="container">
                        <h1>Edit Student</h1>
                        <form action="/update/${s.id}" method="POST">
                            <input type="text" name="student_id" value="${s.student_id}" required placeholder="Student ID"><br>
                            <input type="text" name="full_name" value="${s.full_name}" required placeholder="Full Name"><br>
                            <input type="text" name="course" value="${s.course}" required placeholder="Course"><br>
                            <input type="text" name="year_level" value="${s.year_level}" required placeholder="Year Level"><br>
                            <input type="email" name="email" value="${s.email}" required placeholder="Email"><br>
                            <button type="submit">Update Student</button>
                        </form>
                        <a href="/students">Back</a>
                    </div>
                </body>
                </html>
            `);
        }
    });
});

// UPDATE LOGIC
app.post('/update/:id', (req, res) => {
    const { student_id, full_name, course, year_level, email } = req.body;
    const sql = `UPDATE students SET student_id=?, full_name=?, course=?, year_level=?, email=? WHERE id=?`;
    db.query(sql, [student_id, full_name, course, year_level, email, req.params.id], (err) => {
        if (err) res.send('Update Failed');
        else res.redirect('/students');
    });
});

// DELETE LOGIC
app.get('/delete/:id', (req, res) => {
    db.query('DELETE FROM students WHERE id = ?', [req.params.id], (err) => {
        if (err) res.send('Delete Failed');
        else res.redirect('/students');
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
