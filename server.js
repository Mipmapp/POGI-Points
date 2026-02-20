import app from './SSAAM_VERCEL_BACKEND.js';

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Students login: POST http://localhost:${PORT}/apis/students/login`);
});
