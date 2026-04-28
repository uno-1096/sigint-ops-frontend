export function exportPDF(brief, feedItems, score, activeInc) {
  const getLevel = (s) => s >= 80 ? 'CRITICAL' : s >= 60 ? 'ELEVATED' : s >= 40 ? 'MODERATE' : 'LOW'
  const getColor = (s) => s >= 80 ? '#e24b4a' : s >= 60 ? '#ef9f27' : s >= 40 ? '#97c459' : '#378add'
  const now = new Date().toUTCString()
  const criticalItems = (feedItems || []).filter(i => i.severity === 'critical').slice(0, 10)

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>SIGINT OPS Report</title>
<style>body{font-family:Courier New,monospace;background:#080a0d;color:#c8cfd8;padding:40px}
.logo{font-size:24px;font-weight:bold;letter-spacing:4px;color:#e0e6ed}
.score{font-size:28px;font-weight:bold;color:${getColor(score)}}
.section{margin:20px 0}
.stitle{font-size:10px;letter-spacing:2px;color:#2a3545;border-left:3px solid ${getColor(score)};padding-left:8px;margin-bottom:10px}
.brief{font-size:11px;line-height:1.7;color:#8a9aaa;white-space:pre-wrap}
.item{padding:6px 0;border-bottom:1px solid #0a1020;font-size:10px}
.src{font-size:8px;color:#378add;margin-bottom:2px}
.footer{margin-top:40px;font-size:8px;color:#2a3545;border-top:1px solid #1e2530;padding-top:12px}
</style></head><body>
<div class="logo">SIGINT OPS</div>
<div style="font-size:9px;color:#3a4a58;letter-spacing:2px;margin:4px 0 16px">INTELLIGENCE SITUATION REPORT</div>
<div style="display:flex;gap:30px;margin-bottom:20px">
  <div><div style="font-size:8px;color:#2a3545">ESCALATION</div><div class="score">${score}/100</div></div>
  <div><div style="font-size:8px;color:#2a3545">LEVEL</div><div class="score">${getLevel(score)}</div></div>
  <div><div style="font-size:8px;color:#2a3545">INCIDENTS</div><div class="score">${activeInc}</div></div>
</div>
<div class="section"><div class="stitle">SITUATION REPORT</div><div class="brief">${brief || 'No brief available'}</div></div>
<div class="section"><div class="stitle">CRITICAL DEVELOPMENTS</div>
${criticalItems.map(i => `<div class="item"><div class="src">${i.source}</div>${i.title}</div>`).join('')}
</div>
<div class="footer">SIGINT OPS — ops.unocloud.us &nbsp;|&nbsp; Generated: ${now} &nbsp;|&nbsp; UNCLASSIFIED // OSINT ONLY</div>
</body></html>`

  const win = window.open('', '_blank')
  win.document.write(html)
  win.document.close()
  setTimeout(() => win.print(), 500)
}
