package jy.demo.util;

import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.util.Map;

import org.springframework.stereotype.Component;

import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;

import jy.demo.dto.HttpRequestDto;

@Component
public class JsonUtil {

    private Gson gson = new Gson();

    public String toJson(HttpRequestDto dto){
        return gson.toJson(dto);
    }

    public String toEncodedUrl(HttpRequestDto dto){
        try {
            return URLEncoder.encode(gson.toJson(dto), "UTF-8");
        } catch (UnsupportedEncodingException e) {
            // TODO 사용자 예외 클래스 정의하기
            throw new RuntimeException(e);
        }
    };

    public Map<String, String> toMap(String json){
        return gson.fromJson(json, new TypeToken<Map<String, String>>(){}.getType());
    }


}
