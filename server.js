const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS to allow requests from the frontend
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Configure PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_BIKoV81zuFON@ep-cold-haze-a26t016q-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require', // Replace with your Neon connection string
  ssl: { rejectUnauthorized: false }, // Enable SSL for Neon
});

// Test the database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Error connecting to PostgreSQL:', err);
  } else {
    console.log('Connected to PostgreSQL:', res.rows[0]);
  }
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
app.get('/submissions', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM submissions ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching submissions:', err);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

// Endpoint to handle file uploads
app.post('/upload', upload.single('file'), async (req, res) => {
  const { name, subject } = req.body;
  const file = req.file;

  if (!name || !subject || !file) {
    return res.status(400).json({ error: 'All fields are required!' });
  }

  const fileUrl = `/uploads/${file.filename}`;
  const query = 'INSERT INTO submissions (name, subject, file_name, file_url) VALUES ($1, $2, $3, $4)';
  const values = [name, subject, file.originalname, fileUrl];

  try {
    await pool.query(query, values);
    res.status(201).json({ message: 'Submission saved!' });
  } catch (err) {
    console.error('Error saving submission:', err);
    res.status(500).json({ error: 'Failed to save submission' });
  }
});

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
