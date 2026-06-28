const { test, expect } = require('@playwright/test');

const BASE_URL = process.env.BASE_URL || 'https://jeval.otepc.go.th';
const TEST_CREDENTIALS = {
    email: process.env.TEST_USER_EMAIL || 'test@example.com',
    password: process.env.TEST_USER_PASSWORD || 'password123'
};

test.use({ ignoreHTTPSErrors: true });

test('Run 5 Evaluations in Bulk', async ({ page }) => {
    test.setTimeout(900000); // 15 minutes max timeout
    
    console.log('Logging in...');
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', TEST_CREDENTIALS.email);
    await page.fill('input[type="password"]', TEST_CREDENTIALS.password);
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/dashboard', { timeout: 15000 });
    console.log('Logged in successfully!');

    let successCount = 0;

    for (let i = 1; i <= 5; i++) {
        try {
            console.log(`Starting evaluation ${i}/5...`);
            
            await page.goto(`${BASE_URL}/dashboard`);
            await page.waitForSelector('text=ชื่อตำแหน่ง/เลขที่ตำแหน่ง', { timeout: 10000 });

            // Step 1: General Info
            // Randomly select index 1 or 2 (SPEC or ADMIN, since 0 is usually the placeholder)
            const typePosIndex = Math.floor(Math.random() * 2) + 1; 
            await page.locator('select[name="TypePos"]').selectOption({ index: typePosIndex });
            await page.fill('input[name="Name_Pos"]', `Bulk Tester ${i}`);
            await page.fill('input[name="Num_Pos_M"]', `POS-BULK-${i}`);
            await page.fill('input[name="Affiliation"]', `สังกัดที่ ${i}`);
            await page.fill('input[name="EducationalInstitution"]', `สถานศึกษาที่ ${i}`);
            await page.click('button:has-text("ถัดไป")');

            // Step 2: Questions
            await page.waitForSelector('text=ข้อที่ 1 จาก', { timeout: 15000 });
            for (let qNum = 1; qNum <= 20; qNum++) {
                // Wait for the exact question to be visible to ensure transitions finished
                await page.waitForSelector(`text=ข้อที่ ${qNum} จาก`, { timeout: 5000 });
                
                const radios = page.locator(`input[name="Q${qNum}"]`);
                const count = await radios.count();
                if (count > 0) {
                    // Always choose the first option to ensure sum is within expected bounds (avoid random invalid combinations)
                    await radios.nth(0).check();
                }
                
                if (qNum < 20) {
                    await page.click('button:has-text("ถัดไป")');
                } else {
                    await page.click('button:has-text("บันทึกและประมวลผล")');
                }
            }

            // Step 3: Result page validation
            await page.waitForSelector('text=ผลการประเมิน', { timeout: 30000 });
            await expect(page.locator(`text=Bulk Tester ${i}`).first()).toBeVisible();
            console.log(`✅ Completed evaluation ${i}/5`);
            successCount++;
        } catch (err) {
            console.error(`❌ Failed at evaluation ${i}: ${err.message}`);
            // Attempt to recover by going back to dashboard in the next loop
        }
    }
    
    console.log(`\n🎉 Bulk test finished! Successfully submitted ${successCount} / 5 forms.`);
    expect(successCount).toBe(5);
});
