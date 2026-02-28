import Link from 'next/link';
import { ShieldCheck, Lock, Globe, Mail } from 'lucide-react';
import { LanguageCode, REPORT_TRANSLATIONS } from '@/utils/translations';

interface FooterProps {
    language?: LanguageCode;
}

const NAV_LINKS = {
    product: {
        EN: 'Product',
        KO: '서비스',
        JP: 'サービス',
        CN: '产品',
    },
    company: {
        EN: 'Company',
        KO: '회사',
        JP: '会社',
        CN: '公司',
    },
    legal: {
        EN: 'Legal',
        KO: '법적 정보',
        JP: '法的情報',
        CN: '法律信息',
    },
};

const FOOTER_LINKS = {
    product: [
        { href: '#patients', label: { EN: 'For Patients', KO: '환자용', JP: '患者向け', CN: '患者' } },
        { href: '#doctors', label: { EN: 'For Doctors', KO: '의사용', JP: '医師向け', CN: '医生' } },
        { href: '#pricing', label: { EN: 'Pricing', KO: '요금제', JP: '料金', CN: '价格' } },
        { href: '/tools/skin_mapper.html', label: { EN: 'Skin Mapper', KO: '스킨 매퍼', JP: 'スキンマッパー', CN: '皮肤分析' } },
    ],
    company: [
        { href: 'mailto:hello@connectingdocs.ai', label: { EN: 'Contact Us', KO: '문의하기', JP: 'お問い合わせ', CN: '联系我们' } },
    ],
    legal: [
        { href: '/privacy', label: { EN: 'Privacy Policy', KO: '개인정보처리방침', JP: 'プライバシーポリシー', CN: '隐私政策' } },
        { href: '/terms', label: { EN: 'Terms of Service', KO: '이용약관', JP: '利用規約', CN: '服务条款' } },
    ],
};

export default function Footer({ language = 'EN' }: FooterProps) {
    const lang = language as keyof typeof FOOTER_LINKS.product[0]['label'];

    return (
        <footer className="bg-[#050505] border-t border-white/5 pt-16 pb-8">
            <div className="container mx-auto px-6 max-w-7xl">

                {/* Main Footer Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">

                    {/* Brand Column */}
                    <div className="col-span-2 md:col-span-1">
                        <div className="text-xl font-bold tracking-tighter text-white mb-3">
                            Connecting<span className="text-cyan-400">Docs</span>
                        </div>
                        <p className="text-sm text-gray-500 leading-relaxed mb-4">
                            {language === 'KO'
                                ? '피부 고민을 데이터 기반 임상 프로토콜로 변환하는 글로벌 의료 인텔리전스 플랫폼'
                                : language === 'JP'
                                ? '肌悩みをデータ主導の臨床プロトコルに変換するグローバル医療インテリジェンスプラットフォーム'
                                : language === 'CN'
                                ? '将皮肤问题转化为数据驱动临床方案的全球医疗智能平台'
                                : 'The global medical intelligence platform that translates skin concerns into data-driven clinical protocols.'}
                        </p>
                        <a
                            href="mailto:hello@connectingdocs.ai"
                            className="inline-flex items-center gap-2 text-xs text-gray-500 hover:text-cyan-400 transition-colors"
                        >
                            <Mail className="w-3 h-3" />
                            hello@connectingdocs.ai
                        </a>
                    </div>

                    {/* Product Links */}
                    <div>
                        <h4 className="text-xs font-bold text-white uppercase tracking-widest mb-4">
                            {NAV_LINKS.product[lang] || NAV_LINKS.product.EN}
                        </h4>
                        <ul className="space-y-2.5">
                            {FOOTER_LINKS.product.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="text-sm text-gray-500 hover:text-white transition-colors"
                                    >
                                        {link.label[lang] || link.label.EN}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Company Links */}
                    <div>
                        <h4 className="text-xs font-bold text-white uppercase tracking-widest mb-4">
                            {NAV_LINKS.company[lang] || NAV_LINKS.company.EN}
                        </h4>
                        <ul className="space-y-2.5">
                            {FOOTER_LINKS.company.map((link) => (
                                <li key={link.href}>
                                    <a
                                        href={link.href}
                                        className="text-sm text-gray-500 hover:text-white transition-colors"
                                    >
                                        {link.label[lang] || link.label.EN}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Legal Links */}
                    <div>
                        <h4 className="text-xs font-bold text-white uppercase tracking-widest mb-4">
                            {NAV_LINKS.legal[lang] || NAV_LINKS.legal.EN}
                        </h4>
                        <ul className="space-y-2.5">
                            {FOOTER_LINKS.legal.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="text-sm text-gray-500 hover:text-white transition-colors"
                                    >
                                        {link.label[lang] || link.label.EN}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Tagline */}
                <div className="border-t border-white/5 pt-8 mb-6">
                    <p className="text-center text-gray-500 italic text-sm">
                        &ldquo;{REPORT_TRANSLATIONS[language]?.footer.tagline || REPORT_TRANSLATIONS['EN'].footer.tagline}&rdquo;
                    </p>
                </div>

                {/* Bottom Bar */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-xs text-gray-600">
                        &copy; {new Date().getFullYear()} {REPORT_TRANSLATIONS[language]?.footer.copyright || REPORT_TRANSLATIONS['EN'].footer.copyright}
                    </p>
                    <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1.5 text-xs text-gray-600 bg-white/5 px-2 py-1 rounded-md">
                            <ShieldCheck className="w-3 h-3" /> {REPORT_TRANSLATIONS[language]?.footer.compliance.hipaa || REPORT_TRANSLATIONS['EN'].footer.compliance.hipaa}
                        </span>
                        <span className="flex items-center gap-1.5 text-xs text-gray-600 bg-white/5 px-2 py-1 rounded-md">
                            <Lock className="w-3 h-3" /> {REPORT_TRANSLATIONS[language]?.footer.compliance.iso || REPORT_TRANSLATIONS['EN'].footer.compliance.iso}
                        </span>
                        <span className="flex items-center gap-1.5 text-xs text-gray-600 bg-white/5 px-2 py-1 rounded-md">
                            <Globe className="w-3 h-3" /> {REPORT_TRANSLATIONS[language]?.footer.compliance.fhir || REPORT_TRANSLATIONS['EN'].footer.compliance.fhir}
                        </span>
                    </div>
                </div>

            </div>
        </footer>
    );
}
