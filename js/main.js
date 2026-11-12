/* Rafael Raasch Pazeto, Advocacia: WhatsApp, situações, formulário e fundo do hero */
(function(){
  /* ===== CONFIGURAÇÃO ===== */
  var CONFIG = {
    whatsapp: '',      // DDI + DDD + número, só dígitos. Ex.: '5527999999999'. Vazio = o WhatsApp abre pedindo para escolher o contato.
    oab: '',           // número da OAB/ES, aparece no rodapé. Ex.: '12.345'
    webhookUrl: ''     // opcional: URL de um webhook (n8n, Make, Power Automate) para registrar cada contato
  };

  var params = new URLSearchParams(location.search);
  var origem = params.get('utm_source') || params.get('origem') || '';
  var phone = (CONFIG.whatsapp || '').replace(/\D/g, '');

  function waUrl(text){ return 'https://wa.me/' + phone + '?text=' + encodeURIComponent(text); }
  function withOrigin(text){ return origem ? text + '\n\n(origem: ' + origem + ')' : text; }

  var DEFAULT_MSG = 'Olá, Dr. Rafael! Vim pelo site e gostaria de agendar uma conversa sobre o meu caso.';

  /* ===== Todo elemento com data-wa abre o WhatsApp com a mensagem daquele elemento ===== */
  function wireWhatsApp(root){
    (root || document).querySelectorAll('[data-wa]').forEach(function(a){
      var msg = a.getAttribute('data-wa');
      if (msg === 'default') msg = DEFAULT_MSG;
      a.href = waUrl(withOrigin(msg));
      a.target = '_blank';
      a.rel = 'noopener';
      if (!a.__waTracked) {
        a.__waTracked = true;
        a.addEventListener('click', function(){
          var label = (a.textContent || '').trim().slice(0, 60);
          try { if (window.dataLayer) window.dataLayer.push({ event: 'whatsapp_click', label: label }); } catch (e) {}
          try { if (window.fbq) window.fbq('track', 'Contact'); } catch (e) {}
        });
      }
    });
  }
  wireWhatsApp();

  if (phone.length >= 12) {
    var p = phone.slice(2), shown = '+55 (' + p.slice(0, 2) + ') ' + p.slice(2, p.length - 4) + '-' + p.slice(-4);
    var pd = document.getElementById('phone-display'); if (pd) pd.textContent = shown;
  }
  if (CONFIG.oab) {
    var ob = document.getElementById('oab'); if (ob) ob.textContent = 'Advogado · OAB/ES nº ' + CONFIG.oab;
  }

  /* ===== Situações selecionáveis: o que for marcado vai na mensagem do WhatsApp ===== */
  var pains = Array.prototype.slice.call(document.querySelectorAll('.pain'));
  var countEl = document.getElementById('pains-count');
  var goEl = document.getElementById('pains-go');
  var goLabel = document.getElementById('pains-go-label');
  var previewEl = document.getElementById('wa-preview-text');
  var msgEl = document.getElementById('f-msg');
  var msgTouched = false;
  msgEl.addEventListener('input', function(){ msgTouched = msgEl.value.trim() !== ''; });
  function selectedPains(){ return pains.filter(function(p){ return p.getAttribute('aria-pressed') === 'true'; }).map(function(p){ return p.lastElementChild.textContent; }); }
  function painsMessage(sel){
    if (!sel.length) return 'Olá, Dr. Rafael! Vim pelo site e gostaria de conversar sobre a minha situação.';
    return 'Olá, Dr. Rafael! Vim pelo site e me identifiquei com ' + (sel.length === 1 ? 'esta situação' : 'estas situações') + ':\n\n' +
      sel.map(function(s){ return '• ' + s; }).join('\n') + '\n\nGostaria de conversar sobre ' + (sel.length === 1 ? 'isso' : 'isso') + '.';
  }
  function syncPains(){
    var sel = selectedPains(), msg = painsMessage(sel);
    countEl.textContent = sel.length === 0 ? 'Nenhum item marcado ainda.' : (sel.length === 1 ? '1 item vai junto na sua mensagem.' : sel.length + ' itens vão juntos na sua mensagem.');
    goLabel.textContent = sel.length ? 'Enviar para o WhatsApp' : 'Falar sobre minha situação';
    goEl.href = waUrl(withOrigin(msg));
    previewEl.textContent = msg;
    if (!msgTouched) msgEl.value = sel.length ? sel.map(function(s){ return '• ' + s; }).join('\n') : '';
  }
  pains.forEach(function(p){
    p.addEventListener('click', function(){
      p.setAttribute('aria-pressed', String(p.getAttribute('aria-pressed') !== 'true'));
      syncPains();
    });
  });
  goEl.addEventListener('click', function(){
    var sel = selectedPains();
    try { if (window.dataLayer) window.dataLayer.push({ event: 'whatsapp_click', label: 'situacoes', itens: sel.length }); } catch (e) {}
    try { if (window.fbq) window.fbq('track', 'Contact'); } catch (e) {}
  });
  syncPains();

  /* ===== Máscara de telefone ===== */
  var tel = document.getElementById('f-tel');
  tel.addEventListener('input', function(){
    var d = tel.value.replace(/\D/g, '').slice(0, 11);
    var out = d;
    if (d.length > 2) out = '(' + d.slice(0,2) + ') ' + d.slice(2);
    if (d.length > 6) out = '(' + d.slice(0,2) + ') ' + d.slice(2, d.length === 11 ? 7 : 6) + '-' + d.slice(d.length === 11 ? 7 : 6);
    tel.value = out;
  });

  /* ===== Envio do formulário: monta a mensagem e abre o WhatsApp ===== */
  var form = document.getElementById('lead-form');
  var errEl = document.getElementById('form-error');
  form.addEventListener('submit', function(e){
    e.preventDefault();
    if (!form.checkValidity()) {
      var first = form.querySelector(':invalid');
      errEl.hidden = false;
      errEl.textContent = first && first.id === 'f-ok' ? 'Marque a autorização de contato para continuar.' :
        first && first.id === 'f-tel' ? 'Confira o WhatsApp: use DDD e número, como (27) 99999-9999.' : 'Preencha os campos marcados com *.';
      if (first) first.focus();
      return;
    }
    errEl.hidden = true;
    var data = Object.fromEntries(new FormData(form).entries());
    var lines = ['Olá, Dr. Rafael! Vim pelo site.', '', 'Nome: ' + data.nome];
    if (data.empresa && data.empresa.trim()) lines.push('Empresa: ' + data.empresa.trim());
    if (data.assunto) lines.push('Assunto: ' + data.assunto);
    lines.push('WhatsApp: ' + data.whatsapp);
    if (data.mensagem && data.mensagem.trim()) lines.push('', 'O que está acontecendo:', data.mensagem.trim());
    if (origem) lines.push('', '(origem: ' + origem + ')');
    var url = waUrl(lines.join('\n'));

    if (CONFIG.webhookUrl) {
      try {
        fetch(CONFIG.webhookUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nome: data.nome, empresa: data.empresa || '', assunto: data.assunto || '', whatsapp: data.whatsapp,
            mensagem: data.mensagem || '', situacoes: selectedPains(), origem: origem, pagina: location.href, enviadoEm: new Date().toISOString() }) })
          .catch(function(){});
      } catch (err) {}
    }
    try { if (window.dataLayer) window.dataLayer.push({ event: 'lead_form', label: data.assunto || '' }); } catch (err) {}
    try { if (window.fbq) window.fbq('track', 'Lead'); } catch (err) {}

    document.getElementById('done-title').textContent = 'Pronto, ' + data.nome.split(' ')[0] + '!';
    document.getElementById('done-link').href = url;
    form.hidden = true;
    document.getElementById('done').hidden = false;
    document.dispatchEvent(new CustomEvent('rp:lead'));
    try { var w = window.open(url, '_blank'); if (w) w.opener = null; } catch (err) {}
  });

  /* ===== Barra fixa do celular some na seção de contato ===== */
  var mbar = document.getElementById('mbar');
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function(entries){
      entries.forEach(function(en){ mbar.classList.toggle('away', en.isIntersecting); });
    }, { threshold: 0.15 }).observe(document.getElementById('contato'));
  }

  /* ===== Fundo do hero: leque de linhas finas em dourado (eco do monograma) ===== */
  var canvas = document.getElementById('mesh');
  function drawFan(){
    var rect = canvas.getBoundingClientRect();
    if (!rect.width) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = rect.width * dpr; canvas.height = rect.height * dpr;
    var ctx = canvas.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, rect.width, rect.height);
    var ox = rect.width * 1.02, oy = -rect.height * 0.12, len = Math.hypot(rect.width, rect.height) * 1.6;
    // brilho suave no canto
    var g = ctx.createRadialGradient(ox, oy, 0, ox, oy, rect.width * 0.75);
    g.addColorStop(0, 'rgba(201,166,107,0.16)'); g.addColorStop(1, 'rgba(201,166,107,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, rect.width, rect.height);
    // raios
    var n = rect.width < 700 ? 34 : 56;
    for (var i = 0; i < n; i++) {
      var t = i / (n - 1), a = (96 + t * 84) * Math.PI / 180;
      ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + Math.cos(a) * len, oy + Math.sin(a) * len);
      ctx.strokeStyle = 'rgba(201,166,107,' + (0.035 + 0.075 * Math.sin(t * Math.PI)).toFixed(3) + ')';
      ctx.lineWidth = i % 7 === 0 ? 1.4 : 1; ctx.stroke();
    }
    // arcos concêntricos
    for (var r = 120; r < len * 0.7; r += 96) {
      ctx.beginPath(); ctx.arc(ox, oy, r, 0.5 * Math.PI, Math.PI, false);
      ctx.strokeStyle = 'rgba(169,180,200,' + Math.max(0.025, 0.09 - r / 9000).toFixed(3) + ')'; ctx.lineWidth = 1; ctx.stroke();
    }
  }
  drawFan();
  var rz; window.addEventListener('resize', function(){ clearTimeout(rz); rz = setTimeout(drawFan, 150); });
})();
