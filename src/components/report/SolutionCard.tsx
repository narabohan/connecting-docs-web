import { Check, Zap, Award, Lock, ArrowRight } from 'lucide-react';
import { REPORT_TRANSLATIONS, LanguageCode } from '@/utils/translations';
import SkinLayerVisual from './SkinLayerVisual';

type EnergyDepth = 'epidermis' | 'dermis' | 'hypodermis' | 'smas';

interface SolutionCardProps {
    id: string;
    rank: number;
    name: string;
    matchScore: number;
    composition: string[];
    description: string;
    tags: string[];
    energyDepth?: EnergyDepth;
    isLocked?: boolean;
    language?: LanguageCode;
}

const RANK_DEPTH_MAP: Record<number, EnergyDepth> = {
    1: 'smas',
    2: 'dermis',
    3: 'epidermis',
};

export default function SolutionCard({
    id, rank, name, matchScore, composition, description, tags,
    energyDepth, isLocked = false, language = 'EN'
}: SolutionCardProps) {
    const t = REPORT_TRANSLATIONS[language]?.solutions || REPORT_TRANSLATIONS['EN'].solutions;
    const depth: EnergyDepth = energyDepth || RANK_DEPTH_MAP[rank] || 'dermis';

    if (isLocked) {
        return (
            <div className="min-w-[300px] rounded-xl p-6 relative overflow-hidden group transition-all cursor-not-allowed"
                style={{ background: 'rgba(10,10,42,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center p-6 rounded-xl"
                    style={{ backdropFilter: 'blur(8px)', background: 'rgba(10,10,42,0.7)' }}>
                    <Lock className="w-7 h-7 mb-2" style={{ color: 'rgba(0,255,255,0.4)' }} />
                    <div className="text-sm font-bold font-mono mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
                        {t.locked.title}
                    </div>
                    <div className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.25)' }}>
                        {t.locked.desc}
                    </div>
                </div>
                <div className="opacity-10 blur-sm pointer-events-none">
                    <div className="flex justify-between items-start mb-4">
                        <div className="bg-gray-800 h-4 w-8 rounded" />
                        <div className="bg-gray-800 h-4 w-12 rounded" />
                    </div>
                    <div className="bg-gray-800 h-6 w-3/4 rounded mb-2" />
                    <div className="bg-gray-800 h-4 w-full rounded mb-4" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-w-[320px] rounded-xl p-6 group relative overflow-hidden transition-all"
            style={{
                background: 'linear-gradient(135deg, rgba(10,10,42,0.9) 0%, rgba(8,20,40,0.9) 100%)',
                border: '1px solid rgba(0,255,255,0.12)',
                boxShadow: '0 0 0 0 rgba(0,255,255,0)',
                transition: 'all 0.3s ease',
            }}
            onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(0,255,255,0.35)';
                (e.currentTarget as HTMLDivElement).style.boxShadow = '0 0 24px rgba(0,255,255,0.08)';
            }}
            onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(0,255,255,0.12)';
                (e.currentTarget as HTMLDivElement).style.boxShadow = '0 0 0 0 rgba(0,255,255,0)';
            }}>

            {/* Top-right arrow */}
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowRight className="w-4 h-4 -rotate-45" style={{ color: '#00FFFF' }} />
            </div>

            {/* Rank + Match Score */}
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                    <span className="flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold font-mono"
                        style={{
                            background: 'rgba(0,255,255,0.15)',
                            border: '1px solid rgba(0,255,255,0.4)',
                            color: '#00FFFF',
                            boxShadow: '0 0 8px rgba(0,255,255,0.2)',
                        }}>
                        {rank}
                    </span>
                    <span className="text-[10px] font-mono tracking-wider" style={{ color: 'rgba(255,255,255,0.35)' }}>
                        {t.protocolId}: {id.slice(-4)}
                    </span>
                </div>
                <div className="flex items-center gap-1 px-2 py-1 rounded text-xs font-bold font-mono"
                    style={{
                        background: 'rgba(0,255,255,0.08)',
                        border: '1px solid rgba(0,255,255,0.25)',
                        color: '#00FFFF',
                    }}>
                    <Award className="w-3 h-3" />
                    {matchScore}% {t.match}
                </div>
            </div>

            {/* Name */}
            <h3 className="text-lg font-bold text-white mb-3 font-mono leading-tight group-hover:text-cyan-300 transition-colors"
                style={{ textShadow: '0 0 12px rgba(0,255,255,0)' }}>
                {name}
            </h3>

            {/* Composition chips */}
            <div className="flex flex-wrap gap-1.5 mb-4">
                {composition.map((device, i) => (
                    <span key={i} className="text-[10px] flex items-center gap-1 px-2 py-1 rounded font-mono"
                        style={{
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            color: 'rgba(255,255,255,0.6)',
                        }}>
                        <Zap className="w-2.5 h-2.5 text-yellow-400" />
                        {device}
                    </span>
                ))}
            </div>

            {/* Description */}
            <p className="text-xs leading-relaxed mb-4 line-clamp-3" style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'monospace' }}>
                {description}
            </p>

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5 mb-4">
                {tags.map((tag, i) => (
                    <span key={i} className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded font-mono"
                        style={{
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: 'rgba(255,255,255,0.35)',
                        }}>
                        {tag}
                    </span>
                ))}
            </div>

            {/* Skin Layer Visual */}
            <SkinLayerVisual energyDepth={depth} language={language} protocolName={name} />
        </div>
    );
}
