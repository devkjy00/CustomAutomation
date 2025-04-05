package jy.demo.service;

import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import static jy.demo.api.ApiClient.APP_TYPE_URL_ENCODED;
import jy.demo.api.WebClientImpl;
import jy.demo.dto.KakaoOAuthDto;
import jy.demo.util.JsonUtil;


@Service
public class KakaoMsgServiceImpl implements MessageService{
	// TODO - bean 생성 시점에(생성자에서) 토큰 받아오도록 수정하기

    // private Logger logger = LoggerFactory.getLogger(this.getClass());

    private static final String AUTH_URL = "https://kauth.kakao.com/oauth/token";

    private final WebClientImpl apiClient;
	private final JsonUtil jsonUtil;

	private static final String MSG_SEND_SERVICE_URL = "https://kapi.kakao.com/v2/api/talk/memo/default/send";
	private static final String SEND_SUCCESS_MSG = "메시지 전송에 성공했습니다.";
	private static final String SEND_FAIL_MSG = "메시지 전송에 실패했습니다.";
	private static final String SUCCESS_CODE = "0"; //kakao api에서 return해주는 success code 값

	public String accessToken = "";
	public String refrashToken = "";
	@Value("${kakao.api.key}")
	private String clientId;

	public KakaoMsgServiceImpl(WebClientImpl apiClient, JsonUtil jsonUtil) {
        this.apiClient = apiClient;
		this.jsonUtil = jsonUtil;
    }

	public boolean requestAccessToken(String code)  {
		

		KakaoOAuthDto body = new KakaoOAuthDto(code, clientId);
		Map<String, String> result;
		try {
			String response = apiClient.post(AUTH_URL, JsonUtil.toJson(JsonUtil.toMap(body)), JsonUtil.toJson(apiClient.generateUrlEncodedHeader()));
			result = JsonUtil.toMap(response);
		} catch(Exception e) {
			// logger.error("토큰 발급에 실패했습니다.");
			return false;
		}

		accessToken = result.get("access_token");
		refrashToken = result.get("refresh_token");

		if (accessToken.isEmpty() || refrashToken.isEmpty()) {
			// throw new Exception("토큰 발급에 실패했습니다.");
			return false;
		}

		return true;
	}

	@Override
	public String sendMessage(String text) {
		if (accessToken == null || accessToken.isEmpty()) {
			return "액세스 토큰이 없습니다. 먼저 인증을 완료해주세요.";
		}

		// 요청 헤더 설정
		Map<String, String> headers = Map.of(
			"Content-Type", APP_TYPE_URL_ENCODED,
			"Authorization", "Bearer " + accessToken
		);

		String result = "";
		try {
			result = apiClient.post(MSG_SEND_SERVICE_URL, jsonUtil.createKakaoSendMsgJson(text), headers);
		} catch (Exception e) {
			e.printStackTrace();
		}

		if (result == null || result.isEmpty()) {
			return SEND_FAIL_MSG + " (응답이 비어있습니다)";
		}

		try {
			Map<String, Object> response = JsonUtil.parseResponse(result);
			Object resultCode = response.get("result_code");

			if (resultCode != null && "0".equals(resultCode.toString())) {
				return SEND_SUCCESS_MSG;
			} else {
				Object errorMsg = response.get("msg");
				return SEND_FAIL_MSG + " (Error: " + (errorMsg != null ? errorMsg.toString() : "알 수 없는 오류") + ")";
			}
		} catch (Exception e) {
			e.printStackTrace();
			return SEND_FAIL_MSG + " (응답 파싱 실패: " + result + ")";
		}
	}

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
