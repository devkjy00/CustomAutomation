package jy.demo.dto;

import java.util.HashMap;
import java.util.Map;   

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
// public class KakaoMsgDto implements HttpRequestDto{
public class KakaoMsgDto {

    private String objType;
    private String text;
    private String webUrl;
    private String mobileUrl;
    private String btnTitle;

    // public Map<String, String> toMap(){
	// 	Map<String, String> url = new HashMap<>();
	// 	url.put("web_url", this.getWebUrl());
	// 	url.put("mobile_web_url", this.getMobileUrl());

	// 	Map<String, Object> templateObj = new HashMap<>();
	// 	templateObj.put("object_type", this.getObjType());
	// 	templateObj.put("text", this.getText());
	// 	templateObj.put("link", url);
	// 	templateObj.put("button_title", this.getBtnTitle());

	// 	Map<String, Object> result = new HashMap<>();
	// 	result.put("template_object", templateObj);

    //     return result;

    // }
}