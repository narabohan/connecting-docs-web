export interface TranslationStructure {
    loading: {
        title: string;
        subtitle: string;
    };
    header: {
        title: string;
        export: string;
    };
    radar: {
        title: string;
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
            export: "EXPORT PDF"
        },
        radar: {
            title: "PATIENT CLINICAL PROFILE",
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
                stats: { protocols: "Protocols", accuracy: "Accuracy", monitoring: "Monitoring" }
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
                title: "Join the",
                titleHighlight: "Global Logic Network",
                description: "Upload your signature protocols. Let our AI match you with pre-qualified patients who are looking for exactly what you offer.",
                cards: {
                    upload: { title: "Upload Protocols", desc: "Digitize your clinical logic. Define the exact patient parameters that yield your best results." },
                    match: { title: "AI Matching", desc: "Stop wasting time on consultations with patients who aren't a fit. Our engine filters and educates patients before they even walk in." },
                    revenue: { title: "Revenue Share", desc: "Earn royalties on your data. If other doctors use your protocols, or if patients purchase recommended home care, you get paid." }
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
            }
        }
    },
    KO: {
        loading: {
            title: "임상 변수 분석 중...",
            subtitle: "글로벌 인텔리전스 네트워크 연결"
        },
        header: {
            title: "인텔리전스 리포트",
            export: "PDF 내보내기"
        },
        radar: {
            title: "환자 임상 프로필",
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
                stats: { protocols: "프로토콜", accuracy: "정확도", monitoring: "모니터링" }
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
                title: "글로벌 로직 네트워크에",
                titleHighlight: "참여하세요",
                description: "당신의 시그니처 프로토콜을 업로드하세요. 우리의 AI가 당신이 제공하는 서비스에 딱 맞는 사전 검증된 환자와 매칭해 드립니다.",
                cards: {
                    upload: { title: "프로토콜 업로드", desc: "임상 로직을 디지털화하세요. 최상의 결과를 낳는 정확한 환자 파라미터를 정의하세요." },
                    match: { title: "AI 매칭", desc: "맞지 않는 환자와의 상담으로 시간을 낭비하지 마세요. 엔진이 내원 전 환자를 필터링하고 교육합니다." },
                    revenue: { title: "수익 공유", desc: "데이터에 대한 로열티를 받으세요. 다른 의사가 당신의 프로토콜을 사용하거나 환자가 홈케어 제품을 구매하면 수익을 얻습니다." }
                },
                cta: "Apply for Access"
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
            }
        }
    },
    JP: {
        loading: {
            title: "臨床変数を分析中...",
            subtitle: "グローバルインテリジェンスネットワークに接続"
        },
        header: {
            title: "インテリジェンスレポート",
            export: "PDFエクスポート"
        },
        radar: {
            title: "患者臨床プロファイル",
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
                stats: { protocols: "プロトコル", accuracy: "精度", monitoring: "モニタリング" }
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
                title: "グローバルロジックネットワークに",
                titleHighlight: "参加しましょう",
                description: "シグネチャープロトコルをアップロードしてください。当社のAIが、あなたが提供するサービスに最適な事前審査済みの患者とマッチングします。",
                cards: {
                    upload: { title: "プロトコルアップロード", desc: "臨床ロジックをデジタル化します。最良の結果を生む正確な患者パラメータを定義してください。" },
                    match: { title: "AIマッチング", desc: "適合しない患者との相談に時間を無駄にしないでください。エンジンが来院前に患者をフィルタリングし、教育します。" },
                    revenue: { title: "収益シェア", desc: "データに対するロイヤリティを受け取ります。他の医師があなたのプロトコルを使用したり、患者がホームケア製品を購入したりすると収益が得られます。" }
                },
                cta: "Apply for Access"
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
            }
        }
    },
    CN: {
        loading: {
            title: "正在分析临床变量...",
            subtitle: "连接至全球智能网络"
        },
        header: {
            title: "智能报告",
            export: "导出PDF"
        },
        radar: {
            title: "患者临床档案",
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
                stats: { protocols: "方案", accuracy: "准确率", monitoring: "监控" }
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
                title: "加入",
                titleHighlight: "全球逻辑网络",
                description: "上传您的签名方案。让我们的AI为您匹配正在寻找您所提供服务的预审患者。",
                cards: {
                    upload: { title: "上传方案", desc: "数字化您的临床逻辑。定义产生最佳效果的精确患者参数。" },
                    match: { title: "AI匹配", desc: "不要在不合适的患者咨询上浪费时间。引擎在患者进门前就对其进行过滤和教育。" },
                    revenue: { title: "收益共享", desc: "赚取数据版税。如果其他医生使用您的方案，或者患者购买推荐的家庭护理产品，您将获得收益。" }
                },
                cta: "Apply for Access"
            },
            pricing: {
                title: "选择您的方案",
                subtitle: "无论您是追求完美的患者，还是实现完美的医生，我们要为您准备了计划。",
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
            }
        }
    }
};

export type LanguageCode = keyof typeof REPORT_TRANSLATIONS;
