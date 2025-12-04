/**
 * 카카오 로그인 자동화 스크립트
 *
 * 사용법:
 * 1. npm install 실행
 * 2. .env 파일에 KAKAO_EMAIL과 KAKAO_PASSWORD 설정
 * 3. node kakao-auth-automation.js 실행
 */

// .env 파일 로드
require('dotenv').config();

const { chromium } = require('playwright');
const fs = require('fs');

// 설정
const CONFIG = {
    CLIENT_ID: '620c9095c04cad076902cde3e1237d7a', // application.yml에서 가져온 값
    REDIRECT_URI: 'http://southoftheriver.synology.me:8081/kakao/callback',
    KAKAO_EMAIL: process.env.KAKAO_EMAIL,
    KAKAO_PASSWORD: process.env.KAKAO_PASSWORD,
    TOKEN_FILE: './kakao-tokens.json' // 토큰을 저장할 파일
};

// 카카오 인증 URL 생성
function buildAuthUrl() {
    const params = new URLSearchParams({
        client_id: CONFIG.CLIENT_ID,
        redirect_uri: CONFIG.REDIRECT_URI,
        response_type: 'code',
        scope: 'talk_message'  // profile 제거 (동의 항목 미설정)
    });
    return `https://kauth.kakao.com/oauth/authorize?${params.toString()}`;
}

// Access Token 요청
async function getAccessToken(code) {
    const response = await fetch('https://kauth.kakao.com/oauth/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: CONFIG.CLIENT_ID,
            redirect_uri: CONFIG.REDIRECT_URI,
            code: code
        })
    });

    return await response.json();
}

// Refresh Token으로 새 Access Token 발급
async function refreshAccessToken(refreshToken) {
    const response = await fetch('https://kauth.kakao.com/oauth/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
            grant_type: 'refresh_token',
            client_id: CONFIG.CLIENT_ID,
            refresh_token: refreshToken
        })
    });

    return await response.json();
}

// 토큰 저장
function saveTokens(tokens) {
    fs.writeFileSync(CONFIG.TOKEN_FILE, JSON.stringify(tokens, null, 2));
    console.log(`✓ 토큰이 ${CONFIG.TOKEN_FILE}에 저장되었습니다.`);
}

// 토큰 로드
function loadTokens() {
    if (fs.existsSync(CONFIG.TOKEN_FILE)) {
        return JSON.parse(fs.readFileSync(CONFIG.TOKEN_FILE, 'utf-8'));
    }
    return null;
}

// 카카오 로그인 자동화
async function automateKakaoLogin() {
    console.log('🚀 카카오 로그인 자동화 시작...\n');

    // 환경변수 확인
    if (!CONFIG.KAKAO_EMAIL || !CONFIG.KAKAO_PASSWORD) {
        console.error('❌ KAKAO_EMAIL 또는 KAKAO_PASSWORD 환경변수가 설정되지 않았습니다.');
        console.log('\n사용법:');
        console.log('  export KAKAO_EMAIL="your-email@example.com"');
        console.log('  export KAKAO_PASSWORD="your-password"');
        console.log('  node kakao-auth-automation.js');
        process.exit(1);
    }

    const browser = await chromium.launch({
        headless: false // 디버깅을 위해 브라우저 표시
    });

    try {
        const context = await browser.newContext();
        const page = await context.newPage();

        console.log('1️⃣ 카카오 인증 페이지로 이동...');
        const authUrl = buildAuthUrl();
        await page.goto(authUrl, { waitUntil: 'networkidle' });

        // 로그인 페이지 대기 (변경된 selector)
        await page.waitForSelector('input[name="loginId"]', { timeout: 10000 });

        console.log('2️⃣ 로그인 정보 입력...');
        await page.fill('input[name="loginId"]', CONFIG.KAKAO_EMAIL);
        await page.fill('input[name="password"]', CONFIG.KAKAO_PASSWORD);

        console.log('3️⃣ 로그인 버튼 클릭...');

        // 로그인 후 리다이렉트 대기
        const navigationPromise = page.waitForNavigation({ timeout: 10000 }).catch(() => null);
        await page.click('button[type="submit"]');
        await navigationPromise;

        // 페이지 URL 확인
        console.log('현재 URL:', page.url());

        // 에러 메시지 확인
        const errorElement = await page.$('.error_txt, .txt_error, [class*="error"]');
        if (errorElement) {
            const errorText = await errorElement.textContent();
            console.error('❌ 카카오 에러 발생:', errorText);

            // 스크린샷 저장
            await page.screenshot({ path: 'kakao-error.png' });
            console.log('스크린샷 저장: kakao-error.png');
        }

        // 페이지 전체 텍스트에서 KOE 에러 찾기
        const pageContent = await page.content();
        if (pageContent.includes('KOE')) {
            const errorMatch = pageContent.match(/KOE\d+/);
            if (errorMatch) {
                console.error(`❌ 카카오 에러 코드: ${errorMatch[0]}`);
            }
        }

        // 동의 화면이 나올 수 있음
        try {
            await page.waitForSelector('button.btn_agree', { timeout: 5000 });
            console.log('4️⃣ 권한 동의 버튼 클릭...');
            const agreeNavPromise = page.waitForNavigation({ timeout: 10000 }).catch(() => null);
            await page.click('button.btn_agree');
            await agreeNavPromise;
        } catch (e) {
            console.log('4️⃣ 권한 동의 화면 없음 (이미 동의됨)');
        }

        // Redirect URL에서 code 파라미터 추출
        console.log('5️⃣ Authorization Code 추출 중...');
        console.log('최종 URL:', page.url());

        // URL에 code가 있는지 확인
        let authCode = null;
        let currentUrl = page.url();

        // code가 없으면 조금 더 대기
        if (!currentUrl.includes('code=')) {
            await page.waitForTimeout(3000);
            currentUrl = page.url();
        }

        const urlParams = new URLSearchParams(new URL(currentUrl).search);
        authCode = urlParams.get('code');

        if (!authCode) {
            throw new Error('Authorization Code를 추출할 수 없습니다.');
        }

        console.log(`✓ Authorization Code: ${authCode.substring(0, 20)}...`);

        // Access Token 발급
        console.log('\n6️⃣ Access Token 발급 중...');
        const tokens = await getAccessToken(authCode);

        if (tokens.access_token) {
            console.log('✓ Access Token 발급 성공!');
            console.log(`  - Access Token: ${tokens.access_token.substring(0, 30)}...`);
            console.log(`  - Refresh Token: ${tokens.refresh_token.substring(0, 30)}...`);
            console.log(`  - Expires In: ${tokens.expires_in}초`);

            // 토큰 저장
            saveTokens(tokens);

            // 서버에 토큰 전달 (선택사항)
            console.log('\n7️⃣ 서버에 토큰 전달 중...');
            try {
                const serverResponse = await fetch(`http://localhost:8081/kakao/callback?code=${authCode}`);
                console.log('✓ 서버에 Authorization Code 전달 완료');
            } catch (e) {
                console.log('⚠ 서버 연결 실패 (서버가 실행 중인지 확인하세요)');
            }

        } else {
            console.error('❌ Token 발급 실패:', tokens);
        }

    } catch (error) {
        console.error('❌ 오류 발생:', error.message);
    } finally {
        await browser.close();
    }
}

// Refresh Token으로 갱신
async function refreshTokens() {
    console.log('🔄 Access Token 갱신 중...\n');

    const tokens = loadTokens();
    if (!tokens || !tokens.refresh_token) {
        console.error('❌ 저장된 Refresh Token이 없습니다. 먼저 로그인을 수행하세요.');
        process.exit(1);
    }

    try {
        const newTokens = await refreshAccessToken(tokens.refresh_token);

        if (newTokens.access_token) {
            console.log('✓ Access Token 갱신 성공!');
            console.log(`  - New Access Token: ${newTokens.access_token.substring(0, 30)}...`);

            // Refresh Token이 새로 발급된 경우 업데이트
            const updatedTokens = {
                ...tokens,
                access_token: newTokens.access_token,
                expires_in: newTokens.expires_in,
                refresh_token: newTokens.refresh_token || tokens.refresh_token
            };

            saveTokens(updatedTokens);
        } else {
            console.error('❌ Token 갱신 실패:', newTokens);
        }
    } catch (error) {
        console.error('❌ 오류 발생:', error.message);
    }
}

// 메인 실행
const command = process.argv[2];

if (command === 'refresh') {
    refreshTokens();
} else {
    automateKakaoLogin();
}
