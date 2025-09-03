import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

// Serve static files from dist/public (correct build location)
app.use(express.static('dist/public'));

// Professional demo route
app.get('/professional-demo', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/public/index.html'));
});

// Default route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/public/index.html'));
});

const port = 5000;
app.listen(port, () => {
  console.log(`🚀 Demo server running on http://localhost:${port}`);
  console.log(`👀 View professional demo: http://localhost:${port}/professional-demo`);
});