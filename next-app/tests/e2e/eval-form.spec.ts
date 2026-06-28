import { test, expect, type APIRequestContext, type Page } from '@playwright/test';
import { EVAL_CASES, type EvalCase } from './fixtures';

/**
 * JEVAL eval-form tests — 10 verified cases (5 SPEC + 5 ADMIN), each covering
 * PASS / NOT-PASS (below min and above max) for the min–max scoring rule.
 *
 * Credentials (a user allowed to use the eval form):
 *   TEST_USER=<identifier/email>  TEST_PASS=<password>
 *
 * Layers:
 *   1) API   — create → analyse, assert total + ResultScore (fast, deterministic).
 *   2) UI E2E — drive the real multi-step form and assert the result page.
 */

const USER = process.env.TEST_USER || '';
const PASS = process.env.TEST_PASS || '';

// --------------------------------------------------------------------------
// 1) API-level scoring tests
// --------------------------------------------------------------------------
async function login(request: APIRequestContext): Promise<string> {
    const res = await request.post('/api/auth/local', {
        data: { identifier: USER, password: PASS },
    });
    expect(res.ok(), `login failed (${res.status()})`).toBeTruthy();
    return (await res.json()).jwt as string;
}

async function createAndAnalyse(request: APIRequestContext, jwt: string, c: EvalCase) {
    const create = await request.post('/api/forms', {
        headers: { Authorization: `Bearer ${jwt}` },
        data: { data: { TypePos: c.typePos, Name_Pos: '__pw_test__', Num_Pos_M: 'PW-1', ...c.answers } },
    });
    expect(create.ok(), `create failed (${create.status()})`).toBeTruthy();
    const documentId = (await create.json()).data.documentId;
    const analyse = await request.get(`/api/forms/analyse/${documentId}`, {
        headers: { Authorization: `Bearer ${jwt}` },
    });
    expect(analyse.ok(), `analyse failed (${analyse.status()})`).toBeTruthy();
    return await analyse.json();
}

test.describe('API: scoring by min–max range', () => {
    test.skip(!USER || !PASS, 'set TEST_USER / TEST_PASS to run');

    for (const c of EVAL_CASES) {
        test(c.name, async ({ request }) => {
            const jwt = await login(request);
            const body = await createAndAnalyse(request, jwt, c);
            expect(body.status).toBe('ok');
            expect(body.totalScore).toBeCloseTo(c.expected.total, 1);
            expect(body.ResultScore).toBe(c.expected.resultScore);
        });
    }
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

async function fillEvalForm(page: Page, c: EvalCase) {
    // Step 1 — ข้อมูลทั่วไป (TypePos drives the verdict range)
    await page.selectOption('select[name="TypePos"]', c.typePos);
    await page.fill('input[name="Name_Pos"]', 'PW Test Position');
    await page.fill('input[name="Num_Pos_M"]', 'PW-1');
    await page.getByRole('button', { name: 'ถัดไป' }).click();

    // Step 2 — answer Q1..Q20 (radio value === answer No)
    for (let q = 1; q <= 20; q++) {
        const radio = page.locator(`input[type="radio"][value="${c.answers[`Q${q}`]}"]`);
        await expect(radio).toBeVisible();
        await radio.check();
        await page
            .getByRole('button', { name: q === 20 ? 'บันทึกและประมวลผล' : 'ถัดไป' })
            .click();
    }
}

test.describe('UI: full eval form → result page', () => {
    test.skip(!USER || !PASS, 'set TEST_USER / TEST_PASS to run');

    // Drive one representative PASS and one NOT-PASS per TypePos through the UI.
    const uiCases = [
        EVAL_CASES.find((c) => c.typePos === 'SPEC' && c.expected.resultScore)!,
        EVAL_CASES.find((c) => c.typePos === 'SPEC' && !c.expected.resultScore)!,
        EVAL_CASES.find((c) => c.typePos === 'ADMIN' && c.expected.resultScore)!,
        EVAL_CASES.find((c) => c.typePos === 'ADMIN' && !c.expected.resultScore)!,
    ];

    for (const c of uiCases) {
        test(`UI ${c.name}`, async ({ page }) => {
            await uiLogin(page);
            await fillEvalForm(page, c);

            await expect(page.getByText('ผลการประเมินค่างาน')).toBeVisible();
            await expect(page.getByText(c.expected.total.toFixed(2))).toBeVisible();
            // "การประเมินค่างาน" row = ResultScore (min–max)
            await expect(
                page.getByText(c.expected.resultScore ? 'ผ่าน' : 'ไม่ผ่าน').first(),
            ).toBeVisible();
        });
    }
});
