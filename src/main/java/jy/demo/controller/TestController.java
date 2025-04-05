package jy.demo.controller;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/test")
public class TestController {

    @GetMapping
    public String getTest() {
        return "GET 요청 성공";
    }

    @PostMapping
    public String postTest(@RequestBody String body) {
        return "POST 요청 성공: " + body;
    }

    @PutMapping
    public String putTest(@RequestBody String body) {
        return "PUT 요청 성공: " + body;
    }

    @DeleteMapping
    public String deleteTest() {
        return "DELETE 요청 성공";
    }

    @PatchMapping
    public String patchTest(@RequestBody String body) {
        return "PATCH 요청 성공: " + body;
    }
} 