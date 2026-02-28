import { motion } from 'framer-motion';

export default function TheEngine() {
    const steps = [
        {
            id: "01",
            title: "Input Variables",
            desc: "Answer 8 strategic questions about your skin history, pain tolerance, and recovery goals.",
            color: "border-blue-500"
        },
        {
            id: "02",
            title: "Intelligence Processing",
            desc: "Our AI analyzes your inputs against the Clinical Judgment Graph of top 1% dermatologists.",
            color: "border-indigo-500"
        },
        {
            id: "03",
            title: "Intelligence Report",
            desc: "Receive a personalized protocol visualization showing fit, downtime, and risk factors.",
            color: "border-purple-500"
        },
        {
            id: "04",
            title: "Master Connection",
            desc: "Connect directly with the Founding Partner Doctor who designed your proprietary protocol.",
            color: "border-white"
        }
    ];

    return (
        <section className="py-24 bg-[#050505] relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-900/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="container mx-auto px-6 max-w-4xl relative z-10">
                <div className="text-center mb-20">
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">The Engine</h2>
                    <p className="text-gray-400 text-lg">How we translate your unique data into a perfect clinical match.</p>
                </div>

                <div className="relative">
                    {/* Vertical Line */}
                    <div className="absolute left-[20px] md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent md:-translate-x-1/2" />

                    <div className="space-y-16">
                        {steps.map((step, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true, margin: "-100px" }}
                                transition={{ duration: 0.5 }}
                                className={`relative flex flex-col md:flex-row gap-8 md:gap-0 items-start md:items-center ${index % 2 === 0 ? 'md:flex-row-reverse' : ''}`}
                            >
                                {/* Timeline Node */}
                                <div className="absolute left-[20px] md:left-1/2 -translate-x-1/2 w-3 h-3 bg-[#050505] border-2 border-white rounded-full z-10 mt-1.5 md:mt-0" />

                                {/* Content */}
                                <div className="ml-12 md:ml-0 md:w-1/2 md:px-12">
                                    <div className={`p-6 rounded-2xl border border-white/5 bg-[#0A0A0A] hover:bg-[#111] transition-colors group relative overflow-hidden`}>
                                        <div className={`absolute top-0 left-0 w-1 h-full ${step.color} opacity-50`} />
                                        <div className="text-4xl font-black text-white/5 mb-2 absolute right-4 top-2 select-none group-hover:text-white/10 transition-colors">{step.id}</div>
                                        <h3 className="text-xl font-bold text-white mb-2 relative z-10">{step.title}</h3>
                                        <p className="text-gray-400 text-sm relative z-10 leading-relaxed">{step.desc}</p>
                                    </div>
                                </div>

                                {/* Empty Space for alignment */}
                                <div className="hidden md:block md:w-1/2" />
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
