const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Web Search Service using Playwright MCP and web scraping
 */
class WebSearchService {
  constructor() {
    this.searchResults = new Map(); // Simple in-memory cache
  }

  /**
   * Perform DuckDuckGo HTML search (more bot-friendly than Google)
   */
  async searchGoogle(query, maxResults = 5) {
    try {
      console.log(`[WebSearch] Searching DuckDuckGo for: ${query}`);

      const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;

      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
          'Accept-Charset': 'utf-8'
        },
        responseEncoding: 'utf8'
      });

      const $ = cheerio.load(response.data);
      const results = [];

      // Extract DuckDuckGo results
      $('.result').each((index, element) => {
        if (results.length >= maxResults) return false;

        const titleElem = $(element).find('.result__a');
        const title = titleElem.text().trim();
        const link = titleElem.attr('href');
        const snippet = $(element).find('.result__snippet').text().trim();

        if (title && snippet) {
          results.push({
            title: title,
            snippet: snippet,
            link: link || '',
            source: 'duckduckgo'
          });
        }
      });

      console.log(`[WebSearch] Found ${results.length} results`);

      // Cache results
      this.searchResults.set(query, {
        timestamp: Date.now(),
        results: results
      });

      return results;
    } catch (error) {
      console.error('[WebSearch] DuckDuckGo Error:', error.message);
      return [];
    }
  }

  /**
   * Search Naver for Korean content
   */
  async searchNaver(query, maxResults = 5) {
    try {
      console.log(`[WebSearch] Searching Naver for: ${query}`);

      const searchUrl = `https://search.naver.com/search.naver?query=${encodeURIComponent(query)}`;

      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'ko-KR,ko;q=0.9',
          'Accept-Charset': 'utf-8'
        },
        responseEncoding: 'utf8'
      });

      const $ = cheerio.load(response.data);
      const results = [];

      // Extract Naver search results
      $('.total_wrap').each((index, element) => {
        if (results.length >= maxResults) return false;

        const title = $(element).find('.total_tit').text();
        const snippet = $(element).find('.total_txt').text();
        const link = $(element).find('.total_tit').attr('href');

        if (title && snippet) {
          results.push({
            title: title.trim(),
            snippet: snippet.trim(),
            link: link || '',
            source: 'naver'
          });
        }
      });

      console.log(`[WebSearch] Found ${results.length} Naver results`);

      return results;
    } catch (error) {
      console.error('[WebSearch] Naver Error:', error.message);
      return [];
    }
  }

  /**
   * Fetch actual weather data using OpenWeatherMap API
   * Free tier: 1000 calls/day, 60 calls/minute
   */
  async getWeatherData(location) {
    try {
      console.log(`[WebSearch] Fetching weather data for: ${location}`);

      // OpenWeatherMap API (free tier)
      // Note: You need to set OPENWEATHER_API_KEY environment variable
      const apiKey = process.env.OPENWEATHER_API_KEY || '';

      if (!apiKey) {
        console.log('[WebSearch] OPENWEATHER_API_KEY not set, skipping weather API');
        return null;
      }

      const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&appid=${apiKey}&units=metric&lang=kr`;

      const response = await axios.get(weatherUrl, {
        timeout: 5000
      });

      const data = response.data;

      if (data && data.main) {
        return {
          location: data.name || location,
          temperature: `${Math.round(data.main.temp)}°C`,
          condition: data.weather?.[0]?.description || '정보 없음',
          humidity: `${data.main.humidity}%`,
          wind: `${data.wind.speed}m/s`,
          pressure: `${data.main.pressure}hPa`,
          feels_like: `${Math.round(data.main.feels_like)}°C`,
          source: 'openweathermap',
          timestamp: new Date().toISOString()
        };
      }

      return null;
    } catch (error) {
      console.error('[WebSearch] Weather API error:', error.message);
      return null;
    }
  }

  /**
   * Multi-source search (Google + Naver)
   * Enhanced with weather detection
   */
  async searchMultiSource(query, maxResults = 5) {
    try {
      // Fall back to regular search
      const [googleResults, naverResults] = await Promise.all([
        this.searchGoogle(query, Math.ceil(maxResults / 2)),
        this.searchNaver(query, Math.ceil(maxResults / 2))
      ]);

      const allResults = [...googleResults, ...naverResults];
      return allResults.slice(0, maxResults);
    } catch (error) {
      console.error('[WebSearch] Multi-source error:', error.message);
      return [];
    }
  }

  /**
   * Get cached search results
   */
  getCachedResults(query, maxAge = 3600000) { // 1 hour default
    const cached = this.searchResults.get(query);

    if (cached && (Date.now() - cached.timestamp) < maxAge) {
      console.log(`[WebSearch] Using cached results for: ${query}`);
      return cached.results;
    }

    return null;
  }

  /**
   * Format search results for AI prompt
   */
  formatResultsForAI(results) {
    if (!results || results.length === 0) {
      return "검색 결과를 찾을 수 없습니다.";
    }

    let formatted = "=== 웹 검색 결과 ===\n\n";

    results.forEach((result, index) => {
      formatted += `[${index + 1}] ${result.title}\n`;
      formatted += `출처: ${result.source}\n`;
      formatted += `내용: ${result.snippet}\n`;
      if (result.link) {
        formatted += `링크: ${result.link}\n`;
      }
      formatted += '\n';
    });

    return formatted;
  }

  /**
   * Clear old cache entries
   */
  clearCache(maxAge = 3600000) {
    const now = Date.now();
    for (const [query, data] of this.searchResults.entries()) {
      if (now - data.timestamp > maxAge) {
        this.searchResults.delete(query);
      }
    }
  }
}

module.exports = new WebSearchService();
