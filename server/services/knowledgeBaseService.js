const { db } = require('./firebaseService');

const COLLECTION_NAME = 'knowledge_base';

// Cache configuration
let cachedArticles = null;
let lastCacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Adds or updates an article in the Knowledge Base
 * @param {string} title
 * @param {string} content
 * @param {string[]} tags
 */
exports.addArticle = async (title, content, tags) => {
  try {
    // Generate a slug-like ID from title for easy reference, or let Firestore auto-gen
    const docId = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    await db.collection(COLLECTION_NAME).doc(docId).set({
      title,
      content,
      tags: tags.map(t => t.toLowerCase()),
      last_updated: new Date().toISOString()
    });
    cachedArticles = null; // Invalidate cache
    console.log(`[KnowledgeBase] Article added: ${title}`);
  } catch (error) {
    console.error('[KnowledgeBase] Error adding article:', error);
    throw error;
  }
};

/**
 * Searches for articles relevant to the query.
 * Strategy:
 * 1. Simple keyword matching from the query against tags.
 * 2. If we had embeddings, we'd use vector search.
 * 3. For now, we fetch all articles (dataset is small) and filter in memory,
 *    OR use Firestore array-contains-any if we can extract tags from the query.
 *
 * Given the "Small but Elite" nature, fetching all KB articles (assuming < 100)
 * and performing a weighted keyword match in memory is extremely fast (< 50ms)
 * and more accurate than simple Firestore queries.
 *
 * @param {string} query
 * @returns {Promise<Array>} Sorted list of relevant articles
 */
exports.searchArticles = async (query) => {
  try {
    // Check cache
    const now = Date.now();
    if (!cachedArticles || (now - lastCacheTime > CACHE_TTL)) {
      // console.log('[KnowledgeBase] Cache miss, fetching from Firestore...');
      const snapshot = await db.collection(COLLECTION_NAME).get();
      cachedArticles = [];
      if (!snapshot.empty) {
        snapshot.forEach(doc => cachedArticles.push(doc.data()));
      }
      lastCacheTime = now;
    }

    if (cachedArticles.length === 0) return [];

    const articles = [];
    const queryTokens = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);

    cachedArticles.forEach(data => {
      let score = 0;

      // Scoring logic
      queryTokens.forEach(token => {
        // Exact tag match (High weight)
        if (data.tags.includes(token)) score += 5;
        // Title match (Medium weight)
        if (data.title.toLowerCase().includes(token)) score += 3;
        // Content match (Low weight)
        if (data.content.toLowerCase().includes(token)) score += 1;
      });

      if (score > 0) {
        articles.push({ ...data, score });
      }
    });

    // Return top 3 matches
    return articles.sort((a, b) => b.score - a.score).slice(0, 3);
  } catch (error) {
    console.error('[KnowledgeBase] Search error:', error);
    return []; // Fail safe to empty
  }
};

/**
 * Seeds the database with essential Secrets Of SAT knowledge
 */
exports.seedDefaultArticles = async () => {
  const defaults = [
    {
      title: "Verification Process",
      content: "To verify your payment, upload a clear screenshot of the transaction. Our AI analyzes it instantly. Ensure the amount matches exactly. If the AI flags it, a human strategist will review it within 4 hours.",
      tags: ["verification", "payment", "screenshot", "upload", "ai", "pending"]
    },
    {
      title: "Anonymity Protocol",
      content: "We do not require your real name. Use a pseudonym. We only need a valid email for order delivery. Your IP and session data are ephemeral and used only for fraud prevention.",
      tags: ["anonymity", "privacy", "name", "security", "safe"]
    },
    {
      title: "Refund Policy",
      content: "Refunds are granted only if the exam materials are proven inaccurate (video proof required). 'Change of mind' refunds are not permitted due to the digital nature of the product.",
      tags: ["refund", "money", "back", "return", "policy"]
    },
    {
      title: "Delivery Time",
      content: "Materials are delivered to your email 24-48 hours before the exam date. Check your Spam/Promotions folder. Access links expire after 72 hours.",
      tags: ["delivery", "time", "when", "receive", "email", "spam"]
    },
    {
      title: "Exam Dates",
      content: "We currently support upcoming SAT dates. Check the dashboard for the latest available slots. New dates are added 2 weeks prior to the exam.",
      tags: ["dates", "schedule", "upcoming", "sat", "when"]
    }
  ];

  for (const article of defaults) {
    await exports.addArticle(article.title, article.content, article.tags);
  }
};
