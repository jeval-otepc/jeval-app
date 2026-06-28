// Playwright E2E Tests for the Full Evaluation Flow
// Target: Login -> General Info -> 20 Questions -> Result

const { test, expect } = require('@playwright/test');

// Test configuration
const BASE_URL = process.env.BASE_URL || 'https://jeval.otepc.go.th';
const TEST_CREDENTIALS = {
    email: process.env.TEST_USER_EMAIL || 'admin@otepc.mail.go.th',
    password: process.env.TEST_USER_PASSWORD || 'Admin@@#'
};

test.describe('Evaluation Form E2E Tests', () => {
    // We use serial mode because these tests build on each other
    test.describe.configure({ mode: 'serial' });

    let page;

    test.beforeAll(async ({ browser }) => {
        const context = await browser.newContext({ ignoreHTTPSErrors: true });
        page = await context.newPage();
        
        // Clear any existing sessions
        await context.clearCookies();
        await context.clearPermissions();
    });

    test.afterAll(async () => {
        await page.close();
    });

    test('1. Authentication Flow', async () => {
        test.setTimeout(60000);
        console.log('🧪 1. Testing login flow...');

        await page.goto(`${BASE_URL}/login`);
        
        // Wait for login form
        await page.waitForSelector('input[type="email"]');

        // Fill login form
        await page.fill('input[type="email"]', TEST_CREDENTIALS.email);
        await page.fill('input[type="password"]', TEST_CREDENTIALS.password);

        // Submit form
        await page.click('button[type="submit"]');

        // Wait for redirect to dashboard
        await page.waitForURL('**/dashboard', { timeout: 15000 }).catch(() => console.log('Wait for URL timed out, checking elements instead.'));
        
        // Verify dashboard loaded by waiting for the logout button
        const dashboardElement = page.locator('button:has-text("ออกจากระบบ")').first();
        try {
            await expect(dashboardElement).toBeVisible({ timeout: 15000 });
        } catch (e) {
            const content = await page.content();
            console.log('PAGE CONTENT DUMP:', content);
            throw e;
        }
    });

    test('2. Navigation to Evaluation Form', async () => {
        console.log('🧪 2. Testing navigation to form...');
        
        // Go directly to the dashboard page where the form typically is
        await page.goto(`${BASE_URL}/dashboard`);
        
        // Wait for the General Info step to be visible
        await page.waitForSelector('text=ข้อมูลทั่วไป', { timeout: 10000 });
        
        // Ensure we see the "ชื่อตำแหน่ง/เลขที่ตำแหน่ง" header
        await expect(page.locator('text=ชื่อตำแหน่ง/เลขที่ตำแหน่ง')).toBeVisible();
    });

    test('3. General Information Validation & Submission (Step 1)', async () => {
        console.log('🧪 3. Testing General Info (Step 1)...');
        
        // Test 3.1: Validation Check
        // Try submitting without filling required fields
        await page.click('button:has-text("ถัดไป")');
        
        // We can just verify that it doesn't move to Step 2
        const isStillOnStep1 = await page.locator('text=ชื่อตำแหน่ง/เลขที่ตำแหน่ง').isVisible();
        expect(isStillOnStep1).toBeTruthy();

        // Test 3.2: Fill required data
        // 1. Select Position Type (TypePos) - choosing the first available option
        const positionSelect = page.locator('select[name="TypePos"]');
        await positionSelect.selectOption({ index: 1 }); // Select the first valid option

        // 2. Fill Position Name (Name_Pos)
        await page.fill('input[name="Name_Pos"]', 'ผู้อำนวยการทดสอบ E2E');

        // 3. Fill Position Number (Num_Pos_M)
        await page.fill('input[name="Num_Pos_M"]', 'POS-999-E2E');

        // 4. Fill Affiliation
        await page.fill('input[name="Affiliation"]', 'สพฐ. ทดสอบ');

        // 5. Fill Educational Institution
        await page.fill('input[name="EducationalInstitution"]', 'โรงเรียนทดสอบระบบ');

        // Submit Step 1
        await page.click('button:has-text("ถัดไป")');

        // Verify we moved to Step 2 (Questions)
        await page.waitForSelector('text=แบบประเมิน', { timeout: 15000 });
        await expect(page.locator('text=ข้อที่ 1').first()).toBeVisible({ timeout: 10000 });
    });

    test('4. Evaluation Questions Flow (Step 2)', async () => {
        test.setTimeout(120000); // 2 minutes for answering 20 questions
        console.log('🧪 4. Testing 20 Questions (Step 2)...');

        // We are on Question 1
        await expect(page.locator('text=ข้อที่ 1').first()).toBeVisible();

        // Loop through all 20 questions
        for (let qNum = 1; qNum <= 20; qNum++) {
            // Wait for the question number to update
            await page.waitForSelector(`text=ข้อที่ ${qNum} จาก`, { timeout: 10000 });

            // Select the first radio button for the current question
            const radioName = `Q${qNum}`;
            const firstRadio = page.locator(`input[name="${radioName}"]`).first();
            await firstRadio.click();

            // Fill memo for the question
            const memoName = `Q${qNum}_Memo`;
            const memoInput = page.locator(`textarea[name="${memoName}"]`);
            if (await memoInput.isVisible()) {
                await memoInput.fill(`ทดสอบเหตุผลข้อที่ ${qNum} โดย E2E Script`);
            }

            // Test navigation: on question 2, go back to 1, then back to 2
            if (qNum === 2) {
                console.log('   - Testing "Previous" button navigation...');
                const prevBtn = page.locator('button', { hasText: 'ก่อนหน้า' });
                await prevBtn.click();
                
                await expect(page.locator('text=ข้อที่ 1 จาก')).toBeVisible();
                
                const nextBtn = page.locator('button', { hasText: 'ถัดไป' });
                await nextBtn.click();
                
                await expect(page.locator('text=ข้อที่ 2 จาก')).toBeVisible();
            }

            // Click Next (or Submit if it's the last question)
            if (qNum < 20) {
                // Not the last question, click 'ถัดไป'
                const nextBtn = page.locator('button', { hasText: 'ถัดไป' });
                await nextBtn.click();
            } else {
                // Last question, click 'บันทึกและประมวลผล'
                const submitBtn = page.locator('button', { hasText: 'บันทึกและประมวลผล' });
                await submitBtn.click();
            }
        }
    });

    test('5. Result & Processing (Step 3)', async () => {
        test.setTimeout(60000);
        console.log('🧪 5. Testing Result Processing (Step 3)...');

        // Wait for the result screen to appear
        // The processing might take a few seconds
        await page.waitForSelector('text=ผลการประเมิน', { timeout: 30000 });

        // Verify basic data is displayed on the result page
        await expect(page.locator('text=ผู้อำนวยการทดสอบ E2E').first()).toBeVisible();
        await expect(page.locator('text=POS-999-E2E').first()).toBeVisible();

        // Verify tables and scores
        await expect(page.locator('text=องค์ประกอบหลักด้านความรู้และทักษะที่จำเป็นในงาน').first()).toBeVisible();
        await expect(page.locator('text=OTEPC POINT').first()).toBeVisible();
        await expect(page.locator('text=สรุปผลการประเมิน').first()).toBeVisible();

        // Verify action buttons
        await expect(page.locator('button:has-text("พิมพ์รายงาน")')).toBeVisible();
        await expect(page.locator('button:has-text("ดาวน์โหลด PDF")')).toBeVisible();
        await expect(page.locator('button:has-text("ประเมินใหม่")')).toBeVisible();

        console.log('✅ Full evaluation flow completed successfully.');
    });
});
