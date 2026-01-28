const dotenv = require('dotenv');
const path = require('path');

// Load env from server directory
dotenv.config({ path: path.join(__dirname, '../.env') });

const { seedDefaultArticles } = require('../services/knowledgeBaseService');

async function main() {
  console.log('Seeding Knowledge Base...');
  try {
    await seedDefaultArticles();
    console.log('✅ Knowledge Base seeded successfully.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding KB:', error);
    process.exit(1);
  }
}

main();
