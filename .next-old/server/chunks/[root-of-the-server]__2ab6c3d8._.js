module.exports=[70406,(e,t,o)=>{t.exports=e.x("next/dist/compiled/@opentelemetry/api",()=>require("next/dist/compiled/@opentelemetry/api"))},14142,e=>e.a(async(t,o)=>{try{let t=await e.y("resend-8394417a8534d297");e.n(t),o()}catch(e){o(e)}},!0),31982,e=>e.a(async(t,o)=>{try{var r=e.i(14142),i=t([r]);[r]=i.then?(await i)():i;let a=new r.Resend(process.env.RESEND_API_KEY),d=process.env.RESEND_FROM_EMAIL||"onboarding@resend.dev",s=process.env.ADMIN_EMAIL||"",p="http://localhost:3001";async function n(e,t){if("POST"!==e.method)return t.status(405).json({error:"Method not allowed"});let o=e.body;if(!o.report_id)return t.status(400).json({error:"Missing report_id"});if(!process.env.RESEND_API_KEY)return console.warn("[notify-report] RESEND_API_KEY not set. Logging instead."),console.log(`[notify-report] Report ${o.report_id} for ${o.patient_email||"anonymous"}`),t.status(200).json({success:!0,mock:!0});let r=[];try{if(s){let e=await a.emails.send({from:d,to:[s],subject:`[CD] 새 리포트: ${o.patient_country}/${o.patient_gender}/${o.patient_age} — ${o.primary_goal||"N/A"}`,html:`
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;margin:0;padding:20px;background:#f8fafc;">
  <div style="max-width:540px;margin:0 auto;background:white;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#2563eb,#1d4ed8);padding:24px 28px;">
      <h1 style="color:white;margin:0;font-size:18px;">🔔 새 리포트 생성 완료</h1>
      <p style="color:#bfdbfe;margin:4px 0 0;font-size:13px;">ConnectingDocs Admin Alert</p>
    </div>

    <!-- Body -->
    <div style="padding:24px 28px;">
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr>
          <td style="padding:8px 0;color:#6b7280;width:120px;">Report ID</td>
          <td style="padding:8px 0;font-weight:600;"><code style="background:#f1f5f9;padding:2px 6px;border-radius:4px;font-size:12px;">${o.report_id}</code></td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#6b7280;">환자 정보</td>
          <td style="padding:8px 0;">${o.patient_country} / ${o.patient_gender} / ${o.patient_age}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#6b7280;">이메일</td>
          <td style="padding:8px 0;">${o.patient_email||"비회원 (미수집)"}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#6b7280;">언어</td>
          <td style="padding:8px 0;">${o.lang}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#6b7280;">주요 목표</td>
          <td style="padding:8px 0;font-weight:600;">${o.primary_goal||"-"}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#6b7280;">Top 장비</td>
          <td style="padding:8px 0;">${o.top_device||"-"}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#6b7280;">Top 스킨부스터/인젝터블</td>
          <td style="padding:8px 0;">${o.top_injectable||"-"}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#6b7280;">AI 모델</td>
          <td style="padding:8px 0;">${o.model}</td>
        </tr>
        ${o.cost_usd?`<tr>
          <td style="padding:8px 0;color:#6b7280;">API 비용</td>
          <td style="padding:8px 0;">$${o.cost_usd.toFixed(4)}</td>
        </tr>`:""}
      </table>

      <!-- Report Link -->
      <div style="margin-top:20px;text-align:center;">
        <a href="${p}/report-v2/${o.report_id}"
           style="display:inline-block;background:#2563eb;color:white;padding:10px 24px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;">
          리포트 보기 →
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="padding:16px 28px;background:#f8fafc;border-top:1px solid #e5e7eb;">
      <p style="margin:0;color:#9ca3af;font-size:11px;">
        ${new Date().toLocaleString("ko-KR",{timeZone:"Asia/Seoul"})} KST \xb7 ConnectingDocs Auto Alert
      </p>
    </div>
  </div>
</body>
</html>`});r.push(`admin:${e.data?.id||"sent"}`),console.log(`[notify-report] ✅ Admin email sent → ${s}`)}if(o.patient_email){let e,t,i,n={KO:"피부 분석 리포트가 완성되었습니다",EN:"Your Skin Analysis Report is Ready",JP:"肌分析レポートが完成しました","ZH-CN":"您的皮肤分析报告已完成"},s=`[ConnectingDocs] ${n[o.lang]||n.EN}`,l=await a.emails.send({from:d,to:[o.patient_email],subject:s,html:(e=`${p}/report-v2/${o.report_id}`,i=(t={KO:{subject:"피부 분석 리포트가 완성되었습니다",greeting:"안녕하세요!",body:"AI 피부 분석이 완료되어 맞춤 시술 리포트가 준비되었습니다. 아래 버튼을 클릭하여 결과를 확인하세요.",cta:"내 리포트 확인하기",footer:"이 이메일은 ConnectingDocs 피부 분석 서비스에서 발송되었습니다."},EN:{subject:"Your Skin Analysis Report is Ready",greeting:"Hello!",body:"Your AI skin analysis is complete and your personalized treatment report is ready. Click the button below to view your results.",cta:"View My Report",footer:"This email was sent by ConnectingDocs skin analysis service."},JP:{subject:"肌分析レポートが完成しました",greeting:"こんにちは！",body:"AI肌分析が完了し、カスタマイズ施術レポートが準備できました。下のボタンをクリックして結果をご確認ください。",cta:"レポートを確認する",footer:"このメールはConnectingDocs肌分析サービスより送信されました。"},"ZH-CN":{subject:"您的皮肤分析报告已完成",greeting:"您好！",body:"AI皮肤分析已完成，您的个性化治疗报告已准备就绪。请点击下方按钮查看结果。",cta:"查看我的报告",footer:"此邮件由ConnectingDocs皮肤分析服务发送。"}})[o.lang]||t.EN,`
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;margin:0;padding:20px;background:#f0f9ff;">
  <div style="max-width:480px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.08);">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#2563eb,#7c3aed);padding:32px 28px;text-align:center;">
      <div style="font-size:40px;margin-bottom:8px;">✨</div>
      <h1 style="color:white;margin:0;font-size:20px;font-weight:700;">${i.subject}</h1>
    </div>

    <!-- Body -->
    <div style="padding:28px;">
      <p style="font-size:16px;color:#1f2937;margin:0 0 12px;">${i.greeting}</p>
      <p style="font-size:14px;color:#4b5563;line-height:1.6;margin:0 0 24px;">${i.body}</p>

      <!-- CTA -->
      <div style="text-align:center;margin:24px 0;">
        <a href="${e}"
           style="display:inline-block;background:linear-gradient(135deg,#2563eb,#7c3aed);color:white;padding:14px 32px;border-radius:12px;text-decoration:none;font-size:16px;font-weight:700;box-shadow:0 4px 12px rgba(37,99,235,0.3);">
          ${i.cta} →
        </a>
      </div>

      <!-- Report URL fallback -->
      <p style="text-align:center;font-size:11px;color:#9ca3af;margin-top:16px;word-break:break-all;">
        ${e}
      </p>
    </div>

    <!-- Footer -->
    <div style="padding:16px 28px;background:#f8fafc;border-top:1px solid #e5e7eb;text-align:center;">
      <p style="margin:0;color:#9ca3af;font-size:11px;">${i.footer}</p>
      <p style="margin:4px 0 0;color:#d1d5db;font-size:10px;">ConnectingDocs \xa9 ${new Date().getFullYear()}</p>
    </div>
  </div>
</body>
</html>`)});r.push(`patient:${l.data?.id||"sent"}`),console.log(`[notify-report] ✅ Patient email sent → ${o.patient_email}`)}return t.status(200).json({success:!0,results:r})}catch(e){return console.error("[notify-report] ❌ Email error:",e.message),t.status(200).json({success:!1,error:e.message})}}e.s(["default",()=>n]),o()}catch(e){o(e)}},!1),8587,e=>e.a(async(t,o)=>{try{var r=e.i(26747),i=e.i(90406),n=e.i(44898),a=e.i(62950),d=e.i(31982),s=e.i(7031),p=e.i(81927),l=e.i(46432),c=t([d]);[d]=c.then?(await c)():c;let y=(0,a.hoist)(d,"default"),x=(0,a.hoist)(d,"config"),u=new n.PagesAPIRouteModule({definition:{kind:i.RouteKind.PAGES_API,page:"/api/survey-v2/notify-report",pathname:"/api/survey-v2/notify-report",bundlePath:"",filename:""},userland:d,distDir:".next",relativeProjectDir:""});async function g(e,t,o){u.isDev&&(0,l.addRequestMeta)(e,"devRequestTimingInternalsEnd",process.hrtime.bigint());let i="/api/survey-v2/notify-report";i=i.replace(/\/index$/,"")||"/";let n=await u.prepare(e,t,{srcPage:i});if(!n){t.statusCode=400,t.end("Bad Request"),null==o.waitUntil||o.waitUntil.call(o,Promise.resolve());return}let{query:a,params:d,prerenderManifest:c,routerServerContext:g}=n;try{let o=e.method||"GET",r=(0,s.getTracer)(),n=r.getActiveScopeSpan(),l=u.instrumentationOnRequestError.bind(u),y=async n=>u.render(e,t,{query:{...a,...d},params:d,allowedRevalidateHeaderKeys:[],multiZoneDraftMode:!1,trustHostHeader:!1,previewProps:c.preview,propagateError:!1,dev:u.isDev,page:"/api/survey-v2/notify-report",internalRevalidate:null==g?void 0:g.revalidate,onError:(...t)=>l(e,...t)}).finally(()=>{if(!n)return;n.setAttributes({"http.status_code":t.statusCode,"next.rsc":!1});let e=r.getRootSpanAttributes();if(!e)return;if(e.get("next.span_type")!==p.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${e.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let a=e.get("next.route");if(a){let e=`${o} ${a}`;n.setAttributes({"next.route":a,"http.route":a,"next.span_name":e}),n.updateName(e)}else n.updateName(`${o} ${i}`)});n?await y(n):await r.withPropagatedContext(e.headers,()=>r.trace(p.BaseServerSpan.handleRequest,{spanName:`${o} ${i}`,kind:s.SpanKind.SERVER,attributes:{"http.method":o,"http.target":e.url}},y))}catch(e){if(u.isDev)throw e;(0,r.sendError)(t,500,"Internal Server Error")}finally{null==o.waitUntil||o.waitUntil.call(o,Promise.resolve())}}e.s(["config",0,x,"default",0,y,"handler",()=>g]),o()}catch(e){o(e)}},!1)];

//# sourceMappingURL=%5Broot-of-the-server%5D__2ab6c3d8._.js.map