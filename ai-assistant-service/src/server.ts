import 'dotenv/config';
import app from './app';

const PORT = process.env.PORT || 4002;

async function main() {
  app.listen(PORT, () => {
    console.log(`ai-assistant-service running on port ${PORT}`);
  });
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
