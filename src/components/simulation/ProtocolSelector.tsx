'use client';
import { LanguageCode } from '@/utils/translations';

interface Protocol {
    id: string;
    rank: number;
    name: string;
    matchScore: number;
    faceZones?: string[];
    targetLayers?: string | string[];
    reasonWhy?: {
        pain_level: string;
        downtime_level: string;
    };
}

interface ProtocolSelectorProps {
    protocols: Protocol[];
    selected: number; // rank (1, 2, or 3)
    onSelect: (rank: number) => void;
    language?: LanguageCode;
}

const LABELS: Record<LanguageCode, string[]> = {
    EN: ['#1 Best Match', '#2 Alternative', '#3 Consider'],
    KO: ['#1 최적 매칭', '#2 대안 시술', '#3 검토'],
    JP: ['#1 最適', '#2 代替', '#3 検討'],
    CN: ['#1 最佳', '#2 替代', '#3 考虑'],
};

const SELECT_HINT: Record<LanguageCode, string> = {
    EN: 'Select a treatment to see its target zones',
    KO: '시술을 선택하면 타겟 부위가 표시됩니다',
    JP: '治療を選択してターゲットゾーンを表示',
    CN: '选择治疗方案以查看目标区域',
};

const MEDALS = ['🥇', '🥈', '🥉'];

export default function ProtocolSelector({ protocols, selected, onSelect, language = 'EN' }: ProtocolSelectorProps) {
    const labels = LABELS[language] || LABELS['EN'];
    const hint = SELECT_HINT[language] || SELECT_HINT['EN'];

    return (
        <div className="mb-6">
            <div className="text-[10px] font-mono tracking-[0.25em] mb-3 text-center" style={{ color: 'rgba(0,255,255,0.5)' }}>
                ◈ {hint}
            </div>
            <div className="grid grid-cols-3 gap-3">
                {protocols.slice(0, 3).map((proto, idx) => {
                    const isSelected = selected === proto.rank;
                    return (
                        <button
                            key={proto.id}
                            onClick={() => onSelect(proto.rank)}
                            className="relative rounded-xl p-4 text-left transition-all duration-300 group"
                            style={{
                                background: isSelected
                                    ? 'linear-gradient(135deg, rgba(0,255,255,0.12), rgba(0,180,255,0.08))'
                                    : 'rgba(255,255,255,0.03)',
                                border: isSelected
                                    ? '1.5px solid rgba(0,255,255,0.6)'
                                    : '1px solid rgba(255,255,255,0.08)',
                                boxShadow: isSelected ? '0 0 20px rgba(0,255,255,0.15), inset 0 0 20px rgba(0,255,255,0.03)' : 'none',
                            }}
                        >
                            {/* Active indicator */}
                            {isSelected && (
                                <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#00FFFF]" />
                            )}

                            {/* Medal + Label */}
                            <div className="flex items-center gap-1.5 mb-2">
                                <span className="text-base">{MEDALS[idx]}</span>
                                <span className="text-[9px] font-mono tracking-wider"
                                    style={{ color: isSelected ? 'rgba(0,255,255,0.9)' : 'rgba(255,255,255,0.35)' }}>
                                    {labels[idx]}
                                </span>
                            </div>

                            {/* Protocol Name */}
                            <div className="text-xs font-bold leading-tight mb-2"
                                style={{ color: isSelected ? 'white' : 'rgba(255,255,255,0.55)', fontFamily: 'monospace' }}>
                                {proto.name}
                            </div>

                            {/* Score */}
                            <div className="text-[10px] font-mono"
                                style={{ color: isSelected ? 'rgba(0,255,255,0.8)' : 'rgba(255,255,255,0.25)' }}>
                                {proto.matchScore}% Match
                            </div>

                            {/* Pain / Downtime mini badges */}
                            {proto.reasonWhy && (
                                <div className="flex gap-1 mt-2 flex-wrap">
                                    <span className="text-[8px] px-1.5 py-0.5 rounded font-mono"
                                        style={{ background: 'rgba(255,100,100,0.15)', color: 'rgba(255,150,150,0.8)', border: '1px solid rgba(255,100,100,0.2)' }}>
                                        🔥 {proto.reasonWhy.pain_level}
                                    </span>
                                    <span className="text-[8px] px-1.5 py-0.5 rounded font-mono"
                                        style={{ background: 'rgba(100,255,100,0.1)', color: 'rgba(150,255,150,0.8)', border: '1px solid rgba(100,255,100,0.2)' }}>
                                        ⏳ {proto.reasonWhy.downtime_level}
                                    </span>
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
