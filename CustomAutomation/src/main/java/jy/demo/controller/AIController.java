package jy.demo.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import jy.demo.api.ChatGPTClient;
import jy.demo.api.DalaiClient;
import jy.demo.service.SlackMsgService;

import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.util.Map;

@RestController
public class AIController {

	private static final Logger logger = LoggerFactory.getLogger(AIController.class);

	private final ChatGPTClient chatGPTClient;
	private final DalaiClient dalaiClient;
	private final SlackMsgService slackMsgService;

	public AIController(ChatGPTClient chatGPTClient, DalaiClient dalaiClient, SlackMsgService slackMsgService) {
		this.chatGPTClient = chatGPTClient;
		this.dalaiClient = dalaiClient;
		this.slackMsgService = slackMsgService;
	}

	private final String SYS_PROMPT =  
		"You are a developer with excellent Java and JavaScript development skills. \n" + 
		"Please regenerate the code by refactoring the given source. \n" + 
		"Please write the regenerated code in the output area below. \n" + 
		"output :  \n" + 
		" \n" + 
		"input : \n";

	@GetMapping("/refactoring")
	public String doRefactoring(@RequestParam("prompt") String prompt) {
		return chatGPTClient.sendRequest(prompt, SYS_PROMPT);
	}

	@PostMapping("/refactoring")
	public String doRefactoring(@RequestBody Map<String, String> prompt) {
		return chatGPTClient.sendRequest(prompt.get("prompt"), SYS_PROMPT);
	}

	@GetMapping("/ai")
	public String doAI(@RequestParam("prompt") String prompt) {
		return dalaiClient.sendPrompt(prompt);
	}

	/**
	 * 웹 검색 + AI 응답 + Slack 전송
	 * 자동으로 웹 검색을 수행하고 최신 정보를 기반으로 AI 응답 생성 후 Slack으로 전송
	 */
	@GetMapping("/ai/search")
	public String doAIWithSearch(@RequestParam("prompt") String prompt) {
		try {
			logger.info("=== AI 웹 검색 요청 ===");
			logger.info("질문: {}", prompt);

			long startTime = System.currentTimeMillis();

			// 웹 검색 모드로 AI 호출 (search=true)
			String rawResponse = dalaiClient.sendPromptWithSearch(prompt, true);

			long endTime = System.currentTimeMillis();
			logger.info("AI 응답 완료 (소요시간: {}ms)", endTime - startTime);

			// 응답 파싱 (answer : 프리픽스와 <end> 태그 제거)
			String cleanedResponse = parseAIResponse(rawResponse);

			logger.info("정제된 응답 길이: {} 자", cleanedResponse.length());

			// Slack으로 전송
			logger.info("Slack 메시지 전송 중...");
			String slackResult = slackMsgService.sendRichMessage("🔍 AI 웹 검색 결과: " + prompt, cleanedResponse);
			logger.info("Slack 전송 결과: {}", slackResult);

			return cleanedResponse;

		} catch (Exception e) {
			logger.error("AI 웹 검색 실패: {}", e.getMessage(), e);
			return "AI 응답 생성 중 오류가 발생했습니다: " + e.getMessage();
		}
	}

	/**
	 * AI 응답 파싱: "answer : " 프리픽스 제거 및 정제
	 */
	private String parseAIResponse(String rawResponse) {
		if (rawResponse == null || rawResponse.trim().isEmpty()) {
			return "AI 응답을 받지 못했습니다.";
		}

		// "answer : " 프리픽스 제거
		String cleaned = rawResponse.trim();
		if (cleaned.startsWith("answer :") || cleaned.startsWith("answer:")) {
			cleaned = cleaned.replaceFirst("^answer\\s*:\\s*", "");
		}

		// <end> 태그 제거
		cleaned = cleaned.replaceAll("<end>.*$", "").trim();

		// 빈 응답 체크
		if (cleaned.isEmpty()) {
			return "AI가 유효한 응답을 생성하지 못했습니다.";
		}

		return cleaned;
	}
}