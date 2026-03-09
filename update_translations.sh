#!/bin/bash
sed -i '' 's/"Low Pain & Skin Rest", "Moderate Sting & Balanced Care", "High Energy & Radical Change"/"Low Pain & Rest", "Moderate & Balance", "High Energy & Change"/g' src/utils/translations.ts
sed -i '' 's/"Zero Downtime", "Mild Swelling (1-3 Days)", "Intensive Recovery (5+ Days)"/"Zero", "Mild (1-3 Days)", "Intensive (5 Days+)"/g' src/utils/translations.ts

sed -i '' 's/"합리적인 가성비 (Economy)", "검증된 표준 케어 (Standard)", "프리미엄 시그니처 (Premium)"/"실속형", "표준형", "프리미엄"/g' src/utils/translations.ts
sed -i '' 's/"저통증 & 피부 휴식", "중등도 & 밸런스 케어", "고강도 & 라인 변화"/"저통증 & 휴식", "중등도 & 밸런스", "고강도 & 변화"/g' src/utils/translations.ts
sed -i '' 's/"다운타임 없음", "약한 붓기 (1-3일)", "집중 회복 (5일 이상)"/"없음", "약한 붓기 (1-3일)", "집중 회복 (5일 이상)"/g' src/utils/translations.ts

sed -i '' 's/"合理的な価格設定", "検証済みの標準ケア", "プレミアム・シグネチャー"/"エコノミー", "スタンダード", "プレミアム"/g' src/utils/translations.ts
sed -i '' 's/"低痛感・お肌の休息", "適度な刺激・バランスケア", "高強度・確実な変化"/"低刺激 & 休息", "中程度 & バランス", "高出力 & 変化"/g' src/utils/translations.ts
sed -i '' 's/"即時日常生活復帰", "軽い腫れ・赤み (1-3日)", "集中回復期間 (5日以上)"/"なし", "軽度 (1-3日)", "集中ケア (5日以上)"/g' src/utils/translations.ts

sed -i '' 's/"经济高效", "标准专业", "顶级奢享"/"经济型", "标准型", "尊贵型"/g' src/utils/translations.ts
sed -i '' 's/"低痛感 & 皮肤修护", "适度刺激 & 平衡护理", "高能激发 & 显著改变"/"低痛感 & 休息", "适度刺激 & 平衡", "高能量 & 改变"/g' src/utils/translations.ts
sed -i '' 's/"无需恢复期", "轻微红肿 (1-3天)", "深度修复 (5天以上)"/"零恢复期", "轻微 (1-3天)", "密集恢复 (5天以上)"/g' src/utils/translations.ts
