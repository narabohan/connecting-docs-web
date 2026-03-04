'use client';
import { LanguageCode } from '@/utils/translations';

interface SpatialBlueprintProps {
    primaryZones: string[];
    activeLayers: string[];
    language?: LanguageCode;
}

const ZONE_LABELS: Record<LanguageCode, Record<string, string>> = {
    EN: { Forehead: 'FOREHEAD', Cheek: 'CHEEK', Jawline: 'JAWLINE', EyeArea: 'EYE AREA', Nose: 'NOSE', Neck: 'NECK' },
    KO: { Forehead: '이마', Cheek: '볼', Jawline: '턱선', EyeArea: '눈가', Nose: '코', Neck: '목' },
    JP: { Forehead: '額', Cheek: '頬', Jawline: 'あご', EyeArea: '目元', Nose: '鼻', Neck: '首' },
    CN: { Forehead: '额头', Cheek: '脸颊', Jawline: '下颌', EyeArea: '眼周', Nose: '鼻子', Neck: '颈部' },
};

export default function SpatialBlueprint({ primaryZones, activeLayers, language = 'EN' }: SpatialBlueprintProps) {
    const zones = ZONE_LABELS[language] || ZONE_LABELS['EN'];

    // Coordinates mapping over the specific GenAI image used.
    // Face is located on the left side (~25% X offset).
    const faceCoord: Record<string, { top: string, left: string }> = {
        Forehead: { top: '30%', left: '26%' },
        EyeArea: { top: '40%', left: '26%' },
        Nose: { top: '50%', left: '26%' },
        Cheek: { top: '60%', left: '26%' },
        Jawline: { top: '75%', left: '26%' },
        Neck: { top: '90%', left: '26%' },
    };

    // Skin Layers are located on the right side (~75% X offset).
    const layerCoord: Record<string, { top: string, left: string }> = {
        Epidermis: { top: '25%', left: '74%' },
        Dermis: { top: '45%', left: '74%' },
        SMAS: { top: '68%', left: '74%' },
        Muscle: { top: '88%', left: '74%' },
    };

    return (
        <div className="relative w-full aspect-[16/9] md:aspect-[2.2/1] bg-[#02050A] rounded-3xl overflow-hidden border border-[#00FFA0]/20 shadow-[0_0_40px_rgba(0,255,160,0.05)] group">
            {/* The single unified AI image overlay */}
            <img
                src="/images/Gemini_Generated_Image_tvx7w3tvx7w3tvx7.png"
                alt="Spatial Anatomy & Layers"
                className="absolute inset-0 w-full h-full object-cover opacity-80 mix-blend-screen transition-all duration-700 group-hover:opacity-100"
            />

            {/* Scanline effect to make it look medical/premium */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,160,0.05)_1px,transparent_1px)] bg-[size:100%_4px] pointer-events-none opacity-20" />

            {/* Absolute overlay mapping for Face Zones */}
            {primaryZones.map(zone => {
                const c = faceCoord[zone];
                if (!c) return null;
                return (
                    <div key={`face-${zone}`} className="absolute" style={{ top: c.top, left: c.left, transform: 'translate(-50%, -50%)' }}>
                        <div className="relative flex items-center justify-center">
                            {/* Cyber Ring */}
                            <div
                                className="absolute w-[180px] h-[60px] sm:w-[220px] sm:h-[70px] rounded-[50%] border-[2px] border-[#00FFA0]/80 shadow-[0_0_20px_#00FFA0] animate-[pulse_2s_ease-in-out_infinite]"
                                style={{ transform: 'rotateX(60deg)' }}
                            />
                            {/* Label inside ring */}
                            <span className="absolute -mt-6 sm:-mt-8 font-mono text-[9px] sm:text-xs font-bold text-[#00FFA0] bg-[#00FFA0]/10 px-3 py-1 rounded-full border border-[#00FFA0]/40 backdrop-blur-md shadow-lg whitespace-nowrap">
                                ◈ {zones[zone] || zone}
                            </span>
                        </div>
                    </div>
                );
            })}

            {/* Absolute overlay mapping for Skin Layers */}
            {activeLayers.map(layer => {
                const c = layerCoord[layer];
                if (!c) return null;
                return (
                    <div key={`layer-${layer}`} className="absolute z-10" style={{ top: c.top, left: c.left, transform: 'translate(-50%, -50%)' }}>
                        {/* Colored Block Highlighting the layer slice */}
                        <div className="w-[180px] h-[50px] sm:w-[240px] sm:h-[70px] bg-[#00FFA0]/20 border-l-[3px] border-[#00FFA0] shadow-[0_0_30px_rgba(0,255,160,0.3)] backdrop-blur-[2px] animate-[pulse_3.5s_ease-in-out_infinite] flex items-center justify-between px-4 -skew-y-6">
                            <span className="font-mono text-[9px] sm:text-sm font-bold text-white uppercase tracking-widest drop-shadow-lg">
                                {layer}
                            </span>
                            <span className="text-[8px] sm:text-[10px] font-black tracking-widest text-[#00FFA0] animate-pulse">
                                {language === 'KO' ? '활성' : 'ACTIVE'}
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
