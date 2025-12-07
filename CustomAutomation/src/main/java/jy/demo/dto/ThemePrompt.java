package jy.demo.dto;

import lombok.Getter;
import lombok.AllArgsConstructor;

@Getter
@AllArgsConstructor
public class ThemePrompt {
    private String theme;
    private String prompt;
    private boolean requiresWebSearch;

    public ThemePrompt(String theme, String prompt) {
        this.theme = theme;
        this.prompt = prompt;
        this.requiresWebSearch = false;
    }
}
