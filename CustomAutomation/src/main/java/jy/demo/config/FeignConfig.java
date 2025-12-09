package jy.demo.config;

import feign.Request;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.TimeUnit;

/**
 * Feign Client Configuration
 * 자율 에이전트의 긴 실행 시간을 지원하기 위한 타임아웃 설정
 */
@Configuration
public class FeignConfig {

    /**
     * Feign Request Options 설정
     * - connectTimeout: 5초
     * - readTimeout: 3분 (180초) - 자율 에이전트 대응
     */
    @Bean
    public Request.Options requestOptions() {
        return new Request.Options(
            5000,    // connectTimeout: 5초
            TimeUnit.MILLISECONDS,
            180000,  // readTimeout: 3분 (자율 에이전트의 긴 실행 시간 대응)
            TimeUnit.MILLISECONDS,
            true     // followRedirects
        );
    }
}
