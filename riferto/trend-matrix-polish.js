const trendSection=document.querySelector('.app-section[data-section="trend"]');

const style=document.createElement('style');
style.textContent=`
.trend-table-wrap{max-width:100%;overflow-x:auto!important;-webkit-overflow-scrolling:touch;border-radius:16px}
.trend-matrix{width:max-content!important;min-width:100%!important;table-layout:auto!important}
.trend-matrix th:first-child,.trend-matrix td:first-child{width:170px!important;min-width:170px!important;max-width:170px!important;white-space:normal!important;vertical-align:top!important;overflow:hidden!important}
.trend-matrix td:first-child strong{display:block;white-space:normal!important;overflow-wrap:anywhere;word-break:normal;line-height:1.14;font-size:.78rem}
.trend-matrix td:first-child small{display:block;margin-top:3px;white-space:normal!important;line-height:1.1;color:var(--muted);font-size:.64rem}
.trend-matrix .trend-exam-short{display:block;font-size:.82rem;font-weight:850;line-height:1.05}
.trend-matrix .trend-exam-long{display:block;margin-top:2px;font-size:.68rem;font-weight:700;line-height:1.12;color:var(--text);overflow-wrap:anywhere}
.trend-matrix td:not(:first-child),.trend-matrix th:not(:first-child){min-width:112px;white-space:nowrap!important}

html[data-riferto-theme="dark"] .trend-panel,
html[data-riferto-theme="dark"] .trend-result,
html[data-riferto-theme="dark"] .trend-hero{color:#eef4ff!important}
html[data-riferto-theme="dark"] .trend-exam-row{background:rgba(39,53,74,.88)!important;border:1px solid rgba(255,255,255,.055)!important}
html[data-riferto-theme="dark"] .trend-exam-row strong{color:#f2f6fc!important}
html[data-riferto-theme="dark"] .trend-exam-row small{color:#8fa0b8!important}
html[data-riferto-theme="dark"] .trend-star{color:#7e91aa!important}
html[data-riferto-theme="dark"] .trend-star.active{color:#efb72e!important}
html[data-riferto-theme="dark"] .trend-segment{background:rgba(7,14,25,.48)!important;border:1px solid rgba(255,255,255,.055)}
html[data-riferto-theme="dark"] .trend-segment button{color:#9dabc0!important}
html[data-riferto-theme="dark"] .trend-segment button.active{background:#e8edf5!important;color:#172234!important;box-shadow:0 2px 10px rgba(0,0,0,.22)!important}
html[data-riferto-theme="dark"] .trend-table{color:#eaf0fa!important}
html[data-riferto-theme="dark"] .trend-table th,
html[data-riferto-theme="dark"] .trend-table td{border-bottom-color:rgba(255,255,255,.075)!important}
html[data-riferto-theme="dark"] .trend-table th{background:#172337!important;color:#b9c6d9!important}
html[data-riferto-theme="dark"] .trend-matrix th:first-child,
html[data-riferto-theme="dark"] .trend-matrix td:first-child{background:#1a273a!important;color:#eef4ff!important;border-right:1px solid rgba(255,255,255,.09)!important}
html[data-riferto-theme="dark"] .trend-matrix th:first-child{color:#b9c6d9!important}
html[data-riferto-theme="dark"] .trend-matrix td:first-child strong,
html[data-riferto-theme="dark"] .trend-matrix .trend-exam-long{color:#f5f8fd!important}
html[data-riferto-theme="dark"] .trend-matrix td:first-child small{color:#8295af!important}
html[data-riferto-theme="dark"] .trend-matrix td:not(:first-child){background:rgba(18,29,45,.58)!important;color:#edf3fc!important}
html[data-riferto-theme="dark"] .trend-matrix tbody tr:hover td:not(:first-child){background:rgba(37,52,73,.68)!important}
html[data-riferto-theme="dark"] .trend-outlier{color:#ff5a5f!important}

@media (min-width:900px){
  html[data-riferto-layout="landscape"] .app-section[data-section="trend"].active{grid-template-columns:minmax(310px,360px) minmax(0,1fr)!important;gap:18px!important}
  html[data-riferto-layout="landscape"] .trend-panel{padding:18px!important;border-radius:22px}
  html[data-riferto-layout="landscape"] .trend-result{padding:18px!important;border-radius:22px}
  html[data-riferto-layout="landscape"] .trend-exam-picker{max-height:310px!important}
  html[data-riferto-layout="landscape"] .trend-matrix th:first-child,
  html[data-riferto-layout="landscape"] .trend-matrix td:first-child{width:190px!important;min-width:190px!important;max-width:190px!important}
}
@media(max-width:520px){
  .trend-matrix th:first-child,.trend-matrix td:first-child{width:138px!important;min-width:138px!important;max-width:138px!important}
  .trend-matrix td:not(:first-child),.trend-matrix th:not(:first-child){min-width:104px}
}
`;
document.head.appendChild(style);

function splitExamName(name){
  const text=String(name||'').trim();
  const match=text.match(/^([A-Z][A-Z0-9]{1,8})\s*[-–—]\s*(.+)$/);
  return match?{short:match[1],long:match[2]}:{short:'',long:text};
}

function polishMatrix(){
  trendSection?.querySelectorAll('.trend-matrix tbody td:first-child').forEach(cell=>{
    if(cell.dataset.matrixPolished==='1')return;
    const strong=cell.querySelector('strong');
    if(!strong)return;
    const parts=splitExamName(strong.textContent);
    if(parts.short){
      strong.innerHTML=`<span class="trend-exam-short">${parts.short}</span><span class="trend-exam-long">${parts.long}</span>`;
    }
    cell.dataset.matrixPolished='1';
  });
}

if(trendSection)new MutationObserver(()=>requestAnimationFrame(polishMatrix)).observe(trendSection,{childList:true,subtree:true});
polishMatrix();
