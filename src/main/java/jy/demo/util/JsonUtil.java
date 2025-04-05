package jy.demo.util;

import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.util.Map;

import org.springframework.stereotype.Component;

import com.google.gson.FieldNamingPolicy;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.reflect.TypeToken;

import jy.demo.dto.JsonConvertible;

@Component
public class JsonUtil {
    static Gson gson = new GsonBuilder()
            .setFieldNamingPolicy(FieldNamingPolicy.LOWER_CASE_WITH_UNDERSCORES)
            .create();

    public static String toJson(JsonConvertible dto) {
        return gson.toJson(dto);
    }

    public static String toJson(Map<String, String> map) {
        return gson.toJson(map);
    }

    public static String toEncodedUrl(JsonConvertible dto) {
        try {
            return URLEncoder.encode(gson.toJson(dto), "UTF-8");
        } catch (UnsupportedEncodingException e) {
            // TODO 사용자 예외 클래스 정의하기
            throw new RuntimeException(e);
        }
    }

    public static Map<String, String> toMap(String json) {
        return gson.fromJson(json, new TypeToken<Map<String, String>>() {
        }.getType());
    }

    public static Map<String, Object> parseResponse(String json) {
        return gson.fromJson(json, new TypeToken<Map<String, Object>>() {
        }.getType());
    }

    public static Map<String, String> toMap(JsonConvertible dto) {
        String json = gson.toJson(dto);
        return toMap(json);
    }

    public String createKakaoSendMsgJson(String text) {
        Map<String, Object> msg = Map.of(
            "object_type", "text",
            "text", text,
            "link", Map.of(
                "web_url", "https://developers.kakao.com",
                "mobile_web_url", "https://developers.kakao.com"
            ),
            "button_title", "바로 확인"
        );

        return gson.toJson(msg);
    }   

}
