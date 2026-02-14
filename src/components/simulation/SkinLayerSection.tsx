import { LanguageCode } from '@/utils/translations';
import Image from 'next/image';

interface SkinLayerSectionProps {
    activeLayers: string[];
    painLevel: number; // 1-3
    language: LanguageCode;
}

export default function SkinLayerSection({ activeLayers, painLevel, language }: SkinLayerSectionProps) {
    const isHighEnergy = painLevel === 3;

    return (
        <div className="h-full bg-[#0a0a2a] rounded-3xl border border-white/5 p-6 relative overflow-hidden flex flex-col items-center shadow-[0_0_50px_rgba(0,0,0,0.5)]">

            <h3 className="text-sm font-mono text-gray-400 uppercase tracking-widest mb-4 z-10 w-full text-center">
                TARGET DEPTH
            </h3>

            {/* 3D Skin Layer Image container */}
            <div className={`relative w-full flex-grow min-h-[300px] transition-transform duration-500 ${isHighEnergy ? 'scale-[1.02]' : ''}`}>
                <Image
                    src="/images/skin_layers_base.png" // We will move the generated image here
                    alt="Skin Layers Cross-section"
                    fill
                    className="object-contain"
                    priority
                />

                {/* Interactive Glow Overlays based on activeLayers */}
                {/* Epidermis - Cyan (Texture/Glow) */}
                {activeLayers.includes('Epidermis') && (
                    <div className="absolute top-[18%] left-[10%] w-[80%] h-[15%] bg-cyan-400/50 blur-lg animate-pulse mix-blend-screen shadow-[0_0_20px_#22d3ee]" />
                )}

                {/* Dermis - Pink/Magenta (Firmness) - High Contrast */}
                {activeLayers.includes('Dermis') && (
                    <div className="absolute top-[35%] left-[10%] w-[80%] h-[20%] bg-fuchsia-500/40 blur-lg animate-pulse mix-blend-screen shadow-[0_0_20px_#d946ef]" />
                )}

                {/* SMAS - Deep Purple (Lifting) */}
                {activeLayers.includes('SMAS') && (
                    <div className={`absolute top-[60%] left-[10%] w-[80%] h-[15%] bg-violet-600/60 blur-lg mix-blend-screen shadow-[0_0_25px_#7c3aed] ${isHighEnergy ? 'animate-ping duration-1000' : 'animate-pulse'}`} />
                )}

                {/* Muscle - Red (Deep Support) */}
                {activeLayers.includes('Muscle') && (
                    <div className="absolute bottom-[10%] left-[10%] w-[80%] h-[15%] bg-red-600/50 blur-lg animate-pulse mix-blend-screen shadow-[0_0_20px_#dc2626]" />
                )}
            </div>

            {/* Legend / Status */}
            <div className="w-full mt-4 space-y-2 z-10">
                {['Epidermis', 'Dermis', 'SMAS', 'Muscle'].map((layer) => (
                    <div key={layer} className={`flex items-center justify-between text-xs font-mono px-3 py-2 rounded border transition-colors duration-300 ${activeLayers.includes(layer)
                        ? 'bg-blue-500/10 border-blue-500/50 text-blue-300 shadow-[0_0_15px_rgba(59,130,246,0.2)]'
                        : 'bg-transparent border-white/5 text-gray-700 opacity-50'
                        }`}>
                        <span>{layer}</span>
                        <span className={`w-2 h-2 rounded-full ${activeLayers.includes(layer) ? 'bg-cyan-400 shadow-[0_0_10px_#22d3ee]' : 'bg-gray-800'}`} />
                    </div>
                ))}
            </div>
        </div>
    );
}
