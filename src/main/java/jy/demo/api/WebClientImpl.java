package jy.demo.api;

import java.util.HashMap;
import java.util.Map;

import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClient.RequestBodySpec;

import jy.demo.dto.JsonConvertible;
import jy.demo.util.JsonUtil;


@Component
public class WebClientImpl implements ApiClient {

	private final WebClient webClient;

    public WebClientImpl(WebClient webClient){
        this.webClient = webClient;
    }

    public String post(String uri, String body, Map<String, String> headers) {
        RequestBodySpec headersSpec = webClient.post()
            .uri(uri)
            .headers(httpHeaders -> {
                httpHeaders.setAll(headers);
            });

        headersSpec = setRequestSpec(body, headers, headersSpec);

        return headersSpec
            .retrieve()
            .bodyToMono(new ParameterizedTypeReference<String>() {}) 
            .block();
    }

    private RequestBodySpec setRequestSpec(String body, Map<String, String> headers, WebClient.RequestBodySpec headersSpec) {

        if (headers.containsKey(CONTENT_TYPE) && headers.get(CONTENT_TYPE).equals(APP_TYPE_URL_ENCODED)) {
            // URL encoded form data 처리
            MultiValueMap<String, String> formData = convertToMultiValueMap(JsonUtil.toMap(body));
            headersSpec.bodyValue(formData);
        } else {
            // 기본적으로 JSON으로 처리
            headersSpec.bodyValue(body);
        }

        return headersSpec;
    }

    public String postWithObjectHeaders(String uri, String body, Map<String, Object> headers) {
        Map<String, String> headersStr = toStringMap(headers);
        return post(uri, body, headersStr);
    }

    public String post(String uri, JsonConvertible body, Map<String, Object> headers) {
        return postWithObjectHeaders(uri, JsonUtil.toJson(body), headers);
    }

    @Override
    public String post(String uri, String body, String headers) { 
        return postWithObjectHeaders(uri, body, JsonUtil.toMap(headers));
    }

    private Map<String, String> toStringMap(Map<String, Object> headers) {
        Map<String, String> headersStr = new HashMap<>();

        headers.entrySet().stream()
        .forEach(entry -> {
            if (entry.getValue() instanceof String) {
                headersStr.put(entry.getKey(), (String) entry.getValue());
            } else if(entry.getValue() instanceof Map) {
                headersStr.put(entry.getKey(), JsonUtil.toJson((Map<String, Object>) entry.getValue()));
            }
        });
        return headersStr;
    }

    private MultiValueMap<String, String> convertToMultiValueMap(Map<String, Object> map) {
        MultiValueMap<String, String> multiValueMap = new LinkedMultiValueMap<>();
        toStringMap(map).forEach(multiValueMap::add);
        return multiValueMap;
    }
}
