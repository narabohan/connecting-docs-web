'use client';
import { useState, useEffect, useRef } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { Activity } from 'lucide-react';
import { REPORT_TRANSLATIONS, LanguageCode } from '@/utils/translations';

interface AlignmentHeroProps {
    score?: number;
    radarData: { subject: string; A: number; fullMark: number }[];
    language: LanguageCode;
    terminalText?: string;
    patientName?: string;
}

const TYPEWRITER_LINES: Record<LanguageCode, string[]> = {
    EN: [
        '> INITIALIZING CLINICAL ENGINE v4.1...',
        '> PATIENT PROFILE: LOADED',
        '> SCANNING 847 PROTOCOL DATABASE...',
        '> RISK FILTER: ACTIVE — Melasma flag detected',
        '> CONSTRAINT MATCH: Pain LOW · Downtime MINIMAL',
        '> PROTOCOL SELECTION: 3 candidates isolated',
        '> BEST MATCH: Volformer Dual-Depth [SCORE: 98]',
        '> CLINICAL EVIDENCE: VALIDATED ✓',
        '> REPORT GENERATION: COMPLETE',
    ],
    KO: [
        '> 임상 엔진 v4.1 초기화 중...',
        '> 환자 프로파일: 로드 완료',
        '> 847개 프로토콜 데이터베이스 스캔 중...',
        '> 리스크 필터: 활성 — 기미 플래그 감지됨',
        '> 제약 매칭: 통증 낮음 · 다운타임 최소화',
        '> 프로토콜 선정: 3개 후보 선별 완료',
        '> 최적 매칭: Volformer 듀얼 뎁스 [점수: 98]',
        '> 임상 근거: 검증 완료 ✓',
        '> 보고서 생성 완료',
    ],
    JP: [
        '> クリニカルエンジン v4.1 初期化中...',
        '> 患者プロファイル: ロード完了',
        '> 847プロトコルDBスキャン中...',
        '> リスクフィルター: 有効 — メラスマフラグ検出',
        '> 制約マッチング: 痛み 低 · ダウンタイム 最小',
        '> プロトコル選定: 3候補を選別',
        '> 最適マッチ: Volformer Dual-Depth [スコア: 98]',
        '> 臨床エビデンス: 検証済み ✓',
        '> レポート生成完了',
    ],
    CN: [
        '> 初始化临床引擎 v4.1...',
        '> 患者档案: 加载完成',
        '> 扫描847个治疗协议数据库...',
        '> 风险过滤: 激活 — 检测到黄褐斑标志',
        '> 约束匹配: 疼痛 低 · 恢复期 最短',
        '> 协议筛选: 3个候选方案已固定',
        '> 最佳匹配: Volformer双深度 [评分: 98]',
        '> 临床证据: 已验证 ✓',
        '> 报告生成完成',
    ],
};

export default function AlignmentHero({ score = 92, radarData, language, terminalText, patientName }: AlignmentHeroProps) {
    const t = (REPORT_TRANSLATIONS[language] || REPORT_TRANSLATIONS['EN']).report?.hero || {
        score: 'ALIGNMENT SCORE',
        scoreLabel: 'Clinical Match',
        subtitle: 'Pre-Consulting Intelligence Report',
        matrixTitle: 'CLINICAL PROFILE MATRIX',
        toleranceZone: 'TOLERANCE_ZONE: MATCHED ✓',
        badges: { protocol: 'PROTOCOL MATCH', risk: 'RISK FILTERED', logic: 'LOGIC VERIFIED' },
        axes: { thickness: 'Skin Thickness', pain: 'Pain Tolerance', downtime: 'Downtime', pigment: 'Pigment Risk', aging: 'Aging Stage' },
    } as const;

    const [displayScore, setDisplayScore] = useState(0);
    const [termLines, setTermLines] = useState<string[]>([]);
    const [currentLine, setCurrentLine] = useState(0);
    const [currentChar, setCurrentChar] = useState(0);
    const hasAnimated = useRef(false);
    const termRef = useRef<HTMLDivElement>(null);

    const lines = TYPEWRITER_LINES[language] || TYPEWRITER_LINES['EN'];

    // Score ring animation
    useEffect(() => {
        if (hasAnimated.current) return;
        hasAnimated.current = true;
        let start = 0;
        const step = () => {
            start += 2;
            if (start >= score) { setDisplayScore(score); return; }
            setDisplayScore(start);
            requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }, [score]);

    // Typewriter effect
    useEffect(() => {
        if (currentLine >= lines.length) return;
        const line = lines[currentLine];
        if (currentChar < line.length) {
            const t = setTimeout(() => setCurrentChar(c => c + 1), 28);
            return () => clearTimeout(t);
        } else {
            const t = setTimeout(() => {
                setTermLines(prev => [...prev, line]);
                setCurrentLine(l => l + 1);
                setCurrentChar(0);
            }, 180);
            return () => clearTimeout(t);
        }
    }, [currentLine, currentChar, lines]);

    // Auto-scroll terminal
    useEffect(() => {
        if (termRef.current) termRef.current.scrollTop = termRef.current.scrollHeight;
    }, [termLines, currentChar]);

    const localizedData = radarData.map(item => {
        const axes = (t.axes || {}) as Record<string, string>;
        const key = item.subject.toLowerCase().replace(/\s/g, '');
        const mapped = Object.entries(axes).find(([k]) => key.includes(k));
        return { ...item, subject: mapped ? mapped[1] : item.subject };
    });

    const renderTick = ({ x, y, payload }: any) => (
        <text x={x} y={y} dy={4} fill="#6ee7f7" fontSize={9} textAnchor="middle" fontFamily="monospace">{payload.value}</text>
    );

    const r = 52;
    const circum = 2 * Math.PI * r;
    const progress = (displayScore / 100) * circum;

    return (
        <section className="relative w-full rounded-2xl overflow-hidden mb-6"
            style={{ background: 'linear-gradient(135deg, #0a0a2a 0%, #0d1040 60%, #081828 100%)', border: '1px solid rgba(0,255,255,0.15)' }}>
            {/* Ambient glow */}
            <div className="absolute inset-0 pointer-events-none"
                style={{ background: 'radial-gradient(ellipse at 15% 50%, rgba(0,255,255,0.07) 0%, transparent 55%)' }} />

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-0 min-h-[360px]">

                {/* ── LEFT: Score Ring + Badges ── */}
                <div className="flex flex-col items-center justify-center p-8 gap-4"
                    style={{ borderRight: '1px solid rgba(0,255,255,0.06)' }}>
                    <div className="text-[10px] font-mono tracking-[0.3em] text-cyan-400/70 uppercase flex items-center gap-2">
                        <Activity className="w-3 h-3" /> {t.score}
                    </div>
                    <div className="relative">
                        <svg width="148" height="148" className="-rotate-90">
                            <circle cx="74" cy="74" r={r} fill="none" stroke="rgba(0,255,255,0.07)" strokeWidth="7" />
                            <circle cx="74" cy="74" r={r} fill="none" stroke="#00FFFF" strokeWidth="7"
                                strokeLinecap="round"
                                strokeDasharray={`${progress} ${circum}`}
                                style={{ filter: 'drop-shadow(0 0 10px #00FFFF)', transition: 'stroke-dasharray 0.04s linear' }}
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-5xl font-bold text-white font-mono" style={{ textShadow: '0 0 24px rgba(0,255,255,0.45)' }}>
                                {displayScore}
                            </span>
                            <span className="text-[10px] text-cyan-400 font-mono tracking-widest">/100</span>
                        </div>
                    </div>
                    <div className="text-center">
                        <div className="text-sm font-bold text-white font-mono">{t.scoreLabel}</div>
                        {patientName && patientName !== 'Guest' && (
                            <div className="text-xs text-cyan-400/60 font-mono mt-1">{patientName}</div>
                        )}
                    </div>
                    <div className="flex gap-1.5 flex-wrap justify-center">
                        {[
                            t.badges?.protocol || 'PROTOCOL MATCH',
                            t.badges?.risk || 'RISK FILTERED',
                            t.badges?.logic || 'LOGIC VERIFIED',
                        ].map(badge => (
                            <span key={badge} className="text-[9px] font-mono px-2 py-1 rounded border tracking-widest"
                                style={{ borderColor: 'rgba(0,255,255,0.25)', color: '#00FFFF', background: 'rgba(0,255,255,0.05)' }}>
                                ✓ {badge}
                            </span>
                        ))}
                    </div>
                </div>

                {/* ── CENTER: 5-Axis Radar ── */}
                <div className="flex flex-col p-7"
                    style={{ borderRight: '1px solid rgba(0,255,255,0.06)' }}>
                    <div className="text-[10px] font-mono tracking-[0.3em] text-cyan-400/70 uppercase mb-3">
                        {t.matrixTitle || 'CLINICAL PROFILE MATRIX'}
                    </div>
                    <div className="flex-1 min-h-[260px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="72%" data={localizedData}>
                                <PolarGrid stroke="rgba(0,255,255,0.1)" />
                                <PolarAngleAxis dataKey="subject" tick={renderTick} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                <Radar name="Profile" dataKey="A" stroke="#00FFFF" strokeWidth={2}
                                    fill="#00FFFF" fillOpacity={0.12}
                                    style={{ filter: 'drop-shadow(0 0 6px #00FFFF)' }}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="text-[9px] font-mono text-right text-cyan-400/40 mt-1">
                        {t.toleranceZone || 'TOLERANCE_ZONE: MATCHED ✓'}
                    </div>
                </div>

                {/* ── RIGHT: AI Terminal ── */}
                <div className="flex flex-col p-7">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#FF3B30' }} />
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#FFD60A' }} />
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#30D158' }} />
                        <span className="text-[9px] font-mono ml-2" style={{ color: 'rgba(0,255,255,0.4)' }}>
                            CLINICAL_ANALYSIS.log
                        </span>
                    </div>
                    <div ref={termRef}
                        className="flex-1 rounded-xl p-4 overflow-y-auto font-mono text-[11px] leading-relaxed"
                        style={{
                            background: 'rgba(0,0,0,0.5)',
                            border: '1px solid rgba(0,255,255,0.1)',
                            color: 'rgba(0,255,255,0.75)',
                            minHeight: '220px',
                            maxHeight: '300px',
                            scrollbarWidth: 'thin',
                        }}>
                        {termLines.map((line, i) => (
                            <div key={i} className="mb-1">
                                <span style={{ color: 'rgba(0,255,255,0.35)' }}>{String(i).padStart(2, '0')} </span>
                                <span>{line}</span>
                            </div>
                        ))}
                        {/* currently typing line */}
                        {currentLine < lines.length && (
                            <div className="mb-1">
                                <span style={{ color: 'rgba(0,255,255,0.35)' }}>{String(currentLine).padStart(2, '0')} </span>
                                <span>{lines[currentLine].slice(0, currentChar)}</span>
                                <span className="animate-pulse" style={{ color: '#00FFFF' }}>█</span>
                            </div>
                        )}
                        {currentLine >= lines.length && terminalText && (
                            <div className="mt-3 pt-3 text-[10px]" style={{ borderTop: '1px solid rgba(0,255,255,0.08)', color: 'rgba(255,255,255,0.4)' }}>
                                {terminalText}
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </section>
    );
}
