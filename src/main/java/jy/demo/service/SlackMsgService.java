package jy.demo.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Service
public class SlackMsgService {

    private static final Logger logger = LoggerFactory.getLogger(SlackMsgService.class);

    @Value("${slack.webhook.url}")
    private String webhookUrl;

    private final RestTemplate restTemplate;

    public SlackMsgService() {
        this.restTemplate = new RestTemplate();
    }

    /**
     * Slack에 간단한 텍스트 메시지 전송
     */
    public String sendMessage(String message) {
        try {
            logger.info("Slack 메시지 전송 시작");
            logger.debug("메시지 내용: {}", message);

            Map<String, Object> payload = new HashMap<>();
            payload.put("text", message);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);

            restTemplate.postForObject(webhookUrl, request, String.class);

            logger.info("Slack 메시지 전송 성공");
            return "메시지 전송에 성공했습니다.";

        } catch (Exception e) {
            logger.error("Slack 메시지 전송 실패: {}", e.getMessage(), e);
            return "메시지 전송에 실패했습니다: " + e.getMessage();
        }
    }

    /**
     * Slack에 Rich Formatting 메시지 전송 (Blocks 사용)
     */
    public String sendRichMessage(String theme, String content) {
        try {
            logger.info("Slack Rich 메시지 전송 시작");
            logger.debug("테마: {}, 내용: {}", theme, content);

            Map<String, Object> payload = new HashMap<>();

            // Blocks를 사용한 Rich Formatting
            Map<String, Object> headerBlock = new HashMap<>();
            headerBlock.put("type", "header");
            Map<String, String> headerText = new HashMap<>();
            headerText.put("type", "plain_text");
            headerText.put("text", theme);
            headerBlock.put("text", headerText);

            Map<String, Object> contentBlock = new HashMap<>();
            contentBlock.put("type", "section");
            Map<String, String> contentText = new HashMap<>();
            contentText.put("type", "mrkdwn");
            contentText.put("text",  content);
            contentBlock.put("text", contentText);

            Map<String, Object> dividerBlock = new HashMap<>();
            dividerBlock.put("type", "divider");

            payload.put("blocks", new Object[]{headerBlock, dividerBlock, contentBlock});

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);

            restTemplate.postForObject(webhookUrl, request, String.class);

            logger.info("Slack Rich 메시지 전송 성공");
            return "Rich 메시지 전송에 성공했습니다.";

        } catch (Exception e) {
            logger.error("Slack Rich 메시지 전송 실패: {}", e.getMessage(), e);
            return "Rich 메시지 전송에 실패했습니다: " + e.getMessage();
        }
    }

    /**
     * Webhook URL 유효성 검사
     */
    public boolean isWebhookConfigured() {
        return webhookUrl != null
            && !webhookUrl.isEmpty()
            && !webhookUrl.contains("YOUR/WEBHOOK/URL");
    }
}
