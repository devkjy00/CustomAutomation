const aiService = require('./aiService');
const webSearchService = require('./webSearchService');
const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Autonomous Search Agent
 * AI가 주도적으로 웹을 탐색하며 정보를 수집합니다.
 */
class AutonomousSearchAgent {
  constructor() {
    this.maxDepth = 5; // 최대 탐색 깊이 (3 → 5)
    this.maxLinksPerSearch = 8; // 검색 결과당 최대 방문 링크 수 (5 → 8)
    this.maxTotalPages = 15; // 전체 세션에서 최대 방문 페이지 수
    this.visitedUrls = new Set(); // 중복 방문 방지
  }

  /**
   * 자율 탐색 시작
   */
  async search(userQuery) {
    console.log('='.repeat(80));
    console.log('[Agent] 🤖 AUTONOMOUS SEARCH SESSION STARTED');
    console.log('[Agent] Query:', userQuery);
    console.log('='.repeat(80));
    this.visitedUrls.clear();

    // Phase 1: AI가 검색 계획 수립
    console.log('\n[Agent] 📋 PHASE 1: Planning Search Strategy');
    const planStartTime = Date.now();
    const searchPlan = await this.planSearch(userQuery);
    console.log(`[Agent] ✓ Search plan created (${Date.now() - planStartTime}ms)`);
    console.log('[Agent]   - Keywords:', searchPlan.keywords);
    console.log('[Agent]   - Target Sites:', searchPlan.targetSites.join(', ') || 'None specified');
    console.log('[Agent]   - Information Type:', searchPlan.informationType);
    console.log('[Agent]   - Estimated Depth:', searchPlan.estimatedDepth);

    // Phase 2: 검색 실행
    console.log('\n[Agent] 🔍 PHASE 2: Multi-Source Web Search');
    const searchStartTime = Date.now();
    const searchResults = await webSearchService.searchMultiSource(
      searchPlan.keywords,
      10 // 더 많은 결과 가져오기
    );
    console.log(`[Agent] ✓ Found ${searchResults.length} results from 5 sources (${Date.now() - searchStartTime}ms)`);

    if (!searchResults || searchResults.length === 0) {
      console.log('[Agent] ❌ No search results found');
      console.log('='.repeat(80));
      return {
        success: false,
        gatheredInfo: [],
        finalAnswer: '검색 결과를 찾을 수 없습니다.'
      };
    }

    // Phase 3: AI가 링크 우선순위 결정
    console.log('\n[Agent] 🎯 PHASE 3: Link Prioritization');
    const priorityStartTime = Date.now();
    const prioritizedLinks = await this.prioritizeLinks(userQuery, searchResults, searchPlan);
    console.log(`[Agent] ✓ Prioritized ${prioritizedLinks.length} links (${Date.now() - priorityStartTime}ms)`);
    prioritizedLinks.forEach((link, i) => {
      console.log(`[Agent]   ${i+1}. [Score: ${link.priorityScore.toFixed(2)}] ${link.title}`);
      console.log(`[Agent]      ${link.url}`);
    });

    // Phase 4: 자율적으로 링크 탐색
    console.log('\n[Agent] 🌐 PHASE 4: Autonomous Web Exploration');
    const gatheredInfo = [];
    let satisfactionLevel = 0;
    const explorationStartTime = Date.now();

    for (let depth = 0; depth < this.maxDepth && satisfactionLevel < 0.8; depth++) {
      console.log(`\n[Agent] --- Depth ${depth + 1}/${this.maxDepth} ---`);
      console.log(`[Agent] Progress: ${this.visitedUrls.size}/${this.maxTotalPages} pages visited, ${gatheredInfo.length} relevant pages found`);

      // 전체 방문 페이지 수 제한 확인
      if (this.visitedUrls.size >= this.maxTotalPages) {
        console.log('[Agent] ⚠️ Reached maximum total pages limit');
        break;
      }

      const linksToVisit = prioritizedLinks.slice(0, this.maxLinksPerSearch);
      const remainingSlots = this.maxTotalPages - this.visitedUrls.size;
      const linksToProcess = linksToVisit.slice(0, remainingSlots);

      console.log(`[Agent] Planning to visit ${linksToProcess.length} links in this depth`);

      for (const linkInfo of linksToProcess) {
        if (this.visitedUrls.has(linkInfo.url)) continue;

        console.log(`\n[Agent] 🔗 [${this.visitedUrls.size + 1}/${this.maxTotalPages}] Visiting: ${linkInfo.title}`);
        console.log(`[Agent]    URL: ${linkInfo.url}`);

        const extractStartTime = Date.now();
        const pageContent = await this.extractPageContent(linkInfo.url);

        if (pageContent) {
          this.visitedUrls.add(linkInfo.url);
          console.log(`[Agent] ✓ Content extracted (${pageContent.length} chars, ${Date.now() - extractStartTime}ms)`);

          // AI가 추출된 내용의 관련성 평가
          const evalStartTime = Date.now();
          const relevance = await this.evaluateRelevance(userQuery, pageContent);
          console.log(`[Agent] 📊 Relevance: ${relevance.score.toFixed(2)} (${Date.now() - evalStartTime}ms)`);
          console.log(`[Agent]    Insights: ${relevance.insights}`);

          if (relevance.score > 0.4) { // 임계값 낮춤 (0.5 → 0.4)
            gatheredInfo.push({
              url: linkInfo.url,
              title: linkInfo.title,
              content: pageContent,
              relevance: relevance.score,
              insights: relevance.insights
            });
            console.log(`[Agent] ✅ Page added to knowledge base (${gatheredInfo.length} total)`);
          } else {
            console.log(`[Agent] ⏭️ Page skipped (relevance too low)`);
          }
        } else {
          console.log(`[Agent] ❌ Failed to extract content (${Date.now() - extractStartTime}ms)`);
        }

        // 현재까지 수집한 정보의 충분성 평가
        if (gatheredInfo.length > 0 && gatheredInfo.length % 3 === 0) { // 3개마다 평가
          console.log(`\n[Agent] 🎓 Evaluating information sufficiency...`);
          const suffStartTime = Date.now();
          const sufficiency = await this.evaluateSufficiency(userQuery, gatheredInfo);
          satisfactionLevel = sufficiency.score;
          console.log(`[Agent] 📈 Sufficiency: ${(satisfactionLevel * 100).toFixed(0)}% (${Date.now() - suffStartTime}ms)`);

          if (sufficiency.missing) {
            console.log(`[Agent]    Missing: ${sufficiency.missing}`);
          }

          if (satisfactionLevel >= 0.8) {
            console.log('[Agent] ✅ Sufficient information gathered! Stopping exploration.');
            break;
          } else {
            console.log('[Agent] ⚠️ More information needed. Continuing exploration...');
          }
        }

        // 전체 페이지 수 제한 확인
        if (this.visitedUrls.size >= this.maxTotalPages) {
          console.log('[Agent] ⚠️ Reached maximum total pages limit during iteration');
          break;
        }
      }

      // 정보가 부족하면 새로운 검색 전략 수립
      if (satisfactionLevel < 0.8 && depth < this.maxDepth - 1) {
        console.log(`\n[Agent] 🔄 REPLANNING: Information insufficient (${(satisfactionLevel * 100).toFixed(0)}%)`);
        const replanStartTime = Date.now();
        const newPlan = await this.replanSearch(userQuery, gatheredInfo);
        console.log(`[Agent] ✓ New strategy: "${newPlan.keywords}" (${Date.now() - replanStartTime}ms)`);

        const newResults = await webSearchService.searchMultiSource(newPlan.keywords, 10);
        console.log(`[Agent] ✓ Found ${newResults.length} new results`);

        const newLinks = await this.prioritizeLinks(userQuery, newResults, newPlan);
        console.log(`[Agent] ✓ Prioritized ${newLinks.length} new links`);

        // 새로운 링크를 우선순위 목록에 추가
        const addedLinks = newLinks.filter(link => !this.visitedUrls.has(link.url));
        prioritizedLinks.push(...addedLinks);
        console.log(`[Agent] ✓ Added ${addedLinks.length} unvisited links to queue`);
      }
    }

    console.log(`\n[Agent] ✓ Exploration complete (${Date.now() - explorationStartTime}ms)`);
    console.log(`[Agent] Summary: Visited ${this.visitedUrls.size} pages, gathered ${gatheredInfo.length} relevant pages`);

    // Phase 5: 수집된 정보로 최종 답변 생성
    console.log('\n[Agent] 📝 PHASE 5: Synthesizing Final Answer');
    const synthStartTime = Date.now();
    const finalAnswer = await this.synthesizeAnswer(userQuery, gatheredInfo);
    console.log(`[Agent] ✓ Answer synthesized (${Date.now() - synthStartTime}ms)`);

    console.log('='.repeat(80));
    console.log('[Agent] 🎉 AUTONOMOUS SEARCH SESSION COMPLETED');
    console.log(`[Agent] Success: ${gatheredInfo.length > 0}`);
    console.log(`[Agent] Sufficiency: ${(satisfactionLevel * 100).toFixed(0)}%`);
    console.log(`[Agent] Total pages visited: ${this.visitedUrls.size}`);
    console.log('='.repeat(80));

    return {
      success: gatheredInfo.length > 0,
      gatheredInfo,
      satisfactionLevel,
      visitedUrls: Array.from(this.visitedUrls),
      finalAnswer
    };
  }

  /**
   * AI가 검색 계획 수립
   * P1 개선: Prompt 간소화로 AI 응답 속도 향상 (5-8초 → 3-5초 목표)
   */
  async planSearch(userQuery) {
    const template = `질문: "${userQuery}"
검색 전략 수립:
keywords: [핵심 검색어]
informationType: [정보유형]
estimatedDepth: [1-3]`;

    const result = await aiService.callAI(template, 'Autonomous Search Planning');

    // 결과 파싱
    const keywordsMatch = result.match(/keywords:\s*\[?([^\]\n]+)\]?/i);
    const targetSitesMatch = result.match(/targetSites:\s*\[?([^\]\n]+)\]?/i);
    const infoTypeMatch = result.match(/informationType:\s*\[?([^\]\n]+)\]?/i);
    const depthMatch = result.match(/estimatedDepth:\s*(\d+)/i);

    return {
      keywords: keywordsMatch ? keywordsMatch[1].trim() : userQuery,
      targetSites: targetSitesMatch ? targetSitesMatch[1].split(',').map(s => s.trim()) : [],
      informationType: infoTypeMatch ? infoTypeMatch[1].trim() : '일반',
      estimatedDepth: depthMatch ? parseInt(depthMatch[1]) : 2
    };
  }

  /**
   * AI가 링크 우선순위 결정
   * P1 개선: Prompt 간소화 및 top-5만 요청으로 속도 향상
   */
  async prioritizeLinks(userQuery, searchResults, searchPlan) {
    // Top 10개만 평가 (전체가 10개 미만이면 전체)
    const topResults = searchResults.slice(0, 10);
    const searchResultsText = topResults
      .map((r, i) => `[${i+1}] ${r.title}\n${r.snippet}`)
      .join('\n');

    const template = `질문: "${userQuery}"
검색결과:
${searchResultsText}

상위 5개 선택:
[번호] score: [0-1]`;

    const result = await aiService.callAI(template, 'Link Prioritization');

    // 결과 파싱
    const prioritized = [];
    const lines = result.split('\n');

    for (const line of lines) {
      const match = line.match(/\[(\d+)\]\s*score:\s*([\d.]+)/i);
      if (match) {
        const index = parseInt(match[1]) - 1;
        const score = parseFloat(match[2]);

        if (index >= 0 && index < topResults.length) {
          prioritized.push({
            ...topResults[index],
            url: topResults[index].link,
            priorityScore: score
          });
        }
      }
    }

    // 점수 높은 순으로 정렬
    return prioritized.sort((a, b) => b.priorityScore - a.priorityScore);
  }

  /**
   * 웹 페이지 내용 추출
   * P1 개선: DuckDuckGo URL 추출 및 재시도 로직 추가
   */
  async extractPageContent(url, retries = 2) {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        // P1 개선: DuckDuckGo 리다이렉트 URL에서 실제 URL 추출
        let normalizedUrl = url;
        if (url.includes('duckduckgo.com/l/') && url.includes('uddg=')) {
          const uddgMatch = url.match(/uddg=([^&]+)/);
          if (uddgMatch) {
            normalizedUrl = decodeURIComponent(uddgMatch[1]);
            console.log(`[Agent] Extracted DuckDuckGo target: ${normalizedUrl}`);
          }
        }

        // URL 정규화: //로 시작하는 URL을 https://로 변환
        if (normalizedUrl.startsWith('//')) {
          normalizedUrl = 'https:' + normalizedUrl;
        } else if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
          normalizedUrl = 'https://' + normalizedUrl;
        }

        if (attempt > 0) {
          console.log(`[Agent] Retry ${attempt}/${retries}: ${normalizedUrl}`);
        } else {
          console.log(`[Agent] Extracting content from: ${normalizedUrl}`);
        }

        const response = await axios.get(normalizedUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8',
          },
          timeout: 10000,
          maxRedirects: 5,
          responseEncoding: 'utf8'
        });

        const $ = cheerio.load(response.data);

        // 불필요한 요소 제거
        $('script, style, nav, header, footer, iframe, noscript').remove();

        // 본문 추출 시도
        let content = '';

        // 일반적인 본문 셀렉터들 시도
        const contentSelectors = [
          'article',
          '[role="main"]',
          'main',
          '.content',
          '.post-content',
          '#content',
          '.entry-content',
          'body'
        ];

        for (const selector of contentSelectors) {
          const elem = $(selector);
          if (elem.length > 0) {
            content = elem.text().trim();
            if (content.length > 200) break;
          }
        }

        // 텍스트 정리
        content = content
          .replace(/\s+/g, ' ')
          .replace(/\n+/g, '\n')
          .trim()
          .substring(0, 3000); // 최대 3000자

        if (content.length > 100) {
          return content;
        } else if (attempt < retries) {
          console.log(`[Agent] Content too short (${content.length} chars), retrying...`);
          await new Promise(resolve => setTimeout(resolve, 1000)); // 1초 대기
          continue;
        } else {
          return null;
        }

      } catch (error) {
        if (attempt < retries) {
          console.error(`[Agent] Attempt ${attempt + 1} failed: ${error.message}, retrying...`);
          await new Promise(resolve => setTimeout(resolve, 1000)); // 1초 대기
        } else {
          console.error(`[Agent] All attempts failed for ${url}:`, error.message);
          return null;
        }
      }
    }
    return null;
  }

  /**
   * AI가 페이지 내용의 관련성 평가
   * P1 개선: Prompt 간소화 및 컨텐츠 축약으로 속도 향상
   */
  async evaluateRelevance(userQuery, pageContent) {
    // 컨텐츠를 1000자로 축약 (1500 → 1000)
    const template = `질문: "${userQuery}"
내용: ${pageContent.substring(0, 1000)}

평가:
score: [0-1]
insights: [핵심정보 30자]`;

    const result = await aiService.callAI(template, 'Content Relevance Evaluation');

    const scoreMatch = result.match(/score:\s*([\d.]+)/i);
    const insightsMatch = result.match(/insights:\s*(.+)/i);

    return {
      score: scoreMatch ? parseFloat(scoreMatch[1]) : 0,
      insights: insightsMatch ? insightsMatch[1].trim() : ''
    };
  }

  /**
   * AI가 수집된 정보의 충분성 평가
   * P1 개선: Prompt 간소화
   */
  async evaluateSufficiency(userQuery, gatheredInfo) {
    const infoSummary = gatheredInfo
      .map((info, i) => `${i+1}. ${info.insights}`)
      .join('\n');

    const template = `질문: "${userQuery}"
수집정보:
${infoSummary}

충분성 평가:
score: [0-1]
missing: [부족정보]`;

    const result = await aiService.callAI(template, 'Information Sufficiency Evaluation');

    const scoreMatch = result.match(/score:\s*([\d.]+)/i);
    const missingMatch = result.match(/missing:\s*(.+)/i);

    return {
      score: scoreMatch ? parseFloat(scoreMatch[1]) : 0,
      missing: missingMatch ? missingMatch[1].trim() : ''
    };
  }

  /**
   * 정보가 부족할 때 새로운 검색 전략 수립
   * P1 개선: Prompt 간소화
   */
  async replanSearch(userQuery, gatheredInfo) {
    const infoSummary = gatheredInfo
      .slice(0, 5) // 최근 5개만 요약에 포함
      .map(info => `- ${info.insights}`)
      .join('\n');

    const template = `질문: "${userQuery}"
수집: ${infoSummary}

새 전략:
keywords: [검색어]`;

    const result = await aiService.callAI(template, 'Search Replanning');

    const keywordsMatch = result.match(/keywords:\s*\[?([^\]\n]+)\]?/i);
    const targetSitesMatch = result.match(/targetSites:\s*\[?([^\]\n]+)\]?/i);

    return {
      keywords: keywordsMatch ? keywordsMatch[1].trim() : userQuery + ' 상세',
      targetSites: targetSitesMatch ? targetSitesMatch[1].split(',').map(s => s.trim()) : []
    };
  }

  /**
   * 수집된 정보로 최종 답변 생성
   */
  async synthesizeAnswer(userQuery, gatheredInfo) {
    if (gatheredInfo.length === 0) {
      return '충분한 정보를 찾지 못했습니다.';
    }

    const infoText = gatheredInfo
      .map(info => `출처: ${info.title}\n내용: ${info.content.substring(0, 500)}\n핵심: ${info.insights}`)
      .join('\n\n---\n\n');

    const template = `사용자 질문: "${userQuery}"

수집된 정보:
${infoText}

위 정보를 종합하여 사용자 질문에 정확하고 구체적으로 답변하세요.
출처를 명시하고, 수집된 사실만 활용하세요.

답변 (200자 이내):`;

    const result = await aiService.callAI(template, 'Final Answer Synthesis');
    return result;
  }
}

module.exports = new AutonomousSearchAgent();
