package jy.demo.dto;

import jy.demo.util.HTTPStatic;

public class KakaoOAuthDto implements JsonConvertible{

        private String code = "";
        private String grantType = HTTPStatic.KAKAO_OAUTH_GRANT_TYPE;
        private String clientId = "";
        private String redirectUrl = HTTPStatic.KAKAO_REDIRECT_URL;

        public KakaoOAuthDto(String code, String clientId) {
            this.code = code;
            this.clientId = clientId;
        }
}


