package jy.demo.dto;

import java.lang.reflect.Field;
import java.util.HashMap;
import java.util.Map;

import com.google.gson.annotations.SerializedName;


public class KakaoOAuthDto implements HttpRequestDto{

    // 맥 터미널에ㅓ ㅅ8081 번 포트로 돌아가는 프로세스 찾는 명령어
    // lsof -i tcp:8081

        @SerializedName("code")
        private String code = "";
        @SerializedName("grant_type")
        private String grantType = "authorization_code";
        @SerializedName("client_id")
        private String clientId = "620c9095c04cad076902cde3e1237d7a";
        @SerializedName("redirect_url")
        private String redirectUrl = "http://southoftheriver.synology.me:8081/kakao/callback";

        public KakaoOAuthDto(String code) {
            this.code = code;
        }

        @Override
        public Map<String, String> toMap() {
            Map<String, String> result = new HashMap<>();
            Field[] fields = this.getClass().getDeclaredFields();

            for (Field field : fields) {
                try {
                    boolean accessible = field.canAccess(this);
                    if (!accessible) field.setAccessible(true);
                    result.put(field.getName(), field.get(this).toString());
                    if (!accessible) field.setAccessible(false);
                } catch (IllegalAccessException e) {
                    throw new RuntimeException("Error occurred while creating map", e);
                }
            }

            return result;
        }
}


