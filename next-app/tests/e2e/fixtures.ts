/**
 * Verified scoring fixtures for the JEVAL eval form.
 *
 * The PASS/NOT-PASS verdict is driven by TypePos (ประเภทตำแหน่ง, chosen on the
 * "ข้อมูลทั่วไป" step), NOT by Q20:
 *
 *   TypePos = 'SPEC'  (วิชาการ/เชี่ยวชาญ)   → PASS when total ∈ [631, 900]
 *   TypePos = 'ADMIN' (อำนวยการสูง)         → PASS when total ∈ [725, 1035]
 *   total below min OR above max            → NOT PASS  (ResultScore = false)
 *
 * total = ResultKH + ResultPS + ResultAC, where
 *   ResultPS = ResultKH * psPercent / 100
 * Q1-Q9 feed KH, Q10-Q13 feed PS, Q14-Q18 feed AC, Q19 feeds the "component"
 * check, Q20 is recorded but does NOT affect the score.
 *
 * Both fixtures below were verified against the live /api/forms/analyse endpoint
 * (PASS produced total=740, ResultScore=true).  Answer values are the answer "No"
 * (e.g. "4.1.2") — i.e. the radio `value` rendered in the form.
 */

export interface EvalFixture {
    typePos: 'SPEC' | 'ADMIN';
    answers: Record<string, string>; // Q1..Q20 -> answer No
    expected: {
        total: number;
        resultScore: boolean; // total within the TypePos range
    };
}

/** total = 740 → inside SPEC range [631,900] → ResultScore = true (ผ่านค่าคะแนน) */
export const PASS_FIXTURE: EvalFixture = {
    typePos: 'SPEC',
    answers: {
        Q1: '4.1.2', Q2: '4.2.4', Q3: '4.3.8', Q4: '4.4.11', Q5: '4.5.1',
        Q6: '4.6.1', Q7: '4.7.2', Q8: '4.8.2', Q9: '4.9.2', Q10: '4.10.5',
        Q11: '4.11.11', Q12: '4.12.1', Q13: '4.13.5', Q14: '4.14.1', Q15: '4.15.3',
        Q16: '4.16.1', Q17: '4.17.1', Q18: '4.18.5', Q19: '4.19.4', Q20: '4.20.1',
    },
    expected: { total: 740, resultScore: true },
};

/** total = 201.32 → below SPEC min 631 → ResultScore = false (ไม่ผ่าน) */
export const NOT_PASS_FIXTURE: EvalFixture = {
    typePos: 'SPEC',
    answers: {
        Q1: '4.1.3', Q2: '4.2.2', Q3: '4.3.4', Q4: '4.4.1', Q5: '4.5.2',
        Q6: '4.6.1', Q7: '4.7.2', Q8: '4.8.2', Q9: '4.9.4', Q10: '4.10.3',
        Q11: '4.11.5', Q12: '4.12.1', Q13: '4.13.2', Q14: '4.14.2', Q15: '4.15.3',
        Q16: '4.16.2', Q17: '4.17.1', Q18: '4.18.2', Q19: '4.19.3', Q20: '4.20.1',
    },
    expected: { total: 201.32, resultScore: false },
};
