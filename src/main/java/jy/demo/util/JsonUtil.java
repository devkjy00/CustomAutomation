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

    public static String toJson(Map<String, Object> map) {
        return gson.toJson(map);
    }

    /**
     * JsonConvertible 객체를 JSON 문자열로 변환한 후 URL 인코딩을 수행하는 메서드입니다.
     * 
     * 1. 입력받은 dto 객체를 gson을 사용하여 JSON 문자열로 변환합니다.
     * 2. 변환된 JSON 문자열을 UTF-8 인코딩으로 URL 인코딩합니다.
     * 3. URL에서 안전하게 전송할 수 있는 형식의 문자열을 반환합니다.
     * 
     * @param dto JSON으로 변환 가능한 객체
     * @return URL 인코딩된 JSON 문자열
     * @throws RuntimeException UTF-8 인코딩이 지원되지 않을 경우 발생 (실제로는 거의 발생하지 않음)
     */
    public static String toEncodedUrl(JsonConvertible dto) {
        return toEncodedUrl(gson.toJson(dto));
    }

    public static String toEncodedUrl(String json) {
        try {
            return URLEncoder.encode(json, "UTF-8");
        } catch (UnsupportedEncodingException e) {
            // TODO 사용자 예외 클래스 정의하기
            throw new RuntimeException(e);
        }
    }

    public static Map<String, Object> toMap(String json) {
        return gson.fromJson(json, new TypeToken<Map<String, Object>>() {}.getType());
    }

    public static Map<String, Object> toMap(JsonConvertible dto) {
        String json = gson.toJson(dto);
        return toMap(json);
    }

    public String createKakaoSendMsgJson(String text) {
        Map<String, Object> msg = Map.of(
            "template_object", Map.of(
            "object_type", "text",
            "text", text,
            "link", Map.of(
                "web_url", "https://developers.kakao.com",
                "mobile_web_url", "https://developers.kakao.com"
            ),
            "button_title", "바로 확인"
            )
        );

        return gson.toJson(msg);
    }   

}
