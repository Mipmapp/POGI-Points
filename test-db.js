import dotenv from 'dotenv';
dotenv.config();

console.log('MONGODB_URI:', process.env.MONGODB_URI ? process.env.MONGODB_URI.substring(0, 50) + '...' : 'undefined');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'set' : 'not set');

import mongoose from 'mongoose';

try {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('✗ MONGODB_URI is undefined');
    process.exit(1);
  }
  
  console.log('Attempting to connect...');
  
  await mongoose.connect(uri);
  
  console.log('✓ Connected to MongoDB successfully');
  process.exit(0);
} catch (err) {
  console.error('✗ Failed:', err.message);
  process.exit(1);
}
