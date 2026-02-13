export const translations = {
    EN: {
        reportTitle: "Clinical Alignment Report",
        reportSubtitle: "Based on your unique skin profile and recovery preferences, we have identified specific clinical protocols that align with your goals.",
        reportId: "REPORT ID",
        fitAnalysis: "Fit Analysis",
        clinicalLogic: "Clinical Logic",
        recommendationsTitle: "Recommended Signature Solutions",
        matchScore: "MATCH SCORE",
        noDowntime: "NO DOWNTIME",
        performedBy: "Performed By",
        viewDetails: "View Full Details",
        noMatches: "No matching protocols found for your specific criteria.",
        contactUs: "Contact us for a custom consultation",
        loading: "Analyzing Clinical Data...",
        error: "Error",
        subjects: {
            painSafe: "Pain Safe",
            downtime: "Downtime",
            efficacy: "Efficacy",
            skinFit: "Skin Fit",
            budget: "Budget"
        }
    },
    KO: {
        reportTitle: "임상 매칭 리포트",
        reportSubtitle: "고객님의 피부 특성과 회복 선호도를 분석하여 최적의 시술 프로토콜을 선정했습니다.",
        reportId: "리포트 ID",
        fitAnalysis: "적합도 분석",
        clinicalLogic: "임상 로직",
        recommendationsTitle: "추천 시그니처 솔루션",
        matchScore: "매칭 점수",
        noDowntime: "다운타임 없음",
        performedBy: "시술 의료진",
        viewDetails: "상세 보기",
        noMatches: "조건에 맞는 프로토콜을 찾을 수 없습니다.",
        contactUs: "맞춤 상담 문의하기",
        loading: "임상 데이터 분석 중...",
        error: "오류",
        subjects: {
            painSafe: "통증 안심",
            downtime: "회복 편의성",
            efficacy: "효과",
            skinFit: "피부 적합성",
            budget: "예산 적합성"
        }
    },
    JP: {
        reportTitle: "クリニカル・アライメント・レポート",
        reportSubtitle: "お客様の肌質とダウンタイムのご希望に基づき、最適な施術プロトコルを選定しました。",
        reportId: "レポートID",
        fitAnalysis: "適合分析",
        clinicalLogic: "クリニカル・ロジック",
        recommendationsTitle: "推奨シグネチャーソリューション",
        matchScore: "マッチングスコア",
        noDowntime: "ダウンタイムなし",
        performedBy: "担当医師/クリニック",
        viewDetails: "詳細を見る",
        noMatches: "条件に合うプロトコルが見つかりませんでした。",
        contactUs: "個別相談にお問い合わせください",
        loading: "臨床データを分析中...",
        error: "エラー",
        subjects: {
            painSafe: "痛みへの配慮",
            downtime: "ダウンタイム",
            efficacy: "効果",
            skinFit: "肌質適合性",
            budget: "予算適合性"
        }
    },
    CN: {
        reportTitle: "临床匹配报告",
        reportSubtitle: "根据您的皮肤特征和恢复偏好，我们要为您制定了最合适的治疗方案。",
        reportId: "报告 ID",
        fitAnalysis: "适合度分析",
        clinicalLogic: "临床逻辑",
        recommendationsTitle: "推荐的签名解决方案",
        matchScore: "匹配分数",
        noDowntime: "无恢复期",
        performedBy: "执行医生",
        viewDetails: "查看详情",
        noMatches: "未找到符合您标准的治疗方案。",
        contactUs: "联系我们需要定制咨询",
        loading: "正在分析临床数据...",
        error: "错误",
        subjects: {
            painSafe: "疼痛安全",
            downtime: "恢复期",
            efficacy: "效果",
            skinFit: "皮肤适合度",
            budget: "预算适合度"
        }
    }
};

export type Language = keyof typeof translations;
