package jy.demo.controller;

import jy.demo.service.SlackMsgService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/slack")
public class SlackController {

    private final SlackMsgService slackMsgService;

    public SlackController(SlackMsgService slackMsgService) {
        this.slackMsgService = slackMsgService;
    }

    /**
     * Slack 메시지 전송 테스트 (간단한 텍스트)
     * GET /slack/test?message=테스트메시지
     */
    @GetMapping("/test")
    public String testSimpleMessage(@RequestParam("message") String message) {
        return slackMsgService.sendMessage(message);
    }

    /**
     * Slack Rich 메시지 전송 테스트
     * GET /slack/rich?theme=제목&content=내용
     */
    @GetMapping("/rich")
    public String testRichMessage(
            @RequestParam("theme") String theme,
            @RequestParam("content") String content) {
        return slackMsgService.sendRichMessage(theme, content);
    }

    /**
     * Webhook 설정 상태 확인
     * GET /slack/status
     */
    @GetMapping("/status")
    public String checkStatus() {
        if (slackMsgService.isWebhookConfigured()) {
            return "Slack Webhook이 설정되어 있습니다.";
        } else {
            return "Slack Webhook이 설정되지 않았습니다. application.yml 또는 환경변수 SLACK_WEBHOOK_URL을 설정해주세요.";
        }
    }
}
