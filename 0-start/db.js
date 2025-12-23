const { MongoClient } = require('mongodb');

const client = new MongoClient(process.env.MONGODB_URL);

const db = client.db('vector-search-db');

module.exports = { db };