package jy.demo.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import jy.demo.service.KakaoMsgServiceImpl;

@RestController
@RequestMapping("/message")
public class MessageController {

    private final KakaoMsgServiceImpl kakaoMsgService;

    @Autowired
    public MessageController(KakaoMsgServiceImpl kakaoMsgService) {
        this.kakaoMsgService = kakaoMsgService;
    }

    @GetMapping("/send/kakaoMsg")
    public String sendMessage(@RequestParam("text") String text) {
        return kakaoMsgService.sendMessage(text); 
    }
}
