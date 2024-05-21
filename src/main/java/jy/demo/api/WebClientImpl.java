package jy.demo.api;

import java.util.*;
import java.util.function.Function;

import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;

import jy.demo.util.JsonUtil;

import jy.demo.dto.HttpRequestDto;


@Component
public class WebClientImpl implements ApiClient {

	private final WebClient webClient;
    private final Map<String, Function<HttpRequestDto, String>> encFuncMap; 

    // 현재는 필요 없음
    private final JsonUtil jsonUtil;

    public WebClientImpl(WebClient webClient, JsonUtil jsonUtil){
        this.webClient = webClient;
        this.jsonUtil = jsonUtil;

        this.encFuncMap = Map.of(
            APP_TYPE_URL_ENCODED, ((body) -> jsonUtil.toEncodedUrl(body)),
            APP_TYPE_JSON, ((body) -> jsonUtil.toJson(body))
            );
    }

    public Map<String, String> post(String uri, Map<String, String> body, Map<String, String> headers) {

        return webClient.post()

            .uri(uri)
            .headers(header -> header.addAll(convertToMultiValueMap(headers)))
            // .bodyValue(encFunction.apply(body))
            .body(BodyInserters.fromFormData(convertToMultiValueMap(body)))
            // .body(BodyInserters.fromFormData(convertToMultiValueMap(body.toMap())))
            // .body(convertToMultiValueMap(jsonUtil.toMap(encFunction.apply(body))))
            .retrieve()
            .bodyToMono(new ParameterizedTypeReference<Map<String, String>>() {}) 
            .block();
    }


    @Override
    public Map<String, String> post(String uri, HttpRequestDto body, Map<String, String> headers) {

        Function<HttpRequestDto, String> encFunction = encFuncMap.get(headers.get(CONTENT_TYPE));
        Map<String, String> map = body.toMap();
        return post(uri, map, headers);

    }

    private MultiValueMap<String, String> convertToMultiValueMap(Map<String, String> map){
        MultiValueMap<String, String> multiValueMap = new LinkedMultiValueMap<>();
        map.forEach(multiValueMap::add);
        return multiValueMap;
    }
}
