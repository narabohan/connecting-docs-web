import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Droplets, Zap, Clock, ShieldCheck, ChevronDown, ChevronUp, Link as LinkIcon, Loader2, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { LanguageCode } from '@/utils/translations';

interface DeepDiveModalProps {
    isOpen: boolean;
    onClose: () => void;
    rankData: any;
    language: string;
    runId?: string;
    overallDirectionText?: string;
    isRank1?: boolean;
}

export default function DeepDiveModal({
    isOpen,
    onClose,
    rankData,
    language,
    runId,
    overallDirectionText,
    isRank1
}: DeepDiveModalProps) {
    const [expandedDevice, setExpandedDevice] = useState<string | null>(null);
    const [expandedBooster, setExpandedBooster] = useState<string | null>(null);

    // AI Copilot Q&A State
    const [chatOpen, setChatOpen] = useState(false);
    const [chatQuestion, setChatQuestion] = useState('');
    const [chatAnswer, setChatAnswer] = useState('');
    const [chatLoading, setChatLoading] = useState(false);

    if (!isOpen || !rankData) return null;

    const cat = rankData.category || {};
    const devices = rankData.devices || [];
    const boosters = rankData.boosters || [];
    const whyText = language === 'EN' ? (rankData.why_EN || rankData.why_KO) : (rankData.why_KO || rankData.why_EN);

    const getBrandTierColor = (tier: string) => {
        if (!tier) return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
        const t = tier.toLowerCase();
        if (t.includes('premium')) return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
        if (t.includes('standard')) return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'; // Budget
    };

    const getEvidenceBadge = (score: number | string) => {
        const s = Number(score) || 0;
        if (s >= 5) return { stars: '★★★★★', label: 'Gold Standard', color: 'text-amber-400' };
        if (s >= 4) return { stars: '★★★★', label: 'Strong Evidence', color: 'text-cyan-400' };
        if (s >= 3) return { stars: '★★★', label: 'Clinical Evidence', color: 'text-emerald-400' };
        if (s >= 2) return { stars: '★★', label: 'Emerging Evidence', color: 'text-blue-400' };
        return { stars: '★', label: 'Early Stage', color: 'text-gray-400' };
    };

    const handleAskCopilot = async () => {
        if (!chatQuestion.trim() || !runId) return;
        setChatLoading(true);
        setChatAnswer('');
        try {
            const res = await fetch('/api/report-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ runId, question: chatQuestion, language })
            });
            if (!res.body) throw new Error('No body');
            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value);
                const lines = chunk.split('\n').filter(l => l.startsWith('data: '));
                for (const line of lines) {
                    try {
                        const payload = JSON.parse(line.replace('data: ', ''));
                        if (payload.done) break;
                        if (payload.text) setChatAnswer(prev => prev + payload.text);
                    } catch { }
                }
            }
        } catch (e) {
            console.error('[Copilot]', e);
        } finally {
            setChatLoading(false);
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm"
                onClick={onClose}
            >
                <div
                    className="relative w-full sm:max-w-3xl h-[90vh] sm:h-auto sm:max-h-[90vh] bg-[#0a0a0f] border-t sm:border border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex-none flex items-center justify-between p-6 border-b border-white/5 bg-black/40">
                        <div className="space-y-1">
                            {cat.best_primary_indication && (
                                <span className="inline-block px-2 py-0.5 text-[10px] font-bold tracking-widest text-cyan-400 uppercase border border-cyan-400/30 rounded bg-cyan-400/10 mb-2">
                                    {cat.best_primary_indication}
                                </span>
                            )}
                            <h2
                                className="text-3xl text-white font-serif italic font-light"
                            >
                                {cat.category_display_name}
                            </h2>
                        </div>
                        <button onClick={onClose} className="p-3 rounded-full bg-white/5 hover:bg-white/10 text-white transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Scrollable Body */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-10">

                        {/* Summary Badges */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                                <Droplets className="w-4 h-4 text-emerald-400 mx-auto mb-2" />
                                <div className="text-[10px] text-white/40 mb-1">{language === 'EN' ? 'Pain Level' : '통증 수준'}</div>
                                <div className="text-sm font-bold text-white">{cat.avg_pain_level || '-'}</div>
                            </div>
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                                <Clock className="w-4 h-4 text-amber-400 mx-auto mb-2" />
                                <div className="text-[10px] text-white/40 mb-1">{language === 'EN' ? 'Downtime' : '다운타임'}</div>
                                <div className="text-sm font-bold text-white">{cat.avg_downtime || '-'}</div>
                            </div>
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                                <Zap className="w-4 h-4 text-violet-400 mx-auto mb-2" />
                                <div className="text-[10px] text-white/40 mb-1">{language === 'EN' ? 'Sessions' : '권장 횟수'}</div>
                                <div className="text-sm font-bold text-white">{cat.recommended_sessions || '-'}</div>
                            </div>
                        </div>

                        {/* Why This Treatment */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-cyan-400" />
                                <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-widest">
                                    Why This Treatment / {language === 'EN' ? 'Rationale' : '적합 사유'}
                                </h3>
                            </div>
                            <div className="bg-cyan-950/20 border border-cyan-500/20 rounded-2xl p-6 space-y-4">
                                <p className="text-[15px] leading-relaxed text-cyan-50">
                                    {whyText}
                                </p>
                                {overallDirectionText && (
                                    <div className="pt-4 border-t border-cyan-500/20 mt-4">
                                        <div className="text-[10px] text-cyan-400/60 uppercase tracking-widest mb-2 font-bold">Overall Clinical Context</div>
                                        <p className="text-sm leading-relaxed text-cyan-100/70">
                                            {overallDirectionText}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Recommended Devices */}
                        {devices.length > 0 && (
                            <section className="space-y-4">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    <div className="w-1 h-5 bg-cyan-500 rounded-full" />
                                    {language === 'EN' ? 'Suitable Device Options' : '적합한 디바이스 옵션'}
                                </h3>

                                <div className="space-y-3">
                                    {devices.map((device: any) => {
                                        const ev = getEvidenceBadge(device.clinical_evidence_score);
                                        const isExp = expandedDevice === device.device_id;

                                        return (
                                            <div key={device.device_id} className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden">
                                                <div
                                                    className="p-5 cursor-pointer hover:bg-white/[0.02] transition-colors flex items-center justify-between"
                                                    onClick={() => setExpandedDevice(isExp ? null : device.device_id)}
                                                >
                                                    <div className="space-y-2 flex-1 pr-4">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <h4 className="text-lg font-bold text-white">{device.device_name}</h4>
                                                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider border ${getBrandTierColor(device.brand_tier)}`}>
                                                                {device.brand_tier || 'TIER UNKNOWN'}
                                                            </span>
                                                        </div>
                                                        <div className="text-xs text-white/50">{device.primary_indication} {device.secondary_indication && `· ${device.secondary_indication}`}</div>

                                                        {/* Trend Bar */}
                                                        {device.trend_score && (
                                                            <div className="flex items-center gap-2 pt-1 max-w-[200px]">
                                                                <span className="text-[10px] text-white/30 uppercase tracking-widest">Trend</span>
                                                                <div className="h-1.5 flex-1 bg-white/10 rounded-full overflow-hidden">
                                                                    <div className="h-full bg-cyan-500" style={{ width: `${(Number(device.trend_score) / 10) * 100}%` }} />
                                                                </div>
                                                                <span className="text-[10px] font-bold text-cyan-400">{device.trend_score}/10</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex flex-col items-end gap-2 shrink-0">
                                                        <div className={`flex flex-col items-end`}>
                                                            <span className={`text-xs ${ev.color} tracking-widest`}>{ev.stars}</span>
                                                            <span className="text-[10px] text-white/40 uppercase tracking-wider">{ev.label}</span>
                                                        </div>
                                                        <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center">
                                                            {isExp ? <ChevronUp className="w-4 h-4 text-white/60" /> : <ChevronDown className="w-4 h-4 text-white/60" />}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Expanded Area */}
                                                <AnimatePresence>
                                                    {isExp && (
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: 'auto', opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            className="border-t border-white/5 bg-black/40"
                                                        >
                                                            <div className="p-5 space-y-4">
                                                                {device.signiture_technology && (
                                                                    <div>
                                                                        <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1">Signature Technology</div>
                                                                        <div className="text-sm text-cyan-300 italic font-serif" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600 }}>
                                                                            "{device.signiture_technology}"
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {device.clinical_charactor && (
                                                                    <div>
                                                                        <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1">Clinical Character</div>
                                                                        <div className="text-xs leading-relaxed text-white/70">
                                                                            {device.clinical_charactor}
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {(device.reason_why || device.reason_why_EN) && (
                                                                    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                                                                        <div className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                                                                            <ShieldCheck className="w-3 h-3" />
                                                                            AI Selection Logic
                                                                        </div>
                                                                        <div className="text-xs leading-relaxed text-white/80 border-l-2 border-cyan-500/30 pl-3">
                                                                            {language === 'EN' ? (device.reason_why_EN || device.reason_why) : (device.reason_why || device.reason_why_EN)}
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {device.evidence_basis && (
                                                                    <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-xl p-4 mt-2">
                                                                        <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                                                                            <Sparkles className="w-3 h-3" />
                                                                            {language === 'EN' ? 'Evidence Basis' : '근거 자료'}
                                                                        </div>
                                                                        <div className="text-xs leading-relaxed text-emerald-100/80 border-l-2 border-emerald-500/30 pl-3">
                                                                            {device.evidence_basis}
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {device.launch_year && (
                                                                    <div className="inline-block px-2 py-1 bg-white/5 rounded text-[10px] text-white/40 border border-white/10">
                                                                        Launched in {device.launch_year}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>
                        )}

                        {/* Recommended Boosters */}
                        {boosters.length > 0 && (
                            <section className="space-y-4">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    <div className="w-1 h-5 bg-violet-500 rounded-full" />
                                    {language === 'EN' ? 'Recommended Skin Boosters' : '조합 추천 스킨부스터'}
                                </h3>

                                <div className="space-y-3">
                                    {boosters.map((booster: any) => {
                                        const isExp = expandedBooster === booster.booster_id;

                                        return (
                                            <div key={booster.booster_id} className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden">
                                                <div
                                                    className="p-5 cursor-pointer hover:bg-white/[0.02] transition-colors flex items-center justify-between"
                                                    onClick={() => setExpandedBooster(isExp ? null : booster.booster_id)}
                                                >
                                                    <div className="space-y-2 flex-1 pr-4">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <h4 className="text-base font-bold text-white">{booster.booster_name}</h4>
                                                            {booster.canonical_role && (
                                                                <span className="px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider border bg-violet-500/20 text-violet-400 border-violet-500/30">
                                                                    {booster.canonical_role}
                                                                </span>
                                                            )}
                                                        </div>

                                                        {booster.primary_effect && (
                                                            <div className="flex items-center gap-2 text-xs text-white/60">
                                                                <span className="font-medium text-white/90">{booster.primary_effect}</span>
                                                                {booster.secondary_effect && (
                                                                    <>
                                                                        <ArrowRight className="w-3 h-3 text-white/30" />
                                                                        <span>{booster.secondary_effect}</span>
                                                                    </>
                                                                )}
                                                            </div>
                                                        )}

                                                        {booster.target_layer && (
                                                            <div className="text-[10px] text-white/40 pt-1">Target Layer: {booster.target_layer}</div>
                                                        )}
                                                    </div>

                                                    <div className="w-6 h-6 rounded-full bg-white/5 flex flex-shrink-0 items-center justify-center">
                                                        {isExp ? <ChevronUp className="w-4 h-4 text-white/60" /> : <ChevronDown className="w-4 h-4 text-white/60" />}
                                                    </div>
                                                </div>

                                                <AnimatePresence>
                                                    {isExp && (
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: 'auto', opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            className="border-t border-white/5 bg-black/40"
                                                        >
                                                            <div className="p-5 space-y-4">
                                                                {booster.key_value && (
                                                                    <div>
                                                                        <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">Key Ingredients / Value</div>
                                                                        <div className="text-xs leading-relaxed text-white/80 bg-white/5 border border-white/10 p-3 rounded-lg">
                                                                            {booster.key_value}
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {booster.product_page_url && (
                                                                    <a
                                                                        href={booster.product_page_url}
                                                                        target="_blank"
                                                                        rel="noreferrer"
                                                                        className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/15 border border-white/10 rounded-lg text-xs font-bold text-white transition-colors"
                                                                        onClick={e => e.stopPropagation()}
                                                                    >
                                                                        제품 상세 보기 <LinkIcon className="w-3 h-3" />
                                                                    </a>
                                                                )}
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Category Booster Pairing Note */}
                                {(cat.booster_pairing_note_KO || cat.booster_pairing_note_EN) && (
                                    <div className="mt-4 bg-violet-950/20 border border-violet-500/20 rounded-xl p-4">
                                        <div className="text-[10px] font-bold text-violet-400 uppercase tracking-widest mb-1">Clinical Suggestion</div>
                                        <p className="text-xs text-violet-200/80 leading-relaxed">
                                            {cat.booster_pairing_note_KO || cat.booster_pairing_note_EN}
                                        </p>
                                    </div>
                                )}
                            </section>
                        )}

                        <div className="h-8" />
                    </div>

                    {/* Footer / Copilot (Sticky Bottom) */}
                    <div className="flex-none bg-[#111116] border-t border-white/5 relative z-10 w-full rounded-b-3xl">
                        <button
                            onClick={() => setChatOpen(!chatOpen)}
                            className="w-full flex items-center justify-between px-6 py-4 text-sm font-bold text-cyan-400 hover:text-cyan-300 transition-colors"
                        >
                            <span className="flex items-center gap-2">
                                <Sparkles className="w-4 h-4" />
                                AI 전문의에게 질문하기
                            </span>
                            <ChevronUp className={`w-4 h-4 transition-transform ${chatOpen ? 'rotate-180' : ''}`} />
                        </button>

                        <AnimatePresence>
                            {chatOpen && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="px-6 pb-6 space-y-4">
                                        <div className="flex flex-wrap gap-2">
                                            {['부작용은 어떤게 있나요?', '시술 간격은 언제가 좋나요?', '화장은 언제부터 가능한가요?'].map((q, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => setChatQuestion(q)}
                                                    className="px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-white/70 transition-colors"
                                                >
                                                    {q}
                                                </button>
                                            ))}
                                        </div>

                                        <div className="flex gap-2 relative z-20">
                                            <input
                                                type="text"
                                                value={chatQuestion}
                                                onChange={e => setChatQuestion(e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && handleAskCopilot()}
                                                placeholder={'무엇이든 물어보세요...'}
                                                className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500/50"
                                            />
                                            <button
                                                onClick={handleAskCopilot}
                                                disabled={chatLoading || !chatQuestion.trim() || !runId}
                                                className="px-4 py-3 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-black font-bold rounded-xl transition-colors flex items-center justify-center min-w-[50px]"
                                            >
                                                {chatLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
                                            </button>
                                        </div>

                                        {chatAnswer && (
                                            <div className="p-4 bg-black/40 border border-cyan-500/20 rounded-xl text-sm text-white/90 leading-relaxed font-normal whitespace-pre-wrap">
                                                {chatAnswer}
                                                {chatLoading && <span className="inline-block w-1.5 h-4 bg-cyan-500 ml-1 animate-pulse rounded-sm align-middle" />}
                                            </div>
                                        )}
                                        {!runId && (
                                            <p className="text-xs text-gray-600">
                                                * 일시적으로 AI 지원을 사용할 수 없습니다
                                            </p>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
