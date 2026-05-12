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


const db = mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false } // Aiven WILL reject the INSERT without this
});


// CONNECT DATABASE
db.connect((err) => {

    if (err) {
        console.log('Database Connection Failed');
        console.log(err);
    } else {
        console.log('Connected to Aiven Database');
    }
});


// HOME PAGE
app.get('/', (req, res) => {

    res.sendFile(path.join(__dirname, 'views/index.html'));
});


// ADD STUDENT PAGE
app.get('/add', (req, res) => {

    res.sendFile(path.join(__dirname, 'views/add.html'));
});


// SAVE STUDENT
app.post('/save', (req, res) => {

    const {
        student_id,
        full_name,
        course,
        year_level,
        email
    } = req.body;

    const sql = `
        INSERT INTO students
        (
            student_id,
            full_name,
            course,
            year_level,
            email
        )
        VALUES (?, ?, ?, ?, ?)
    `;

    db.query(
        sql,
        [
            student_id,
            full_name,
            course,
            year_level,
            email
        ],
        (err) => {

            if (err) {

                console.log(err);
                res.send('Insert Failed');

            } else {

                res.redirect('/students');
            }
        }
    );
});


// VIEW STUDENTS
app.get('/students', (req, res) => {

    const sql = 'SELECT * FROM students';

    db.query(sql, (err, results) => {

        if (err) {

            res.send('Error Fetching Students');

        } else {

            let table = `
            <html>

            <head>

                <title>Student Records</title>

                <link rel="stylesheet" href="/style.css">

            </head>

            <body>

            <div class="container">

            <h1>Student Records</h1>

            <a href="/">Home</a>
            <a href="/add">Add Student</a>

            <table>

                <tr>
                    <th>ID</th>
                    <th>Student ID</th>
                    <th>Full Name</th>
                    <th>Course</th>
                    <th>Year Level</th>
                    <th>Email</th>
                    <th>Actions</th>
                </tr>
            `;

            results.forEach(student => {

                table += `
                    <tr>

                        <td>${student.id}</td>
                        <td>${student.student_id}</td>
                        <td>${student.full_name}</td>
                        <td>${student.course}</td>
                        <td>${student.year_level}</td>
                        <td>${student.email}</td>

                        <td>

                            <a href="/edit/${student.id}">
                                Edit
                            </a>

                            <a href="/delete/${student.id}">
                                Delete
                            </a>

                        </td>

                    </tr>
                `;
            });

            table += `
                </table>

                </div>

                </body>

                </html>
            `;

            res.send(table);
        }
    });
});


// EDIT PAGE
app.get('/edit/:id', (req, res) => {

    const id = req.params.id;

    const sql = 'SELECT * FROM students WHERE id = ?';

    db.query(sql, [id], (err, result) => {

        if (err) {

            res.send('Error Loading Student');

        } else {

            const student = result[0];

            res.send(`

                <html>

                <head>

                    <title>Edit Student</title>

                    <link rel="stylesheet" href="/style.css">

                </head>

                <body>

                <div class="container">

                <h1>Edit Student</h1>

                <form action="/update/${student.id}" method="POST">

                    <input
                        type="text"
                        name="student_id"
                        value="${student.student_id}"
                        required
                    >

                    <input
                        type="text"
                        name="full_name"
                        value="${student.full_name}"
                        required
                    >

                    <input
                        type="text"
                        name="course"
                        value="${student.course}"
                        required
                    >

                    <input
                        type="text"
                        name="year_level"
                        value="${student.year_level}"
                        required
                    >

                    <input
                        type="email"
                        name="email"
                        value="${student.email}"
                        required
                    >

                    <button type="submit">

                        Update Student

                    </button>

                </form>

                <a href="/students">

                    Back

                </a>

                </div>

                </body>

                </html>
            `);
        }
    });
});


// UPDATE STUDENT
app.post('/update/:id', (req, res) => {

    const id = req.params.id;

    const {
        student_id,
        full_name,
        course,
        year_level,
        email
    } = req.body;

    const sql = `
        UPDATE students

        SET
            student_id = ?,
            full_name = ?,
            course = ?,
            year_level = ?,
            email = ?

        WHERE id = ?
    `;

    db.query(
        sql,
        [
            student_id,
            full_name,
            course,
            year_level,
            email,
            id
        ],
        (err) => {

            if (err) {

                res.send('Update Failed');

            } else {

                res.redirect('/students');
            }
        }
    );
});


// DELETE STUDENT
app.get('/delete/:id', (req, res) => {

    const id = req.params.id;

    const sql = 'DELETE FROM students WHERE id = ?';

    db.query(sql, [id], (err) => {

        if (err) {

            res.send('Delete Failed');

        } else {

            res.redirect('/students');
        }
    });
});


// SERVER
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {

    console.log(`Server running on port ${PORT}`);
});
