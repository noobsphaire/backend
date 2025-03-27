const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const mysql = require('mysql2');

const app = express();
const PORT = 3000;

// Enable CORS to allow requests from the frontend
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Configure MySQL connection
const db = mysql.createConnection({
  host: 'localhost', // Replace with your MySQL host (e.g., PlanetScale hostname if using PlanetScale)
  user: 'root', // Replace with your MySQL username
  password: 'your_password', // Replace with your MySQL password
  database: 'homework_app', // Replace with your MySQL database name
});

// Connect to the database
db.connect(err => {
  if (err) {
    console.error('Error connecting to the database:', err);
    process.exit(1);
  }
  console.log('Connected to the MySQL database.');
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Save files in the "uploads" folder
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname); // Add timestamp to file name
  },
});
const upload = multer({ storage });

// Endpoint to get all submissions
app.get('/submissions', (req, res) => {
  const query = 'SELECT * FROM submissions ORDER BY created_at DESC';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching submissions:', err);
      return res.status(500).json({ error: 'Failed to fetch submissions' });
    }
    res.json(results);
  });
});

// Endpoint to handle file uploads
app.post('/upload', upload.single('file'), (req, res) => {
  const { name, subject } = req.body;
  const file = req.file;

  if (!name || !subject || !file) {
    return res.status(400).json({ error: 'All fields are required!' });
  }

  const fileUrl = `/uploads/${file.filename}`;
  const query = 'INSERT INTO submissions (name, subject, file_name, file_url) VALUES (?, ?, ?, ?)';
  const values = [name, subject, file.originalname, fileUrl];

  db.query(query, values, (err, result) => {
    if (err) {
      console.error('Error saving submission:', err);
      return res.status(500).json({ error: 'Failed to save submission' });
    }
    res.status(201).json({ message: 'Submission saved!' });
  });
});

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});