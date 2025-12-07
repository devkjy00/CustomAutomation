var express = require('express');
var router = express.Router();
const webSearchService = require('../services/webSearchService');
const ragService = require('../services/ragService');
const aiService = require('../services/aiService');

/* GET users listing - AI with web search and RAG */
router.get('/', async function(req, res, next) {
  const q = req.query.q;
  const enableSearch = req.query.search === 'true' || req.query.search === '1';

  try {
    let finalPrompt = q;

    // If search is enabled, perform web search and add context
    if (enableSearch) {
      console.log('[AI] Web search enabled for query:', q);

      // Generate optimized search keywords using AI
      let searchKeywords = await aiService.generateSearchKeywords(q);
      console.log('[AI] Generated search keywords:', searchKeywords);

      // Analyze which websites would be best for this query
      let targetWebsites = await aiService.analyzeBestWebsites(q, searchKeywords);
      console.log('[AI] Target websites:', targetWebsites);

      // Iterative search with quality verification (max 3 attempts)
      let searchResults = null;
      let filteredResults = null;
      let context = null;
      let searchAttempt = 0;
      const maxAttempts = 3;
      let searchSuccess = false;

      while (!searchSuccess && searchAttempt < maxAttempts) {
        searchAttempt++;
        console.log(`[AI] Search attempt ${searchAttempt}/${maxAttempts}`);

        // Perform multi-source search
        searchResults = await webSearchService.searchMultiSource(searchKeywords, 5);

        if (searchResults && searchResults.length > 0) {
          // Filter search results with AI before adding to RAG
          filteredResults = await aiService.filterSearchResults(searchResults, q, targetWebsites);

          // Verify if filtered results contain the answer user needs
          const verification = await aiService.verifySearchQuality(q, filteredResults);

          console.log(`[AI] Search quality verification:`, verification);

          if (verification.hasAnswer) {
            console.log('[AI] Search results contain required information');
            searchSuccess = true;

            // Add filtered results to RAG knowledge base
            ragService.addSearchResults(searchKeywords, filteredResults);

            // Get relevant context from RAG
            context = ragService.getContext(q, 3);
          } else {
            console.log(`[AI] Missing information: ${verification.missingInfo}`);

            if (searchAttempt < maxAttempts) {
              // Generate alternative search strategy
              const alternativeSearch = await aiService.generateAlternativeSearch(q, verification.missingInfo, searchAttempt);
              console.log(`[AI] Alternative search: ${alternativeSearch.keywords}, targeting: ${alternativeSearch.sites.join(', ')}`);

              searchKeywords = alternativeSearch.keywords;
              targetWebsites = alternativeSearch.sites;

              // Wait a bit before retry
              await new Promise(resolve => setTimeout(resolve, 1000));
            } else {
              console.log('[AI] Max attempts reached, using best available results');
              // Use the last results even if incomplete
              ragService.addSearchResults(searchKeywords, filteredResults);
              context = ragService.getContext(q, 3);
            }
          }
        } else {
          console.log('[AI] No search results found');
          break;
        }
      }

      // Add context to final prompt if web search was performed
      if (context) {
        finalPrompt = `다음 검색 결과를 참고하여 질문에 답변해주세요.

검색 컨텍스트:
${context}

사용자 질문: ${q}

위 검색 결과를 바탕으로 정확하고 구체적인 답변을 제공해주세요. 검색 결과에 없는 내용은 추측하지 마세요.`;
      }
    }

    // Call Ollama API
    const aiResponse = await aiService.generateFinalAnswer(finalPrompt, 'Final Answer Generation');
    const answer = "answer : " + aiResponse + "<end>";
    res.send(answer);
  } catch (error) {
    console.error('Ollama API error:', error.message);
    res.status(500).send('answer : Error generating response<end>');
  }
});

/* GET /search - Perform web search and add to RAG */
router.get('/search', async function(req, res, next) {
  const query = req.query.q;
  const source = req.query.source || 'multi'; // google, naver, multi

  if (!query) {
    return res.status(400).json({ error: 'Query parameter required' });
  }

  try {
    let searchResults;

    if (source === 'google') {
      searchResults = await webSearchService.searchGoogle(query);
    } else if (source === 'naver') {
      searchResults = await webSearchService.searchNaver(query);
    } else {
      searchResults = await webSearchService.searchMultiSource(query);
    }

    // Add to RAG
    if (searchResults && searchResults.length > 0) {
      ragService.addSearchResults(query, searchResults);
    }

    res.json({
      query: query,
      count: searchResults.length,
      results: searchResults,
      ragStats: ragService.getStats()
    });
  } catch (error) {
    console.error('Search error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/* GET /rag/stats - Get RAG statistics */
router.get('/rag/stats', async function(req, res, next) {
  res.json(ragService.getStats());
});

/* POST /rag/clear - Clear old RAG documents */
router.post('/rag/clear', async function(req, res, next) {
  const maxAge = req.body.maxAge || 86400000; // 24 hours default
  ragService.clearOldDocuments(maxAge);
  res.json({ success: true, stats: ragService.getStats() });
});

module.exports = router;
