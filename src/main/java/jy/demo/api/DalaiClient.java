package jy.demo.api;

import java.util.Map;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import feign.Headers;

@FeignClient(name = "dalaiClient", url = "http://southoftheriver.synology.me:3000")
public interface DalaiClient {
    // @PostMapping(value = "/refactoring", consumes = "application/json")
    // @Headers("Content-Type: application/json")
    // String getHello(@RequestBody Map<String, String> prompt);

    @GetMapping(value = "/users", consumes = "application/json")
    @Headers("Content-Type: application/json")
    String sendPrompt(@RequestParam("q") String q);
}
