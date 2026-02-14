import { LanguageCode } from '@/utils/translations';
import Image from 'next/image';

interface FaceMannequinProps {
    primaryZones: string[];   // Cyan (#00FFFF)
    secondaryZones: string[]; // Amber (#FFBF00)
    language: LanguageCode;
}

export default function FaceMannequin({ primaryZones, secondaryZones, language }: FaceMannequinProps) {
    const renderZone = (zone: string, color: 'cyan' | 'amber') => {
        // High Visibility Neon Mode
        // Primary: Neon Cyan (#00FFFF) -> bg-cyan-400/60
        // Secondary: Neon Pink/Magenta (#FF00FF) -> bg-fuchsia-500/50 (Replacing Amber)

        const isPrimary = color === 'cyan';
        const bgClass = isPrimary
            ? 'bg-cyan-400/60 border-cyan-300/80 shadow-[0_0_30px_rgba(34,211,238,0.8)]'
            : 'bg-fuchsia-500/50 border-fuchsia-400/60 shadow-[0_0_30px_rgba(217,70,239,0.7)]';

        const position = {
            Forehead: 'top-[20%] left-1/2 -translate-x-1/2 w-1/3 h-1/6',
            Cheek: 'top-[45%] left-1/2 -translate-x-1/2 w-2/3 h-1/6',
            Jawline: 'bottom-[20%] left-1/2 -translate-x-1/2 w-1/2 h-1/6',
            EyeArea: 'top-[35%] left-1/2 -translate-x-1/2 w-3/4 h-[10%]',
            Nose: 'top-[40%] left-1/2 -translate-x-1/2 w-[10%] h-[15%]'
        }[zone] || '';

        if (!position) return null;

        return (
            <div key={`${zone}-${color}`} className={`absolute ${position} ${bgClass} blur-md rounded-full animate-pulse mix-blend-screen transition-all duration-1000`} />
        );
    };

    return (
        <div className="relative w-full aspect-square bg-[#0a0a2a] rounded-3xl border border-white/5 overflow-hidden group shadow-[0_0_50px_rgba(0,0,0,0.5)]">
            {/* Base Face Map Image */}
            <div className="absolute inset-0 opacity-90 group-hover:opacity-100 transition-opacity duration-700">
                <Image
                    src="/images/face_map_base.png" // We will move the generated image here
                    alt="Medical Face Map"
                    fill
                    className="object-cover"
                    priority
                />
            </div>

            {/* Render Zones */}
            {secondaryZones.map(z => renderZone(z, 'amber'))}
            {primaryZones.map(z => renderZone(z, 'cyan'))}

            <div className="absolute bottom-4 right-4 text-[10px] font-mono text-cyan-500 border border-cyan-500/30 px-2 py-1 rounded bg-black/50 backdrop-blur-md shadow-lg shadow-cyan-900/20">
                FACE MAP: ONLINE
            </div>
        </div>
    );
}
