package jy.demo.controller;

import jy.demo.dto.ThemePrompt;
import jy.demo.service.ScheduledMessageService;
import jy.demo.service.ThemePromptService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/scheduled")
public class ScheduledMessageController {

    private final ScheduledMessageService scheduledMessageService;
    private final ThemePromptService themePromptService;

    @Autowired
    public ScheduledMessageController(
            ScheduledMessageService scheduledMessageService,
            ThemePromptService themePromptService) {
        this.scheduledMessageService = scheduledMessageService;
        this.themePromptService = themePromptService;
    }

    /**
     * 수동으로 테마 메시지 전송 테스트
     */
    @GetMapping("/test")
    public String testScheduledMessage() {
        scheduledMessageService.sendTestMessage();
        return "테스트 메시지 전송 완료";
    }

    /**
     * 커스텀 프롬프트로 수동 전송
     */
    @GetMapping("/manual")
    public String sendManualMessage(@RequestParam("prompt") String prompt) {
        return scheduledMessageService.sendManualMessage(prompt);
    }

    /**
     * 등록된 모든 테마 목록 조회
     */
    @GetMapping("/themes")
    public List<ThemePrompt> getAllThemes() {
        return themePromptService.getAllThemes();
    }

    /**
     * 랜덤 테마 조회
     */
    @GetMapping("/theme/random")
    public ThemePrompt getRandomTheme() {
        return themePromptService.getRandomTheme();
    }

    /**
     * 현재 시간대 기반 테마 조회
     */
    @GetMapping("/theme/current")
    public ThemePrompt getCurrentTheme() {
        return themePromptService.getThemeByTime();
    }

    /**
     * 새로운 테마 추가
     */
    @PostMapping("/theme/add")
    public String addTheme(
            @RequestParam("theme") String theme,
            @RequestParam("prompt") String prompt) {
        themePromptService.addTheme(theme, prompt);
        return "테마 추가 완료: " + theme;
    }
}
