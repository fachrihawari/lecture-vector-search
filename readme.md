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
npm install -D dotenv
npm install mongodb @google/genai
```

### Project Structure
```
project/
├── .env
├── .env.example
├── db.js
├── package-lock.json
├── package.json
├── products.json
├── search.js
└── seed.js
```

### Configuration

Create a `.env` file for your credentials:
```env
MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/
GEMINI_API_KEY=your_gemini_api_key_here
```

### Seeding Script

Edit `seed.js` to read products, generate embeddings, and store them in MongoDB:

```javascript
require('dotenv').config();

const { GoogleGenAI } = require('@google/genai') // STEP 1. Import Gemini AI client
const { db } = require('./db');
const products = require('./products.json');

// STEP 2. Initialize Gemini AI client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// STEP 3. Function to generate embeddings
async function generateEmbedding(text) {
  const response = await ai.models.embedContent({
    model: 'gemini-embedding-001',
    contents: text,
    config: {
      outputDimensionality: 768
    }
  });

  console.log(response.embeddings, "<<< embeddings");
  

  return response.embeddings[0].values;
}

async function seedData() {
  try {
    // Clear existing data
    await db.collection('products').deleteMany({});
    console.log('Cleared existing data');

    // Generate embeddings and insert documents
    for (const product of products) {

      // STEP 4. Generate embedding for each product 
      const textToEmbed = `${product.name}. ${product.description}`;
      const embedding = await generateEmbedding(textToEmbed);

      const document = {
        ...product,
        embedding: embedding, // STEP 5. Store embedding in the document
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
```

### Creating the Vector Search Index

After seeding your data, set up a vector search index in MongoDB Atlas:

1. Navigate to your MongoDB Atlas cluster
2. Go to the "Search & Vector Search" tab
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

const { db } = require('./db');

// STEP 1. Import the embedding generation function
const { generateEmbedding } = require('./helpers');

async function search(query) {
  console.log(`Searching for: "${query}"`);

  try {

    // STEP 2. Generate embedding for the search query
    const embedding = await generateEmbedding(query);


    // STEP 3. Construct the aggregation pipeline for vector search
    const pipeline = [
      {
        $vectorSearch: {
          index: 'vector_index', // index name
          path: 'embedding', // path containing vectors
          queryVector: embedding, // query embedding
          numCandidates: 768, // number of candidates to consider
          limit: 3 // limit results
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

    // STEP 4. Execute the aggregation pipeline to perform vector search
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
```

### Usage

Run the searches:
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

---



## Resources

- [MongoDB Vector Search Documentation](https://www.mongodb.com/docs/atlas/atlas-vector-search/vector-search-overview/)
- [Google Gemini AI Documentation](https://ai.google.dev/docs)
- [Understanding Embeddings](https://en.wikipedia.org/wiki/Embedding_(machine_learning))

