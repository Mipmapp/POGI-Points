import dotenv from 'dotenv';

// Load environment variables IMMEDIATELY
dotenv.config();

// Import the original backend which has all 114+ routes
// The modular api/app.js structure is being built for gradual migration
const { default: app } = await import('./SSAAM_VERCEL_BACKEND.js');

const PORT = process.env.PORT || 3001;

// Start server
async function startServer() {
  try {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`Students login: POST http://localhost:${PORT}/apis/students/login`);
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
}

startServer();

startServer();