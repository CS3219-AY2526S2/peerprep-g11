import 'dotenv/config';
import { connectDB } from '../config/db';
import { User } from '../models/User';

async function seed() {
  await connectDB();

  const email = 'admin@peerprep.local';
  const password = 'Admin1234!';

  const existing = await User.findOne({ email });
  if (existing) {
    console.log('Admin user already exists, skipping seed.');
    process.exit(0);
  }

  await User.create({ email, password, role: 'admin' });
  console.log(`Admin user created: ${email}`);
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
