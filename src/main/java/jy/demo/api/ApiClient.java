package jy.demo.api;

import java.util.HashMap;
import java.util.Map;

import jy.demo.dto.HttpRequestDto;

public interface ApiClient {

    final String CONTENT_TYPE = "Content-Type";
    final String APP_TYPE_URL_ENCODED = "application/x-www-form-urlencoded;charset=UTF-8";
    final String APP_TYPE_JSON = "application/json;charset=UTF-8";

    Map<String, String> post(String uri, HttpRequestDto body, Map<String, String> headers);

    default Map<String, String> generateUrlEncodedHeader(){
        Map<String, String> headers = new HashMap<>();
        headers.put(CONTENT_TYPE, APP_TYPE_URL_ENCODED);
        return headers;
    }

    default Map<String, String> generateJsonHeader(){
        Map<String, String> headers = new HashMap<>();
        headers.put(CONTENT_TYPE, APP_TYPE_JSON);
        return headers;
    };

}