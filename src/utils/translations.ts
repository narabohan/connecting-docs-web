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
        };
        judgment: {
            badge: string;
            title: string;
            titleHighlight: string;
            quote: string;
            desc: string;
            quoteKorean: string;
            cards: {
                filter: { title: string; desc: string; };
                safe: { title: string; desc: string; };
            };
            mock: {
                title: string;
                level: string;
                label: string;
                excluded: string;
            }
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
                    partner: { name: string; price: string; period: string; cta: string; features: string[]; missing: string[]; };
                    enterprise: { name: string; price: string; period: string; cta: string; features: string[]; missing: string[]; };
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
                        main: "Tired of Skin Trial & Error?",
                        sub: "Discover Your AI-Powered Signature Treatment"
                    },
                    doctor: {
                        main: "Stop Repeating Consults",
                        sub: "Turn Your Expertise into a VIP Patient Magnet"
                    }
                },
                dynamicDesc: {
                    patient: "Skin fatigue? AI finds your safe 'Signature Treatment' – Personalized, Global Connection.",
                    doctor: "Consultation fatigue? Turn your know-how into assets that attract VIP patients."
                },
                dynamicSubDesc: {
                    patient: "From Price Wars to Logic-Driven Choices: Empowering Top 1% Connections.",
                    doctor: "Be the Chef with Signature Courses, Not Just a Menu Seller."
                },
                dynamicCta: {
                    patient: "Get My Free Skin Report",
                    doctor: "Inquire Signature Registration"
                }
            },
            judgment: {
                badge: "JUDGMENT LAYER ACTIVE",
                title: "We Start with",
                titleHighlight: "What NOT to Do.",
                quote: "Why trust a \"Yes\" if they never say \"No\"?",
                desc: "Before matching you with any treatment, our AI analyzes your pain tolerance, downtime constraints, and skin risk factors to filter out unsafe options first.",
                quoteKorean: "\"We filter out what you shouldn't do first – Pain tolerance, risk distortion, efficacy analysis.\"",
                cards: {
                    filter: { title: "Contraindicated Procedures Filtered", desc: "Example: High-energy RF excluded for thin skin types." },
                    safe: { title: "Safe-Zone Optimization", desc: "Only protocols matching your safety profile are ranked." }
                },
                mock: {
                    title: "Risk Assessment",
                    level: "High",
                    label: "Downtime Risk",
                    excluded: "🚫 EXCLUDED OPTIONS"
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
                            features: ["3 AI Clinical Reports", "Basic Skin Scoring", "Standard Matching", "Community Support"],
                            missing: ["Home Care Integration", "Re-Visit Tracking", "Concierge Booking"]
                        },
                        standard: {
                            name: "Standard",
                            price: "$9.99",
                            period: "/month",
                            cta: "Upgrade",
                            features: ["Unlimited Reports", "Detailed Risk Analysis", "Home Care Integration", "Priority Matching", "Quarterly Skin Audit"],
                            missing: ["Concierge Booking"]
                        },
                        premium: {
                            name: "Premium",
                            price: "$29.99",
                            period: "/month",
                            cta: "Go Premium",
                            features: ["Everything in Standard", "Concierge Booking", "VIP Clinic Access", "1:1 Doctor Chat", "Annual Genetic Test"],
                            missing: []
                        }
                    },
                    doctor: {
                        basic: {
                            name: "Basic",
                            price: "Free",
                            period: "",
                            cta: "Join Network",
                            features: ["List Profile", "Upload 1 Signature Solution", "5 Leads / Month"],
                            missing: ["Unlimited Matching", "Dev Support", "Data Licensing"]
                        },
                        partner: {
                            name: "Partner",
                            price: "$199",
                            period: "/month",
                            cta: "Partner Up",
                            features: ["Unlimited Matching", "Upload 5 Solutions", "Dev Support", "Verified Badge", "Priority Listing"],
                            missing: ["Reasoning OS Access", "Data Licensing"]
                        },
                        enterprise: {
                            name: "Enterprise",
                            price: "$499",
                            period: "/month",
                            cta: "Contact Sales",
                            features: ["Everything in Partner", "Reasoning OS Access", "Data Licensing", "Custom API Access", "White Label Reports"],
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
        risks: {
            title: "위험성 평가 프로토콜",
            safe: "안전",
            caution: "주의",
            danger: "금기"
        },
        landing: {
            hero: {
                badge: "시스템 글로벌: 온라인",
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
                        main: "피부과 시행착오, 지치셨나요?",
                        sub: "AI가 찾아주는 '나만의 시그니처 시술'"
                    },
                    doctor: {
                        main: "반복되는 상담, 지치셨나요?",
                        sub: "당신의 노하우를 VIP 환자를 부르는 자산으로 만드세요"
                    }
                },
                dynamicDesc: {
                    patient: "피부 실험은 그만. AI가 안전하고 검증된 솔루션만 매칭해드립니다.",
                    doctor: "단순 진료를 넘어, 당신의 로직을 찾는 준비된 환자를 만나세요."
                },
                dynamicSubDesc: {
                    patient: "최저가 경쟁이 아닌, 로직 기반의 최적의 선택.",
                    doctor: "메뉴판 판매자가 아닌, 시그니처 코스를 제공하는 셰프가 되세요."
                },
                dynamicCta: {
                    patient: "무료 피부 리포트 받기",
                    doctor: "시그니처 등록 문의"
                }
            },
            judgment: {
                badge: "판단 레이어 활성화",
                title: "우리는 먼저",
                titleHighlight: "하지 말아야 할 것을 거릅니다.",
                quote: "\"No\"라고 말하지 않는 \"Yes\"를 믿을 수 있나요?",
                desc: "치료를 매칭하기 전, 통증 허용도, 다운타임, 피부 위험 요소를 분석하여 안전하지 않은 옵션부터 필터링합니다.",
                quoteKorean: "\"위험 요소를 먼저 제거합니다 – 통증, 왜곡 위험, 효율성 분석.\"",
                cards: {
                    filter: { title: "금기 시술 필터링", desc: "예: 얇은 피부 타입에 고에너지 RF 제외." },
                    safe: { title: "안전 구간 최적화", desc: "안전 프로필에 부합하는 프로토콜만 순위가 매겨집니다." }
                },
                mock: {
                    title: "위험 평가",
                    level: "높음",
                    label: "다운타임 위험",
                    excluded: "🚫 제외된 옵션"
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
                            features: ["3 AI Clinical Reports", "Basic Skin Scoring", "Standard Matching", "Community Support"],
                            missing: ["Home Care Integration", "Re-Visit Tracking", "Concierge Booking"]
                        },
                        standard: {
                            name: "스탠다드",
                            price: "₩12,000",
                            period: "/월",
                            cta: "업그레이드",
                            features: ["Unlimited Reports", "Detailed Risk Analysis", "Home Care Integration", "Priority Matching", "Quarterly Skin Audit"],
                            missing: ["Concierge Booking"]
                        },
                        premium: {
                            name: "프리미엄",
                            price: "₩36,000",
                            period: "/월",
                            cta: "프리미엄 전환",
                            features: ["Everything in Standard", "Concierge Booking", "VIP Clinic Access", "1:1 Doctor Chat", "Annual Genetic Test"],
                            missing: []
                        }
                    },
                    doctor: {
                        basic: {
                            name: "베이직",
                            price: "무료",
                            period: "",
                            cta: "네트워크 가입",
                            features: ["List Profile", "Upload 1 Signature Solution", "5 Leads / Month"],
                            missing: ["Unlimited Matching", "Dev Support", "Data Licensing"]
                        },
                        partner: {
                            name: "파트너",
                            price: "₩250,000",
                            period: "/월",
                            cta: "파트너 신청",
                            features: ["Unlimited Matching", "Upload 5 Solutions", "Dev Support", "Verified Badge", "Priority Listing"],
                            missing: ["Reasoning OS Access", "Data Licensing"]
                        },
                        enterprise: {
                            name: "엔터프라이즈",
                            price: "₩600,000",
                            period: "/월",
                            cta: "영업팀 문의",
                            features: ["Everything in Partner", "Reasoning OS Access", "Data Licensing", "Custom API Access", "White Label Reports"],
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
                        main: "肌の試行錯誤に疲れましたか？",
                        sub: "AIが見つける「あなただけのシグネチャー施術」"
                    },
                    doctor: {
                        main: "繰り返しのカウンセリングに疲れましたか？",
                        sub: "あなたのノウハウをVIP患者を引き付ける資産に変えましょう"
                    }
                },
                dynamicDesc: {
                    patient: "肌の実験はもう終わり。AIが安全で検証済みのソリューションだけをマッチングします。",
                    doctor: "単純な診療を超えて、あなたのロジックを求める準備された患者に出会いましょう。"
                },
                dynamicSubDesc: {
                    patient: "価格競争ではなく、ロジックに基づいた最適な選択。",
                    doctor: "メニューの売り手ではなく、シグネチャーコースを提供するシェフになりましょう。"
                },
                dynamicCta: {
                    patient: "無料肌レポートを受け取る",
                    doctor: "シグネチャー登録の問い合わせ"
                }
            },
            judgment: {
                badge: "判断レイヤーアクティブ",
                title: "私たちはまず",
                titleHighlight: "すべきでないことを除外します。",
                quote: "「No」と言わない「Yes」を信じられますか？",
                desc: "治療をマッチングする前に、AIは痛みの許容度、ダウンタイムの制約、肌のリスク要因を分析し、安全でないオプションを最初に除外します。",
                quoteKorean: "「リスク要因を最初に除去します – 痛み、リスクの歪み、効率性分析。」",
                cards: {
                    filter: { title: "禁忌施術のフィルタリング", desc: "例：薄い肌タイプには高エネルギーRFを除外。" },
                    safe: { title: "安全ゾーンの最適化", desc: "安全プロファイルに一致するプロトコルのみがランク付けされます。" }
                },
                mock: {
                    title: "リスク評価",
                    level: "高",
                    label: "ダウンタイムリスク",
                    excluded: "🚫 除外されたオプション"
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
                            price: "無料",
                            period: "",
                            cta: "ネットワーク参加",
                            features: ["List Profile", "Upload 1 Signature Solution", "5 Leads / Month"],
                            missing: ["Unlimited Matching", "Dev Support", "Data Licensing"]
                        },
                        partner: {
                            name: "パートナー",
                            price: "¥25,000",
                            period: "/月",
                            cta: "パートナー申請",
                            features: ["Unlimited Matching", "Upload 5 Solutions", "Dev Support", "Verified Badge", "Priority Listing"],
                            missing: ["Reasoning OS Access", "Data Licensing"]
                        },
                        enterprise: {
                            name: "エンタープライズ",
                            price: "¥60,000",
                            period: "/月",
                            cta: "営業に問い合わせ",
                            features: ["Everything in Partner", "Reasoning OS Access", "Data Licensing", "Custom API Access", "White Label Reports"],
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
                        main: "厌倦了皮肤试错？",
                        sub: "发现AI驱动的“专属签名治疗”"
                    },
                    doctor: {
                        main: "不想再重复咨询？",
                        sub: "将您的专业知识转化为吸引VIP患者的磁铁"
                    }
                },
                dynamicDesc: {
                    patient: "皮肤疲劳？AI为您通过个性化和全球连接找到安全的“签名治疗”。",
                    doctor: "咨询疲劳？将您的专有技术转化为吸引VIP患者的资产。"
                },
                dynamicSubDesc: {
                    patient: "从价格战到逻辑驱动的选择：赋能前1%的连接。",
                    doctor: "成为拥有签名课程的主厨，而不仅仅是菜单推销员。"
                },
                dynamicCta: {
                    patient: "获取我的免费皮肤报告",
                    doctor: "咨询签名注册"
                }
            },
            judgment: {
                badge: "判断层已激活",
                title: "我们先从",
                titleHighlight: "不该做什么开始。",
                quote: "如果他们从不说“不”，你为什么要相信“是”？",
                desc: "在为您匹配任何治疗之前，我们的AI会分析您的疼痛耐受度、恢复期限制和皮肤风险因素，首先过滤掉不安全的选项。",
                quoteKorean: "“我们首先过滤掉您不应该做的事情——痛觉耐受度、风险扭曲、疗效分析。”",
                cards: {
                    filter: { title: "已过滤的禁忌手术", desc: "示例：薄皮类型排除高能射频。" },
                    safe: { title: "安全区优化", desc: "仅对符合您安全档案的方案进行排名。" }
                },
                mock: {
                    title: "风险评估",
                    level: "高",
                    label: "恢复期风险",
                    excluded: "🚫 已排除的选项"
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
                            price: "免费",
                            period: "",
                            cta: "加入网络",
                            features: ["List Profile", "Upload 1 Signature Solution", "5 Leads / Month"],
                            missing: ["Unlimited Matching", "Dev Support", "Data Licensing"]
                        },
                        partner: {
                            name: "合伙人",
                            price: "¥1,400",
                            period: "/月",
                            cta: "申请合伙",
                            features: ["Unlimited Matching", "Upload 5 Solutions", "Dev Support", "Verified Badge", "Priority Listing"],
                            missing: ["Reasoning OS Access", "Data Licensing"]
                        },
                        enterprise: {
                            name: "企业版",
                            price: "¥3,500",
                            period: "/月",
                            cta: "联系销售",
                            features: ["Everything in Partner", "Reasoning OS Access", "Data Licensing", "Custom API Access", "White Label Reports"],
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
        }
    }
};

export type LanguageCode = keyof typeof REPORT_TRANSLATIONS;
