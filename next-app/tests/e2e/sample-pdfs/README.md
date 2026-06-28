# Sample result PDFs

10 ตัวอย่างผลการประเมิน (PDF) สร้างจากฟังก์ชันระบบ `generateResultPdf`
(Sarabun vector) ป้อน resultData จาก /api/forms/analyse จริง — ตรงกับ
fixtures ใน `../fixtures.ts` (verify total/ResultScore แล้ว 10/10)

verdict "การประเมินค่างาน" = ResultScore (ช่วง min–max ตาม TypePos):
- SPEC  ผ่านเมื่อ total ∈ [631, 900]
- ADMIN ผ่านเมื่อ total ∈ [725, 1035]

ไฮไลต์: total=649 → ผ่าน (ต่ำกว่า 650 เกณฑ์เก่า แต่ในช่วง),
total=2769/2493 → ไม่ผ่าน (เกิน max) — พิสูจน์เกณฑ์ min–max
