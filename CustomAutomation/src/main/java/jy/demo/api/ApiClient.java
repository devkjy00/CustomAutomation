package jy.demo.api;

import java.util.HashMap;
import java.util.Map;

public interface ApiClient {

    final String CONTENT_TYPE = "Content-Type";
    final String APP_TYPE_URL_ENCODED = "application/x-www-form-urlencoded";
    final String APP_TYPE_JSON = "application/json";

    String post(String uri, String body, String headers);

    default Map<String, Object> generateUrlEncodedHeader(){
        Map<String, Object> headers = new HashMap<>();
        headers.put(CONTENT_TYPE, APP_TYPE_URL_ENCODED);
        return headers;
    }

    default Map<String, Object> generateJsonHeader(){
        Map<String, Object> headers = new HashMap<>();
        headers.put(CONTENT_TYPE, APP_TYPE_JSON);
        return headers;
    };
}
