import { motion } from 'framer-motion';

const steps = [
    {
        title: "Input Variables",
        desc: "Answer 8 strategic questions about your skin profile, past failures, and desired outcome style.",
        number: "01"
    },
    {
        title: "Intelligence Processing",
        desc: "Our AI Clinical Translator, trained on the logic of master physicians, analyzes your inputs against the Clinical Judgment Graph.",
        number: "02"
    },
    {
        title: "Intelligence Report",
        desc: "Receive your personalized Pre-consulting Report. It visualizes your clinical fit, expected downtime, and risk factors.",
        number: "03"
    },
    {
        title: "Master Connection",
        desc: "Connect directly with the Founding Partner Doctor who owns the exact Signature Solution matched to your logic.",
        number: "04"
    },
];

export default function HowItWorks() {
    return (
        <section className="py-32 bg-slate-950 text-slate-50 relative border-t border-slate-900">
            <div className="container mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mb-20"
                >
                    <div className="flex items-center gap-4 mb-4">
                        <div className="h-px flex-1 bg-slate-800"></div>
                        <span className="text-primary font-mono text-xs tracking-[0.2em] uppercase">The Engine</span>
                        <div className="h-px flex-1 bg-slate-800"></div>
                    </div>
                    <h2 className="text-3xl md:text-5xl font-bold text-center">How It Works</h2>
                </motion.div>

                <div className="grid md:grid-cols-4 gap-8 relative">
                    {/* Connection Line (Desktop) */}
                    <div className="hidden md:block absolute top-[2.5rem] left-0 w-full h-0.5 bg-slate-800 -z-0">
                        <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary/0 via-primary to-primary/0 w-full opacity-30" />
                    </div>

                    {steps.map((s, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.2 }}
                            className="group relative z-10 flex flex-col items-center md:items-start text-center md:text-left"
                        >
                            <div className="w-20 h-20 rounded-2xl transform rotate-3 bg-slate-900 border border-slate-700 flex items-center justify-center text-2xl font-bold text-slate-600 mb-8 mx-auto md:mx-0 group-hover:rotate-0 group-hover:border-primary group-hover:text-primary group-hover:bg-slate-800 transition-all duration-500 shadow-xl">
                                {s.number}
                            </div>
                            <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">{s.title}</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">{s.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    )
}
