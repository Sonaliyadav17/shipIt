import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns';

// load env from server/.env first, then fallback to project root .env
dotenv.config();
if (!process.env.MONGODB_URI) {
  const path = new URL('../.env', import.meta.url).pathname;
  dotenv.config({ path });
}

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('MONGODB_URI not set; please check .env');
  process.exit(1);
}

try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (err) {
  // ignore
}

(async () => {
  try {
    console.log('Attempting to connect to MongoDB using URI from .env...');
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
    console.log('Connected to MongoDB (diagnostic)');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Full MongoDB connection error:');
    console.error(err);
    if (err && err.reason) console.error('Reason:', err.reason);
    process.exit(1);
  }
})();
