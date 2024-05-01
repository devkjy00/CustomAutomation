package jy.demo.service;

import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import java.util.HashMap;
import java.util.Map;   
import com.google.gson.Gson;
import org.springframework.util.MultiValueMap;
import org.slf4j.Logger;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Service;


import jy.demo.api.KakaoMessageClient;

@Service
public class KakaoMsgServiceImpl {
    // private Logger logger = LoggerFactory.getLogger(this.getClass());


    private final KakaoMessageClient kakaoMessageClient;

    public KakaoMsgServiceImpl(KakaoMessageClient kakaoMessageClient) {
        this.kakaoMessageClient = kakaoMessageClient;
    }

	private static final String AUTH_URL = "https://kauth.kakao.com/oauth/token";
	public static String authToken;

	public void getKakaoAuthToken(String code)  {
		String accessToken = "";
		String refrashToken = "";

		Map<String, String> parameters = new HashMap<>();
		parameters.put("code", code);
		parameters.put("grant_type", "authorization_code");
		parameters.put("client_id", "your client id");
		parameters.put("redirect_url", "http://localhost:88");
		parameters.put("client_secret", "your client secret");

        kakaoMessageClient.auth(parameters);
		// accessToken = jsonData.get("access_token").toString();
		// refrashToken = jsonData.get("refresh_token").toString();
		// if(accessToken.isEmpty() || refrashToken.isEmpty()) {
		// 	logger.debug("토큰발급에 실패했습니다.");
		// 	return false;
		// }else {
		//     authToken = accessToken;
		//     return true;
		// }
	}
    
}
