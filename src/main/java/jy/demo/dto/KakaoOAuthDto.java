package jy.demo.dto;

import java.lang.reflect.Field;
import java.util.HashMap;
import java.util.Map;


public class KakaoOAuthDto implements HttpRequestDto{

        private String code = "";
        private String grantType = "authorization_code";
        private String clientId = "620c9095c04cad076902cde3e1237d7a";
        private String redirectUrl = "http://southoftheriver.synology.me:8081/kakao/callback";

        public KakaoOAuthDto(String code) {
            this.code = code;
        }
}


