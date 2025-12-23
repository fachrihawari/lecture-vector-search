require('dotenv').config();

const { db } = require('./db');
const { generateEmbedding } = require('./helpers');

async function search(query) {
  console.log(`Searching for: "${query}"`);

  try {
    const embedding = await generateEmbedding(query);

    const pipeline = [
      {
        $vectorSearch: {
          index: 'vector_index',
          path: 'embedding',
          queryVector: embedding,
          numCandidates: 768,
          limit: 3
        }
      }, {
        '$project': {
          '_id': 0,
          'name': 1,
          'score': {
            '$meta': 'vectorSearchScore'
          }
        }
      }
    ]

    const products = await db.collection('products').aggregate(pipeline).toArray();

    console.log("Search Results:");
    console.log(products);

  } catch (error) {
    console.error('Error searching data:', error);
  } finally {
    await db.client.close();
  }
}

if (process.argv[2]) {
  const query = process.argv.slice(2).join(' ');
  search(query);
} else {
  console.log("\nNo search query provided. Run example searches with:");
  console.log("node search.js \"your search query here\"");
}