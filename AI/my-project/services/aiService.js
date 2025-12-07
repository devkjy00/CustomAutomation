const axios = require('axios');
const fs = require('fs');
const path = require('path');

// AI log file path
const AI_LOG_DIR = path.join(__dirname, '../logs');
const AI_LOG_FILE = path.join(AI_LOG_DIR, 'ai-requests.log');

// Prompts directory
const PROMPTS_DIR = path.join(__dirname, '../prompts');

// Ensure logs directory exists
if (!fs.existsSync(AI_LOG_DIR)) {
  fs.mkdirSync(AI_LOG_DIR, { recursive: true });
}

/**
 * Load prompt template from markdown file
 */
function loadPromptTemplate(templateName) {
  try {
    const filePath = path.join(PROMPTS_DIR, `${templateName}.md`);
    const content = fs.readFileSync(filePath, 'utf8');

    // Extract template section from markdown
    const templateMatch = content.match(/```\n([\s\S]*?)\n```/);
    if (templateMatch) {
      return templateMatch[1];
    }

    throw new Error(`Template section not found in ${templateName}.md`);
  } catch (error) {
    console.error(`[AI Service] Failed to load template ${templateName}:`, error.message);
    return null;
  }
}

/**
 * Replace variables in template
 */
function fillTemplate(template, variables) {
  let filled = template;

  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    filled = filled.replace(regex, value);
  }

  return filled;
}

/**
 * Write to AI log file
 */
function writeAILog(content) {
  try {
    const timestamp = new Date().toISOString();
    const logEntry = `\n${timestamp}\n${content}\n`;
    fs.appendFileSync(AI_LOG_FILE, logEntry, 'utf8');
  } catch (error) {
    console.error('[AI Service] Failed to write to log file:', error.message);
  }
}

/**
 * Call AI model with logging
 */
async function callAI(prompt, context = '') {
  const startTime = Date.now();

  // Console logging
  console.log('='.repeat(80));
  console.log('[AI] PROMPT START');
  console.log('='.repeat(80));
  console.log(prompt);
  console.log('='.repeat(80));
  console.log('[AI] PROMPT END');
  console.log('='.repeat(80));

  // File logging - Prompt
  const promptLog = `${'='.repeat(80)}
[AI REQUEST] ${context || 'Unknown Context'}
${'='.repeat(80)}
PROMPT:
${prompt}
${'='.repeat(80)}`;
  writeAILog(promptLog);

  const response = await axios.post('http://localhost:11434/api/generate', {
    model: 'gemma3:27b',
    prompt: prompt,
    stream: false
  });

  const result = response.data.response.trim();
  const endTime = Date.now();
  const duration = endTime - startTime;

  // Console logging
  console.log('='.repeat(80));
  console.log(`[AI] RESPONSE START ${context ? `(${context})` : ''}`);
  console.log('='.repeat(80));
  console.log(result);
  console.log('='.repeat(80));
  console.log('[AI] RESPONSE END');
  console.log('='.repeat(80));

  // File logging - Response
  const responseLog = `${'='.repeat(80)}
[AI RESPONSE] ${context || 'Unknown Context'}
Duration: ${duration}ms
${'='.repeat(80)}
RESPONSE:
${result}
${'='.repeat(80)}
`;
  writeAILog(responseLog);

  return result;
}

/**
 * Generate search keywords from user query
 */
async function generateSearchKeywords(query) {
  try {
    console.log('[AI Service] Generating search keywords...');

    const template = loadPromptTemplate('search-keywords-generation');
    if (!template) {
      return query; // Fallback to original query
    }

    const prompt = fillTemplate(template, { query });
    let keywords = await callAI(prompt, 'Search Keywords Generation');

    // Clean up the response
    keywords = keywords
      .replace(/^["']|["']$/g, '')
      .replace(/\n/g, ' ')
      .trim();

    // Validation
    if (!keywords || keywords.length < 2 || keywords.length > query.length * 2) {
      console.log('[AI Service] Generated keywords seem invalid, using original query');
      return query;
    }

    return keywords;
  } catch (error) {
    console.error('[AI Service] Keyword generation error:', error.message);
    return query;
  }
}

/**
 * Analyze best websites for query
 */
async function analyzeBestWebsites(originalQuery, searchKeywords) {
  try {
    console.log('[AI Service] Analyzing best websites...');

    const template = loadPromptTemplate('best-websites-analysis');
    if (!template) {
      return ['일반 검색'];
    }

    const prompt = fillTemplate(template, { originalQuery, searchKeywords });
    let websites = await callAI(prompt, 'Best Websites Analysis');

    // Extract website names
    websites = websites
      .replace(/^\[|\]$/g, '')
      .split(/,|،/)
      .map(s => s.trim())
      .filter(s => s.length > 0);

    console.log('[AI Service] Identified target websites:', websites);

    return websites.length > 0 ? websites : ['일반 검색'];
  } catch (error) {
    console.error('[AI Service] Website analysis error:', error.message);
    return ['일반 검색'];
  }
}

/**
 * Verify search result quality
 */
async function verifySearchQuality(query, searchResults) {
  try {
    console.log('[AI Service] Verifying search result quality...');

    const template = loadPromptTemplate('search-quality-verification');
    if (!template) {
      return { hasAnswer: true, missingInfo: '' };
    }

    const searchResultsText = searchResults
      .map((r, i) => `[${i+1}] ${r.title}\n${r.snippet}`)
      .join('\n\n');

    const prompt = fillTemplate(template, { query, searchResults: searchResultsText });
    const result = await callAI(prompt, 'Search Quality Verification');

    // Parse the response
    const hasAnswerMatch = result.match(/hasAnswer:\s*(yes|no)/i);
    const missingInfoMatch = result.match(/missingInfo:\s*(.+)/i);

    const hasAnswer = hasAnswerMatch ? hasAnswerMatch[1].toLowerCase() === 'yes' : false;
    const missingInfo = missingInfoMatch ? missingInfoMatch[1].trim() : '구체적인 정보 부족';

    return { hasAnswer, missingInfo };
  } catch (error) {
    console.error('[AI Service] Verification error:', error.message);
    return { hasAnswer: true, missingInfo: '' };
  }
}

/**
 * Generate alternative search strategy
 */
async function generateAlternativeSearch(originalQuery, missingInfo, attemptNumber) {
  try {
    console.log('[AI Service] Generating alternative search strategy...');

    const template = loadPromptTemplate('alternative-search-strategy');
    if (!template) {
      return {
        keywords: originalQuery + ' 정보',
        sites: ['일반 검색']
      };
    }

    const prompt = fillTemplate(template, { originalQuery, missingInfo, attemptNumber });
    const result = await callAI(prompt, 'Alternative Search Strategy');

    // Parse the response
    const keywordsMatch = result.match(/keywords:\s*(.+)/i);
    const sitesMatch = result.match(/sites:\s*(.+)/i);

    let keywords = keywordsMatch ? keywordsMatch[1].trim() : originalQuery;
    let sites = sitesMatch
      ? sitesMatch[1].split(/,|،/).map(s => s.trim()).filter(s => s.length > 0)
      : ['일반 검색'];

    // Clean up
    keywords = keywords.replace(/^\[|\]$/g, '').trim();

    return { keywords, sites };
  } catch (error) {
    console.error('[AI Service] Alternative search generation error:', error.message);
    return {
      keywords: originalQuery + ' 정보',
      sites: ['일반 검색']
    };
  }
}

/**
 * Filter search results with AI
 */
async function filterSearchResults(searchResults, query, targetWebsites = []) {
  try {
    console.log('[AI Service] Filtering search results...');

    const template = loadPromptTemplate('search-results-filtering');
    if (!template) {
      return searchResults;
    }

    const websiteContext = targetWebsites.length > 0 ? targetWebsites.join(', ') : '';
    const searchResultsText = searchResults
      .map((r, i) => `[${i+1}] 제목: ${r.title}\n내용: ${r.snippet}\n출처: ${r.source}`)
      .join('\n\n');

    const prompt = fillTemplate(template, {
      query,
      targetWebsites: websiteContext,
      searchResults: searchResultsText
    });

    const filtered = await callAI(prompt, 'Search Results Filtering');

    // Parse AI response and create filtered results
    const lines = filtered.split('\n').filter(line => line.trim());
    const filteredResults = [];

    let currentIndex = 0;
    for (const line of lines) {
      const cleanLine = line.replace(/^\[\d+\]\s*/, '').trim();

      if (cleanLine && cleanLine.length > 20) {
        if (currentIndex < searchResults.length) {
          filteredResults.push({
            title: searchResults[currentIndex].title,
            snippet: cleanLine,
            link: searchResults[currentIndex].link,
            source: searchResults[currentIndex].source
          });
          currentIndex++;
        }
      }
    }

    console.log(`[AI Service] Filtered ${searchResults.length} -> ${filteredResults.length} results`);
    console.log('[AI Service] Filtered snippets:', filteredResults.map(r => r.snippet.substring(0, 100)));

    // If filtering produced too few results, keep original
    if (filteredResults.length < searchResults.length / 2) {
      console.log('[AI Service] Filtering removed too much content, using original results');
      return searchResults;
    }

    return filteredResults.length > 0 ? filteredResults : searchResults;
  } catch (error) {
    console.error('[AI Service] Filter error:', error.message);
    return searchResults;
  }
}

/**
 * Generate final answer with RAG context
 */
async function generateFinalAnswer(finalPrompt, context = 'Final Answer Generation') {
  try {
    const result = await callAI(finalPrompt, context);
    return result;
  } catch (error) {
    console.error('[AI Service] Final answer generation error:', error.message);
    throw error;
  }
}

module.exports = {
  generateSearchKeywords,
  analyzeBestWebsites,
  verifySearchQuality,
  generateAlternativeSearch,
  filterSearchResults,
  generateFinalAnswer,
  loadPromptTemplate,
  fillTemplate
};
