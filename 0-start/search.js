require('dotenv').config();

const { db } = require('./db');

async function search(query) {
  console.log(`Searching for: "${query}"`);

  try {

    const products = await db.collection('products').find({
      name: { $regex: query, $options: 'i' }
    }).toArray();

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