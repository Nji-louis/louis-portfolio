(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const loginView = $('#login-view'), dashboardView = $('#dashboard-view'), loginForm = $('#login-form');
  const statusLabels = {new:'New',contacted:'Contacted',qualified:'Qualified',quoted:'Quoted',negotiation:'Negotiation',won:'Won',lost:'Lost',not_fit:'Not a fit'};
  let leads = [], selectedId = null;
  async function api(url, options = {}) {
    const response = await fetch(url, { credentials: 'same-origin', ...options, headers: { 'Content-Type': 'application/json', ...(options.headers || {}) } });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) { if (response.status === 401) showLogin(); throw new Error(data.error || `Request failed (${response.status})`); }
    return data;
  }
  function showLogin() { document.body.classList.add('auth-screen'); loginView.classList.remove('hidden'); dashboardView.classList.add('hidden'); $('#logout').classList.add('hidden'); }
  function showDashboard() { document.body.classList.remove('auth-screen'); loginView.classList.add('hidden'); dashboardView.classList.remove('hidden'); $('#logout').classList.remove('hidden'); }
  function safe(value) { return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function date(value) { if (!value) return '—'; const d = new Date(value); return Number.isNaN(d.getTime()) ? safe(value) : d.toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'}); }
  function money(value,currency='XAF') { if (value === null || value === undefined || value === '') return 'Not quoted'; return `${Number(value).toLocaleString()} ${currency}`; }
  async function load() {
    $('#notice').textContent = 'Loading…';
    try {
      const [summary, list, config] = await Promise.all([api('/api/admin/summary'),api('/api/admin/leads'+filterQuery()),api('/api/admin/notification-config')]);
      leads = list; showDashboard();
      const cards = [['All leads',summary.total],['New',summary.new],['Active pipeline',summary.active],['Won projects',summary.won],['Overdue follow-ups',summary.overdue],['Won value',money(summary.won_value)]];
      $('#stats').innerHTML = cards.map(([label,value])=>`<article class="stat"><span>${safe(label)}</span><strong>${safe(value)}</strong></article>`).join('');
      const overviewRows = leads.map(l=>`<tr data-id="${l.id}"><td><span class="lead-name">${safe(l.name)}</span><span class="subline">${safe(l.email)}</span></td><td>${safe(l.service)}</td><td><span class="pill ${safe(l.status)}">${safe(statusLabels[l.status]||l.status)}</span></td><td>${date(l.created_at)}</td></tr>`).join('');
      const fullRows = leads.map(l=>`<tr data-id="${l.id}"><td><span class="lead-name">${safe(l.name)}</span><span class="subline">${safe(l.email)}</span><span class="subline">${safe(l.phone||'')}</span></td><td>${safe(l.service)}<span class="subline">${safe(l.budget)}</span></td><td><span class="pill ${safe(l.status)}">${safe(statusLabels[l.status]||l.status)}</span></td><td>${date(l.created_at)}</td><td>${date(l.next_follow_up)}</td><td><span class="subline">Email: ${safe(l.email_notification_status)}</span><span class="subline">WhatsApp: ${safe(l.whatsapp_notification_status)}</span></td></tr>`).join('');
      $('#leads-body').innerHTML = leads.length ? overviewRows : '<tr><td colspan="4">No leads found yet.</td></tr>';
      $('#leads-body-full').innerHTML = leads.length ? fullRows : '<tr><td colspan="6">No leads found. Send a test enquiry from the public website after deployment.</td></tr>';
      document.querySelectorAll('#leads-body tr[data-id], #leads-body-full tr[data-id]').forEach(row=>row.addEventListener('click',()=>openDetail(Number(row.dataset.id))));
      $('#notice').textContent = `Loaded ${leads.length} lead(s). Notifications — email: ${config.email?'configured':'not configured'}, WhatsApp: ${config.whatsapp?'configured':'not configured'}${config.whatsapp&&!config.whatsappTemplate?' (set an approved template for business-initiated messages)':''}.`;
      if (selectedId && leads.some(l=>l.id===selectedId)) openDetail(selectedId);
    } catch(e) { $('#notice').textContent = e.message; }
  }
  function filterQuery() { const p=new URLSearchParams(); if($('#status-filter').value)p.set('status',$('#status-filter').value);if($('#search').value.trim())p.set('q',$('#search').value.trim());return p.size?'?'+p.toString():''; }
  function openDetail(id) {
    const l=leads.find(x=>x.id===id); if(!l)return; selectedId=id; $('#detail').classList.remove('hidden'); $('#detail-title').textContent=`#${l.id} · ${l.name}`;
    $('#detail-content').innerHTML=`<div class="detail-grid"><div><strong>Email</strong><p>${safe(l.email)}</p></div><div><strong>Phone / WhatsApp</strong><p>${safe(l.phone||'Not provided')}</p></div><div><strong>Country</strong><p>${safe(l.country||'Not provided')}</p></div><div><strong>Received</strong><p>${date(l.created_at)}</p></div><div class="wide"><strong>Project brief</strong><div class="detail-message">${safe(l.message)}</div></div></div><form id="edit-lead" class="editor"><div class="detail-grid"><label>Status<select name="status">${Object.entries(statusLabels).map(([v,t])=>`<option value="${v}" ${l.status===v?'selected':''}>${t}</option>`).join('')}</select></label><label>Quote amount (${safe(l.currency||'XAF')})<input name="quote_amount" type="number" min="0" step="0.01" value="${l.quote_amount??''}"></label><label>Next follow-up date<input name="next_follow_up" type="date" value="${l.next_follow_up?String(l.next_follow_up).slice(0,10):''}"></label><label class="wide">Internal notes<textarea name="notes" maxlength="5000">${safe(l.notes||'')}</textarea></label></div><div class="actions"><button class="button" type="submit">Save changes</button><a class="button secondary" href="mailto:${encodeURIComponent(l.email)}?subject=${encodeURIComponent('Re: '+l.service+' enquiry')}">Email prospect</a>${l.phone?`<a class="button secondary" target="_blank" rel="noopener noreferrer" href="https://wa.me/${safe(l.phone.replace(/\D/g,''))}">Open WhatsApp</a>`:''}</div><p id="edit-error" class="error" role="status"></p></form>`;
    $('#edit-lead').addEventListener('submit',saveDetail);
  }
  async function saveDetail(e) {
    e.preventDefault(); const f=new FormData(e.currentTarget); const body={status:f.get('status'),quote_amount:f.get('quote_amount')===''?null:Number(f.get('quote_amount')),next_follow_up:f.get('next_follow_up')||null,notes:f.get('notes')};
    try { await api(`/api/admin/leads/${selectedId}`,{method:'PATCH',body:JSON.stringify(body)}); $('#edit-error').textContent='Saved.'; await load(); openDetail(selectedId); $('#notice').textContent='Lead updated.'; }
    catch(err){$('#edit-error').textContent=err.message;}
  }
  loginForm.addEventListener('submit',async e=>{e.preventDefault();const f=new FormData(loginForm);$('#login-error').textContent='';try{await api('/api/auth/login',{method:'POST',body:JSON.stringify({username:f.get('username'),password:f.get('password')})});loginForm.reset();await load();}catch(err){$('#login-error').textContent=err.message;}});
  $('#logout').addEventListener('click',async()=>{try{await api('/api/auth/logout',{method:'POST',body:'{}'});}finally{showLogin();}});
  $('#refresh').addEventListener('click',load); $('#status-filter').addEventListener('change',load); let timer; $('#search').addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(load,250);}); $('#close-detail').addEventListener('click',()=>{$('#detail').classList.add('hidden');selectedId=null;});
  const viewTitles = {overview:'Good morning, Louis ✦',leads:'Leads & enquiries',pages:'Pages',projects:'Projects',pricing:'Services & pricing',settings:'Settings'};
  function activateView(view) {
    document.querySelectorAll('[data-panel]').forEach(panel=>panel.classList.toggle('active', panel.dataset.panel===view));
    document.querySelectorAll('.nav-link[data-view]').forEach(link=>link.classList.toggle('active', link.dataset.view===view));
    const heading = $('#page-heading'); if (heading) heading.textContent = viewTitles[view] || 'Portfolio workspace';
    $('#sidebar').classList.remove('is-open');
  }
  document.querySelectorAll('[data-view]').forEach(button=>button.addEventListener('click',()=>activateView(button.dataset.view)));
  $('#mobile-menu').addEventListener('click',()=>$('#sidebar').classList.toggle('is-open'));
  api('/api/admin/me').then(()=>load()).catch(()=>showLogin());
})();
