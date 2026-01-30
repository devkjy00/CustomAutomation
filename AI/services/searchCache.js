/**
 * Search Cache Service
 * P2 개선: 동일/유사 질문에 대한 캐싱으로 응답 시간 단축
 */
class SearchCache {
  constructor() {
    this.cache = new Map();
    this.maxSize = 100; // 최대 캐시 항목 수
    this.ttl = 3600000; // 1시간 (밀리초)
    this.similarityThreshold = 0.8; // 유사도 임계값
  }

  /**
   * 캐시 키 생성 (질문을 정규화)
   */
  generateKey(query) {
    return query
      .toLowerCase()
      .trim()
      .replace(/[?!.,\s]+/g, '_');
  }

  /**
   * 두 질문의 유사도 계산 (단순 Jaccard 유사도)
   */
  calculateSimilarity(query1, query2) {
    const words1 = new Set(query1.toLowerCase().split(/\s+/));
    const words2 = new Set(query2.toLowerCase().split(/\s+/));

    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
  }

  /**
   * 캐시에서 조회 (정확한 매칭 또는 유사 질문)
   */
  get(query) {
    const key = this.generateKey(query);

    // 1. 정확한 매칭 시도
    if (this.cache.has(key)) {
      const entry = this.cache.get(key);

      // TTL 체크
      if (Date.now() - entry.timestamp < this.ttl) {
        console.log(`[Cache] 🎯 HIT (exact): "${query}"`);
        entry.hits++;
        entry.lastAccessed = Date.now();
        return entry.data;
      } else {
        console.log(`[Cache] ⏰ EXPIRED: "${query}"`);
        this.cache.delete(key);
      }
    }

    // 2. 유사 질문 검색
    for (const [cachedKey, entry] of this.cache.entries()) {
      const similarity = this.calculateSimilarity(query, entry.originalQuery);

      if (similarity >= this.similarityThreshold) {
        // TTL 체크
        if (Date.now() - entry.timestamp < this.ttl) {
          console.log(`[Cache] 🎯 HIT (similar ${(similarity * 100).toFixed(0)}%): "${entry.originalQuery}"`);
          entry.hits++;
          entry.lastAccessed = Date.now();
          return entry.data;
        } else {
          this.cache.delete(cachedKey);
        }
      }
    }

    console.log(`[Cache] ❌ MISS: "${query}"`);
    return null;
  }

  /**
   * 캐시에 저장
   */
  set(query, data) {
    // 캐시 크기 제한 체크
    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }

    const key = this.generateKey(query);
    const entry = {
      originalQuery: query,
      data: data,
      timestamp: Date.now(),
      lastAccessed: Date.now(),
      hits: 0
    };

    this.cache.set(key, entry);
    console.log(`[Cache] 💾 SAVED: "${query}" (${this.cache.size}/${this.maxSize})`);
  }

  /**
   * 가장 오래된 항목 제거 (LRU)
   */
  evictOldest() {
    let oldestKey = null;
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      console.log(`[Cache] 🗑️ EVICT: "${this.cache.get(oldestKey).originalQuery}"`);
      this.cache.delete(oldestKey);
    }
  }

  /**
   * 캐시 통계
   */
  getStats() {
    const entries = Array.from(this.cache.values());
    const totalHits = entries.reduce((sum, entry) => sum + entry.hits, 0);
    const avgAge = entries.reduce((sum, entry) => sum + (Date.now() - entry.timestamp), 0) / entries.length;

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      totalHits: totalHits,
      avgAgeMinutes: Math.round(avgAge / 60000),
      entries: entries.map(e => ({
        query: e.originalQuery,
        hits: e.hits,
        ageMinutes: Math.round((Date.now() - e.timestamp) / 60000)
      }))
    };
  }

  /**
   * 캐시 초기화
   */
  clear() {
    this.cache.clear();
    console.log('[Cache] 🧹 CLEARED');
  }
}

module.exports = new SearchCache();
