// ═══════════════════════════════════════════════════════════════
//  Report v7 — I18n Context
//  Provides t(key) translation function for 4 languages.
//  UI-only strings; report content comes pre-translated from API.
// ═══════════════════════════════════════════════════════════════

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { SurveyLang } from '@/types/report-v7';

// ─── Translation Dictionary ───────────────────────────────────
type TranslationDict = Record<string, Record<SurveyLang, string>>;

const TRANSLATIONS: TranslationDict = {
  // Tab labels
  'tab.patient': {
    KO: '환자 리포트',
    EN: 'Patient Report',
    JP: '患者レポート',
    'ZH-CN': '患者报告',
  },
  'tab.doctor': {
    KO: '의사 브리핑',
    EN: 'Doctor Briefing',
    JP: '医師ブリーフィング',
    'ZH-CN': '医生简报',
  },
  // Section labels
  'section.recommendations': {
    KO: '추천 시술',
    EN: 'Recommendations',
    JP: 'おすすめ施術',
    'ZH-CN': '推荐项目',
  },
  'section.ebd': {
    KO: '에너지 기반 시술',
    EN: 'Energy-Based Devices',
    JP: 'エネルギーベース施術',
    'ZH-CN': '能量型设备',
  },
  'section.injectable': {
    KO: '주사 시술',
    EN: 'Injectables',
    JP: '注入施術',
    'ZH-CN': '注射项目',
  },
  'section.signature': {
    KO: '시그니처 솔루션',
    EN: 'Signature Solutions',
    JP: 'シグネチャーソリューション',
    'ZH-CN': '招牌方案',
  },
  'section.plan': {
    KO: '시술 플랜',
    EN: 'Treatment Plan',
    JP: '施術プラン',
    'ZH-CN': '治疗计划',
  },
  'section.homecare': {
    KO: '홈케어 가이드',
    EN: 'Homecare Guide',
    JP: 'ホームケアガイド',
    'ZH-CN': '家庭护理指南',
  },
  'section.skinLayer': {
    KO: '피부층 시각화',
    EN: 'Skin Layer Visualization',
    JP: '皮膚層ビジュアライゼーション',
    'ZH-CN': '皮肤层可视化',
  },
  'section.radar': {
    KO: '시술 비교',
    EN: 'Treatment Comparison',
    JP: '施術比較',
    'ZH-CN': '治疗对比',
  },
  // Card actions
  'action.viewDetail': {
    KO: '자세히 보기',
    EN: 'View Detail',
    JP: '詳細を見る',
    'ZH-CN': '查看详情',
  },
  'action.collapse': {
    KO: '접기',
    EN: 'Collapse',
    JP: '閉じる',
    'ZH-CN': '收起',
  },
  'action.bookConsult': {
    KO: '상담 예약하기',
    EN: 'Book Consultation',
    JP: '相談を予約する',
    'ZH-CN': '预约咨询',
  },
  // Fallback card
  'fallback.additionalTitle': {
    KO: '추가 추천',
    EN: 'Additional Recommendation',
    JP: '追加おすすめ',
    'ZH-CN': '额外推荐',
  },
  'fallback.additionalDesc': {
    KO: '진료 시 담당 의사가 최적의 추가 시술을 추천해 드립니다.',
    EN: 'Your doctor will recommend the best additional treatment during consultation.',
    JP: '診察時に担当医が最適な追加施術をご提案いたします。',
    'ZH-CN': '就诊时医生会为您推荐最佳的额外治疗方案。',
  },
  // Labels
  'label.pain': {
    KO: '통증',
    EN: 'Pain',
    JP: '痛み',
    'ZH-CN': '疼痛',
  },
  'label.downtime': {
    KO: '다운타임',
    EN: 'Downtime',
    JP: 'ダウンタイム',
    'ZH-CN': '恢复期',
  },
  'label.evidence': {
    KO: '근거 수준',
    EN: 'Evidence Level',
    JP: 'エビデンスレベル',
    'ZH-CN': '证据等级',
  },
  'label.synergy': {
    KO: '시너지',
    EN: 'Synergy',
    JP: 'シナジー',
    'ZH-CN': '协同效应',
  },
  'label.fitScore': {
    KO: '적합도',
    EN: 'Fit Score',
    JP: '適合度',
    'ZH-CN': '适合度',
  },
  // Error & loading
  'error.title': {
    KO: '표시 오류',
    EN: 'Display Error',
    JP: '表示エラー',
    'ZH-CN': '显示错误',
  },
  'error.description': {
    KO: '이 섹션을 불러오는 중 문제가 발생했습니다.',
    EN: 'An error occurred while loading this section.',
    JP: 'このセクションの読み込み中にエラーが発生しました。',
    'ZH-CN': '加载此部分时发生错误。',
  },
  'loading.title': {
    KO: '리포트를 준비하고 있습니다',
    EN: 'Preparing your report',
    JP: 'レポートを準備しています',
    'ZH-CN': '正在准备您的报告',
  },
  // Practical info labels
  'practical.sessions': {
    KO: '시술 횟수', EN: 'Sessions', JP: '施術回数', 'ZH-CN': '疗程次数',
  },
  'practical.interval': {
    KO: '간격', EN: 'Interval', JP: '間隔', 'ZH-CN': '间隔',
  },
  'practical.duration': {
    KO: '소요 시간', EN: 'Duration', JP: '所要時間', 'ZH-CN': '时长',
  },
  'practical.onset': {
    KO: '효과 시작', EN: 'Onset', JP: '効果発現', 'ZH-CN': '起效时间',
  },
  'practical.maintain': {
    KO: '유지 기간', EN: 'Maintain', JP: '持続期間', 'ZH-CN': '维持时间',
  },
  'label.moa': {
    KO: '작용 기전', EN: 'Mechanism of Action', JP: '作用機序', 'ZH-CN': '作用机制',
  },
  'label.none': {
    KO: '없음', EN: 'None', JP: 'なし', 'ZH-CN': '无',
  },
  // Disclaimer
  'disclaimer.text': {
    KO: '본 리포트는 AI 분석 결과이며, 최종 판단은 담당 의료진과 상담 후 결정하시기 바랍니다.',
    EN: 'This report is AI-generated. Please consult with your doctor for final decisions.',
    JP: 'このレポートはAI分析結果です。最終判断は担当医とご相談ください。',
    'ZH-CN': '本报告为AI分析结果，最终决定请咨询您的医生。',
  },
};

// ─── Context Type ─────────────────────────────────────────────
interface ReportI18nContextValue {
  lang: SurveyLang;
  t: (key: string) => string;
}

const ReportI18nCtx = createContext<ReportI18nContextValue>({
  lang: 'KO',
  t: (key: string) => key,
});

// ─── Provider ─────────────────────────────────────────────────
interface ReportI18nProviderProps {
  lang: SurveyLang;
  children: ReactNode;
}

export function ReportI18nProvider({ lang, children }: ReportI18nProviderProps) {
  const value = useMemo<ReportI18nContextValue>(() => ({
    lang,
    t: (key: string): string => {
      const entry = TRANSLATIONS[key];
      if (!entry) return key;
      return entry[lang] ?? entry.KO ?? key;
    },
  }), [lang]);

  return (
    <ReportI18nCtx.Provider value={value}>
      {children}
    </ReportI18nCtx.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────
export function useReportI18n(): ReportI18nContextValue {
  return useContext(ReportI18nCtx);
}
