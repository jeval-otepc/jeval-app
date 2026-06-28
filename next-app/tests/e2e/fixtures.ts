/**
 * Verified scoring fixtures for the JEVAL eval form.
 *
 * The PASS/NOT-PASS verdict ("การประเมินค่างาน") is driven by TypePos
 * (ประเภทตำแหน่ง, chosen on the "ข้อมูลทั่วไป" step) via the backend ResultScore,
 * which checks the total against a min–max range — NOT a flat threshold:
 *
 *   TypePos = 'SPEC'  (วิชาการ/เชี่ยวชาญ)  → PASS when total ∈ [631, 900]
 *   TypePos = 'ADMIN' (อำนวยการสูง)        → PASS when total ∈ [725, 1035]
 *   total below min OR above max           → NOT PASS (ResultScore = false)
 *
 * total = ResultKH + ResultPS + ResultAC  (ResultPS = ResultKH * psPercent / 100).
 * Q1-Q9 feed KH, Q10-Q13 feed PS, Q14-Q18 feed AC, Q19 feeds the "component"
 * check, Q20 is recorded but does NOT affect the score.
 *
 * Every case below was verified 10/10 against the live /api/forms/analyse endpoint
 * (live totalScore and ResultScore matched exactly). Answer values are the answer
 * "No" (e.g. "4.1.2") — i.e. the radio `value` rendered in the form.
 *
 * Notable: SPEC total=649 PASSES (649 ∈ [631,900]) even though it is below the old
 * 650 flat threshold; SPEC=2769 / ADMIN=2493 FAIL because they exceed the max — both
 * demonstrate the min–max rule.
 */

export interface EvalCase {
    name: string;
    typePos: 'SPEC' | 'ADMIN';
    answers: Record<string, string>; // Q1..Q20 -> answer No
    expected: {
        total: number;
        resultScore: boolean; // total within the TypePos min–max range
    };
}

export const EVAL_CASES: EvalCase[] = [
    {
        name: "SPEC PASS (total 879)",
        typePos: "SPEC",
        answers: { Q1: '4.1.2', Q2: '4.2.1', Q3: '4.3.9', Q4: '4.4.4', Q5: '4.5.4', Q6: '4.6.2', Q7: '4.7.5', Q8: '4.8.4', Q9: '4.9.2', Q10: '4.10.6', Q11: '4.11.6', Q12: '4.12.6', Q13: '4.13.1', Q14: '4.14.1', Q15: '4.15.8', Q16: '4.16.1', Q17: '4.17.3', Q18: '4.18.2', Q19: '4.19.4', Q20: '4.20.1' },
        expected: { total: 879, resultScore: true },
    },
    {
        name: "SPEC PASS (total 724.5)",
        typePos: "SPEC",
        answers: { Q1: '4.1.3', Q2: '4.2.2', Q3: '4.3.2', Q4: '4.4.3', Q5: '4.5.6', Q6: '4.6.9', Q7: '4.7.3', Q8: '4.8.2', Q9: '4.9.1', Q10: '4.10.8', Q11: '4.11.3', Q12: '4.12.6', Q13: '4.13.4', Q14: '4.14.2', Q15: '4.15.7', Q16: '4.16.6', Q17: '4.17.3', Q18: '4.18.1', Q19: '4.19.6', Q20: '4.20.1' },
        expected: { total: 724.5, resultScore: true },
    },
    {
        name: "SPEC PASS (total 649 — below old 650 threshold but in range)",
        typePos: "SPEC",
        answers: { Q1: '4.1.1', Q2: '4.2.5', Q3: '4.3.8', Q4: '4.4.2', Q5: '4.5.2', Q6: '4.6.4', Q7: '4.7.5', Q8: '4.8.2', Q9: '4.9.1', Q10: '4.10.3', Q11: '4.11.11', Q12: '4.12.8', Q13: '4.13.1', Q14: '4.14.1', Q15: '4.15.1', Q16: '4.16.1', Q17: '4.17.4', Q18: '4.18.2', Q19: '4.19.5', Q20: '4.20.1' },
        expected: { total: 649, resultScore: true },
    },
    {
        name: "SPEC NOT-PASS (below min 631, total 437.5)",
        typePos: "SPEC",
        answers: { Q1: '4.1.2', Q2: '4.2.6', Q3: '4.3.1', Q4: '4.4.9', Q5: '4.5.1', Q6: '4.6.1', Q7: '4.7.2', Q8: '4.8.1', Q9: '4.9.2', Q10: '4.10.4', Q11: '4.11.8', Q12: '4.12.3', Q13: '4.13.5', Q14: '4.14.2', Q15: '4.15.9', Q16: '4.16.3', Q17: '4.17.3', Q18: '4.18.1', Q19: '4.19.4', Q20: '4.20.1' },
        expected: { total: 437.5, resultScore: false },
    },
    {
        name: "SPEC NOT-PASS (above max 900, total 2769.2)",
        typePos: "SPEC",
        answers: { Q1: '4.1.3', Q2: '4.2.3', Q3: '4.3.12', Q4: '4.4.9', Q5: '4.5.13', Q6: '4.6.1', Q7: '4.7.2', Q8: '4.8.1', Q9: '4.9.4', Q10: '4.10.10', Q11: '4.11.2', Q12: '4.12.1', Q13: '4.13.5', Q14: '4.14.1', Q15: '4.15.12', Q16: '4.16.3', Q17: '4.17.1', Q18: '4.18.3', Q19: '4.19.4', Q20: '4.20.1' },
        expected: { total: 2769.2, resultScore: false },
    },
    {
        name: "ADMIN PASS (total 941)",
        typePos: "ADMIN",
        answers: { Q1: '4.1.2', Q2: '4.2.7', Q3: '4.3.2', Q4: '4.4.1', Q5: '4.5.2', Q6: '4.6.10', Q7: '4.7.9', Q8: '4.8.1', Q9: '4.9.4', Q10: '4.10.5', Q11: '4.11.3', Q12: '4.12.3', Q13: '4.13.1', Q14: '4.14.3', Q15: '4.15.1', Q16: '4.16.4', Q17: '4.17.3', Q18: '4.18.4', Q19: '4.19.2', Q20: '4.20.1' },
        expected: { total: 941, resultScore: true },
    },
    {
        name: "ADMIN PASS (total 954.04)",
        typePos: "ADMIN",
        answers: { Q1: '4.1.1', Q2: '4.2.1', Q3: '4.3.8', Q4: '4.4.10', Q5: '4.5.8', Q6: '4.6.2', Q7: '4.7.2', Q8: '4.8.5', Q9: '4.9.1', Q10: '4.10.6', Q11: '4.11.10', Q12: '4.12.2', Q13: '4.13.3', Q14: '4.14.1', Q15: '4.15.1', Q16: '4.16.4', Q17: '4.17.4', Q18: '4.18.5', Q19: '4.19.5', Q20: '4.20.1' },
        expected: { total: 954.04, resultScore: true },
    },
    {
        name: "ADMIN PASS (total 804.5)",
        typePos: "ADMIN",
        answers: { Q1: '4.1.1', Q2: '4.2.1', Q3: '4.3.6', Q4: '4.4.4', Q5: '4.5.3', Q6: '4.6.2', Q7: '4.7.6', Q8: '4.8.1', Q9: '4.9.4', Q10: '4.10.2', Q11: '4.11.5', Q12: '4.12.3', Q13: '4.13.6', Q14: '4.14.1', Q15: '4.15.2', Q16: '4.16.8', Q17: '4.17.4', Q18: '4.18.4', Q19: '4.19.1', Q20: '4.20.1' },
        expected: { total: 804.5, resultScore: true },
    },
    {
        name: "ADMIN NOT-PASS (below min 725, total 644.48)",
        typePos: "ADMIN",
        answers: { Q1: '4.1.1', Q2: '4.2.3', Q3: '4.3.1', Q4: '4.4.5', Q5: '4.5.8', Q6: '4.6.1', Q7: '4.7.3', Q8: '4.8.3', Q9: '4.9.2', Q10: '4.10.4', Q11: '4.11.6', Q12: '4.12.1', Q13: '4.13.8', Q14: '4.14.2', Q15: '4.15.8', Q16: '4.16.8', Q17: '4.17.1', Q18: '4.18.1', Q19: '4.19.1', Q20: '4.20.1' },
        expected: { total: 644.48, resultScore: false },
    },
    {
        name: "ADMIN NOT-PASS (above max 1035, total 2493)",
        typePos: "ADMIN",
        answers: { Q1: '4.1.1', Q2: '4.2.7', Q3: '4.3.8', Q4: '4.4.8', Q5: '4.5.8', Q6: '4.6.1', Q7: '4.7.5', Q8: '4.8.2', Q9: '4.9.3', Q10: '4.10.5', Q11: '4.11.10', Q12: '4.12.6', Q13: '4.13.4', Q14: '4.14.1', Q15: '4.15.1', Q16: '4.16.3', Q17: '4.17.1', Q18: '4.18.3', Q19: '4.19.4', Q20: '4.20.1' },
        expected: { total: 2493, resultScore: false },
    },
];

/** Backward-compatible single fixtures (first SPEC pass / fail). */
export const PASS_FIXTURE = EVAL_CASES[0];
export const NOT_PASS_FIXTURE = EVAL_CASES[3];
