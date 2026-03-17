// ═══════════════════════════════════════════════════════════════
//  Base Email Layout — Phase 2 (G-4)
//  공통 이메일 레이아웃 (모든 템플릿에서 재사용)
//
//  브랜딩: #0F172A (다크), #3B82F6 (블루 액센트)
//  반응형: 모바일 이메일 클라이언트 호환 (600px max-width)
//  NO any/unknown types
// ═══════════════════════════════════════════════════════════════

import type { EmailLocale } from '@/schemas/email';

// ─── Footer Texts ────────────────────────────────────────────

const FOOTER_TEXT: Record<EmailLocale, { disclaimer: string; unsubscribe: string }> = {
  KO: {
    disclaimer: '이 이메일은 ConnectingDocs 서비스 이용과 관련하여 발송되었습니다.',
    unsubscribe: '이 이메일은 서비스 관련 알림이므로 수신 거부 대상이 아닙니다.',
  },
  EN: {
    disclaimer: 'This email was sent in connection with your use of ConnectingDocs.',
    unsubscribe: 'This is a service-related notification and cannot be unsubscribed.',
  },
  JP: {
    disclaimer: 'このメールはConnectingDocsサービスに関連して送信されました。',
    unsubscribe: 'このメールはサービス関連通知のため、配信停止の対象外です。',
  },
  'ZH-CN': {
    disclaimer: '此邮件与您使用ConnectingDocs服务有关。',
    unsubscribe: '此为服务相关通知，无法退订。',
  },
};

// ─── Base Layout ─────────────────────────────────────────────

export function baseLayout(locale: EmailLocale, bodyContent: string): string {
  const footer = FOOTER_TEXT[locale] ?? FOOTER_TEXT.EN;

  return `<!DOCTYPE html>
<html lang="${locale.toLowerCase()}" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>ConnectingDocs</title>
  <!--[if mso]>
  <style type="text/css">
    table { border-collapse: collapse; }
    td { font-family: Arial, sans-serif; }
  </style>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#f4f4f7;font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <!-- Main Container -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
          <!-- Logo Header -->
          <tr>
            <td style="background-color:#0F172A;padding:28px 32px;text-align:center;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
                <tr>
                  <td style="padding-right:10px;vertical-align:middle;">
                    <div style="width:32px;height:32px;background-color:#3B82F6;border-radius:8px;display:inline-block;text-align:center;line-height:32px;">
                      <span style="color:#ffffff;font-size:18px;font-weight:bold;">C</span>
                    </div>
                  </td>
                  <td style="vertical-align:middle;">
                    <span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.5px;">ConnectingDocs</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding:32px;">
              ${bodyContent}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f8fafc;padding:24px 32px;border-top:1px solid #e2e8f0;">
              <p style="margin:0 0 8px;color:#94a3b8;font-size:12px;line-height:18px;text-align:center;">
                ${footer.disclaimer}
              </p>
              <p style="margin:0;color:#cbd5e1;font-size:11px;line-height:16px;text-align:center;">
                ${footer.unsubscribe}
              </p>
              <p style="margin:12px 0 0;color:#cbd5e1;font-size:11px;text-align:center;">
                &copy; ${new Date().getFullYear()} ConnectingDocs. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── CTA Button Helper ───────────────────────────────────────

export function ctaButton(text: string, url: string): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px auto 0;">
      <tr>
        <td style="background-color:#3B82F6;border-radius:8px;">
          <a href="${url}" target="_blank" style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;letter-spacing:0.3px;">
            ${text}
          </a>
        </td>
      </tr>
    </table>`;
}
