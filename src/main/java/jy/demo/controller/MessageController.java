package jy.demo.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import jy.demo.api.DalaiClient;
import jy.demo.service.KakaoMsgServiceImpl;
@RestController
@RequestMapping("/message")
public class MessageController {

    private final KakaoMsgServiceImpl kakaoMsgService;
	private final DalaiClient dalaiClient;

    @Autowired
    public MessageController(KakaoMsgServiceImpl kakaoMsgService, DalaiClient dalaiClient) {
        this.kakaoMsgService = kakaoMsgService;
		this.dalaiClient = dalaiClient;
    }

    @GetMapping("/send/kakaoMsg")
    public String sendMessage(@RequestParam("text") String text) {
        return kakaoMsgService.sendMessage(text); 
    }

    @GetMapping("/ai-chat")
    public String chatAi(@RequestParam("text") String prompt) {
		String text = dalaiClient.sendPrompt(prompt);
        return kakaoMsgService.sendMessage(text); 
    }
}
