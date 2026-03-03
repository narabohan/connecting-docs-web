const fs = require('fs');

const path = '/Users/nrb/.gemini/antigravity/brain/70c6aa3e-f19d-4410-8e75-9efb292079e3/.system_generated/steps/1493/output.txt';
const data = JSON.parse(fs.readFileSync(path, 'utf8'));

let prompt = "다음은 피부 미용 의료기기 EBD 카테고리들의 한국어 추천 이유(reason_why_template)입니다.\n" +
"각 텍스트를 EN(영어), JP(일본어), CN(중국어)로 번역하되:\n" +
"1. 장비명/제품명은 영문 그대로 유지\n" +
"2. 각 언어의 피부과 환자 커뮤니케이션 표준 표현 사용\n" +
"3. 과도하게 의학적이거나 딱딱하지 않게 환자 친화적으로\n" +
"4. 원문의 의미와 뉘앙스 최대한 보존\n\n";

for (const record of data.records) {
   if (record.fields.reason_why_template) {
      prompt += `[${record.fields.category_id}]\n`;
      prompt += `${record.fields.reason_why_template}\n\n`;
   }
}

prompt += "출력 형식 (반드시 지킬 것, 줄바꿈 포함):\n";
prompt += "category_id | reason_why_EN | reason_why_JP | reason_why_CN\n";

fs.writeFileSync('.agent/category_prompt.txt', prompt);
console.log("Prompt generated at .agent/category_prompt.txt");
