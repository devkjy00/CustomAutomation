package jy.demo.util;

import com.fasterxml.jackson.databind.ObjectMapper;
import jy.demo.dto.KakaoTokenDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;

@Component
public class KakaoTokenFileManager {
    private static final Logger logger = LoggerFactory.getLogger(KakaoTokenFileManager.class);
    private static final String TOKEN_FILE_PATH = "kakao-tokens.json";
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * 토큰 파일에서 토큰을 로드합니다.
     */
    public KakaoTokenDto loadToken() {
        File tokenFile = new File(TOKEN_FILE_PATH);

        if (!tokenFile.exists()) {
            logger.info("카카오 토큰 파일이 존재하지 않습니다: {}", TOKEN_FILE_PATH);
            return null;
        }

        try {
            KakaoTokenDto token = objectMapper.readValue(tokenFile, KakaoTokenDto.class);

            if (token != null && token.getAccessToken() != null && !token.getAccessToken().isEmpty()) {
                logger.info("카카오 토큰을 파일에서 로드했습니다.");
                return token;
            } else {
                logger.warn("카카오 토큰 파일이 비어있거나 유효하지 않습니다.");
                return null;
            }
        } catch (IOException e) {
            logger.error("카카오 토큰 파일 읽기 실패: {}", e.getMessage());
            return null;
        }
    }

    /**
     * 토큰을 파일에 저장합니다.
     */
    public boolean saveToken(String accessToken, String refreshToken) {
        KakaoTokenDto token = new KakaoTokenDto();
        token.setAccessToken(accessToken);
        token.setRefreshToken(refreshToken);
        token.setUpdatedAt(java.time.Instant.now().toString());

        return saveToken(token);
    }

    /**
     * 토큰 객체를 파일에 저장합니다.
     */
    public boolean saveToken(KakaoTokenDto token) {
        try {
            objectMapper.writerWithDefaultPrettyPrinter().writeValue(new File(TOKEN_FILE_PATH), token);
            logger.info("카카오 토큰을 파일에 저장했습니다: {}", TOKEN_FILE_PATH);
            return true;
        } catch (IOException e) {
            logger.error("카카오 토큰 파일 저장 실패: {}", e.getMessage());
            return false;
        }
    }

    /**
     * 토큰 파일이 존재하는지 확인합니다.
     */
    public boolean tokenFileExists() {
        return Files.exists(Paths.get(TOKEN_FILE_PATH));
    }

    /**
     * 토큰 파일을 삭제합니다.
     */
    public boolean deleteToken() {
        try {
            Files.deleteIfExists(Paths.get(TOKEN_FILE_PATH));
            logger.info("카카오 토큰 파일을 삭제했습니다.");
            return true;
        } catch (IOException e) {
            logger.error("카카오 토큰 파일 삭제 실패: {}", e.getMessage());
            return false;
        }
    }
}
