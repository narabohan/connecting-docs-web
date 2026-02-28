export default function TrustSignals() {
    return (
        <section className="py-24 bg-slate-900 border-t border-slate-800 relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[300px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

            <div className="container mx-auto px-6 text-center relative z-10">
                <h3 className="text-secondary font-bold uppercase tracking-[0.2em] text-xs mb-8">Exclusively for High-End Seekers</h3>

                <blockquote className="max-w-4xl mx-auto text-2xl md:text-3xl font-light leading-relaxed mb-16 text-slate-300">
                    "We are not for everyone. We are for those who value <span className="text-white font-medium border-b border-primary/50 pb-1">clinical logic</span> over discount coupons, and <span className="text-white font-medium border-b border-primary/50 pb-1">mastery</span> over marketing."
                </blockquote>

                <div className="flex flex-wrap justify-center gap-6 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
                    <div className="border border-slate-700 bg-slate-800/50 px-5 py-2.5 rounded-lg text-xs font-mono flex items-center gap-2 hover:border-slate-500 hover:text-white transition-colors cursor-default">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                        HIPAA / GDPR Compliant
                    </div>
                    <div className="border border-slate-700 bg-slate-800/50 px-5 py-2.5 rounded-lg text-xs font-mono flex items-center gap-2 hover:border-slate-500 hover:text-white transition-colors cursor-default">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                        FHIR Structure
                    </div>
                    <div className="border border-slate-700 bg-slate-800/50 px-5 py-2.5 rounded-lg text-xs font-mono flex items-center gap-2 hover:border-slate-500 hover:text-white transition-colors cursor-default">
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                        ISO 27001 Security
                    </div>
                </div>
            </div>
        </section>
    )
}
