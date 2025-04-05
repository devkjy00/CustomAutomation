package jy.demo.util;

public class HTTPStatic {
    public static final String KAKAO_API_URL = "https://kapi.kakao.com";
    public static final String KAKAO_OAUTH_URL = "https://kauth.kakao.com";
    public static final String KAKAO_REDIRECT_URL = "http://southoftheriver.synology.me:8081/kakao/callback";
    public static final String KAKAO_OAUTH_TOKEN_URL = KAKAO_OAUTH_URL + "/oauth/token";
    public static final String KAKAO_USER_INFO_URL = KAKAO_API_URL + "/v2/user/me";
    public static final String KAKAO_LOGOUT_URL = KAKAO_API_URL + "/v1/user/logout";
    public static final String KAKAO_UNLINK_URL = KAKAO_API_URL + "/v1/user/unlink";

    public static final String KAKAO_OAUTH_GRANT_TYPE = "authorization_code";
    public static final String KAKAO_OAUTH_CLIENT_SECRET = "KAKAO_OAUTH_CLIENT_SECRET";
    public static final String KAKAO_OAUTH_REDIRECT_URL = KAKAO_REDIRECT_URL;
    public static final String KAKAO_OAUTH_SCOPE = "profile";
    public static final String KAKAO_OAUTH_RESPONSE_TYPE = "code";
    public static final String KAKAO_OAUTH_STATE = "state";
    public static final String KAKAO_OAUTH_ACCESS_TOKEN = "access_token";
    public static final String KAKAO_OAUTH_REFRESH_TOKEN = "refresh_token";
    public static final String KAKAO_OAUTH_EXPIRES_IN = "expires_in";
    public static final String KAKAO_OAUTH_SCOPE_PARAM = "scope";
    public static final String KAKAO_OAUTH_RESPONSE_TYPE_PARAM = "response_type";
    public static final String KAKAO_OAUTH_CLIENT_ID_PARAM = "client_id";
    public static final String KAKAO_OAUTH_REDIRECT_URL_PARAM = "redirect_uri";
    public static final String KAKAO_OAUTH_STATE_PARAM = "state";
    public static final String KAKAO_OAUTH_CODE_PARAM = "code";
    public static final String KAKAO_OAUTH_GRANT_TYPE_PARAM = "grant_type";
    public static final String KAKAO_MSG_OBJECT_TYPE = "text";
    public static final String KAKAO_MSG_LINK_WEB_URL = "https://developers.kakao.com";
    public static final String KAKAO_MSG_LINK_MOBILE_WEB_URL = "https://developers.kakao.com";
    public static final String KAKAO_MSG_BUTTON_TITLE = "바로 확인";

}
