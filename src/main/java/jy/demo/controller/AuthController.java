package jy.demo.controller;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import jy.demo.service.KakaoMsgServiceImpl;

import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;

@RestController
public class AuthController {

    // MessageService messageService;

    // TODO : 테스트로 사용하고 나중에 정리하자
    KakaoMsgServiceImpl kakaoMsgServiceImpl;

    // public AuthController(MessageService messageService, KakaoMsgServiceImpl kakaoMsgServiceImpl) {
    public AuthController(KakaoMsgServiceImpl kakaoMsgServiceImpl) {
        // this.messageService = messageService;
        this.kakaoMsgServiceImpl = kakaoMsgServiceImpl;
    }

    @GetMapping("/kakao/callback")
    public String kakao(@RequestParam("code") String code) {
    // public String kakao() {
        // System.out.println();
        kakaoMsgServiceImpl.requestAccessToken(code);
        return "kakao";
    }

    @PostMapping("/test")
    public String test(@RequestHeader Map<String, String> header, @RequestBody Map<String, String> body) {
        return "kakao";
    }
}