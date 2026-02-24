import { useState } from 'react';
import { LanguageCode } from '@/utils/translations';

interface AiRoadmapProps {
    language: LanguageCode;
}

const tools = [
    {
        icon: '📊',
        name: 'Airtable',
        color: 'from-emerald-500/20 to-emerald-600/5',
        borderColor: 'border-emerald-500/30',
        iconBg: 'bg-emerald-500/10',
        current: {
            EN: 'Clinical protocol database (30+ protocols, indication mapping)',
            KO: '임상 프로토콜 DB (30개+ 프로토콜, indication 매핑)'
        },
        next: [
            { EN: 'Recommendation_Run feedback loop — track protocol performance', KO: 'Recommendation_Run 피드백 루프 — 프로토콜 성과 추적' },
            { EN: 'indication_map ↔ Protocol_block full bidirectional linking', KO: 'indication_map ↔ Protocol_block 완전 양방향 링크' },
            { EN: 'Override_Log: learn from doctor corrections', KO: 'Override_Log: 의사 수정 케이스 학습 데이터 축적' },
        ]
    },
    {
        icon: '🤖',
        name: 'Claude',
        color: 'from-orange-500/20 to-orange-600/5',
        borderColor: 'border-orange-500/30',
        iconBg: 'bg-orange-500/10',
        current: {
            EN: 'Haiku: Fast ranking from Airtable-grounded protocol list',
            KO: 'Haiku: Airtable 프로토콜 목록 기반 빠른 랭킹'
        },
        next: [
            { EN: 'Upgrade to Sonnet: better reasoning for complex contraindications', KO: 'Sonnet 업그레이드: 복잡한 금기사항 추론 향상' },
            { EN: 'Tool Use / Function Calling: Claude queries Airtable directly', KO: 'Tool Use: Claude가 Airtable을 직접 API 조회' },
            { EN: 'search_protocols(indication, pain_tolerance) as a native tool', KO: 'search_protocols(indication, pain_tolerance) 네이티브 도구화' },
        ]
    },
    {
        icon: '📓',
        name: 'NotebookLM',
        color: 'from-blue-500/20 to-blue-600/5',
        borderColor: 'border-blue-500/30',
        iconBg: 'bg-blue-500/10',
        current: {
            EN: 'Manual clinical validation — verify protocols with EBD clinical data',
            KO: '수동 임상 검증 — EBD 임상 데이터로 프로토콜 검증'
        },
        next: [
            { EN: 'Monthly auto-update: new device manuals, clinical papers added', KO: '월 1회 자동 업데이트: 신규 디바이스 매뉴얼, 임상논문 추가' },
            { EN: 'Semi-automatic pipeline: NotebookLM → Claude → Airtable', KO: '반자동 파이프라인: NotebookLM 검증 → Claude 구조화 → Airtable 저장' },
            { EN: 'Antigravity (AI) adds knowledge every 1st of the month', KO: 'Antigravity(AI)가 매월 1일 지식 자동 추가' },
        ]
    },
    {
        icon: '🌐',
        name: 'Gemini',
        color: 'from-purple-500/20 to-purple-600/5',
        borderColor: 'border-purple-500/30',
        iconBg: 'bg-purple-500/10',
        current: {
            EN: 'Not yet integrated (planned multimodal layer)',
            KO: '미통합 (멀티모달 레이어 예정)'
        },
        next: [
            { EN: '(Optional) Skin photo → Gemini Vision auto-scores pigment, pores, elasticity', KO: '(선택) 사진 → Gemini Vision으로 색소·모공·탄력 자동 스코어링' },
            { EN: 'Vision scores added to survey data → more accurate Claude ranking', KO: '비전 분석 결과를 설문 데이터에 합산 → Claude 추천 정확도 향상' },
            { EN: 'Gemini Flash: cost-effective large-context protocol processing', KO: 'Gemini Flash: 대용량 프로토콜 컨텍스트 저비용 처리' },
        ]
    },
    {
        icon: '🔌',
        name: 'GPT (OpenAI)',
        color: 'from-cyan-500/20 to-cyan-600/5',
        borderColor: 'border-cyan-500/30',
        iconBg: 'bg-cyan-500/10',
        current: {
            EN: 'Not yet integrated (planned patient-facing copy layer)',
            KO: '미통합 (환자 친화적 문구 레이어 예정)'
        },
        next: [
            { EN: 'GPT-4o: generate patient-friendly clinical explanation text', KO: 'GPT-4o: 환자 친화적 임상 설명 문구 자동 생성' },
            { EN: 'text-embedding-3-small: semantic similarity for indication matching', KO: 'text-embedding-3-small: 의미 유사도로 indication 매칭 정확도 향상' },
        ]
    },
];

const flowSteps = [
    { icon: '📋', label: { EN: 'Survey + (Optional Photo)', KO: '설문 + (선택: 사진)' } },
    { icon: '🌐', label: { EN: 'Gemini Vision', KO: 'Gemini Vision' } },
    { icon: '📊', label: { EN: 'Airtable Filter', KO: 'Airtable 필터' } },
    { icon: '🤖', label: { EN: 'Claude Ranking', KO: 'Claude 랭킹' } },
    { icon: '📄', label: { EN: 'Personalized Report', KO: '맞춤형 리포트' } },
];

export default function AiRoadmap({ language }: AiRoadmapProps) {
    const [activeCard, setActiveCard] = useState<number | null>(null);
    const lang = (language === 'KO' || language === 'JA' || language === 'ZH') ? 'KO' : 'EN';

    return (
        <section className="relative py-28 overflow-hidden bg-[#050505]">
            {/* Background grid */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:72px_72px]" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-cyan-500/5 rounded-full blur-3xl" />

            <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-16">
                    <span className="inline-block px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-mono tracking-widest uppercase mb-4">
                        AI Architecture
                    </span>
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                        {lang === 'KO' ? (
                            <>Powered by <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">AI × 5</span></>
                        ) : (
                            <>Powered by <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">AI × 5</span></>
                        )}
                    </h2>
                    <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                        {lang === 'KO'
                            ? '5개의 AI 툴이 역할을 분담하여 최고의 임상 추천 정확도를 만들어냅니다'
                            : '5 specialized AI tools work together to deliver unmatched clinical recommendation accuracy'}
                    </p>
                </div>

                {/* Architecture Flow */}
                <div className="flex flex-wrap items-center justify-center gap-2 mb-16">
                    {flowSteps.map((step, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <div className="flex flex-col items-center">
                                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl backdrop-blur-sm hover:scale-110 transition-transform duration-200">
                                    {step.icon}
                                </div>
                                <span className="mt-2 text-xs text-slate-500 text-center max-w-[80px] leading-tight">
                                    {step.label[lang]}
                                </span>
                            </div>
                            {i < flowSteps.length - 1 && (
                                <div className="flex items-center -mt-5">
                                    <div className="w-8 h-px bg-gradient-to-r from-cyan-500/50 to-purple-500/50" />
                                    <div className="w-0 h-0 border-t-4 border-b-4 border-l-4 border-t-transparent border-b-transparent border-l-cyan-500/50" />
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Tool Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {tools.map((tool, i) => (
                        <div
                            key={i}
                            onClick={() => setActiveCard(activeCard === i ? null : i)}
                            className={`relative p-6 rounded-2xl border cursor-pointer transition-all duration-300 bg-gradient-to-br ${tool.color} ${tool.borderColor} hover:scale-[1.02] hover:shadow-lg hover:shadow-black/30 ${activeCard === i ? 'ring-1 ring-white/20' : ''}`}
                        >
                            {/* Tool Header */}
                            <div className="flex items-center gap-3 mb-4">
                                <div className={`w-11 h-11 rounded-xl ${tool.iconBg} flex items-center justify-center text-xl`}>
                                    {tool.icon}
                                </div>
                                <div>
                                    <h3 className="font-bold text-white text-base">{tool.name}</h3>
                                    <span className="text-xs text-slate-500 font-mono">
                                        {lang === 'KO' ? '현재 역할' : 'Current Role'}
                                    </span>
                                </div>
                            </div>

                            {/* Current Status */}
                            <div className="mb-4 p-3 rounded-xl bg-white/5 border border-white/5">
                                <div className="flex items-center gap-1.5 mb-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                                    <span className="text-xs text-green-400 font-mono">
                                        {lang === 'KO' ? '현재' : 'NOW'}
                                    </span>
                                </div>
                                <p className="text-sm text-slate-300 leading-relaxed">
                                    {tool.current[lang]}
                                </p>
                            </div>

                            {/* Next Steps (visible when expanded or on hover) */}
                            <div>
                                <div className="flex items-center gap-1.5 mb-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                                    <span className="text-xs text-cyan-400 font-mono">
                                        {lang === 'KO' ? '다음 단계' : 'NEXT'}
                                    </span>
                                </div>
                                <ul className="space-y-2">
                                    {tool.next.map((item, j) => (
                                        <li key={j} className="flex items-start gap-2 text-sm text-slate-400">
                                            <span className="mt-1 w-1 h-1 rounded-full bg-slate-600 flex-shrink-0" />
                                            <span className="leading-snug">{item[lang]}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ))}

                    {/* Summary Card */}
                    <div className="relative p-6 rounded-2xl border border-dashed border-white/10 bg-gradient-to-br from-white/3 to-transparent md:col-span-2 xl:col-span-1 flex flex-col justify-center">
                        <div className="text-center">
                            <span className="text-4xl mb-4 block">🔄</span>
                            <h3 className="font-bold text-white text-lg mb-2">
                                {lang === 'KO' ? '지속적 학습 루프' : 'Continuous Learning Loop'}
                            </h3>
                            <p className="text-sm text-slate-400 leading-relaxed">
                                {lang === 'KO'
                                    ? '의사 피드백 → Override_Log → Airtable 업데이트 → 더 정확한 추천. 매월 새 임상 데이터가 시스템에 통합됩니다.'
                                    : 'Doctor feedback → Override_Log → Airtable update → better recommendations. New clinical data integrated monthly.'}
                            </p>
                            <div className="mt-4 flex items-center justify-center gap-6 text-xs text-slate-500">
                                <span>📊 30+ Protocols</span>
                                <span>🤖 AI-Ranked</span>
                                <span>🔄 Monthly Update</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Note */}
                <p className="text-center text-xs text-slate-600 mt-12 font-mono">
                    {lang === 'KO'
                        ? 'NotebookLM 지식 베이스는 Antigravity(AI)가 매월 1일에 자동으로 업데이트합니다'
                        : 'NotebookLM knowledge base is automatically updated by Antigravity (AI) on the 1st of every month'}
                </p>
            </div>
        </section>
    );
}
