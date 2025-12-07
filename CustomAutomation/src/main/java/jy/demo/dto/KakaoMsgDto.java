package jy.demo.dto;

import java.util.Map;

import jy.demo.util.KakaoConstants;
import lombok.Data;

/**
 * 카카오 메세지 전송을 위한 DTO
 * "object_type": "text",
 * "text": "텍스트 영역입니다. 최대 200자 표시 가능합니다.",
 * "link": {
 *      "web_url": "https://developers.kakao.com",
 *      "mobile_web_url": "https://developers.kakao.com"
 * },
 * button_title: "바로 확인"
 */
@Data
public class KakaoMsgDto implements JsonConvertible {
    private String objectType = KakaoConstants.MSG_OBJECT_TYPE;
    private String text;
    private Map<String, String> link = Map.of(
        "web_url", KakaoConstants.MSG_LINK_WEB_URL,
        "mobile_web_url", KakaoConstants.MSG_LINK_MOBILE_WEB_URL
    );
    private String buttonTitle = KakaoConstants.MSG_BUTTON_TITLE;

    public KakaoMsgDto(String text) {
        this.text = text;
    }   
}