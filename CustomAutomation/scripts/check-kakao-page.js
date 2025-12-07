require('dotenv').config();
const { chromium } = require('playwright');

async function checkKakaoPage() {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    const authUrl = 'https://kauth.kakao.com/oauth/authorize?client_id=620c9095c04cad076902cde3e1237d7a&redirect_uri=http://southoftheriver.synology.me:8081/kakao/callback&response_type=code&scope=profile,talk_message';

    console.log('카카오 인증 페이지로 이동...');
    await page.goto(authUrl, { waitUntil: 'networkidle' });

    // 3초 대기
    await page.waitForTimeout(3000);

    // 페이지 HTML 출력
    const html = await page.content();
    console.log('\n=== 페이지 소스 ===');
    console.log(html.substring(0, 2000));

    // 입력 필드 찾기
    console.log('\n=== 입력 필드 검색 ===');

    const selectors = [
        'input[name="email"]',
        'input[type="email"]',
        'input[name="loginId"]',
        'input#id_email_2',
        'input.tf_g',
        'input[placeholder*="메일"]',
        'input[placeholder*="이메일"]',
        'input[placeholder*="카카오"]'
    ];

    for (const selector of selectors) {
        try {
            const element = await page.$(selector);
            if (element) {
                console.log(`✓ 찾음: ${selector}`);
                const attrs = await element.evaluate(el => ({
                    id: el.id,
                    name: el.name,
                    type: el.type,
                    placeholder: el.placeholder,
                    className: el.className
                }));
                console.log('  속성:', JSON.stringify(attrs, null, 2));
            }
        } catch (e) {
            // 무시
        }
    }

    // 모든 input 요소 찾기
    console.log('\n=== 모든 input 요소 ===');
    const inputs = await page.$$('input');
    console.log(`총 ${inputs.length}개의 input 발견`);

    for (let i = 0; i < Math.min(inputs.length, 10); i++) {
        const attrs = await inputs[i].evaluate(el => ({
            id: el.id,
            name: el.name,
            type: el.type,
            placeholder: el.placeholder,
            className: el.className
        }));
        console.log(`Input ${i+1}:`, JSON.stringify(attrs, null, 2));
    }

    console.log('\n브라우저를 30초간 열어둡니다. 확인 후 자동으로 닫힙니다.');
    await page.waitForTimeout(30000);

    await browser.close();
}

checkKakaoPage().catch(console.error);
