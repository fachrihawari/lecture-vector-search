require('dotenv').config();

const { db } = require('./db');
const { generateEmbedding } = require('./helpers');
const products = require('./products.json');

async function seedData() {
  try {
    // Clear existing data
    await db.collection('products').deleteMany({});
    console.log('Cleared existing data');

    // Generate embeddings and insert documents
    for (const product of products) {

      const textToEmbed = `${product.name}. ${product.description}`;
      const embedding = await generateEmbedding(textToEmbed);

      const document = {
        ...product,
        embedding: embedding,
        createdAt: new Date()
      };

      await db.collection('products').insertOne(document);
      console.log(`✓ Inserted: ${product.name}`);
    }

    console.log('\n✅ Successfully seeded all products!');
    console.log(`Total documents: ${products.length}`);

  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    await db.client.close();
  }
}

seedData();