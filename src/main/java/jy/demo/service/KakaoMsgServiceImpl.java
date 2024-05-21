package jy.demo.service;

import java.util.HashMap;
import java.util.Map;   
import jy.demo.api.WebClientImpl;
import jy.demo.dto.KakaoOAuthDto;

import org.springframework.stereotype.Service;

import com.google.common.collect.MapDifference;
import com.google.common.collect.Maps;



@Service
public class KakaoMsgServiceImpl {
	// TODO - bean 생성 시점에(생성자에서) 토큰 받아오도록 수정하기

    // private Logger logger = LoggerFactory.getLogger(this.getClass());

    private static final String AUTH_URL = "https://kauth.kakao.com/oauth/token";

    private final WebClientImpl apiClient;

	private static final String MSG_SEND_SERVICE_URL = "https://kapi.kakao.com/v2/api/talk/memo/default/send";
	private static final String SEND_SUCCESS_MSG = "메시지 전송에 성공했습니다.";
	private static final String SEND_FAIL_MSG = "메시지 전송에 실패했습니다.";
	private static final String SUCCESS_CODE = "0"; //kakao api에서 return해주는 success code 값

	public String accessToken = "";
	public String refrashToken = "";

	public KakaoMsgServiceImpl(WebClientImpl apiClient) {
        this.apiClient = apiClient;
    }

	public boolean requestAccessToken(String code)  {
		
		KakaoOAuthDto body2 = new KakaoOAuthDto(code);
		Map<String, String> body = new HashMap<>();
		body.put("code", code);
		body.put("grant_type", "authorization_code");
		body.put("client_id", "620c9095c04cad076902cde3e1237d7a");
		body.put("redirect_url", 
						"http://southoftheriver.synology.me:8081/kakao/callback");


		System.out.println(body);
		System.out.println(body2.toMap());

		MapDifference<String, String> diff = Maps.difference(body, body2.toMap());
		
        Map<String, String> result = apiClient.post(AUTH_URL, body2.toMap(), apiClient.generateUrlEncodedHeader());

		accessToken = result.get("access_token").toString();
		refrashToken = result.get("refresh_token").toString();

		if(accessToken.isEmpty() || refrashToken.isEmpty()) {
			return false;
		}
		return true;
	}

	// public boolean sendMessage(String accessToken, KakaoMsgDto msgDto) {
	// 	Map<String, Object> body = msgDto.toMap();

	// 	// HttpEntity<?> messageRequestEntity = httpClientEntity(header, body);
	// 	apiClient.

	// 	String resultCode = "";
	// 	ResponseEntity<String> response = httpRequest(MSG_SEND_SERVICE_URL, HttpMethod.POST, messageRequestEntity);
	// 	Map<String, String> jsonData = new HashMap<>(response.getBody());
	// 	resultCode = jsonData.get("result_code").toString();

	// 	return successCheck(resultCode);
	// }

	public boolean successCheck(String resultCode) {
		if(resultCode.equals(SUCCESS_CODE)) {
			// logger.info(SEND_SUCCESS_MSG);
			return true;
		}else {
			// logger.debug(SEND_FAIL_MSG);
			return false;
		}

	}
}
