# Vector Search with Node.js, MongoDB & Gemini AI

## 1. What is Vector Search?

Vector search finds similar items by comparing their numerical representations in multi-dimensional space. Instead of matching exact keywords, it understands the semantic meaning behind your search query.

### Key Concepts

**Vectors (Embeddings)**  
These are numerical arrays that capture the meaning of text, images, or other data types. Think of them as coordinates that map concepts in a high-dimensional space.

**Embedding Models**  
AI models that convert your data into vectors. Popular options include Gemini AI, OpenAI embeddings, and various open-source alternatives.

**Similarity Metrics**  
Methods for measuring how close two vectors are to each other. Common approaches include cosine similarity and euclidean distance.

### A Simple Example

```
"dog" → [0.2, 0.8, 0.1, ...]
"puppy" → [0.25, 0.82, 0.09, ...]
"car" → [0.9, 0.1, 0.7, ...]
```

Notice how "dog" and "puppy" have similar vectors, while "car" is quite different. This numerical similarity reflects their semantic relationship.

---

## 2. Why Use Vector Search?

### Core Advantages

**Semantic Understanding**  
Vector search matches based on meaning rather than exact keywords. A search for "smartphone" will also find "mobile phone" or "cell phone."

**Language Flexibility**  
It works across different languages and handles typos gracefully. Small spelling errors won't break your search results.

**Contextual Awareness**  
The system understands phrases and context, not just individual words. This leads to more relevant and useful results.

### Common Applications

**E-commerce**  
Power product recommendations and visual search features. Help customers find what they're looking for, even when they can't describe it perfectly.

**Content Platforms**  
Find similar articles, videos, or documents. Build recommendation systems that actually understand content.

**Conversational AI**  
Match user questions to relevant answers. Understand user intent in chatbots and virtual assistants.

**RAG Systems**  
Retrieval-Augmented Generation uses vector search to provide AI models with relevant context from your data.

---

## 3. Traditional Search vs Vector Search

### Traditional Search (Keyword Matching)

Traditional search works like the "Find" feature in your text editor. It looks for exact word matches in your database.

**Example:**
```
Search: "headphone"
Finds: Products containing "headphone"
Misses: Products labeled "earphone" (even though they're essentially the same)
```

**Limitations:**
- Requires exact keyword matches
- Cannot handle typos or variations
- Doesn't understand synonyms or related terms

### Vector Search (Semantic Matching)

Vector search understands the intent behind your query, not just the literal words.

**Example:**
```
Search: "audio device for music"
Finds: "Wireless Bluetooth Headphones"
Reason: The system understands the semantic relationship between these concepts
```

**Strengths:**
- Matches based on meaning, not just words
- Handles typos and variations
- Finds semantically related items

### Practical Comparison

Consider searching for "fitness watch":

| Traditional Search | Vector Search |
|-------------------|---------------|
| Only returns items containing both words "fitness" and "watch" | Returns Smart Watch, Fitness Tracker, Health Monitor |
| Misses "Smart Watch" because it lacks the word "fitness" | Recognizes semantic relationships between fitness devices |

### Choosing the Right Approach

**Use Traditional Search When:**
- You need exact matches (email addresses, product codes, IDs)
- Working with structured data with known fields
- Users search with precise terminology

**Use Vector Search When:**
- Users describe what they want in natural language
- Building recommendation systems
- Need to find similar or related content

---

## 4. How Vector Search Works

### The Pipeline

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

### Two-Phase Process

**Indexing Phase**

First, we prepare your data:
- Convert documents to embeddings using Gemini AI
- Store these embeddings alongside the original data in MongoDB
- Create a vector search index for efficient querying

**Search Phase**

When a user searches:
- Convert their query to an embedding using the same model
- MongoDB's `$vectorSearch` compares this with stored vectors
- Calculate similarity scores
- Return the most relevant documents, ranked by similarity

---

## 5. Implementation: Seeding Data with Embeddings

### Prerequisites

Install the required packages:
```bash
npm init -y
npm install mongodb @google/generative-ai dotenv
```

### Project Structure
```
project/
├── .env
├── seed.js
├── search.js
└── package.json
```

### Configuration

Create a `.env` file for your credentials:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
DB_NAME=vector_search_db
COLLECTION_NAME=products
GEMINI_API_KEY=your_gemini_api_key_here
```

### Seeding Script

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

### Creating the Vector Search Index

After seeding your data, set up a vector search index in MongoDB Atlas:

1. Navigate to your MongoDB Atlas cluster
2. Go to the "Search" tab
3. Click "Create Search Index"
4. Select "JSON Editor"
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

6. Name the index `vector_index`
7. Select your database and collection

### Running the Seed Script
```bash
node seed.js
```

---

## 6. Implementing Vector Search

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

### Usage

Run the example searches:
```bash
node search.js
```

Or search with a custom query:
```bash
node search.js "fitness tracker with heart monitor"
node search.js "morning hot beverage"
node search.js "audio device for commuting"
```

### Understanding Similarity Scores

Results are ranked by similarity score (0-1):
- **1.0**: Perfect match
- **0.8-0.99**: Highly similar
- **0.6-0.79**: Moderately similar
- **< 0.6**: Low similarity

### Example Output
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

## Resources

- [MongoDB Vector Search Documentation](https://www.mongodb.com/docs/atlas/atlas-vector-search/vector-search-overview/)
- [Google Gemini AI Documentation](https://ai.google.dev/docs)
- [Understanding Embeddings](https://en.wikipedia.org/wiki/Embedding_(machine_learning))

---

## License

MIT License - Feel free to use this material for educational purposes.