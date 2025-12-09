package jy.demo.service;

import jy.demo.api.DalaiClient;
import jy.demo.dto.ThemePrompt;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;

@Service
public class ScheduledMessageService {

    private static final Logger logger = LoggerFactory.getLogger(ScheduledMessageService.class);

    private final ThemePromptService themePromptService;
    private final DalaiClient dalaiClient;
    private final KakaoMsgServiceImpl kakaoMsgService;
    private final SlackMsgService slackMsgService;

    public ScheduledMessageService(
            ThemePromptService themePromptService,
            DalaiClient dalaiClient,
            KakaoMsgServiceImpl kakaoMsgService,
            SlackMsgService slackMsgService) {
        this.themePromptService = themePromptService;
        this.dalaiClient = dalaiClient;
        this.kakaoMsgService = kakaoMsgService;
        this.slackMsgService = slackMsgService;
    }

    /**
     * 1시간마다 AI 응답을 전송
     * cron: "0 0 * * * *" = 매시 정각
     */
    @Scheduled(cron = "0 0 * * * *")
    public void sendHourlyAIMessage() {
        int hour = LocalDateTime.now().getHour(); // 0~23

        // 9 <= hour <= 20 일 때만 전송
        if (!(hour >= 9 && hour <= 20)) {
            return;
        }
        try {
            logger.info("=== 정기 메시지 전송 시작 ===");

            // 1. 시간대에 맞는 테마 선택
            ThemePrompt theme = themePromptService.getThemeByTime();
            logger.info("선택된 테마: {}", theme.getTheme());
            logger.info("웹 검색 필요 여부: {}", theme.isRequiresWebSearch());

            // 2. AI에게 프롬프트 전송 (웹 검색 자동 활성화)
            logger.info("AI 응답 요청 중...");
            logger.debug("프롬프트: {}", theme.getPrompt());

            long startTime = System.currentTimeMillis();
            String rawResponse;

            if (theme.isRequiresWebSearch()) {
                logger.info("🤖 자율 에이전트 모드로 AI 호출");
                rawResponse = dalaiClient.sendPromptWithSearchAgent(theme.getPrompt(), true, true);
            } else {
                rawResponse = dalaiClient.sendPrompt(theme.getPrompt());
            }

            long endTime = System.currentTimeMillis();

            logger.info("AI 응답 수신 완료 (소요시간: {}ms)", endTime - startTime);
            logger.debug("AI 원본 응답: {}", rawResponse);

            // AI 응답 파싱
            String aiResponse = parseAIResponse(rawResponse);
            logger.info("AI 파싱 응답: {}", aiResponse);

            // 3. 메시지 포맷팅
            String message = String.format("[%s]\n%s", theme.getTheme(), aiResponse);

            // 4. Slack 전송
            logger.info("Slack 메시지 전송 중...");
            String slackResult = slackMsgService.sendRichMessage(theme.getTheme(), aiResponse);
            logger.info("Slack 전송 결과: {}", slackResult);

            // 5. 카카오톡 전송 (옵션)
            logger.info("카카오톡 메시지 전송 중...");
            String kakaoResult = kakaoMsgService.sendMessage(message);
            logger.info("카카오톡 전송 결과: {}", kakaoResult);

            logger.info("=== 정기 메시지 전송 완료 ===");

        } catch (Exception e) {
            logger.error("정기 메시지 전송 실패: {}", e.getMessage(), e);
        }
    }

    /**
     * 테스트용: 1분마다 실행
     * 테스트 후 주석 처리 필요
     */
    // @Scheduled(cron = "0 * * * * *")
    public void sendTestMessage() {
        try {
            logger.info("=== 테스트 메시지 전송 ===");

            ThemePrompt theme = themePromptService.getRandomTheme();
            logger.info("테스트 테마: {}", theme.getTheme());
            logger.info("웹 검색 필요 여부: {}", theme.isRequiresWebSearch());
            logger.debug("테스트 프롬프트: {}", theme.getPrompt());

            long startTime = System.currentTimeMillis();
            String rawResponse;

            if (theme.isRequiresWebSearch()) {
                logger.info("🤖 자율 에이전트 모드로 AI 호출");
                rawResponse = dalaiClient.sendPromptWithSearchAgent(theme.getPrompt(), true, true);
            } else {
                rawResponse = dalaiClient.sendPrompt(theme.getPrompt());
            }

            long endTime = System.currentTimeMillis();

            logger.info("AI 응답 수신 완료 (소요시간: {}ms)", endTime - startTime);
            logger.debug("AI 원본 응답: {}", rawResponse);

            // AI 응답 파싱
            String aiResponse = parseAIResponse(rawResponse);
            logger.info("AI 파싱 응답: {}", aiResponse);

            String message = String.format("[테스트-%s]\n%s", theme.getTheme(), aiResponse);

            // Slack 전송
            String slackResult = slackMsgService.sendRichMessage("테스트 - " + theme.getTheme(), aiResponse);
            logger.info("Slack 테스트 전송 결과: {}", slackResult);

            // 카카오톡 전송
            String kakaoResult = kakaoMsgService.sendMessage(message);
            logger.info("카카오톡 테스트 전송 결과: {}", kakaoResult);

        } catch (Exception e) {
            logger.error("테스트 메시지 전송 실패: {}", e.getMessage(), e);
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

    /**
     * 수동 실행용 메서드 - 항상 자율 에이전트 사용
     */
    public String sendManualMessage(String customPrompt) {
        try {
            logger.info("🤖 수동 메시지 전송 시작 (자율 에이전트 모드)");
            logger.debug("커스텀 프롬프트: {}", customPrompt);

            long startTime = System.currentTimeMillis();
            // 수동 실행은 항상 자율 에이전트 사용
            String rawResponse = dalaiClient.sendPromptWithSearchAgent(customPrompt, true, true);
            long endTime = System.currentTimeMillis();

            logger.info("AI 응답 수신 완료 (소요시간: {}ms)", endTime - startTime);
            logger.debug("AI 원본 응답: {}", rawResponse);

            // AI 응답 파싱
            String aiResponse = parseAIResponse(rawResponse);
            logger.info("AI 파싱 응답: {}", aiResponse);

            String message = String.format("[수동 실행]\n%s", aiResponse);

            return kakaoMsgService.sendMessage(message);

        } catch (Exception e) {
            logger.error("수동 메시지 전송 실패: {}", e.getMessage(), e);
            return "메시지 전송 실패: " + e.getMessage();
        }
    }
}
