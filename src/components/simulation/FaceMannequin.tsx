'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LanguageCode } from '@/utils/translations';

interface FaceMannequinProps {
    primaryZones: string[];   // External selection (from survey/protocol)
    secondaryZones?: string[]; // Secondary selection (optional)
    language?: LanguageCode;
    protocolName?: string;
}

const ZONE_LABELS: Record<LanguageCode, Record<string, string>> = {
    EN: { Forehead: 'FOREHEAD', Periorbital: 'PERIORBITAL', Cheek: 'CHEEK', Jawline: 'JAWLINE', Submental: 'SUBMENTAL', Neck: 'NECK' },
    KO: { Forehead: '이마', Periorbital: '눈가', Cheek: '광대/볼', Jawline: '턱선', Submental: '이중턱/턱밑', Neck: '목' },
    JP: { Forehead: '額', Periorbital: '目元', Cheek: '頬', Jawline: 'あご線', Submental: '顎下', Neck: '首' },
    CN: { Forehead: '额头', Periorbital: '眼周', Cheek: '脸颊', Jawline: '下颌线', Submental: '下颌下', Neck: '颈部' },
};

/**
 * Precision Polygon Coordinates.
 * Forehead is updated with the exact coordinates provided by the user from the mapping tool.
 * The viewBox is set to 800x1000 to match high-res input precision.
 */
const ZONES = [
    { id: 'Forehead', points: "241,285 187,298 140,312 159,254 170,206 191,169 225,129 266,106 322,106 377,125 504,199 625,306 575,334 489,298 423,260 378,259 329,268 291,277 246,284 243,285 243,285", labelPos: { x: 380, y: 200 } },
    { id: 'Periorbital', points: "301,326 400,291 483,304 577,334 625,339 632,385 521,450 395,500 309,494 307,409 305,327 302,327 302,327", labelPos: { x: 420, y: 400 } },
    { id: 'Cheek', points: "309,494 408,491 522,454 635,392 670,464 651,537 537,620 446,653 381,654 366,600 329,569 310,496 310,496 310,496", labelPos: { x: 500, y: 550 } },
    { id: 'Jawline', points: "368,674 446,656 534,625 648,542 687,522 699,577 669,643 615,703 553,759 478,804 412,833 314,857 260,801 252,720 307,706 367,673 368,673 368,673", labelPos: { x: 550, y: 780 } },
    { id: 'Submental', points: "305,857 412,835 489,801 553,761 617,703 666,652 702,589 714,610 674,669 633,721 566,789 502,828 435,861 399,854 382,844 382,844", labelPos: { x: 500, y: 920 } },
    { id: 'Neck', points: "398,857 436,861 521,821 568,791 624,736 651,705 678,672 704,646 721,731 737,799 762,869 725,936 648,1002 581,1023 524,1024 483,1023 448,994 411,966 397,858 396,855 396,855", labelPos: { x: 580, y: 950 } },
];

export default function FaceMannequin({ primaryZones = [], secondaryZones = [], language = 'EN', protocolName }: FaceMannequinProps) {
    const [hoveredZone, setHoveredZone] = useState<string | null>(null);
    const zoneLabels = ZONE_LABELS[language] || ZONE_LABELS['EN'];

    // Define color constants
    const COLOR_CYAN = "#00F0FF";

    return (
        <div className="flex flex-col h-full bg-[#03060A] rounded-2xl border border-white/5 overflow-hidden shadow-[0_0_80px_rgba(0,240,255,0.05)_inset]">
            {/* Header */}
            <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between bg-black/40 backdrop-blur-md relative z-30">
                <div className="flex flex-col">
                    <span className="text-[10px] font-mono tracking-[0.3em] text-[#00F0FF] flex items-center gap-2 font-bold uppercase">
                        <span className="w-2 h-2 rounded-full bg-[#00F0FF] animate-pulse shadow-[0_0_8px_#00F0FF]" />
                        Anatomical Precision Scan
                    </span>
                    <span className="text-[9px] text-white/30 font-mono mt-0.5 tracking-wider">MAPPED_COORDS: ACTIVE</span>
                </div>
                {protocolName && (
                    <div className="text-right">
                        <div className="text-[10px] font-mono text-white/50 uppercase tracking-tighter italic truncate max-w-[120px]">{protocolName}</div>
                    </div>
                )}
            </div>

            {/* Analysis Interactive Area */}
            <div className="flex-1 relative flex items-center justify-center p-4 bg-[#03060A]">

                {/* Image & SVG Overlay */}
                <div className="relative w-full aspect-[818/1024] rounded-2xl overflow-hidden shadow-2xl border border-white/5 bg-black">

                    {/* The Provided Face Illustration */}
                    <img
                        src="/images/concepts/face_blueprint.png"
                        alt="Facial Analysis Base"
                        className="w-full h-full object-cover opacity-80 mix-blend-screen"
                    />

                    {/* SVG INTERACTIVE OVERLAY - ViewBox matched to high-res input */}
                    <svg
                        viewBox="0 0 818 1024"
                        className="absolute inset-0 w-full h-full cursor-crosshair z-20"
                    >
                        <defs>
                            <filter id="neonCyanGlow" x="-50%" y="-50%" width="200%" height="200%">
                                <feGaussianBlur stdDeviation="15" result="blur" />
                                <feComposite in="SourceGraphic" in2="blur" operator="over" />
                            </filter>
                        </defs>

                        {ZONES.map((zone) => {
                            const isExternalActive = primaryZones.includes(zone.id);
                            const isHovered = hoveredZone === zone.id;
                            const isActive = isExternalActive || isHovered;

                            return (
                                <g
                                    key={zone.id}
                                    onMouseEnter={() => setHoveredZone(zone.id)}
                                    onMouseLeave={() => setHoveredZone(null)}
                                    className="cursor-pointer pointer-events-auto"
                                >
                                    {/* Precision Polygon Zone */}
                                    <polygon
                                        points={zone.points}
                                        fill={isExternalActive ? "rgba(0, 240, 255, 0.2)" : (secondaryZones.includes(zone.id) ? "rgba(255, 191, 0, 0.15)" : "transparent")}
                                        stroke={isExternalActive ? "#00F0FF" : (secondaryZones.includes(zone.id) ? "#FFBF00" : "rgba(0, 240, 255, 0.05)")}
                                        strokeWidth={isActive ? "4" : "1"}
                                        filter={isActive ? "url(#neonCyanGlow)" : "none"}
                                        className="transition-all duration-300 ease-in-out"
                                        style={{
                                            strokeDasharray: isActive ? "none" : "8, 4"
                                        }}
                                    />

                                    {/* Data Labels & Markers */}
                                    <AnimatePresence>
                                        {isActive && (
                                            <motion.g
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.9 }}
                                            >
                                                {/* Label Box */}
                                                <rect
                                                    x={zone.labelPos.x - 60}
                                                    y={zone.labelPos.y - 15}
                                                    width="120"
                                                    height="30"
                                                    fill="black"
                                                    stroke="#00F0FF"
                                                    strokeWidth="1.5"
                                                    rx="4"
                                                />
                                                <text
                                                    x={zone.labelPos.x}
                                                    y={zone.labelPos.y + 6}
                                                    textAnchor="middle"
                                                    fontSize="14"
                                                    fill="white"
                                                    fontFamily="monospace"
                                                    fontWeight="bold"
                                                    className="uppercase tracking-widest"
                                                >
                                                    {zoneLabels[zone.id]}
                                                </text>
                                            </motion.g>
                                        )}
                                    </AnimatePresence>
                                </g>
                            );
                        })}
                    </svg>

                    {/* Scanning Optical Effect */}
                    <div className="absolute inset-0 pointer-events-none opacity-10 overflow-hidden">
                        <div className="w-full h-1 bg-[#00F0FF] blur-md animate-[scan_10s_linear_infinite]" />
                    </div>
                </div>
            </div>

            {/* Precision Legend */}
            <div className="px-5 py-4 bg-black/60 border-t border-white/5 backdrop-blur-lg flex items-center justify-between z-30">
                <div className="flex gap-4">
                    <div className="flex items-center gap-1.5 font-mono">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#00F0FF] shadow-[0_0_5px_#00F0FF]" />
                        <span className="text-[9px] text-white/70 uppercase tracking-widest">Target Core</span>
                    </div>
                    <div className="text-[9px] text-white/30 uppercase mono tracking-tighter">
                        {primaryZones.length > 0 ? `${primaryZones.length} Zones Targeted` : 'Standby Mode'}
                    </div>
                </div>
                <div className="text-[9px] font-mono text-[#00F0FF] animate-pulse uppercase tracking-[0.2em] font-bold">
                    Scan Active
                </div>
            </div>
        </div>
    );
}
