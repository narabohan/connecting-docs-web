export interface TranslationStructure {
    loading: {
        title: string;
        subtitle: string;
    };
    header: {
        title: string;
        export: string;
        nav: {
            patients: string;
            doctors: string;
            pricing: string;
            login: string;
            getReport: string;
        };
    };
    radar: {
        title: string;
        overlay: string;
        axes: {
            pain: string;
            downtime: string;
            efficacy: string;
            skinFit: string;
            budget: string;
        };
    };
    logic: {
        title: string;
    };
    solutions: {
        title: string;
        subtitle: string;
        match: string;
        protocolId: string;
        locked: { title: string; desc: string; };
        upgrade: {
            title: string;
            subtitle: string;
            button: string;
        };
    };

    simulation: {
        title: string;
        subtitle: string;
        constraints: {
            pain: { title: string; options: string[] };
            downtime: { title: string; options: string[] };
            budget: { title: string; options: string[] };
        };
        radar: {
            title: string;
            lifting: string;
            firmness: string;
            texture: string;
            glow: string;
            safety: string;
        };
        save: string;
        badge: string;
        evaluation: string;
        retry: string;
        finalCall: string;
    };
    curation: {
        title: string;
        ranking: {
            rank1: { title: string; combo: string; reason: string; };
            rank2: { title: string; combo: string; reason: string; };
            rank3: { title: string; combo: string; reason: string; };
        };
        modal: {
            logicTitle: string;
            logicDesc: string;
            visualTitle: string;
            layersTitle: string;
            radarTitle: string;
            doctorTitle: string;
            doctorCta: string;
        };
    };
    risks: {
        title: string;
        safe: string;
        caution: string;
        danger: string;
    };
    landing: {
        hero: {
            badge: string;
            title: string;
            subtitle: string;
            cta: string;
            doctors: string;
            stats: { protocols: string; accuracy: string; monitoring: string; };
            toggle: { patient: string; doctor: string; };
            typing: { patient: string[]; doctor: string[] };
            dynamicTitle: { patient: { main: string; sub: string }; doctor: { main: string; sub: string } };
            dynamicDesc: { patient: string; doctor: string };
            dynamicSubDesc: { patient: string; doctor: string };
            dynamicCta: { patient: string; doctor: string };
            floatingText: string;
        };
        judgment: {
            badge: string;
            title: string;
            titleHighlight: string;
            quote: string;
            desc: string;
            cta: string;
            simulator: {
                inputTitle: string;
                outputTitle: string;
                sliders: {
                    pain: string;
                    downtime: string;
                    budget: string;
                    sessions: string;
                    speed: string;
                };
                radar: {
                    lifting: string;
                    firmness: string;
                    texture: string;
                    glow: string;
                    safety: string;
                };
            };
        };
        patients: {
            title: string;
            titleHighlight: string;
            description: string;
            cards: {
                report: { title: string; desc: string; };
                vault: { title: string; desc: string; };
                care: { title: string; desc: string; };
            };
        };
        doctors: {
            title: string;
            titleHighlight: string;
            description: string;
            subDescription?: string;
            cards: {
                upload: { title: string; desc: string; };
                match: { title: string; desc: string; };
                revenue: { title: string; desc: string; };
            };
            cta: string;
        };
        pricing: {
            title: string;
            subtitle: string;
            toggles: { patient: string; doctor: string; };
            tiers: {
                patient: {
                    free: { name: string; price: string; period: string; cta: string; features: string[]; missing: string[]; };
                    standard: { name: string; price: string; period: string; cta: string; features: string[]; missing: string[]; };
                    premium: { name: string; price: string; period: string; cta: string; features: string[]; missing: string[]; };
                };
                doctor: {
                    basic: { name: string; price: string; period: string; cta: string; features: string[]; missing: string[]; };
                    standard: { name: string; price: string; period: string; cta: string; features: string[]; missing: string[]; };
                    premium: { name: string; price: string; period: string; cta: string; features: string[]; missing: string[]; };
                    platinum: { name: string; price: string; period: string; cta: string; features: string[]; missing: string[]; };
                };
            };
            mostPopular: string;
        };
    };
    auth: {
        title: { patient: string; doctor: string; };
        subtitle: { patient: string; doctor: string; };
        toggles: { patient: string; doctor: string; };
        fields: {
            name: string;
            email: { patient: string; doctor: string; };
        };
        button: { patient: string; doctor: string; };
        footer: string;
    };
    footer: {
        tagline: string;
        compliance: { hipaa: string; iso: string; fhir: string; };
        copyright: string;
    };
    report?: {
        hero: {
            score: string;
            scoreLabel: string;
            subtitle: string;
            matrixTitle: string;
            toleranceZone: string;
            badges: { protocol: string; risk: string; logic: string };
            axes: {
                thickness: string;
                pain: string;
                downtime: string;
                pigment: string;
                aging: string;
            };
        };
        trafficLight: {
            title: string;
            danger: string;
            caution: string;
            safe: string;
            dangerSub: string;
            cautionSub: string;
            safeSub: string;
        };
        sliders: {
            title: string;
            subtitle: string;
            pain: string;
            downtime: string;
            days: string;
            painLabels: string[];
            downtimeLabels: string[];
            scoreLabel: string;
        };
        skinLayer: {
            title: string;
            epidermis: string;
            dermis: string;
            hypodermis: string;
            smas: string;
            depth: string;
        };
        modal: {
            title: string;
            subtitle: string;
            emailPlaceholder: string;
            button: string;
            verifying: string;
            success: string;
            terms: string;
            benefits: string[];
        };
        footer: {
            cta: string;
            locked: string;
        };
    };
    deepDive?: {
        badge: string;
        analyzing: string;
        analyzingDesc: string;
        targetZones: string;
        depthPenetration: string;
        efficacyProfile: string;
        whyProtocol: string;
        estimatedDowntime: string;
        painLevel: string;
        poweredBy: string;
        topSpecialists: string;
        updateProtocol: string;
        closeAnalysis: string;
        maxIntensity: string;
        collagenRemodeling: string;
        resultsDisclaimer: string;
        painOptions: string[];
        downtimeOptions: string[];
        budgetOptions: string[];
        noMatches: string;
        runningMatch: string;
    };
}

export const REPORT_TRANSLATIONS: Record<string, TranslationStructure> = {
    EN: {
        loading: {
            title: "ANALYZING CLINICAL VARIABLES...",
            subtitle: "Connecting to Global Intelligence Network"
        },
        header: {
            title: "INTELLIGENCE REPORT",
            export: "EXPORT PDF",
            nav: {
                patients: "For Patients",
                doctors: "For Doctors",
                pricing: "Pricing",
                login: "Log In",
                getReport: "Get Report"
            }
        },
        radar: {
            title: "PATIENT CLINICAL PROFILE",
            overlay: "TOLERANCE_ZONE: MATCHED",
            axes: {
                pain: "Pain Tolerance",
                downtime: "Downtime",
                efficacy: "Efficacy",
                skinFit: "Skin Fit",
                budget: "Budget"
            }
        },
        logic: {
            title: "CLINICAL LOGIC ENGINE"
        },
        solutions: {
            title: "Signature Solutions",
            subtitle: "Top matched clinical protocols based on your profile",
            match: "Match",
            protocolId: "Protocol ID",
            locked: { title: "Advanced Protocol", desc: "Unlock to view details" },
            upgrade: {
                title: "Unlock Global Matching",
                subtitle: "Get access to 500+ verified master protocols and revenue insights.",
                button: "Upgrade to Premium"
            }
        },
        simulation: {
            title: "Personalized Skin Blueprint",
            subtitle: "Simulate your optimal skin potential by adjusting constraints. We prove the 'safest best' logic for you.",
            constraints: {
                pain: {
                    title: "Pain Tolerance",
                    options: ["Low Pain & Rest", "Moderate & Balance", "High Energy & Change"]
                },
                downtime: {
                    title: "Downtime",
                    options: ["Zero", "Mild (1-3 Days)", "Intensive (5 Days+)"]
                },
                budget: {
                    title: "Budget",
                    options: ["Economy", "Standard", "Premium"]
                }
            },
            radar: {
                title: "Achievable Ideal Skin",
                lifting: "Lifting",
                firmness: "Firmness",
                texture: "Texture",
                glow: "Skin Glow",
                safety: "Safety & Integrity"
            },
            save: "Save This Blueprint",
            badge: "Glass Skin Unlocked",
            evaluation: "Does this diagnostic accurately solve your concerns?",
            retry: "Would you like to adjust pain or budget conditions to see possibilities?",
            finalCall: "Save this report as 'Best Choice' and book consultation"
        },
        curation: {
            title: "Your skin is not a testing ground. Discover your curated signature solutions.",
            ranking: {
                rank1: {
                    title: "Glass Skin Booster",
                    combo: "MNRF + Exosome",
                    reason: "Microneedling creates channels for exosomes to penetrate, while RF tightens deep tissue. A dual-layer approach for ultimate glow."
                },
                rank2: {
                    title: "InMode V-Line (Fat Killing)",
                    combo: "InMode FX + Jawline Botox",
                    reason: "High-voltage pulse permanently destroys fat cells, while RF tightens the skin. Botox relaxes the muscle for a sharp V-line."
                },
                rank3: {
                    title: "Total Skin Solution",
                    combo: "Genius + LaseMD",
                    reason: "A complete overhaul: Genius rebuilds deep collagen, while LaseMD resurfaces the epidermis. The gold standard for texture and pores."
                }
            },
            modal: {
                logicTitle: "Clinical Logic Analysis",
                logicDesc: "This solution targets the deep SMAS layer for lifting while simultaneously hydrating the dermis. The synergy creates a 'Glass Skin' effect that standalone treatments cannot achieve.",
                visualTitle: "Target Exploration",
                layersTitle: "Depth Penetration",
                radarTitle: "Projected Outcome",
                doctorTitle: "Top 3 Doctors for this Logic",
                doctorCta: "Consult with this Doctor (Send My Blueprint)"
            }
        },
        risks: {
            title: "RISK ASSESSMENT PROTOCOL",
            safe: "SAFE",
            caution: "CAUTION",
            danger: "CONTRAINDICATED"
        },
        landing: {
            hero: {
                badge: "SYSTEM GLOBAL: ONLINE",
                title: "Unlock Your Personalized K-Aesthetics Journey",
                subtitle: "AI-Driven Matching for Top 1% Doctors & Lifetime Care. Turn your clinical judgment into tradable assets.",
                cta: "Get Free Report",
                doctors: "For Doctors",
                stats: { protocols: "Protocols", accuracy: "Accuracy", monitoring: "Monitoring" },
                toggle: { patient: "I am a Patient", doctor: "I am a Doctor" },
                typing: {
                    patient: ["Scanning Your Unique Skin Variables...", "Analyzing Clinical Protocol Assets..."],
                    doctor: ["Analyzing Clinical Protocol Assets...", "Scanning Your Unique Skin Variables..."]
                },
                dynamicTitle: {
                    patient: {
                        main: "Find Your Perfect Skin Treatment in 3 Minutes",
                        sub: "Free AI Analysis & Expert Matching"
                    },
                    doctor: {
                        main: "Medical Intelligence v2.0",
                        sub: "Turn Clinical Judgment into Tradable Assets"
                    }
                },
                dynamicDesc: {
                    patient: "Experience the Triple-Linked Skin Simulation. Visualize how Pain, Downtime, and Budget shape your ideal result.",
                    doctor: "Billionaire OS v2.1 Applied. Architecting the Standard of Global Medical Aesthetics."
                },
                dynamicSubDesc: {
                    patient: "From Price Wars to Logic-Driven Choices: Empowering Top 1% Connections.",
                    doctor: "Be the Chef with Signature Courses, Not Just a Menu Seller."
                },
                dynamicCta: {
                    patient: "Get My Free Skin Report",
                    doctor: "Inquire Signature Registration"
                },
                floatingText: "Discover the 'Glass Skin' answer you didn't know existed."
            },
            judgment: {
                badge: "v2.0 SYSTEM ONLINE",
                title: "Your skin is not a testing ground.",
                titleHighlight: "Design your outcome before the treatment.",
                desc: "Exhausted by marketing hype and factory-style consultations? Don't let your face be an experiment. We analyze your clinical variables to find the 'Safe-Optimal' for you. Choose a logic-driven solution that suits your skin, not just a price tag.",
                quote: "We say the 'Honest No' to protect you. If a treatment doesn't fit your skin logic, we simply don't recommend it.",
                cta: "Start My Blueprint",
                simulator: {
                    inputTitle: "Set Your Constraints",
                    outputTitle: "Achievable Ideal Skin",
                    sliders: {
                        pain: "Pain Tolerance",
                        downtime: "Downtime",
                        budget: "Budget Range",
                        sessions: "Desired Sessions",
                        speed: "Result Speed"
                    },
                    radar: {
                        lifting: "Lifting & Contour",
                        firmness: "Firmness & Density",
                        texture: "Texture Refinement",
                        glow: "Skin Glow & Radiance",
                        safety: "Safety & Barrier"
                    }
                }
            },
            patients: {
                title: "Stop Guessing.",
                titleHighlight: "Start Designing.",
                description: "Your skin is not a guessing game. It's a biological system. We analyze your unique clinical variables to match you with the top 1% of doctors and protocols.",
                cards: {
                    report: { title: "3 Free Clinical Reports", desc: "Get a detailed analysis of your Pain Tolerance, Dismorphia Risk, and Treatment Efficacy." },
                    vault: { title: "Lifetime Data Vault", desc: "Store your treatment history, photos, and outcomes in a secure, HIPAA-compliant vault." },
                    care: { title: "Continuity of Care", desc: "We monitor your post-procedure recovery and alert you if anything needs attention." }
                }
            },
            doctors: {
                title: "Signature Logic",
                titleHighlight: "Assetization",
                description: "Tired of Repetitive Explanations? Pre-Qualified VIPs Come with Your Reports.",
                subDescription: "\"Consultation fatigue? VIP patients come ready with your report.\"",
                cards: {
                    upload: { title: "Upload Protocol Asset", desc: "Digitize your unique treatment combinations. We verify and turn them into tradable logic assets." },
                    match: { title: "Patient-Logic Match", desc: "Our RAG engine matches your logic to patient skin data. No more random walk-ins." },
                    revenue: { title: "Build VIP Fanbase", desc: "Be the Chef with Signature Courses. Patients come for *your* logic, not just lowest price." }
                },
                cta: "Apply for Access"
            },
            pricing: {
                title: "Choose Your Tier",
                subtitle: "Whether you are a patient seeking perfection or a doctor delivering it, we have a plan for you.",
                toggles: { patient: "For Patients", doctor: "For Doctors" },
                tiers: {
                    patient: {
                        free: {
                            name: "Free Guest",
                            price: "$0",
                            period: "/forever",
                            cta: "Start Free",
                            features: ["3 AI Clinical Reports", "Basic Skin Score", "Standard Matching", "Community Support"],
                            missing: ["Booking System", "Risk Analysis", "AI Pre/Post-care Chatbot"]
                        },
                        standard: {
                            name: "Standard",
                            price: "$9.90",
                            period: "/month",
                            cta: "Upgrade",
                            features: ["12 Reports/Month", "Detailed Risk Analysis", "Clinic Booking System", "Priority Matching", "Quarterly Skin Audit"],
                            missing: ["AI Pre/Post-care Chatbot", "VIP Priority Booking"]
                        },
                        premium: {
                            name: "Premium",
                            price: "$29.00",
                            period: "/month",
                            cta: "Go Premium",
                            features: ["Unlimited Reports", "VIP Priority Booking", "AI Pre/Post-care Chatbot", "1:1 Doctor Chat", "Full Risk Analysis"],
                            missing: []
                        }
                    },
                    doctor: {
                        basic: {
                            name: "Basic",
                            price: "$0",
                            period: "/forever",
                            cta: "Join Free",
                            features: ["1 Signature Solution (Basic tier)", "Profile Listing", "Standard Search Exposure"],
                            missing: ["Standard/VIP Solutions", "4-Language Localization", "Top-Tier Exposure"]
                        },
                        standard: {
                            name: "Standard",
                            price: "$299",
                            period: "/month",
                            cta: "Start Standard",
                            features: ["3 Solutions (Basic + Standard + VIP)", "4-Language Auto-Localization", "Verified Badge", "Priority Listing", "Patient Analytics"],
                            missing: ["Top-Tier Search Exposure", "Enhanced VIP Solution Detail", "Global VIP Network"]
                        },
                        premium: {
                            name: "Premium",
                            price: "$599",
                            period: "/month",
                            cta: "Go Premium",
                            features: ["5 Solutions incl. Enhanced VIP", "Top-Tier Search Exposure", "Enhanced VIP Solution Detail Page", "Dedicated Patient Concierge", "Full Demographics Analytics"],
                            missing: ["Unlimited Solutions", "Global VIP Network Membership"]
                        },
                        platinum: {
                            name: "Platinum",
                            price: "$1,499+",
                            period: "/month",
                            cta: "Contact Us",
                            features: ["Unlimited Signature Solutions", "Global VIP Continuous Care Network", "Dedicated Global Account Manager", "Custom API & White Label", "Data Licensing"],
                            missing: []
                        }
                    }
                },
                mostPopular: "Most Popular"
            }
        },
        auth: {
            title: { patient: "Start Your Journey", doctor: "Join the Network" },
            subtitle: { patient: "Get 3 Free Clinical Reports & AI Matching", doctor: "Upload Signature Solutions & Get Matched" },
            toggles: { patient: "Patient", doctor: "Doctor" },
            fields: {
                name: "Full Name",
                email: { patient: "Email Address", doctor: "Professional Email" }
            },
            button: { patient: "Get My Free Report", doctor: "Apply for Access" },
            footer: "By joining, you agree to our Privacy Policy and HIPAA Compliance terms."
        },
        footer: {
            tagline: "Exclusively for High-End Seekers. We value clinical logic over discount coupons.",
            compliance: { hipaa: "HIPAA Compliant", iso: "ISO 27001", fhir: "FHIR Standard" },
            copyright: "Connecting Docs. Architecting the Standard of Global Medical Aesthetics. Based in Seoul, Connected Globally."
        },
        report: {
            hero: {
                score: "ALIGNMENT SCORE",
                scoreLabel: "Clinical Match",
                subtitle: "Pre-Consulting Intelligence Report",
                matrixTitle: "CLINICAL PROFILE MATRIX",
                toleranceZone: "TOLERANCE_ZONE: MATCHED ✓",
                badges: { protocol: "PROTOCOL MATCH", risk: "RISK FILTERED", logic: "LOGIC VERIFIED" },
                axes: { thickness: "Skin Thickness", pain: "Pain Tolerance", downtime: "Downtime", pigment: "Pigment Risk", aging: "Aging Stage" },
            },
            trafficLight: {
                title: "RISK FILTER PROTOCOL",
                danger: "CONTRAINDICATED", caution: "PROCEED WITH CAUTION", safe: "CLEARED FOR TREATMENT",
                dangerSub: "These procedures are not recommended for your skin profile.",
                cautionSub: "These may be used under strict monitoring conditions.",
                safeSub: "Fully matched and cleared for your skin logic.",
            },
            sliders: {
                title: "WHAT-IF SIMULATOR",
                subtitle: "Adjust tolerance parameters to recalculate your optimal match.",
                pain: "Pain Tolerance", downtime: "Downtime Acceptance", days: "days",
                painLabels: ["Minimal", "Moderate", "High"],
                downtimeLabels: ["Zero", "1-3 Days", "5+ Days"],
                scoreLabel: "Projected Score",
            },
            skinLayer: {
                title: "ENERGY PENETRATION DEPTH",
                epidermis: "Epidermis", dermis: "Dermis", hypodermis: "Hypodermis", smas: "SMAS Layer", depth: "Target depth",
            },
            modal: {
                title: "Unlock Your Master Profile",
                subtitle: "Get personalized doctor recommendations + instant consultation booking.",
                emailPlaceholder: "Enter your email address",
                button: "Unlock & Book Consultation",
                verifying: "VERIFYING...",
                success: "Access Granted! Redirecting to your full profile...",
                terms: "By submitting, you agree to our Privacy Policy.",
                benefits: ["Top 3 Matched Master Doctors", "Full Clinical Risk Breakdown", "Instant Booking System", "Personalized Pre-Care Guide"],
            },
            footer: { cta: "🔒 Unlock Master Profile & Book", locked: "View full personalized recommendations" },
        },
        deepDive: {
            badge: "Curated Solution",
            analyzing: "Analyzing Protocol...",
            analyzingDesc: "Claude AI is reviewing your skin profile to build a custom protocol.",
            targetZones: "Target Zones",
            depthPenetration: "Depth Penetration",
            efficacyProfile: "Efficacy Profile",
            whyProtocol: "Why This Protocol?",
            estimatedDowntime: "Estimated Downtime",
            painLevel: "Pain Level",
            poweredBy: "Powered by Clinical Engine",
            topSpecialists: "Top Matched Specialists",
            updateProtocol: "Update Protocol",
            closeAnalysis: "Close Analysis",
            maxIntensity: "Max Intensity",
            collagenRemodeling: "Collagen Remodeling",
            resultsDisclaimer: "* Results may vary. Consultation required.",
            painOptions: ["Low (Sensitive)", "Moderate", "High (Strong)"],
            downtimeOptions: ["None (Immediate)", "Short (2-3 days)", "Long (1 week+)"],
            budgetOptions: ["Economy", "Standard", "Premium"],
            noMatches: "No direct matches found yet. Our network is expanding.",
            runningMatch: "Running Clinical Match...",
        }
    },
    KO: {
        loading: {
            title: "임상 변수 분석 중...",
            subtitle: "글로벌 인텔리전스 네트워크 연결"
        },
        header: {
            title: "인텔리전스 리포트",
            export: "PDF 내보내기",
            nav: {
                patients: "환자용",
                doctors: "의사용",
                pricing: "요금제",
                login: "로그인",
                getReport: "리포트 받기"
            }
        },
        radar: {
            title: "환자 임상 프로필",
            overlay: "허용 범위: 매칭 완료",
            axes: {
                pain: "통증 허용도",
                downtime: "회복 기간",
                efficacy: "시술 효과",
                skinFit: "피부 적합성",
                budget: "예산"
            }
        },
        logic: {
            title: "임상 로직 엔진"
        },
        solutions: {
            title: "추천 시술 솔루션",
            subtitle: "고객님의 프로필에 최적화된 상위 임상 프로토콜",
            match: "일치도",
            protocolId: "프로토콜 ID",
            locked: { title: "고급 프로토콜", desc: "잠금 해제하여 상세 보기" },
            upgrade: {
                title: "글로벌 매칭 잠금 해제",
                subtitle: "500개 이상의 검증된 마스터 프로토콜과 수익 분석 데이터에 액세스하세요.",
                button: "프리미엄 업그레이드"
            }
        },
        simulation: {
            title: "나만의 맞춤 피부 설계",
            subtitle: "제약 조건을 조절하여 당신의 최적 피부 잠재력을 실시간으로 시뮬레이션하세요. 단순히 무엇을 할지가 아니라, 당신의 조건에서 '가장 안전한 최상'이 무엇인지 증명합니다.",
            constraints: {
                pain: {
                    title: "통증 허용도",
                    options: ["저통증 & 휴식", "중등도 & 밸런스", "고강도 & 변화"]
                },
                downtime: {
                    title: "회복 기간",
                    options: ["즉시 일상 복귀", "가벼운 붓기와 붉은기 (1-3일)", "집중 회복 필요 (5일 이상)"]
                },
                budget: {
                    title: "가용 예산",
                    options: ["실속형", "표준형", "프리미엄"]
                }
            },
            radar: {
                title: "달성 가능한 이상향",
                lifting: "윤곽 (Lifting)",
                firmness: "탄력 (Firmness)",
                texture: "피부결 (Texture)",
                glow: "속광 (Glow)",
                safety: "안전성 (Safety)"
            },
            save: "설계 저장하기",
            badge: "글래스 스킨 잠금 해제",
            evaluation: "이 진단 결과가 당신의 고민을 정확히 해결했나요?",
            retry: "통증이나 예산 조건을 조정하여 다른 가능성을 확인하시겠습니까?",
            finalCall: "이 리포트를 '최적의 선택'으로 저장하고 상담 예약하기"
        },
        curation: {
            title: "피부는 실험실이 아닙니다. 당신을 위한 최적의 정답을 먼저 확인하세요.",
            ranking: {
                rank1: {
                    title: "글래스 스킨 부스터",
                    combo: "MNRF + 엑소좀",
                    reason: "미세 바늘이 엑소좀 침투 경로를 열고, 고주파가 심부 조직을 조입니다. 광채와 탄력을 동시에 잡는 듀얼 레이어 솔루션."
                },
                rank2: {
                    title: "인모드 V라인 (지방 파괴)",
                    combo: "인모드 FX + 사각턱 보톡스",
                    reason: "고전압 펄스로 지방 세포를 영구 파괴하고 고주파로 탄력을 더합니다. 보톡스로 근육을 축소해 날렵한 V라인을 완성합니다."
                },
                rank3: {
                    title: "토탈 스킨 솔루션",
                    combo: "지니어스 + 라셈드",
                    reason: "완벽한 피부 리셋: 지니어스가 깊은 콜라겐을 재생하고 라셈드가 표피를 매끄럽게 합니다. 모공과 흉터를 위한 골드 스탠다드."
                }
            },
            modal: {
                logicTitle: "임상 로직 분석",
                logicDesc: "이 솔루션은 깊은 SMAS 층을 타겟팅하여 리프팅 효과를 주면서, 동시에 진피층에 수분을 공급합니다. 단독 시술로는 얻을 수 없는 '유리알 광채' 시너지를 창출합니다.",
                visualTitle: "타겟 탐색",
                layersTitle: "침투 깊이",
                radarTitle: "예상 결과",
                doctorTitle: "이 로직을 시술하는 Top 3 의료진",
                doctorCta: "이 원장님께 상담 신청 (블루프린트 전송)"
            }
        },
        risks: {
            title: "위험성 평가 프로토콜",
            safe: "안전",
            caution: "주의",
            danger: "금기"
        },
        landing: {
            hero: {
                badge: "SYSTEM GLOBAL: 온라인",
                title: "당신만의 K-에스테틱 여정을 시작하세요",
                subtitle: "상위 1% 의사를 위한 AI 기반 매칭 및 평생 케어. 당신의 임상적 판단을 자산으로 만드세요.",
                cta: "무료 리포트 받기",
                doctors: "의사 전용",
                stats: { protocols: "프로토콜", accuracy: "정확도", monitoring: "모니터링" },
                toggle: { patient: "저는 환자입니다", doctor: "저는 의사입니다" },
                typing: {
                    patient: ["고유한 피부 변수 스캔 중...", "임상 프로토콜 자산 분석 중..."],
                    doctor: ["임상 프로토콜 자산 분석 중...", "고유한 피부 변수 스캔 중..."]
                },
                dynamicTitle: {
                    patient: {
                        main: "3분 만에 찾는 나만의 인생 피부 시술",
                        sub: "무료 AI 분석 및 전문의 매칭"
                    },
                    doctor: {
                        main: "가격 경쟁의 늪에서 벗어나",
                        sub: "원장님만의 '시그니처 솔루션'으로 독보적인 팬덤을 구축하세요"
                    }
                },
                dynamicDesc: {
                    patient: "아픈 건 싫고, 예산은 한정적이라면? 통증부터 비용까지—나의 조건에 맞춘 '최적의 시술 시나리오'를 한눈에 확인하세요.",
                    doctor: "단순한 홍보가 아닙니다. 원장님의 임상 로직을 디지털 IP로 자산화하여, 준비된 VIP 환자에게 직접 전달합니다. 시그니처 코스요리를 내는 셰프가 되어 보세요."
                },
                dynamicSubDesc: {
                    patient: "가격표에 내 얼굴을 맞추지 마세요. 데이터가 증명하는 '나만을 위한 유일한 처방'을 선택하세요. 최저가 검색 대신 의학적 확신을 드립니다.",
                    doctor: "원장님의 시술 노하우, 이제 병원 벽을 넘어 전 세계 VIP 환자를 위한 '디지털 자산'이 됩니다."
                },
                dynamicCta: {
                    patient: "나만의 인생 시술 설계하기",
                    doctor: "시그니처 자산 등록하기"
                },
                floatingText: "내 피부가 가질 수 있는 가장 투명한 빛, 당신도 몰랐던 '글래스 스킨'의 정답을 찾아보세요."
            },
            judgment: {
                badge: "v2.0 SYSTEM ONLINE",
                title: "피부는 실험실이 아닙니다.",
                titleHighlight: "시술 전, 데이터로 먼저 '피팅'해 보세요.",
                desc: "수많은 마케팅 노이즈와 3분도 안 되는 짧은 상담 시간에 지치셨나요? 커넥팅독스는 당신의 피부 두께와 리스크 수용도를 분석해 가장 안전한 '최적'을 찾아냅니다. 비싼 시술이 아닌, 당신의 피부 로직에 맞는 정답을 선택하세요.",
                quote: "우리는 당신의 안전을 위해 '정직한 No'를 말합니다. 내 피부에 맞지 않는 시술은 결코 정답이 될 수 없기 때문입니다.",
                cta: "내 피부 설계 시작하기",
                simulator: {
                    inputTitle: "나의 시술 조건 설정",
                    outputTitle: "달성 가능한 이상향",
                    sliders: {
                        pain: "통증 허용치",
                        downtime: "회복 기간",
                        budget: "예산 범위",
                        sessions: "시술 횟수",
                        speed: "효과 발현"
                    },
                    radar: {
                        lifting: "윤곽/리프팅",
                        firmness: "탄력/밀도",
                        texture: "피부결/모공",
                        glow: "속광/광채",
                        safety: "안전성/피부 보호"
                    }
                }
            },
            patients: {
                title: "추측은 그만.",
                titleHighlight: "설계를 시작하세요.",
                description: "피부는 추측 게임이 아닙니다. 생물학적 시스템입니다. 당신의 고유한 임상 변수를 분석하여 상위 1% 의료진 및 프로토콜과 매칭해 드립니다.",
                cards: {
                    report: { title: "3가지 무료 임상 리포트", desc: "통증 허용도, 신체 이형 위험도, 치료 효과에 대한 상세 분석을 받아보세요." },
                    vault: { title: "평생 데이터 금고", desc: "치료 이력, 사진, 결과를 안전한 HIPAA 준수 금고에 저장하세요." },
                    care: { title: "치료 연속성 관리", desc: "시술 후 회복 과정을 모니터링하고 주의가 필요한 경우 알림을 보내드립니다." }
                }
            },
            doctors: {
                title: "시그니처 로직",
                titleHighlight: "자산화",
                description: "반복적인 설명에 지치셨나요? 리포트를 통해 미리 검증된 VIP 환자를 만나보세요.",
                subDescription: "\"반복 설명 피로? 준비된 VIP 환자가 원장님 리포트 들고 찾아옵니다.\"",
                cards: {
                    upload: { title: "프로토콜 자산 업로드", desc: "나만의 시술 조합을 디지털화하세요. 검증을 거쳐 거래 가능한 로직 자산으로 만들어 드립니다." },
                    match: { title: "환자-로직 매칭", desc: "RAG 엔진이 환자의 피부 데이터와 원장님의 로직을 매칭합니다. 불필요한 상담은 이제 그만." },
                    revenue: { title: "VIP 팬덤 구축", desc: "시그니처 코스의 셰프가 되세요. 환자는 최저가가 아닌 당신의 '로직'을 찾아옵니다." }
                },
                cta: "접근 권한 신청"
            },
            pricing: {
                title: "요금제 선택",
                subtitle: "완벽을 추구하는 환자든, 그것을 실현하는 의사든, 우리에겐 당신을 위한 플랜이 있습니다.",
                toggles: { patient: "환자용", doctor: "의사용" },
                tiers: {
                    patient: {
                        free: {
                            name: "무료 게스트",
                            price: "₩0",
                            period: "/평생",
                            cta: "무료 시작",
                            features: ["3회 AI 임상 리포트", "기본 피부 점수", "표준 매칭", "커뮤니티 지원"],
                            missing: ["예약 시스템", "리스크 분석", "AI 케어 챗봇"]
                        },
                        standard: {
                            name: "스탠다드",
                            price: "₩13,000",
                            period: "/월",
                            cta: "업그레이드",
                            features: ["월 12회 리포트", "상세 리스크 분석", "클리닉 예약 시스템", "우선 매칭", "분기별 피부 감사"],
                            missing: ["AI 케어 챗봇", "VIP 우선 예약"]
                        },
                        premium: {
                            name: "프리미엄",
                            price: "₩39,000",
                            period: "/월",
                            cta: "프리미엄 전환",
                            features: ["무제한 리포트", "VIP 우선 예약", "AI 시술 전후 케어 챗봇", "1:1 의사 채팅", "전체 리스크 분석"],
                            missing: []
                        }
                    },
                    doctor: {
                        basic: {
                            name: "베이직",
                            price: "₩0",
                            period: "/평생",
                            cta: "무료 가입",
                            features: ["시그니처 솔루션 1건 등록 (Basic 등급)", "프로필 등록", "표준 검색 노출"],
                            missing: ["Standard/VIP 솔루션", "4개국어 자동 현지화", "최상위 노출"]
                        },
                        standard: {
                            name: "스탠다드",
                            price: "₩400,000",
                            period: "/월",
                            cta: "스탠다드 시작",
                            features: ["솔루션 3건 (Basic+Standard+VIP)", "4개국어 자동 현지화", "인증 뱃지", "우선 리스팅", "환자 분석 데이터"],
                            missing: ["최상위 검색 노출", "VIP 솔루션 강화 상세페이지", "글로벌 VIP 네트워크"]
                        },
                        premium: {
                            name: "프리미엄",
                            price: "₩800,000",
                            period: "/월",
                            cta: "프리미엄 전환",
                            features: ["솔루션 5건 (Enhanced VIP 포함)", "최상위 검색 노출", "VIP 솔루션 강화 상세페이지", "전담 환자 컨시어지", "전체 인구통계 분석"],
                            missing: ["무제한 솔루션", "글로벌 VIP 네트워크 멤버십"]
                        },
                        platinum: {
                            name: "플래티넘",
                            price: "₩2,000,000+",
                            period: "/월",
                            cta: "문의하기",
                            features: ["무제한 시그니처 솔루션", "글로벌 VIP 지속 케어 네트워크", "전담 글로벌 어카운트 매니저", "커스텀 API & 화이트 레이블", "데이터 라이선싱"],
                            missing: []
                        }
                    }
                },
                mostPopular: "인기 플랜"
            }
        },
        auth: {
            title: { patient: "여정을 시작하세요", doctor: "네트워크 가입" },
            subtitle: { patient: "3가지 무료 임상 리포트 및 AI 매칭 받기", doctor: "시그니처 솔루션 업로드 및 매칭 받기" },
            toggles: { patient: "환자", doctor: "의사" },
            fields: {
                name: "성함",
                email: { patient: "이메일 주소", doctor: "병원/업무용 이메일" }
            },
            button: { patient: "무료 리포트 확인", doctor: "가입 신청" },
            footer: "가입 시 개인정보 처리방침 및 HIPAA 규정에 동의한 것으로 간주됩니다."
        },
        footer: {
            tagline: "상위 1%를 위한 선택. 우리는 할인 쿠폰보다 임상적 로직을 가치 있게 여깁니다.",
            compliance: { hipaa: "HIPAA 준수", iso: "ISO 27001 인증", fhir: "FHIR 표준" },
            copyright: "Connecting Docs. 글로벌 메디컬 에스테틱의 기준을 설계합니다. 서울 본사, 글로벌 네트워크."
        },
        report: {
            hero: {
                score: "매칭 스코어",
                scoreLabel: "임상 매칭도",
                subtitle: "사전 상담 인텔리전스 리포트",
                matrixTitle: "임상 프로파일 매트릭스",
                toleranceZone: "허용 범위: 일치 ✓",
                badges: { protocol: "프로토콜 매칭", risk: "위험 필터 완료", logic: "로직 검증됨" },
                axes: { thickness: "피부 두께", pain: "통증 허용도", downtime: "회복 기간", pigment: "색소 위험도", aging: "노화 단계" },
            },
            trafficLight: {
                title: "위험 필터 프로토콜",
                danger: "금기", caution: "주의 필요", safe: "시술 가능",
                dangerSub: "해당 시술은 고객님의 피부 프로필에 권장되지 않습니다.",
                cautionSub: "엄격한 모니터링 하에 사용 가능합니다.",
                safeSub: "고객님의 피부 로직에 완전히 부합합니다.",
            },
            sliders: {
                title: "가상 시뮬레이터",
                subtitle: "허용 파라미터를 조정하여 최적 매칭을 재계산하세요.",
                pain: "통증 허용도", downtime: "다운타임 허용도", days: "일",
                painLabels: ["최소", "보통", "높음"],
                downtimeLabels: ["제로", "1-3일", "5일 이상"],
                scoreLabel: "예상 스코어",
            },
            skinLayer: {
                title: "에너지 침투 깊이",
                epidermis: "표피", dermis: "진피", hypodermis: "피하지방", smas: "SMAS층", depth: "목표 깊이",
            },
            modal: {
                title: "마스터 프로필 잠금 해제",
                subtitle: "맞춤형 의사 추천 + 즉시 상담 예약을 받아보세요.",
                emailPlaceholder: "이메일 주소를 입력하세요",
                button: "잠금 해제 & 상담 예약",
                verifying: "검증 중...",
                success: "액세스 승인! 전체 프로필로 리디렉션 중...",
                terms: "제출 시 개인정보 처리방침에 동의한 것으로 간주됩니다.",
                benefits: ["상위 3명 매칭 마스터 의사", "전체 임상 위험 분석", "즉시 예약 시스템", "맞춤형 사전 케어 가이드"],
            },
            footer: { cta: "🔒 마스터 프로필 잠금 해제 & 예약", locked: "맞춤형 전체 추천 보기" },
        },
        deepDive: {
            badge: "큐레이티드 솔루션",
            analyzing: "프로토콜 분석 중...",
            analyzingDesc: "AI가 고객님의 피부 프로필을 기반으로 맞춤 프로토콜을 생성하고 있습니다.",
            targetZones: "타겟 부위",
            depthPenetration: "침투 깊이",
            efficacyProfile: "효능 프로파일",
            whyProtocol: "이 프로토콜을 추천하는 이유",
            estimatedDowntime: "예상 회복 기간",
            painLevel: "통증 수준",
            poweredBy: "임상 엔진 기반",
            topSpecialists: "최적 매칭 전문의",
            updateProtocol: "프로토콜 재분석",
            closeAnalysis: "분석 닫기",
            maxIntensity: "최대 강도",
            collagenRemodeling: "콜라겐 리모델링",
            resultsDisclaimer: "* 결과는 개인에 따라 다를 수 있습니다. 상담 필요.",
            painOptions: ["저통증 (민감)", "중등도", "고강도 (강함)"],
            downtimeOptions: ["없음 (즉시 복귀)", "단기 (2-3일)", "장기 (1주 이상)"],
            budgetOptions: ["실속형", "표준형", "프리미엄"],
            noMatches: "아직 직접 매칭된 의사가 없습니다. 네트워크를 확장 중입니다.",
            runningMatch: "임상 매칭 실행 중...",
        }
    },
    JP: {
        loading: {
            title: "臨床変数を分析中...",
            subtitle: "グローバルインテリジェンスネットワークに接続"
        },
        header: {
            title: "インテリジェンスレポート",
            export: "PDFエクスポート",
            nav: {
                patients: "患者の方へ",
                doctors: "医師の方へ",
                pricing: "料金プラン",
                login: "ログイン",
                getReport: "レポート取得"
            }
        },
        radar: {
            title: "患者臨床プロファイル",
            overlay: "許容範囲: マッチング完了",
            axes: {
                pain: "痛みの許容度",
                downtime: "ダウンタイム",
                efficacy: "施術効果",
                skinFit: "肌への適合性",
                budget: "予算"
            }
        },
        logic: {
            title: "臨床ロジックエンジン"
        },
        solutions: {
            title: "推奨施術ソリューション",
            subtitle: "お客様のプロファイルに最適化されたトップ臨床プロトコル",
            match: "マッチ度",
            protocolId: "プロトコルID",
            locked: { title: "高度なプロトコル", desc: "ロック解除して詳細を表示" },
            upgrade: {
                title: "グローバルマッチングのロック解除",
                subtitle: "500以上の検証済みマスタープロトコルと収益分析データにアクセスできます。",
                button: "プレミアムにアップグレード"
            }
        },
        simulation: {
            title: "あなただけのカスタマイズ肌設計",
            subtitle: "制約条件を調整して、あなたの最適な肌の可能性をリアルタイムでシミュレーションします。単に何をするかではなく、あなたの条件で「最も安全な最善」が何であるかを証明します。",
            constraints: {
                pain: {
                    title: "痛みの許容度",
                    options: ["低刺激 & 休息", "中程度 & バランス", "高出力 & 変化"]
                },
                downtime: {
                    title: "ダウンタイム",
                    options: ["なし", "軽度 (1-3日)", "集中ケア (5日以上)"]
                },
                budget: {
                    title: "予算範囲",
                    options: ["エコノミー", "スタンダード", "プレミアム"]
                }
            },
            radar: {
                title: "達成可能な理想像",
                lifting: "輪郭",
                firmness: "弾力",
                texture: "キメ",
                glow: "内側からのツヤ",
                safety: "安全性"
            },
            save: "設計を保存",
            badge: "グラススキン解除",
            evaluation: "この診断結果はあなたの悩みを正確に解決しましたか？",
            retry: "痛みや予算の条件を調整して、他の可能性を確認しますか？",
            finalCall: "このレポートを「最適な選択」として保存し、カウンセリングを予約する"
        },
        curation: {
            title: "お肌に試行錯誤はいりません。あなたに最適化された正解を今すぐ確認。",
            ranking: {
                rank1: {
                    title: "水光ガラス肌",
                    combo: "ウルセラ + スキンブースター",
                    reason: "真皮層の再生とSMAS層の収縮の完璧な調和。"
                },
                rank2: {
                    title: "Vライン形成",
                    combo: "インモードFX + エラボトックス",
                    reason: "非侵襲的な脂肪除去と筋肉の弛緩で実現するシャープな輪郭。"
                },
                rank3: {
                    title: "毛穴・キメリセット",
                    combo: "ポテンツァ + エクソソーム",
                    reason: "フラクショナルエネルギーによる毛穴縮小と傷跡の再生。"
                }
            },
            modal: {
                logicTitle: "臨床ロジック分析",
                logicDesc: "このソリューションは、深いSMAS層をターゲットにしてリフティング効果を与えながら、同時に真皮層に水分を供給します。単独施術では得られない「水光」シナジーを生み出します。",
                visualTitle: "ターゲット探索",
                layersTitle: "浸透深度",
                radarTitle: "予想結果",
                doctorTitle: "このロジックを施術するTop 3医師",
                doctorCta: "この医師に相談する (青写真を送信)"
            }
        },
        risks: {
            title: "リスク評価プロトコル",
            safe: "安全",
            caution: "注意",
            danger: "禁忌"
        },
        landing: {
            hero: {
                badge: "システムグローバル: オンライン",
                title: "あなただけのK-エステティックの旅を解き放つ",
                subtitle: "トップ1%の医師のためのAIマッチングと生涯ケア。あなたの臨床的判断を資産に変えましょう。",
                cta: "無料レポートを取得",
                doctors: "医師専用",
                stats: { protocols: "プロトコル", accuracy: "精度", monitoring: "モニタリング" },
                toggle: { patient: "私は患者です", doctor: "私は医師です" },
                typing: {
                    patient: ["独自の肌変数をスキャン中...", "臨床プロトコル資産を分析中..."],
                    doctor: ["臨床プロトコル資産を分析中...", "独自の肌変数をスキャン中..."]
                },
                dynamicTitle: {
                    patient: {
                        main: "肌の正解を探す旅、",
                        sub: "AIと共にデザインしましょう"
                    },
                    doctor: {
                        main: "「先生のこだわり」をデジタル資産に。",
                        sub: "実力で選ばれるメディカルプラットフォーム"
                    }
                },
                dynamicDesc: {
                    patient: "「痛み・ダウンタイム・予算」3つの変数で描く、理想の肌シミュレーション。",
                    doctor: "単純な診療を超えて、あなたのロジックを求める準備された患者に出会いましょう。"
                },
                dynamicSubDesc: {
                    patient: "価格競争ではなく、ロジックに基づいた最適な選択。",
                    doctor: "メニューの売り手ではなく、シグネチャーコースを提供するシェフになりましょう。"
                },
                dynamicCta: {
                    patient: "無料肌レポートを受け取る",
                    doctor: "シグネチャー登録の問い合わせ"
                },
                floatingText: "あなたの肌が持つことのできる最も透明な光、あなたも知らなかった「グラススキン」の正解を見つけてください。"
            },
            judgment: {
                badge: "v2.0 SYSTEM ONLINE",
                title: "お肌に試行錯誤はいりません。",
                titleHighlight: "データで導き出す、あなただけの「美の設計図」。",
                desc: "SNSの噂や短すぎるカウンセリングに不安を感じていませんか？AIがあなたの肌質や予算に合わせ、「失敗しない選択」を可視化します。もう迷わない、確信に基づいた美容を。",
                quote: "「NO」と言えるのが、本当のプロフェッショナル。 あなたのリスクを避けるための、誠実な診断を提供します。",
                cta: "私の肌設計を始める",
                simulator: {
                    inputTitle: "施術条件の設定",
                    outputTitle: "達成可能な理想像",
                    sliders: {
                        pain: "痛みの許容度",
                        downtime: "ダウンタイム",
                        budget: "予算範囲",
                        sessions: "施術回数",
                        speed: "効果の現れ方"
                    },
                    radar: {
                        lifting: "輪郭・リフトアップ",
                        firmness: "弾力・密度",
                        texture: "キメ・毛穴",
                        glow: "内側からのツヤ",
                        safety: "安全性・バリア機能"
                    }
                }
            },
            patients: {
                title: "推測はやめて。",
                titleHighlight: "設計を始めましょう。",
                description: "肌は推測ゲームではありません。生物学的システムです。独自の臨床変数を分析し、トップ1%の医師やプロトコルとマッチングします。",
                cards: {
                    report: { title: "3つの無料臨床レポート", desc: "痛みの許容度、身体醜形障害リスク、治療効果に関する詳細な分析を受け取ります。" },
                    vault: { title: "生涯データ保管庫", desc: "治療履歴、写真、結果を安全なHIPAA準拠の保管庫に保存します。" },
                    care: { title: "ケアの継続性", desc: "施術後の回復過程をモニタリングし、注意が必要な場合に通知します。" }
                }
            },
            doctors: {
                title: "シグネチャーロジック",
                titleHighlight: "資産化",
                description: "繰り返しの説明に疲れましたか？レポートを通じて事前に検証されたVIP患者に出会いましょう。",
                subDescription: "「カウンセリング疲れ？VIP患者はあなたのレポートを持ってやってきます。」",
                cards: {
                    upload: { title: "プロトコル資産のアップロード", desc: "独自の治療の組み合わせをデジタル化します。検証を経て取引可能なロジック資産にします。" },
                    match: { title: "患者-ロジックマッチング", desc: "RAGエンジンが患者の肌データとあなたのロジックをマッチングします。無駄なカウンセリングはもう終わり。" },
                    revenue: { title: "VIPファンベースの構築", desc: "シグネチャーコースのシェフになりましょう。患者は最安値ではなく、あなたの「ロジック」を求めてやってきます。" }
                },
                cta: "アクセス権の申請"
            },
            pricing: {
                title: "プランの選択",
                subtitle: "完璧を求める患者であれ、それを実現する医師であれ、私たちはあなたのためのプランを用意しています。",
                toggles: { patient: "患者用", doctor: "医師用" },
                tiers: {
                    patient: {
                        free: {
                            name: "無料ゲスト",
                            price: "¥0",
                            period: "/永久",
                            cta: "無料で開始",
                            features: ["3 AI Clinical Reports", "Basic Skin Scoring", "Standard Matching", "Community Support"],
                            missing: ["Home Care Integration", "Re-Visit Tracking", "Concierge Booking"]
                        },
                        standard: {
                            name: "スタンダード",
                            price: "¥1,200",
                            period: "/月",
                            cta: "アップグレード",
                            features: ["Unlimited Reports", "Detailed Risk Analysis", "Home Care Integration", "Priority Matching", "Quarterly Skin Audit"],
                            missing: ["Concierge Booking"]
                        },
                        premium: {
                            name: "プレミアム",
                            price: "¥3,600",
                            period: "/月",
                            cta: "プレミアムへ",
                            features: ["Everything in Standard", "Concierge Booking", "VIP Clinic Access", "1:1 Doctor Chat", "Annual Genetic Test"],
                            missing: []
                        }
                    },
                    doctor: {
                        basic: {
                            name: "ベーシック",
                            price: "¥0",
                            period: "/永久",
                            cta: "無料参加",
                            features: ["シグネチャーソリューション1件登録（Basic枠）", "プロフィール掲載", "標準検索掲載"],
                            missing: ["Standard/VIPソリューション", "4言語自動ローカライズ", "最上位掲載"]
                        },
                        standard: {
                            name: "スタンダード",
                            price: "¥45,000",
                            period: "/月",
                            cta: "スタンダード開始",
                            features: ["3件ソリューション（Basic+Standard+VIP）", "4言語自動ローカライズ", "認証バッジ", "優先掲載", "患者分析データ"],
                            missing: ["最上位検索掲載", "VIPソリューション強化詳細ページ", "グローバルVIPネットワーク"]
                        },
                        premium: {
                            name: "プレミアム",
                            price: "¥90,000",
                            period: "/月",
                            cta: "プレミアムへ",
                            features: ["5件ソリューション（Enhanced VIP含む）", "最上位検索掲載", "VIPソリューション強化詳細ページ", "専任患者コンシェルジュ", "全人口統計分析"],
                            missing: ["無制限ソリューション", "グローバルVIPネットワーク"]
                        },
                        platinum: {
                            name: "プラチナ",
                            price: "¥225,000+",
                            period: "/月",
                            cta: "お問い合わせ",
                            features: ["無制限シグネチャーソリューション", "グローバルVIP継続ケアネットワーク", "専任グローバルアカウントマネージャー", "カスタムAPI & ホワイトラベル", "データライセンシング"],
                            missing: []
                        }
                    }
                },
                mostPopular: "一番人気"
            }
        },
        auth: {
            title: { patient: "旅を始めましょう", doctor: "ネットワーク参加" },
            subtitle: { patient: "3つの無料臨床レポートとAIマッチングを取得", doctor: "シグネチャーソリューションをアップロードしてマッチング" },
            toggles: { patient: "患者", doctor: "医師" },
            fields: {
                name: "氏名",
                email: { patient: "メールアドレス", doctor: "業務用メールアドレス" }
            },
            button: { patient: "無料レポートを確認", doctor: "参加申請" },
            footer: "参加することにより、プライバシーポリシーおよびHIPAAコンプライアンス規約に同意したものとみなされます。"
        },
        footer: {
            tagline: "ハイエンドな求道者のために。私たちは割引クーポンよりも臨床ロジックを重視します。",
            compliance: { hipaa: "HIPAA準拠", iso: "ISO 27001認証", fhir: "FHIR標準" },
            copyright: "Connecting Docs. グローバルメディカルエステティックの基準を構築。ソウル拠点、グローバル展開。"
        },
        report: {
            hero: {
                score: "マッチングスコア",
                scoreLabel: "臨床マッチング度",
                subtitle: "事前カウンセリング インテリジェンスレポート",
                matrixTitle: "臨床プロファイルマトリクス",
                toleranceZone: "許容ゾーン: 一致 ✓",
                badges: { protocol: "プロトコル一致", risk: "リスクフィルター完了", logic: "ロジック検証済" },
                axes: { thickness: "肌の厚み", pain: "痛みの許容度", downtime: "ダウンタイム", pigment: "色素リスク", aging: "エイジング段階" },
            },
            trafficLight: {
                title: "リスクフィルタープロトコル",
                danger: "禁忌", caution: "要注意", safe: "施術可能",
                dangerSub: "これらの施術はお客様の肌プロファイルには推奨されません。",
                cautionSub: "厳格なモニタリング条件下でのみ使用可能です。",
                safeSub: "お客様の肌ロジックに完全に適合しています。",
            },
            sliders: {
                title: "WHAT-IFシミュレーター",
                subtitle: "許容パラメータを調整して最適マッチを再計算します。",
                pain: "痛みの許容度", downtime: "ダウンタイム許容度", days: "日",
                painLabels: ["最小限", "中程度", "高め"],
                downtimeLabels: ["なし", "1-3日", "5日以上"],
                scoreLabel: "予測スコア",
            },
            skinLayer: {
                title: "エネルギー浸透深度",
                epidermis: "表皮", dermis: "真皮", hypodermis: "皮下脂肪", smas: "SMAS層", depth: "ターゲット深度",
            },
            modal: {
                title: "マスタープロファイルを解除",
                subtitle: "個別化された医師の推薦 + 即時相談予約を受け取りましょう。",
                emailPlaceholder: "メールアドレスを入力してください",
                button: "解除してカウンセリングを予約",
                verifying: "認証中...",
                success: "アクセス許可！フルプロファイルにリダイレクト中...",
                terms: "送信により、プライバシーポリシーに同意したとみなされます。",
                benefits: ["トップ3マッチング医師", "完全臨床リスク分析", "即時予約システム", "個別事前ケアガイド"],
            },
            footer: { cta: "🔒 マスタープロファイル解除＆予約", locked: "カスタマイズされた全推薦を表示" },
        },
        deepDive: {
            badge: "キュレーテッドソリューション",
            analyzing: "プロトコル分析中...",
            analyzingDesc: "AIがお客様の肌プロファイルを基にカスタムプロトコルを生成しています。",
            targetZones: "ターゲット部位",
            depthPenetration: "浸透深度",
            efficacyProfile: "有効性プロファイル",
            whyProtocol: "このプロトコルを選ぶ理由",
            estimatedDowntime: "予想ダウンタイム",
            painLevel: "痛みレベル",
            poweredBy: "臨床エンジン搭載",
            topSpecialists: "最適マッチング専門医",
            updateProtocol: "プロトコル再分析",
            closeAnalysis: "分析を閉じる",
            maxIntensity: "最大強度",
            collagenRemodeling: "コラーゲンリモデリング",
            resultsDisclaimer: "※ 結果は個人によって異なります。要カウンセリング。",
            painOptions: ["低刺激（敏感肌）", "中程度", "高出力（強め）"],
            downtimeOptions: ["なし（即日復帰）", "短期（2-3日）", "長期（1週間以上）"],
            budgetOptions: ["エコノミー", "スタンダード", "プレミアム"],
            noMatches: "現在直接マッチする医師はいません。ネットワーク拡張中です。",
            runningMatch: "臨床マッチング実行中...",
        }
    },
    CN: {
        loading: {
            title: "正在分析临床变量...",
            subtitle: "连接至全球智能网络"
        },
        header: {
            title: "智能报告",
            export: "导出PDF",
            nav: {
                patients: "患者专区",
                doctors: "医生专区",
                pricing: "价格方案",
                login: "登录",
                getReport: "获取报告"
            }
        },
        radar: {
            title: "患者临床档案",
            overlay: "耐受区域：已匹配",
            axes: {
                pain: "疼痛耐受度",
                downtime: "恢复期",
                efficacy: "治疗效果",
                skinFit: "皮肤契合度",
                budget: "预算"
            }
        },
        logic: {
            title: "临床逻辑引擎"
        },
        solutions: {
            title: "推荐治疗方案",
            subtitle: "基于您档案的最佳匹配临床方案",
            match: "匹配度",
            protocolId: "方案 ID",
            locked: { title: "高级方案", desc: "解锁查看详情" },
            upgrade: {
                title: "解锁全球匹配",
                subtitle: "访问500+经过验证的大师级方案及收益分析数据。",
                button: "升级至高级版"
            }
        },
        simulation: {
            title: "个性化皮肤设计蓝图",
            subtitle: "调整约束条件，实时模拟您的最佳皮肤潜力。不仅仅是做什么，而是证明在您的条件下什么是“最安全的最优解”。",
            constraints: {
                pain: {
                    title: "疼痛耐受度",
                    options: ["低痛感 & 休息", "适度刺激 & 平衡", "高能量 & 改变"]
                },
                downtime: {
                    title: "恢复期",
                    options: ["零恢复期", "轻微 (1-3天)", "密集恢复 (5天以上)"]
                },
                budget: {
                    title: "预算范围",
                    options: ["经济型", "标准型", "尊贵型"]
                }
            },
            radar: {
                title: "可达成的理想状态",
                lifting: "轮廓",
                firmness: "紧致",
                texture: "肤质",
                glow: "光泽",
                safety: "安全护屏"
            },
            save: "保存此设计方案",
            badge: "水光肌成就解锁",
            evaluation: "此诊断结果是否准确解决了您的困扰？",
            retry: "您想调整疼痛或预算条件以查看其他可能性吗？",
            finalCall: "将此报告保存为“最佳选择”并预约专家咨询"
        },
        curation: {
            title: "皮肤不是实验室。立即获取为您精准定制的方案。",
            ranking: {
                rank1: {
                    title: "水光玻璃肌",
                    combo: "超声刀 (Ulthera) + 水光针",
                    reason: "真皮层再生与筋膜层收缩的完美结合。"
                },
                rank2: {
                    title: "V脸轮廓",
                    combo: "InMode FX + 下颌角肉毒素",
                    reason: "非侵入式溶脂与肌肉放松，打造精致下颌线。"
                },
                rank3: {
                    title: "毛孔/痘坑重置",
                    combo: "Potenza + 外泌体",
                    reason: "点阵射频能量同时实现毛孔缩小与疤痕修复。"
                }
            },
            modal: {
                logicTitle: "临床逻辑分析",
                logicDesc: "该方案针对深层SMAS层进行提拉，同时为真皮层补充水分。这种协同效应创造了单项治疗无法实现的“水光玻璃肌”效果。",
                visualTitle: "靶点探索",
                layersTitle: "渗透深度",
                radarTitle: "预期结果",
                doctorTitle: "执行此逻辑的 Top 3 医生",
                doctorCta: "咨询此医生 (发送蓝图)"
            }
        },
        risks: {
            title: "风险评估协议",
            safe: "安全",
            caution: "注意",
            danger: "禁忌"
        },
        landing: {
            hero: {
                badge: "系统全球：在线",
                title: "开启您的个性化K-医美之旅",
                subtitle: "专为前1%医生打造的AI匹配及终身护理。将您的临床判断转化为可交易资产。",
                cta: "获取免费报告",
                doctors: "医生专用",
                stats: { protocols: "方案", accuracy: "准确率", monitoring: "监控" },
                toggle: { patient: "我是患者", doctor: "我是医生" },
                typing: {
                    patient: ["正在扫描您独特的皮肤变量...", "正在分析临床方案资产..."],
                    doctor: ["正在分析临床方案资产...", "正在扫描您独特的皮肤变量..."]
                },
                dynamicTitle: {
                    patient: {
                        main: "拒绝盲从，开启“私享皮肤设计”",
                        sub: "AI为您精准匹配全球前1%的招牌方案"
                    },
                    doctor: {
                        main: "让医生的临床经验成为“数字资产”",
                        sub: "告别价格战，用专业逻辑筛选全球顶级VIP"
                    }
                },
                dynamicDesc: {
                    patient: "疼痛、恢复期、预算——三重维度实时模拟，预见您的理想肌肤。",
                    doctor: "咨询疲劳？将您的专有技术转化为吸引VIP患者的资产。"
                },
                dynamicSubDesc: {
                    patient: "从价格战到逻辑驱动的选择：赋能前1%的连接。",
                    doctor: "成为拥有签名课程的主厨，而不仅仅是菜单推销员。"
                },
                dynamicCta: {
                    patient: "获取我的免费皮肤报告",
                    doctor: "咨询签名注册"
                },
                floatingText: "发现您未曾知晓的“水光肌”答案。"
            },
            judgment: {
                badge: "v2.0 SYSTEM ONLINE",
                title: "您的皮肤不是试验场。",
                titleHighlight: "治疗前，先用数据进行‘预演’。",
                desc: "厌倦了营销噱头和流水线式咨询？不要拿自己的脸做实验。我们分析您的临床变量，为您找到‘安全且最优’的方案。选择符合您皮肤逻辑的方案，而不仅仅是看价格。",
                quote: "为了您的安全，我们会诚实地说‘不’。如果方案不符合您的皮肤逻辑，我们绝不推荐。",
                cta: "开始我的皮肤设计",
                simulator: {
                    inputTitle: "设定您的治疗条件",
                    outputTitle: "可达成的理想状态",
                    sliders: {
                        pain: "疼痛耐受度",
                        downtime: "恢复期",
                        budget: "预算范围",
                        sessions: "期望疗程次数",
                        speed: "见效速度"
                    },
                    radar: {
                        lifting: "轮廓提拉",
                        firmness: "紧致密度",
                        texture: "肤质毛孔",
                        glow: "焕采光泽",
                        safety: "安全护屏"
                    }
                }
            },
            patients: {
                title: "停止猜测。",
                titleHighlight: "开始设计。",
                description: "皮肤不是猜谜游戏。它是一个生物系统。我们分析您独特的临床变量，为您匹配前1%的医生和方案。",
                cards: {
                    report: { title: "3份免费临床报告", desc: "获取关于疼痛耐受度、容貌焦虑风险和治疗效果的详细分析。" },
                    vault: { title: "终身数据宝库", desc: "将您的治疗历史、照片和结果存储在符合HIPAA标准的安全宝库中。" },
                    care: { title: "护理连续性", desc: "我们监控您的术后恢复过程，并在需要注意时提醒您。" }
                }
            },
            doctors: {
                title: "签名逻辑",
                titleHighlight: "资产化",
                description: "厌倦了重复解释？预审过的VIP带着您的报告而来。",
                subDescription: "“咨询疲劳？VIP患者带着您的报告准备好了。”",
                cards: {
                    upload: { title: "上传方案资产", desc: "将您独特的治疗组合数字化。我们进行验证并将其转化为可交易的逻辑资产。" },
                    match: { title: "患者-逻辑匹配", desc: "我们的RAG引擎将您的逻辑与患者皮肤数据匹配。不再有随意的上门客。" },
                    revenue: { title: "建立VIP粉丝群", desc: "成为拥有签名课程的主厨。患者是为了*您的*逻辑而来，而不仅仅是最低价格。" }
                },
                cta: "申请访问"
            },
            pricing: {
                title: "选择您的方案",
                subtitle: "无论您是追求完美的患者，还是实现完美的医生，我们要为您准备了计划。",
                mostPopular: "最受欢迎",
                toggles: { patient: "患者", doctor: "医生" },
                tiers: {
                    patient: {
                        free: {
                            name: "免费访客",
                            price: "¥0",
                            period: "/永久",
                            cta: "免费开始",
                            features: ["3 AI Clinical Reports", "Basic Skin Scoring", "Standard Matching", "Community Support"],
                            missing: ["Home Care Integration", "Re-Visit Tracking", "Concierge Booking"]
                        },
                        standard: {
                            name: "标准版",
                            price: "¥70",
                            period: "/月",
                            cta: "升级",
                            features: ["Unlimited Reports", "Detailed Risk Analysis", "Home Care Integration", "Priority Matching", "Quarterly Skin Audit"],
                            missing: ["Concierge Booking"]
                        },
                        premium: {
                            name: "高级版",
                            price: "¥200",
                            period: "/月",
                            cta: "转高级版",
                            features: ["Everything in Standard", "Concierge Booking", "VIP Clinic Access", "1:1 Doctor Chat", "Annual Genetic Test"],
                            missing: []
                        }
                    },
                    doctor: {
                        basic: {
                            name: "基础版",
                            price: "¥0",
                            period: "/永久",
                            cta: "免费加入",
                            features: ["注册1个标志性方案（基础档）", "个人资料展示", "标准搜索曝光"],
                            missing: ["Standard/VIP方案", "四语言自动本地化", "顶级曝光"]
                        },
                        standard: {
                            name: "标准版",
                            price: "¥2,100",
                            period: "/月",
                            cta: "开始标准版",
                            features: ["3个方案（Basic+Standard+VIP）", "四语言自动本地化", "认证徽章", "优先列表", "患者分析数据"],
                            missing: ["顶级搜索曝光", "VIP方案强化详情页", "全球VIP网络"]
                        },
                        premium: {
                            name: "高级版",
                            price: "¥4,200",
                            period: "/月",
                            cta: "升级高级版",
                            features: ["5个方案（含Enhanced VIP）", "顶级搜索曝光", "VIP方案强化详情页", "专属患者礼宾服务", "全人口统计分析"],
                            missing: ["无限方案", "全球VIP网络会员"]
                        },
                        platinum: {
                            name: "白金版",
                            price: "¥10,500+",
                            period: "/月",
                            cta: "联系我们",
                            features: ["无限标志性方案", "全球VIP持续护理网络", "专属全球客户经理", "定制API & 白标", "数据授权"],
                            missing: []
                        }
                    }
                }
            }
        },
        auth: {
            title: { patient: "开始您的旅程", doctor: "加入网络" },
            subtitle: { patient: "获取3份免费临床报告及AI匹配", doctor: "上传签名解决方案并获得匹配" },
            toggles: { patient: "患者", doctor: "医生" },
            fields: {
                name: "姓名",
                email: { patient: "电子邮件地址", doctor: "工作电子邮件" }
            },
            button: { patient: "获取免费报告", doctor: "申请访问" },
            footer: "加入即表示您同意我们的隐私政策和HIPAA合规条款。"
        },
        footer: {
            tagline: "专为高端追求者打造。我们重视临床逻辑胜过折扣券。",
            compliance: { hipaa: "符合HIPAA", iso: "ISO 27001认证", fhir: "FHIR标准" },
            copyright: "Connecting Docs. 构建全球医美标准。总部位于首尔，连接全球。"
        },
        report: {
            hero: {
                score: "匹配分数",
                scoreLabel: "临床匹配度",
                subtitle: "预咨询智能报告",
                matrixTitle: "临床档案矩阵",
                toleranceZone: "耐受区间: 匹配 ✓",
                badges: { protocol: "协议匹配", risk: "风险过滤完成", logic: "逻辑已验证" },
                axes: { thickness: "皮肤厚度", pain: "疼痛耐受度", downtime: "恢复时间", pigment: "色素风险", aging: "老化阶段" },
            },
            trafficLight: {
                title: "风险过滤协议",
                danger: "禁忌", caution: "需谨慎", safe: "可进行手术",
                dangerSub: "这些治疗方法不适合您的皮肤档案。",
                cautionSub: "在严格监测条件下可使用。",
                safeSub: "完全匹配您的皮肤逻辑，已清除。",
            },
            sliders: {
                title: "假设模拟器",
                subtitle: "调整耐受参数以重新计算最优匹配。",
                pain: "疼痛耐受度", downtime: "停工期接受度", days: "天",
                painLabels: ["最小", "适中", "较高"],
                downtimeLabels: ["零", "1-3天", "5天以上"],
                scoreLabel: "预测分数",
            },
            skinLayer: {
                title: "能量穿透深度",
                epidermis: "表皮", dermis: "真皮", hypodermis: "皮下组织", smas: "SMAS层", depth: "目标深度",
            },
            modal: {
                title: "解锁您的主档案",
                subtitle: "获取个性化医生推荐 + 即时预约咨询。",
                emailPlaceholder: "请输入您的电子邮件地址",
                button: "解锁并预约咨询",
                verifying: "验证中...",
                success: "访问已批准！正在跳转至完整档案...",
                terms: "提交即表示您同意我们的隐私政策。",
                benefits: ["匹配前3名主治医师", "完整临床风险分析", "即时预约系统", "个性化术前护理指南"],
            },
            footer: { cta: "🔒 解锁主档案并预约", locked: "查看完整个性化推荐" },
        },
        deepDive: {
            badge: "精选方案",
            analyzing: "正在分析方案...",
            analyzingDesc: "AI正在根据您的皮肤档案生成定制方案。",
            targetZones: "目标区域",
            depthPenetration: "渗透深度",
            efficacyProfile: "功效档案",
            whyProtocol: "为何推荐此方案？",
            estimatedDowntime: "预计恢复期",
            painLevel: "疼痛程度",
            poweredBy: "由临床引擎提供支持",
            topSpecialists: "最优匹配专家",
            updateProtocol: "更新方案",
            closeAnalysis: "关闭分析",
            maxIntensity: "最大强度",
            collagenRemodeling: "胶原重塑",
            resultsDisclaimer: "* 效果因人而异。需要专业咨询。",
            painOptions: ["低痛感（敏感）", "适中", "高能量（强效）"],
            downtimeOptions: ["无恢复期（即刻复工）", "短期（2-3天）", "长期（1周以上）"],
            budgetOptions: ["经济型", "标准型", "尊贵型"],
            noMatches: "暂时没有直接匹配的医生。我们正在扩展网络。",
            runningMatch: "正在运行临床匹配...",
        }
    }
};

export type LanguageCode = keyof typeof REPORT_TRANSLATIONS;
