import React from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, Zap, Layers, Beaker, CheckCircle } from 'lucide-react';
import { LanguageCode, REPORT_TRANSLATIONS } from '@/utils/translations';
import { useAuth } from '@/context/AuthContext';

interface SignatureGalleryProps {
  language: LanguageCode;
  recommendations?: any[];
  onStartAnalysis?: () => void;
  onViewDeepDive?: (rank: 1 | 2 | 3) => void;
}

// Fallback Mock Data representing high-end equipment matching
const MOCK_PROTOCOLS = [
  {
    id: 'p1',
    name: "Ultherapy + Rejuran Complete",
    description: "The ultimate non-surgical lifting combined with DNA-level skin regeneration.",
    category: "Lifting & Regeneration",
    painLevel: "High",
    downtime: "2 Days",
    devices: ["Ultherapy", "Rejuran Healer"],
    benefits: ["SMAS Layer Lifting", "Collagen Remodeling", "Skin Barrier Reconstruction"],
    gradient: "from-cyan-900 via-slate-900 to-black",
    image: "/images/protocols/ultherapy-rejuran.png" // Placeholder image path
  },
  {
    id: 'p2',
    name: "Thermage FLX + Exo-Core",
    description: "High-frequency skin tightening supercharged with Exosome stem cell technology.",
    category: "Tightening & Glow",
    painLevel: "Medium",
    downtime: "None",
    devices: ["Thermage FLX", "ASCE+ Exosomes"],
    benefits: ["Pore Reduction", "Fine Line Erasure", "Instant Radiance"],
    gradient: "from-indigo-900 via-slate-900 to-black",
    image: "/images/protocols/thermage-exo.png" // Placeholder image path
  },
  {
    id: 'p3',
    name: "PicoSure Pro + Juvelook Volume",
    description: "Precision laser toning paired with bio-stimulating volume restoration.",
    category: "Pigmentation & Volume",
    painLevel: "Low",
    downtime: "1 Day",
    devices: ["PicoSure Pro", "Juvelook"],
    benefits: ["Melasma Clearing", "Natural Volume", "Skin Texture Refinement"],
    gradient: "from-fuchsia-900/40 via-slate-900 to-black",
    image: "/images/protocols/picosure-juvelook.png" // Placeholder image path
  }
];

export default function SignatureGallery({ language, recommendations, onStartAnalysis, onViewDeepDive }: SignatureGalleryProps) {
  const { user } = useAuth();
  const t = REPORT_TRANSLATIONS[language]?.deepDive || REPORT_TRANSLATIONS['EN'].deepDive;

  const handleWhyProtocolClick = (index: number) => {
    if (user) {
      onViewDeepDive?.((index + 1) as 1 | 2 | 3);
    } else {
      onStartAnalysis?.();
    }
  };

  const protocols = recommendations?.length ? recommendations.map((r, idx) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    category: r.tags?.[0] || 'Premium Protocol',
    painLevel: r.reasonWhy?.pain_level || 'Medium',
    downtime: r.reasonWhy?.downtime_level || 'None',
    devices: r.composition || [],
    benefits: [r.reasonWhy?.why_suitable || "Optimized for your skin profile."],
    gradient: idx === 0 ? "from-cyan-900 via-slate-900 to-black" : idx === 1 ? "from-indigo-900 via-slate-900 to-black" : "from-fuchsia-900/40 via-slate-900 to-black",
    image: `/images/protocols/thermage-exo.png` // Fallback image wrapper
  })) : MOCK_PROTOCOLS;

  return (
    <section className="py-24 bg-[#050505] relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />
      <div className="absolute top-1/4 -right-1/4 w-[800px] h-[800px] bg-cyan-900/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">

        {/* Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#1F1F1F] bg-[#111111]/80 backdrop-blur-sm mb-6"
          >
            <ShieldAlert className="w-4 h-4 text-[#00F0FF]" />
            <span className="text-sm font-medium text-slate-300 tracking-wide uppercase">Elite Protocols</span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-6"
          >
            Signature <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00F0FF] to-blue-500">Masterpieces</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="max-w-2xl mx-auto text-lg text-[#888888]"
          >
            Exclusive combinations of the world's most advanced aesthetic technologies,
            prescribed only by our top-tier medical network.
          </motion.p>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {protocols.map((protocol, index) => (
            <motion.div
              key={protocol.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              className="group relative rounded-3xl overflow-hidden border border-[#1F1F1F] bg-[#111111] hover:border-[#00F0FF]/30 transition-all duration-300"
            >
              {/* Card Header Background / Image Area */}
              <div className="absolute top-0 left-0 w-full h-48 bg-gradient-to-b from-[#1F1F1F] to-[#111111] overflow-hidden">
                {/* Simulated Abstract 3D Medical Illustration */}
                <div
                  className="w-full h-full bg-cover bg-center opacity-70 mix-blend-lighten transition-transform duration-700 group-hover:scale-105"
                  style={{
                    backgroundImage: `url('${protocol.image}')`,
                    backgroundPosition: 'center',
                    backgroundSize: 'cover'
                  }}
                />

                {/* Vignette Overlay for smooth transition to text */}
                <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-[#111111] via-[#111111]/80 to-transparent" />

                <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#00F0FF] animate-pulse" />
                  <span className="text-[10px] uppercase font-mono text-[#00F0FF] tracking-widest">Logic Verified</span>
                </div>
              </div>

              {/* Spacing for the image area before text starts */}
              <div className="pt-48 relative z-10" />

              {/* Card Content */}
              <div className="p-8 relative z-10 bg-[#111111]">
                <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-[#00F0FF] transition-colors">
                  {protocol.name}
                </h3>
                <p className="text-[#888888] text-sm leading-relaxed mb-6">
                  {protocol.description}
                </p>

                {/* Device Tags */}
                <div className="flex flex-wrap gap-2 mb-8">
                  {protocol.devices.map((device: string, i: number) => (
                    <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#050505] border border-[#1F1F1F]">
                      <Zap className="w-3.5 h-3.5 text-[#00F0FF]" />
                      <span className="text-xs font-medium text-slate-300">{device}</span>
                    </div>
                  ))}
                </div>

                {/* Benefits List */}
                <ul className="space-y-3 mb-8">
                  {protocol.benefits.map((benefit: string, i: number) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle className="w-4 h-4 text-[#00F0FF]/80 mt-0.5 shrink-0" />
                      <span className="text-sm text-slate-300">{benefit}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <button
                  onClick={() => handleWhyProtocolClick(index)}
                  className="w-full py-3.5 rounded-xl border border-[#1F1F1F] bg-[#050505] text-white font-medium hover:bg-[#00F0FF] hover:text-black hover:border-[#00F0FF] transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <Layers className="w-4 h-4" />
                  {t?.whyProtocol || "Why This Protocol?"}
                </button>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
