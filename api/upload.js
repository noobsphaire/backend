import { Pool } from 'pg';
import multer from 'multer';
import nextConnect from 'next-connect';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Configure multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: './public/uploads', // Save files in the "public/uploads" folder
    filename: (req, file, cb) => {
      cb(null, Date.now() + '-' + file.originalname); // Add timestamp to file name
    },
  }),
});

const apiRoute = nextConnect({
  onError(error, req, res) {
    res.status(501).json({ error: `Something went wrong: ${error.message}` });
  },
  onNoMatch(req, res) {
    res.status(405).json({ error: 'Method not allowed' });
  },
});

apiRoute.use(upload.single('file'));

apiRoute.post(async (req, res) => {
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

export default apiRoute;

export const config = {
  api: {
    bodyParser: false, // Disable body parsing for file uploads
  },
};
