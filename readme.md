# Vector Search with Node.js, MongoDB & Gemini AI

## 1. What is Vector Search?

Vector search is a technique for finding similar items by comparing their numerical representations (vectors) in a multi-dimensional space. Unlike traditional keyword-based search that matches exact words, vector search understands semantic meaning and context.

### Key Concepts:
- **Vectors (Embeddings)**: Numerical arrays that represent the semantic meaning of text, images, or other data
- **Embedding Models**: AI models that convert data into vectors (e.g., Gemini AI, OpenAI embeddings)
- **Similarity Metrics**: Methods to measure how close vectors are to each other (cosine similarity, euclidean distance)

Example:
```
"dog" → [0.2, 0.8, 0.1, ...]
"puppy" → [0.25, 0.82, 0.09, ...]
"car" → [0.9, 0.1, 0.7, ...]
```
The vectors for "dog" and "puppy" will be closer than "dog" and "car".

---

## 2. Why We Use Vector Search?

### Advantages:
1. **Semantic Understanding**: Finds results based on meaning, not just exact keyword matches
2. **Multilingual Support**: Can match queries across different languages
3. **Typo Tolerance**: Works even with spelling mistakes
4. **Context Awareness**: Understands phrases and context
5. **Better User Experience**: Returns more relevant results

### Use Cases:
- **E-commerce**: Product recommendations, visual search
- **Content Discovery**: Finding similar articles, videos, or documents
- **Question Answering**: Matching questions to relevant answers
- **Chatbots**: Understanding user intent
- **RAG Systems**: Retrieval-Augmented Generation for AI applications

---

## 3. Traditional Search vs Vector Search

Think of it like this:
- **Traditional Search** = Finding words that match exactly (like Ctrl+F)
- **Vector Search** = Understanding what you mean (like talking to a smart assistant)

### Traditional Search (Keyword Matching)

Searches for exact words in your database:

**Example:**
```
User searches: "headphone"
Database finds: Products with word "headphone" ✅
Database misses: Products with word "earphone" ❌ (even though it's the same thing!)
```

**Problems:**
- ❌ Can't find similar words (headphone vs earphone)
- ❌ Doesn't work with typos (hedphone)
- ❌ Needs exact keywords

### Vector Search (Meaning-Based)

Understands what you're looking for, not just matching words:

**Example:**
```
User searches: "audio device for music"
Vector Search finds: "Wireless Bluetooth Headphones" ✅
Why? Because it understands the meaning!
```

**Benefits:**
- ✅ Finds similar items even with different words
- ✅ Works with typos
- ✅ Understands what you mean

### Simple Comparison

**You search for: "fitness watch"**

| Traditional Search | Vector Search |
|-------------------|---------------|
| Only finds products with words "fitness" AND "watch" | Finds: Smart Watch, Fitness Tracker, Health Monitor |
| Misses "Smart Watch" if it doesn't contain "fitness" | Understands they're all related! |

### When to Use?

**Traditional Search:** 
- When you need exact matches (like searching for an email address or product code)

**Vector Search:**
- When users search with natural language
- When you want to find similar items
- For product recommendations

---

## 4. How It Works?

### The Vector Search Pipeline:

```
1. Data Preparation
   ↓
2. Generate Embeddings (using Gemini AI)
   ↓
3. Store Vectors in MongoDB
   ↓
4. Create Vector Index
   ↓
5. Query → Generate Query Embedding
   ↓
6. Vector Search (find similar vectors)
   ↓
7. Return Results
```

### Technical Flow:
1. **Indexing Phase**:
   - Convert your documents to embeddings using Gemini AI
   - Store embeddings alongside your data in MongoDB
   - Create a vector search index

2. **Search Phase**:
   - Convert user query to an embedding
   - Use MongoDB's `$vectorSearch` aggregation stage
   - Calculate similarity scores
   - Return the most similar documents

---

## 5. Seeding Data to MongoDB with Embedding

### Prerequisites:
```bash
npm init -y
npm install mongodb @google/generative-ai dotenv
```

### Project Structure:
```
project/
├── .env
├── seed.js
├── search.js
└── package.json
```

### Step 1: Setup Environment Variables
Create `.env` file:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
DB_NAME=vector_search_db
COLLECTION_NAME=products
GEMINI_API_KEY=your_gemini_api_key_here
```

### Step 2: Create Seed Script
Create `seed.js`:

```javascript
require('dotenv').config();
const { MongoClient } = require('mongodb');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Sample data to seed
const products = [
  {
    name: "Wireless Bluetooth Headphones",
    description: "High-quality over-ear headphones with active noise cancellation and 30-hour battery life",
    category: "Electronics",
    price: 199.99
  },
  {
    name: "Organic Green Tea",
    description: "Premium loose leaf green tea from Japan, rich in antioxidants",
    category: "Food & Beverage",
    price: 24.99
  },
  {
    name: "Yoga Mat",
    description: "Non-slip eco-friendly yoga mat with extra cushioning, perfect for all types of yoga",
    category: "Sports & Fitness",
    price: 39.99
  },
  {
    name: "Smart Watch",
    description: "Fitness tracking smartwatch with heart rate monitor, GPS, and sleep tracking",
    category: "Electronics",
    price: 299.99
  },
  {
    name: "Coffee Maker",
    description: "Programmable drip coffee maker with thermal carafe, makes 12 cups",
    category: "Home & Kitchen",
    price: 89.99
  }
];

async function generateEmbedding(text) {
  try {
    const model = genAI.getGenerativeModel({ model: "embedding-001" });
    const result = await model.embedContent(text);
    return result.embedding.values;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

async function seedData() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db(process.env.DB_NAME);
    const collection = db.collection(process.env.COLLECTION_NAME);
    
    // Clear existing data
    await collection.deleteMany({});
    console.log('Cleared existing data');
    
    // Generate embeddings and insert documents
    for (const product of products) {
      // Combine name and description for better embeddings
      const textToEmbed = `${product.name}. ${product.description}`;
      
      console.log(`Generating embedding for: ${product.name}`);
      const embedding = await generateEmbedding(textToEmbed);
      
      const document = {
        ...product,
        embedding: embedding,
        createdAt: new Date()
      };
      
      await collection.insertOne(document);
      console.log(`✓ Inserted: ${product.name}`);
    }
    
    console.log('\n✅ Successfully seeded all products!');
    console.log(`Total documents: ${products.length}`);
    
  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    await client.close();
  }
}

seedData();
```

### Step 3: Create Vector Search Index in MongoDB

After seeding data, create a vector search index in MongoDB Atlas:

1. Go to your MongoDB Atlas cluster
2. Navigate to "Search" tab
3. Click "Create Search Index"
4. Choose "JSON Editor"
5. Use this configuration:

```json
{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 768,
      "similarity": "cosine"
    }
  ]
}
```

6. Name your index: `vector_index`
7. Select your database and collection

### Step 4: Run the Seed Script
```bash
node seed.js
```

---

## 6. Search Data Using Vector Search

Create `search.js`:

```javascript
require('dotenv').config();
const { MongoClient } = require('mongodb');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function generateEmbedding(text) {
  try {
    const model = genAI.getGenerativeModel({ model: "embedding-001" });
    const result = await model.embedContent(text);
    return result.embedding.values;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

async function vectorSearch(query, limit = 5) {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db(process.env.DB_NAME);
    const collection = db.collection(process.env.COLLECTION_NAME);
    
    // Generate embedding for the search query
    console.log(`\nSearching for: "${query}"\n`);
    const queryEmbedding = await generateEmbedding(query);
    
    // Perform vector search
    const pipeline = [
      {
        $vectorSearch: {
          index: "vector_index",
          path: "embedding",
          queryVector: queryEmbedding,
          numCandidates: 100,
          limit: limit
        }
      },
      {
        $project: {
          _id: 0,
          name: 1,
          description: 1,
          category: 1,
          price: 1,
          score: { $meta: "vectorSearchScore" }
        }
      }
    ];
    
    const results = await collection.aggregate(pipeline).toArray();
    
    // Display results
    console.log('Search Results:');
    console.log('='.repeat(80));
    
    results.forEach((result, index) => {
      console.log(`\n${index + 1}. ${result.name}`);
      console.log(`   Category: ${result.category}`);
      console.log(`   Price: $${result.price}`);
      console.log(`   Description: ${result.description}`);
      console.log(`   Relevance Score: ${result.score.toFixed(4)}`);
    });
    
    console.log('\n' + '='.repeat(80));
    
    return results;
    
  } catch (error) {
    console.error('Error performing vector search:', error);
  } finally {
    await client.close();
  }
}

// Example searches
async function runExamples() {
  // Example 1: Search for audio devices
  await vectorSearch("noise cancelling headphones for music");
  
  // Example 2: Search for health products
  await vectorSearch("healthy beverage antioxidants");
  
  // Example 3: Search for exercise equipment
  await vectorSearch("equipment for stretching and meditation");
}

// Run examples or custom search
if (process.argv[2]) {
  // Custom search from command line
  const query = process.argv.slice(2).join(' ');
  vectorSearch(query);
} else {
  // Run example searches
  runExamples();
}
```

### Usage:

**Run example searches:**
```bash
node search.js
```

**Custom search:**
```bash
node search.js "fitness tracker with heart monitor"
node search.js "morning hot beverage"
node search.js "audio device for commuting"
```

### Understanding the Results:

The search returns results ranked by **similarity score** (0-1):
- **1.0**: Perfect match
- **0.8-0.99**: Very similar
- **0.6-0.79**: Somewhat similar
- **< 0.6**: Less similar

### Example Output:
```
Searching for: "fitness tracker with heart monitor"

Search Results:
================================================================================

1. Smart Watch
   Category: Electronics
   Price: $299.99
   Description: Fitness tracking smartwatch with heart rate monitor, GPS, and sleep tracking
   Relevance Score: 0.8542

2. Yoga Mat
   Category: Sports & Fitness
   Price: $39.99
   Description: Non-slip eco-friendly yoga mat with extra cushioning, perfect for all types of yoga
   Relevance Score: 0.6234
```

---

## Advanced Features

### 1. Hybrid Search (Vector + Text)
Combine vector search with traditional filters:

```javascript
const pipeline = [
  {
    $vectorSearch: {
      index: "vector_index",
      path: "embedding",
      queryVector: queryEmbedding,
      numCandidates: 100,
      limit: 20,
      filter: {
        category: "Electronics",
        price: { $lt: 300 }
      }
    }
  }
];
```

### 2. Batch Embedding Generation
For large datasets, generate embeddings in batches:

```javascript
async function batchGenerateEmbeddings(items, batchSize = 10) {
  const results = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const embeddings = await Promise.all(
      batch.map(item => generateEmbedding(item))
    );
    results.push(...embeddings);
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  return results;
}
```

### 3. Error Handling & Retry Logic
```javascript
async function generateEmbeddingWithRetry(text, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await generateEmbedding(text);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}
```

---

## Resources

- [MongoDB Vector Search Documentation](https://www.mongodb.com/docs/atlas/atlas-vector-search/vector-search-overview/)
- [Google Gemini AI Documentation](https://ai.google.dev/docs)
- [Understanding Embeddings](https://en.wikipedia.org/wiki/Embedding_(machine_learning))

---

## License

MIT License - Feel free to use this material for educational purposes.