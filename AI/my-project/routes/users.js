var express = require('express');
var router = express.Router();
const webSearchService = require('../services/webSearchService');
const ragService = require('../services/ragService');
const aiService = require('../services/aiService');
const autonomousSearchAgent = require('../services/autonomousSearchAgent');

/* GET users listing - AI with autonomous agent or legacy search */
router.get('/', async function(req, res, next) {
  const q = req.query.q;
  const enableSearch = req.query.search === 'true' || req.query.search === '1';
  const useAgent = req.query.agent === 'true' || req.query.agent === '1'; // 새로운 파라미터

  try {
    let finalPrompt = q;

    // If search is enabled
    if (enableSearch) {
      console.log('[AI] Web search enabled for query:', q);

      if (useAgent) {
        // 🤖 Use Autonomous Search Agent
        console.log('[AI] Using autonomous search agent');
        const agentResult = await autonomousSearchAgent.search(q);

        if (agentResult.success) {
          console.log(`[AI] Agent visited ${agentResult.visitedUrls.length} pages`);
          console.log(`[AI] Satisfaction level: ${agentResult.satisfactionLevel}`);

          // 에이전트가 이미 최종 답변을 생성했음
          const answer = "answer : " + agentResult.finalAnswer + "<end>";
          return res.send(answer);
        } else {
          console.log('[AI] Agent failed to find information, falling back to legacy search');
        }
      }

      // Legacy search (기존 로직 유지 - fallback용)
      let searchKeywords = await aiService.generateSearchKeywords(q);
      console.log('[AI] Generated search keywords:', searchKeywords);

      let targetWebsites = await aiService.analyzeBestWebsites(q, searchKeywords);
      console.log('[AI] Target websites:', targetWebsites);

      let searchResults = null;
      let filteredResults = null;
      let context = null;
      let searchAttempt = 0;
      const maxAttempts = 3;
      let searchSuccess = false;

      while (!searchSuccess && searchAttempt < maxAttempts) {
        searchAttempt++;
        console.log(`[AI] Search attempt ${searchAttempt}/${maxAttempts}`);

        searchResults = await webSearchService.searchMultiSource(searchKeywords, 5);

        if (searchResults && searchResults.length > 0) {
          filteredResults = await aiService.filterSearchResults(searchResults, q, targetWebsites);
          const verification = await aiService.verifySearchQuality(q, filteredResults);

          console.log(`[AI] Search quality verification:`, verification);

          if (verification.hasAnswer) {
            console.log('[AI] Search results contain required information');
            searchSuccess = true;
            ragService.addSearchResults(searchKeywords, filteredResults);
            context = ragService.getContext(q, 3);
          } else {
            console.log(`[AI] Missing information: ${verification.missingInfo}`);

            if (searchAttempt < maxAttempts) {
              const alternativeSearch = await aiService.generateAlternativeSearch(q, verification.missingInfo, searchAttempt);
              console.log(`[AI] Alternative search: ${alternativeSearch.keywords}, targeting: ${alternativeSearch.sites.join(', ')}`);

              searchKeywords = alternativeSearch.keywords;
              targetWebsites = alternativeSearch.sites;

              await new Promise(resolve => setTimeout(resolve, 1000));
            } else {
              console.log('[AI] Max attempts reached, using best available results');
              ragService.addSearchResults(searchKeywords, filteredResults);
              context = ragService.getContext(q, 3);
            }
          }
        } else {
          console.log('[AI] No search results found');
          break;
        }
      }

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
