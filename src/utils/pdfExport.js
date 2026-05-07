export function exportPDF(brief, feedItems, score, activeInc) {
  const getLevel = (s) => s >= 80 ? 'CRITICAL' : s >= 60 ? 'ELEVATED' : s >= 40 ? 'MODERATE' : 'LOW'
  const getColor = (s) => s >= 80 ? '#ff2d55' : s >= 60 ? '#ff9f0a' : s >= 40 ? '#30d158' : '#0a84ff'
  const now = new Date().toUTCString()
  const criticalItems = (feedItems || []).filter(i => i.severity === 'critical').slice(0, 10)
  const color = getColor(score)

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>SIGINT OPS Report</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Inter,system-ui,sans-serif;background:#020509;color:#dde6f0;padding:48px;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.logo{font-size:22px;font-weight:700;letter-spacing:5px;color:#dde6f0;margin-bottom:4px}
.sub{font-size:9px;letter-spacing:3px;color:#364d60;text-transform:uppercase;margin-bottom:24px}
.metrics{display:flex;gap:36px;margin-bottom:28px;padding:16px 20px;background:rgba(255,255,255,0.04);border-radius:8px;border:1px solid rgba(255,255,255,0.06)}
.metric-label{font-size:8px;font-weight:600;letter-spacing:2px;color:#364d60;text-transform:uppercase;margin-bottom:4px}
.metric-value{font-family:'JetBrains Mono',monospace;font-size:26px;font-weight:700;color:${color}}
.section{margin:24px 0}
.stitle{font-family:Inter,sans-serif;font-size:9px;font-weight:700;letter-spacing:2.5px;color:#364d60;text-transform:uppercase;border-left:3px solid ${color};padding-left:10px;margin-bottom:12px}
.brief{font-family:'JetBrains Mono',monospace;font-size:10px;line-height:1.75;color:#7a94aa;white-space:pre-wrap}
.item{padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.04);font-size:10px;color:#7a94aa;line-height:1.45}
.src{font-family:'JetBrains Mono',monospace;font-size:8px;font-weight:700;color:#0a84ff;margin-bottom:3px}
.footer{margin-top:48px;font-size:8px;color:#364d60;border-top:1px solid rgba(255,255,255,0.06);padding-top:14px;letter-spacing:0.5px}
@media print{body{background:#020509 !important}}
</style></head><body>
<div class="logo">SIGINT OPS</div>
<div class="sub">Intelligence Situation Report</div>
<div class="metrics">
  <div><div class="metric-label">Escalation</div><div class="metric-value">${score}<span style="font-size:14px;color:#364d60">/100</span></div></div>
  <div><div class="metric-label">Level</div><div class="metric-value" style="font-size:20px">${getLevel(score)}</div></div>
  <div><div class="metric-label">Incidents</div><div class="metric-value">${activeInc}</div></div>
</div>
<div class="section"><div class="stitle">Situation Report</div><div class="brief">${brief || 'No brief available'}</div></div>
<div class="section"><div class="stitle">Critical Developments</div>
${criticalItems.map(i => `<div class="item"><div class="src">[${i.source}]</div>${i.title}</div>`).join('')}
</div>
<div class="footer">SIGINT OPS &nbsp;·&nbsp; ops.unocloud.us &nbsp;·&nbsp; Generated: ${now} &nbsp;·&nbsp; UNCLASSIFIED // OSINT ONLY</div>
</body></html>`

  const win = window.open('', '_blank')
  win.document.write(html)
  win.document.close()
  setTimeout(() => win.print(), 600)
}
