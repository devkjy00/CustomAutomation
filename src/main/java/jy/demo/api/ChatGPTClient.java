package jy.demo.api;
import java.io.BufferedReader;
import java.io.InputStreamReader;

import org.apache.http.HttpEntity;
import org.apache.http.HttpHeaders;
import org.apache.http.HttpResponse;
import org.apache.http.client.HttpClient;
import org.apache.http.client.entity.EntityBuilder;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.impl.client.HttpClients;
import org.springframework.stereotype.Component;

import org.springframework.beans.factory.annotation.Value;
import org.json.JSONArray;
import org.json.JSONObject;


@Component
public class ChatGPTClient {

    @Value("${openai.apiKey}")
    private String apiKey;
    @Value("${openai.apiUrl}")
    private String apiUrl;
    @Value("${openai.model}")
	private String model;

    public String sendRequest(String userPrompt, String systemPrompt) {
        JSONArray jsonArr = new JSONArray();
        JSONObject system = new JSONObject();
        system.put("role", "system");
        system.put("content", systemPrompt);

        jsonArr.put(system);

        JSONObject user = new JSONObject();
        user.put("role", "user");

        JSONArray userJsonArr = new JSONArray();
        if (!userPrompt.isEmpty()) {
            JSONObject textContent = new JSONObject();
            textContent.put("type", "text");
            textContent.put("text", userPrompt);
            userJsonArr.put(textContent);
        }

        JSONObject detail = new JSONObject();
        detail.put("detail", "high");

        user.put("content", userJsonArr);
        jsonArr.put(user);

        JSONObject reqJson = new JSONObject();
        reqJson.put("model", model);
        reqJson.put("messages", jsonArr);
        reqJson.put("max_tokens", 4096);
        reqJson.put("temperature", 0);
        reqJson.put("seed", 2024);
        String requestData = reqJson.toString();
        System.out.println("input >>>> " + requestData);

        String result = callAPI(requestData);

        JSONObject output = new JSONObject(result);
        return output.getJSONArray("choices").getJSONObject(0).getJSONObject("message").getString("content");
    }


    private String callAPI(String requestData) {
        StringBuilder response = new StringBuilder();
        HttpClient httpClient = HttpClients.createDefault();
        HttpPost httpPost = new HttpPost(apiUrl);
        httpPost.setHeader(HttpHeaders.CONTENT_TYPE, "application/json");
        httpPost.setHeader(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey);

        httpPost.setEntity(EntityBuilder.create().setText(requestData).build());
        try {
            HttpResponse httpResponse = httpClient.execute(httpPost);
            HttpEntity entity = httpResponse.getEntity();
            if (entity != null) {
                try (BufferedReader bufferedReader = new BufferedReader(new InputStreamReader(entity.getContent()))) {
                    String line;
                    System.out.print("output >>>> ");
                    while ((line = bufferedReader.readLine()) != null) {
                        System.out.println(line);
                        response.append(line);
                    }
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
            return "";
        }

        return response.toString();
    }
}
