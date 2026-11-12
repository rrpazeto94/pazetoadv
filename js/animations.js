/* =====================================================================
   ANIMAÇÕES DO SITE
   Todo o movimento do site fica neste arquivo.

   Bibliotecas (carregadas no index.html, antes deste arquivo):
   - GSAP + ScrollTrigger: animações e efeitos ligados à rolagem
   - Lenis: rolagem suave

   Para desligar todas as animações: apague a linha
   <script src="js/animations.js"></script> no index.html.
   O site continua funcionando normalmente sem este arquivo.

   Quem ativou "reduzir movimento" no celular/computador não recebe
   animações (acessibilidade).
   ===================================================================== */
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !window.gsap || !window.ScrollTrigger) return;

  gsap.registerPlugin(ScrollTrigger);
  document.documentElement.classList.add('motion');

  /* ---------- Ajustes rápidos ---------- */
  var EASE = 'power3.out';      // curva padrão das entradas
  var REVEAL_Y = 28;            // quantos pixels o elemento sobe ao aparecer
  var REVEAL_DUR = 0.8;         // duração das entradas (segundos)
  var MAGNET = 0.22;            // força do efeito "ímã" nos botões (0 desliga)
  var isDesktop = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* =========================================================
     1. ROLAGEM SUAVE
     ========================================================= */
  var lenis = null;
  if (window.Lenis) {
    lenis = new Lenis({ duration: 1.15, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);

    // Links internos (#contato, #servicos...) deslizam até a seção
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href');
        if (id.length < 2) return;
        var target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        lenis.scrollTo(target, { offset: -76, duration: 1.4 });
      });
    });
  }

  /* =========================================================
     2. ABERTURA DO HERO (o momento principal)
     ========================================================= */
  var intro = gsap.timeline({ defaults: { ease: EASE } });
  intro
    .from('#mesh', { opacity: 0, duration: 1.8, ease: 'power1.out' }, 0)
    .from('.nav', { y: -24, opacity: 0, duration: 0.7 }, 0.05)
    .from('.hero-copy > *', { y: 30, opacity: 0, duration: 0.9, stagger: 0.09 }, 0.2)
    .from('.hero-area', { y: 18, opacity: 0, duration: 0.7, stagger: 0.1 }, 0.65);

  // Malha do fundo se move mais devagar que a página (profundidade)
  gsap.to('#mesh', {
    yPercent: 16, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
  });

  /* =========================================================
     3. MENU GANHA FUNDO AO ROLAR
     ========================================================= */
  var nav = document.querySelector('.nav');
  ScrollTrigger.create({
    start: 'top -12',
    onToggle: function (self) { nav.classList.toggle('is-scrolled', self.isActive); }
  });

  /* =========================================================
     4. ENTRADAS AO ROLAR
     ========================================================= */
  // Títulos de seção: cada linha entra em sequência
  gsap.utils.toArray('.section-head, .pains-head, .approach-intro, .trust-intro, .contact-intro').forEach(function (head) {
    gsap.from(head.children, {
      y: REVEAL_Y, opacity: 0, duration: REVEAL_DUR, ease: EASE, stagger: 0.08,
      scrollTrigger: { trigger: head, start: 'top 85%', once: true }
    });
  });

  // Grupos de cards: entram em cascata conforme aparecem
  var groups = '.pain, .pillar, .svc, .phase, .segs > a, .trust-list li, .faq details';
  gsap.set(groups, { opacity: 0, y: REVEAL_Y });
  ScrollTrigger.batch(groups, {
    start: 'top 90%', once: true,
    onEnter: function (batch) {
      gsap.to(batch, { opacity: 1, y: 0, duration: REVEAL_DUR, ease: EASE, stagger: 0.07, overwrite: true });
    }
  });

  // Elementos avulsos
  gsap.utils.toArray('.pains-cta, .wa-preview, .method-note, .segs-note, .form').forEach(function (el) {
    gsap.from(el, {
      y: REVEAL_Y, opacity: 0, duration: REVEAL_DUR, ease: EASE,
      scrollTrigger: { trigger: el, start: 'top 90%', once: true }
    });
  });

  // Faixa colorida da seção "Abordagem" se desenha
  gsap.from('.facet-rule', {
    scaleX: 0, transformOrigin: 'left center', duration: 1.3, ease: 'expo.out',
    scrollTrigger: { trigger: '.facet-rule', start: 'top 88%', once: true }
  });

  /* =========================================================
     5. MÉTODO: as barras das fases enchem conforme a rolagem
     ========================================================= */
  var phases = gsap.utils.toArray('.phase');
  if (phases.length) {
    gsap.timeline({
      scrollTrigger: { trigger: '.method', start: 'top 80%', end: 'top 30%', scrub: 0.6 }
    }).fromTo(phases, { '--fill': 0 }, { '--fill': 1, ease: 'none', stagger: 0.35 });
  }

  /* =========================================================
     6. MICROINTERAÇÕES
     ========================================================= */
  // Checkbox das dores dá um "pulo" ao marcar
  document.querySelectorAll('.pain').forEach(function (p) {
    p.addEventListener('click', function () {
      if (p.getAttribute('aria-pressed') === 'true') {
        gsap.fromTo(p.querySelector('.box'), { scale: 0.55 }, { scale: 1, duration: 0.5, ease: 'back.out(3)' });
      }
    });
  });

  // Painel de confirmação após enviar o formulário
  document.addEventListener('rp:lead', function () {
    gsap.from('#done > *', { y: 18, opacity: 0, duration: 0.6, ease: EASE, stagger: 0.08 });
  });

  // FAQ abre e fecha deslizando
  document.querySelectorAll('.faq details').forEach(function (d) {
    var summary = d.querySelector('summary');
    var body = d.querySelector('.ans');
    summary.addEventListener('click', function (e) {
      e.preventDefault();
      if (!d.open) {
        d.open = true;
        gsap.fromTo(body, { height: 0, opacity: 0 },
          { height: 'auto', opacity: 1, duration: 0.45, ease: EASE,
            onComplete: function () { gsap.set(body, { clearProps: 'height,opacity' }); ScrollTrigger.refresh(); } });
      } else {
        gsap.to(body, { height: 0, opacity: 0, duration: 0.35, ease: 'power2.in',
          onComplete: function () { d.open = false; gsap.set(body, { clearProps: 'height,opacity' }); ScrollTrigger.refresh(); } });
      }
    });
  });

  // Botões principais com efeito ímã (só com mouse)
  if (isDesktop && MAGNET > 0) {
    document.querySelectorAll('.btn-primary').forEach(function (btn) {
      var toX = gsap.quickTo(btn, 'x', { duration: 0.4, ease: EASE });
      var toY = gsap.quickTo(btn, 'y', { duration: 0.4, ease: EASE });
      btn.addEventListener('mousemove', function (e) {
        var r = btn.getBoundingClientRect();
        toX((e.clientX - r.left - r.width / 2) * MAGNET);
        toY((e.clientY - r.top - r.height / 2) * MAGNET - 2);
      });
      btn.addEventListener('mouseleave', function () { toX(0); toY(0); });
    });
  }

  /* Recalcula posições quando as fontes terminam de carregar */
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
})();
