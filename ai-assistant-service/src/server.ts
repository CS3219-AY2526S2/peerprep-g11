import 'dotenv/config';
import app from './app';
import { connectDB } from './config/db';

const PORT = process.env.PORT || 4002;

async function main() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`ai-assistant-service running on port ${PORT}`);
  });
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
