import { test, expect, type APIRequestContext, type Page } from '@playwright/test';
import { PASS_FIXTURE, NOT_PASS_FIXTURE, type EvalFixture } from './fixtures';

/**
 * JEVAL eval-form tests.
 *
 *   Credentials (a user allowed to use the eval form) come from env:
 *     TEST_USER=<identifier/email>  TEST_PASS=<password>
 *
 * Two layers:
 *   1) API   — fast, deterministic check of the scoring/verdict (create → analyse).
 *   2) UI E2E — drives the real multi-step form and asserts the result page.
 */

const USER = process.env.TEST_USER || '';
const PASS = process.env.TEST_PASS || '';

// --------------------------------------------------------------------------
// 1) API-level scoring tests (login via Strapi → create form → analyse)
// --------------------------------------------------------------------------
async function login(request: APIRequestContext): Promise<string> {
    const res = await request.post('/api/auth/local', {
        data: { identifier: USER, password: PASS },
    });
    expect(res.ok(), `login failed (${res.status()})`).toBeTruthy();
    return (await res.json()).jwt as string;
}

async function createAndAnalyse(request: APIRequestContext, jwt: string, f: EvalFixture) {
    const create = await request.post('/api/forms', {
        headers: { Authorization: `Bearer ${jwt}` },
        data: {
            data: {
                TypePos: f.typePos,
                Name_Pos: '__pw_test__',
                Num_Pos_M: 'PW-1',
                ...f.answers,
            },
        },
    });
    expect(create.ok(), `create failed (${create.status()})`).toBeTruthy();
    const documentId = (await create.json()).data.documentId;

    const analyse = await request.get(`/api/forms/analyse/${documentId}`, {
        headers: { Authorization: `Bearer ${jwt}` },
    });
    expect(analyse.ok(), `analyse failed (${analyse.status()})`).toBeTruthy();
    return { body: await analyse.json(), documentId };
}

test.describe('API: scoring verdict', () => {
    test.skip(!USER || !PASS, 'set TEST_USER / TEST_PASS to run');

    test('PASS fixture → total in range, ResultScore=true', async ({ request }) => {
        const jwt = await login(request);
        const { body } = await createAndAnalyse(request, jwt, PASS_FIXTURE);
        expect(body.status).toBe('ok');
        expect(body.totalScore).toBeCloseTo(PASS_FIXTURE.expected.total, 1);
        expect(body.ResultScore).toBe(true); // 740 ∈ SPEC [631,900]
    });

    test('NOT-PASS fixture → total below min, ResultScore=false', async ({ request }) => {
        const jwt = await login(request);
        const { body } = await createAndAnalyse(request, jwt, NOT_PASS_FIXTURE);
        expect(body.status).toBe('ok');
        expect(body.totalScore).toBeCloseTo(NOT_PASS_FIXTURE.expected.total, 1);
        expect(body.ResultScore).toBe(false); // 201 < SPEC min 631
    });
});

// --------------------------------------------------------------------------
// 2) UI end-to-end: fill the whole form and assert the result page
// --------------------------------------------------------------------------
async function uiLogin(page: Page) {
    await page.goto('/login');
    // Adjust selectors if the login fields differ:
    await page.getByPlaceholder(/ผู้ใช้|username|identifier|อีเมล/i).first().fill(USER);
    await page.getByPlaceholder(/รหัสผ่าน|password/i).first().fill(PASS);
    await page.getByRole('button', { name: /เข้าสู่ระบบ|login|sign in/i }).click();
    await page.waitForURL(/dashboard|eval-form/);
}

async function fillEvalForm(page: Page, f: EvalFixture) {
    // Step 1 — ข้อมูลทั่วไป
    await page.selectOption('select[name="TypePos"]', f.typePos);
    await page.fill('input[name="Name_Pos"]', 'PW Test Position');
    await page.fill('input[name="Num_Pos_M"]', 'PW-1');
    // วัน-เวลา ที่รับเรื่อง already defaults to today
    await page.getByRole('button', { name: 'ถัดไป' }).click();

    // Step 2 — answer Q1..Q20 (one question per screen). The radio value === answer No.
    for (let q = 1; q <= 20; q++) {
        const val = f.answers[`Q${q}`];
        const radio = page.locator(`input[type="radio"][value="${val}"]`);
        await expect(radio).toBeVisible();
        await radio.check();
        const last = q === 20;
        await page
            .getByRole('button', { name: last ? 'บันทึกและประมวลผล' : 'ถัดไป' })
            .click();
    }
}

test.describe('UI: full eval form → result page', () => {
    test.skip(!USER || !PASS, 'set TEST_USER / TEST_PASS to run');

    test('PASS scenario shows total 740.00 and ผ่าน on score row', async ({ page }) => {
        await uiLogin(page);
        await fillEvalForm(page, PASS_FIXTURE);

        await expect(page.getByText('ผลการประเมินค่างาน')).toBeVisible();
        await expect(page.getByText('740.00')).toBeVisible();
        // "การประเมินค่างาน" row = ResultScore (min–max): 740 ∈ SPEC [631,900] → ผ่าน
        await expect(page.getByText('ผ่าน').first()).toBeVisible();
    });

    test('NOT-PASS scenario shows total 201.32 and ไม่ผ่าน', async ({ page }) => {
        await uiLogin(page);
        await fillEvalForm(page, NOT_PASS_FIXTURE);

        await expect(page.getByText('ผลการประเมินค่างาน')).toBeVisible();
        await expect(page.getByText('201.32')).toBeVisible();
        await expect(page.getByText('ไม่ผ่าน').first()).toBeVisible();
    });
});
