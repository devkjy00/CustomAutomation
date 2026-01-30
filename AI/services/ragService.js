/**
 * Simple RAG (Retrieval-Augmented Generation) Service
 * Uses in-memory vector storage with cosine similarity
 */
class RAGService {
  constructor() {
    this.documents = [];
    this.embeddings = new Map();
  }

  /**
   * Simple text vectorization using TF-IDF approach
   */
  vectorize(text) {
    const words = text.toLowerCase()
      .replace(/[^\w\sㄱ-ㅎㅏ-ㅣ가-힣]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 1);

    const wordCount = new Map();
    words.forEach(word => {
      wordCount.set(word, (wordCount.get(word) || 0) + 1);
    });

    return wordCount;
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  cosineSimilarity(vec1, vec2) {
    const allWords = new Set([...vec1.keys(), ...vec2.keys()]);

    let dotProduct = 0;
    let mag1 = 0;
    let mag2 = 0;

    allWords.forEach(word => {
      const v1 = vec1.get(word) || 0;
      const v2 = vec2.get(word) || 0;

      dotProduct += v1 * v2;
      mag1 += v1 * v1;
      mag2 += v2 * v2;
    });

    if (mag1 === 0 || mag2 === 0) return 0;

    return dotProduct / (Math.sqrt(mag1) * Math.sqrt(mag2));
  }

  /**
   * Add search results to RAG knowledge base
   */
  addSearchResults(query, searchResults) {
    const timestamp = Date.now();

    searchResults.forEach((result, index) => {
      const docId = `${query}_${timestamp}_${index}`;
      const text = `${result.title} ${result.snippet}`;

      const doc = {
        id: docId,
        query: query,
        title: result.title,
        snippet: result.snippet,
        link: result.link,
        source: result.source,
        timestamp: timestamp,
        text: text
      };

      this.documents.push(doc);
      this.embeddings.set(docId, this.vectorize(text));
    });

    console.log(`[RAG] Added ${searchResults.length} documents. Total: ${this.documents.length}`);

    // Clean old documents (keep last 100)
    if (this.documents.length > 100) {
      const removed = this.documents.splice(0, this.documents.length - 100);
      removed.forEach(doc => this.embeddings.delete(doc.id));
    }
  }

  /**
   * Search for relevant documents based on query
   */
  search(query, topK = 5) {
    if (this.documents.length === 0) {
      return [];
  }

    const queryVector = this.vectorize(query);
    const scores = [];

    this.documents.forEach(doc => {
      const docVector = this.embeddings.get(doc.id);
      const similarity = this.cosineSimilarity(queryVector, docVector);

      scores.push({
        doc: doc,
        score: similarity
      });
    });

    // Sort by similarity score
    scores.sort((a, b) => b.score - a.score);

    return scores.slice(0, topK);
  }

  /**
   * Get relevant context for AI prompt
   */
  getContext(query, topK = 3) {
    const results = this.search(query, topK);

    if (results.length === 0) {
      return null;
    }

    let context = "=== 웹 검색 결과 ===\n\n";

    results.forEach((result, index) => {
      if (result.score > 0.1) { // Only include if similarity > threshold
        const doc = result.doc;
        context += `【검색 결과 ${index + 1}】\n`;
        context += `제목: ${doc.title}\n`;
        context += `내용: ${doc.snippet}\n`;
        if (doc.link) {
          context += `링크: ${doc.link}\n`;
        }
        context += `출처: ${doc.source}\n`;
        context += `관련도: ${(result.score * 100).toFixed(1)}%\n`;
        context += `\n`;
      }
    });

    context += "\n【중요】 위 검색 결과의 제목과 내용에 포함된 정보를 종합하여 답변하세요.\n";

    return context;
  }

  /**
   * Clear old documents
   */
  clearOldDocuments(maxAge = 86400000) { // 24 hours default
    const now = Date.now();
    const before = this.documents.length;

    this.documents = this.documents.filter(doc => {
      const keep = (now - doc.timestamp) < maxAge;
      if (!keep) {
        this.embeddings.delete(doc.id);
      }
      return keep;
    });

    const removed = before - this.documents.length;
    if (removed > 0) {
      console.log(`[RAG] Cleared ${removed} old documents`);
    }
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      totalDocuments: this.documents.length,
      uniqueQueries: new Set(this.documents.map(d => d.query)).size,
      oldestDocument: this.documents.length > 0 ?
        new Date(Math.min(...this.documents.map(d => d.timestamp))) : null,
      newestDocument: this.documents.length > 0 ?
        new Date(Math.max(...this.documents.map(d => d.timestamp))) : null
    };
  }
}

module.exports = new RAGService();
