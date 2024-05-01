package jy.demo.api;

import java.util.Map;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import feign.Headers;

@FeignClient(name = "kakaoClient")
public interface KakaoMessageClient {

    @PostMapping(value = "https://kauth.kakao.com/oauth/token", consumes = "application/json")
    @Headers("Content-Type: application/x-www-form-urlencoded;charset=UTF-8")
    Map<String, String> auth(@RequestBody Map<String, String> parameters);
}
