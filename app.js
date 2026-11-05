
(function(){
gsap.registerPlugin(ScrollTrigger);
// always open at the top, so the opening animation is the first thing people see
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
if (!location.hash) window.scrollTo({ top: 0, behavior: 'instant' });
var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
var fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
var root = document.documentElement;
var $ = function(id){ return document.getElementById(id); };
var esc = function(s){ return String(s).replace(/[&<>"]/g, function(c){ return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
var timeNow = function(){ return new Date().toLocaleTimeString('ar-EG', { hour: 'numeric', minute: '2-digit' }); };

/* ---------- prefs: light by default ---------- */
var prefs = { mode: 'dark', lang: 'en' };
var HB = window.HB = { p: 0 };   // shared with the 3D engine: how far "What we build" has scrolled
var onLang = [];                  // things to redraw when the language changes
try { Object.assign(prefs, JSON.parse(localStorage.getItem('hindawy-v7') || '{}')); } catch (e) {}
prefs.lang = 'en';                // the site always opens in English; the ع button switches for this visit only
function save(){ try { localStorage.setItem('hindawy-v7', JSON.stringify(prefs)); } catch (e) {} }
// the button shows where it will take you: a sun in dark mode, a moon in light mode
var MODE_ICON = {
  dark: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5"/>',
  light: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>'
};
function applyMode(){
  if (prefs.mode !== 'light') prefs.mode = 'dark';
  root.dataset.mode = prefs.mode;
  var b = $('modeBtn'); b.querySelector('svg').innerHTML = MODE_ICON[prefs.mode];
  b.setAttribute('aria-label', prefs.mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'); b.title = prefs.mode === 'dark' ? 'فاتح' : 'غامق';
}
applyMode();
$('modeBtn').addEventListener('click', function(){ prefs.mode = prefs.mode === 'dark' ? 'light' : 'dark'; save(); applyMode(); });
// the wordmark types itself once
(function(){
  var el = $('wmTyp'), full = 'hindawy', n = 0;
  if (reduce) return; el.textContent = '';
  setTimeout(function step(){ el.textContent = full.slice(0, ++n); if (n < full.length) setTimeout(step, 110); }, 300);
})();
/* language switch: every element with data-ar swaps to its Arabic version, and listeners redraw generated parts */
function applyLang(onlyNew){
  var ar = prefs.lang === 'ar';
  root.dataset.lang = prefs.lang;
  document.querySelectorAll('[data-ar]').forEach(function(el){
    if (onlyNew && el.dataset.en !== undefined) return;   // already handled (and maybe animating, like the typed slogan)
    if (el.dataset.en === undefined) el.dataset.en = el.innerHTML;
    el.innerHTML = ar ? el.dataset.ar : el.dataset.en;
    el.classList.toggle('is-ar', ar);
  });
  var b = $('langBtn'); b.textContent = ar ? 'EN' : 'ع'; b.setAttribute('aria-label', ar ? 'English' : 'عربي');
  onLang.forEach(function(fn){ fn(); });
}
$('langBtn').addEventListener('click', function(){ prefs.lang = prefs.lang === 'ar' ? 'en' : 'ar'; save(); applyLang(false); });
applyLang();
$('yr').textContent = new Date().getFullYear();

/* ---------- header: hides on scroll down, sliding pip on the active link ---------- */
(function(){
  var top = $('top'), last = 0;
  addEventListener('scroll', function(){
    var y = scrollY; top.classList.toggle('solid', y > 30);
    top.classList.toggle('hide', y > last && y > 300 && $('menu').hidden); last = y;
  }, { passive: true });
  var pip = $('pip'), links = $('links');
  function movePip(a){ if (!a) { pip.style.opacity = 0; return; } pip.style.opacity = 1; pip.style.left = a.offsetLeft + 'px'; pip.style.width = a.offsetWidth + 'px'; }
  links.querySelectorAll('a').forEach(function(a){ a.addEventListener('mouseenter', function(){ movePip(a); }); });
  links.addEventListener('mouseleave', function(){ movePip(links.querySelector('a.on')); });
  // wait until the project sections exist before watching them
  setTimeout(function(){
    [['team','team'],['work','work'],['build','build'],['uses','uses'],['contact','contact']].forEach(function(x){
      var end = x[0] === 'work' ? document.querySelectorAll('.proj')[document.querySelectorAll('.proj').length - 1] : '#' + x[0];
      ScrollTrigger.create({ trigger: '#' + x[0], endTrigger: end, start: 'top 55%', end: 'bottom 45%', onToggle: function(st){
        var a = links.querySelector('a[href="#' + x[1] + '"]'); if (!a) return; a.classList.toggle('on', st.isActive); movePip(links.querySelector('a.on')); } });
    });
  }, 0);
  $('burger').addEventListener('click', function(){ $('menu').hidden = false; if (!reduce) gsap.from('#menu a', { y: 30, opacity: 0, stagger: .06, duration: .5, ease: 'expo.out' }); });
  $('menuX').addEventListener('click', function(){ $('menu').hidden = true; });
  $('menu').querySelectorAll('a').forEach(function(a){ a.addEventListener('click', function(){ $('menu').hidden = true; }); });
})();

/* ---------- reading effect: words light up as you go ---------- */
function splitWords(el){
  var words = el.textContent.trim().split(/\s+/);
  el.innerHTML = words.map(function(w){ return '<span class="w">' + esc(w) + '</span>'; }).join(' ');
  return el.querySelectorAll('.w');
}
// a beam of light runs along the line, word by word, and leaves the words lit behind it
function beam(ws, delay){
  var i = 0;
  setTimeout(function step(){ if (i > 0) ws[i - 1].classList.remove('now'); if (i >= ws.length) return;
    ws[i].classList.add('lit', 'now'); i++; setTimeout(step, 95); }, delay || 0);
}
function readOnTime(el, delay){ if (!reduce) beam(splitWords(el), delay); }
// same beam, but it starts only once the text is on screen
function readWhenSeen(el){
  if (reduce) return; var ws = splitWords(el);
  new IntersectionObserver(function(es, ob){ if (es[0].isIntersecting) { ob.disconnect(); beam(ws, 150); } }, { threshold: .6 }).observe(el);
}

/* ---------- hero: typed slogan, then the lines read themselves ---------- */
var typed = $('typed');
if (!reduce) {
  var plain = [], tmp = document.createElement('div'); tmp.innerHTML = typed.innerHTML;
  (function walk(node, hl){ node.childNodes.forEach(function(n){ if (n.nodeType === 3) n.textContent.split('').forEach(function(ch){ plain.push([ch, hl]); }); else walk(n, true); }); })(tmp, false);
  typed.innerHTML = ''; typed.classList.add('caret');
  var span = null, cur = null, ti = 0;
  (function step(){
    var it = plain[ti++];
    if (it[1] !== cur || !span) { span = document.createElement('span'); if (it[1]) span.className = 'hl'; typed.appendChild(span); cur = it[1]; }
    span.textContent += it[0];
    if (ti < plain.length) setTimeout(step, it[0] === ' ' ? 90 : 60);
    else setTimeout(function(){ typed.classList.remove('caret'); typed.querySelectorAll('span').forEach(function(s){ s.classList.add('beam'); }); }, 1600);
  })();
  gsap.from('#goal', { x: -20, opacity: 0, duration: .8, delay: 1.5, ease: 'expo.out' });
  readOnTime($('heroSub'), 1600); readOnTime($('heroAr'), 3200);
  gsap.from('.hero .cta', { y: 20, opacity: 0, duration: 1, delay: 2.2 });
}

/* ---------- founders: Hunter-style cards ---------- */
var PERSON = '<svg viewBox="0 0 100 100" fill="currentColor"><circle cx="50" cy="34" r="20"/><path d="M8 100c4-26 22-40 42-40s38 14 42 40z"/></svg>';
var FOUNDERS = [
  { no: '001', rank: 'SS', name: 'Eng. Ahmed Hindawy', short: 'AHMED HINDAWY', role: 'Co-Founder & CEO', born: '2010-04-01', photo: 'assets/ahmed-bw.webp?v=5',
    roles: ['Automation Engineer', 'Front-End Developer', 'AI Engineer', 'Industrial AI'],
    stats: [['AGE', 'auto'], ['STUDY', 'Baccalaureate'], ['BASED', 'Egypt'], ['PROJECTS', '4+']],
    bio: 'Builds the screens people touch and the automations behind them. Started HINDAWY to give schools, centers and businesses the same quality of software big companies use.',
    bioAr: 'بيبني الشاشات اللي الناس بتستخدمها والأتمتة اللي وراها. أسّس HINDAWY عشان يدّي المدارس والسناتر والشركات نفس مستوى البرامج اللي بتستخدمها الشركات الكبيرة.',
    focus: [['Front-end & UX', 'الواجهات وتجربة المستخدم'], ['Automation workflows', 'أتمتة الشغل'], ['AI assistants', 'المساعدات الذكية'], ['Industrial AI', 'الذكاء الاصطناعي في المصانع']] },
  { no: '002', rank: 'SS', name: 'Eng. Mohamed Hindawy', short: 'MOHAMED HINDAWY', role: 'Co-Founder & CEO', born: null,
    roles: ['Automation Engineer', 'AI Engineer', 'Industrial AI', 'CS'],
    stats: [['AGE', '18'], ['STUDY', 'CS'], ['BASED', 'Egypt'], ['FOCUS', 'AI']],
    bio: 'Studies CS and leads the AI side: models that read data, predict problems and save hours of manual work.',
    bioAr: 'بيدرس علوم الحاسب وماسك جانب الذكاء الاصطناعي: موديلات بتقرا البيانات وتتوقع المشاكل وتوفّر ساعات من الشغل اليدوي.',
    focus: [['AI models', 'موديلات الذكاء الاصطناعي'], ['Industrial AI', 'الذكاء الاصطناعي في المصانع'], ['Automation', 'الأتمتة'], ['Data & systems', 'البيانات والأنظمة']] }
];
function age(b){ var d = new Date(b), n = new Date(), a = n.getFullYear() - d.getFullYear(); if (n.getMonth() < d.getMonth() || (n.getMonth() === d.getMonth() && n.getDate() < d.getDate())) a--; return a; }
function hcard(f, big){
  return '<div class="hwrap"><div class="hcard"><div class="hc-in"><div class="hc-top"><span>No.' + f.no + '</span><span class="hc-rank"><i></i><i></i><i></i></span></div>' +
    '<div class="hc-photo">' + (f.photo ? '<img src="' + f.photo + '" alt="' + f.name + '" width="720" height="864"' + (big ? ' loading="lazy"' : '') + ' decoding="async">' : '<div class="slot"><div>' + PERSON + 'PHOTO</div></div>') + '<div class="scan"></div></div>' +
    '<div class="hc-name"><b>' + f.short + '</b><small>' + f.role.toUpperCase() + '</small></div><div class="hc-bars"><i></i><i></i><i></i><i></i><i></i></div>' +
    '<div class="hc-foot"><span>HINDAWY</span><span>' + (big ? 'FOUNDER' : 'F-' + f.no) + '</span></div><i class="shine"></i></div><div class="slash"></div></div></div>';
}
$('duo').innerHTML = FOUNDERS.map(function(f){ return hcard(f, false); }).join('');
$('founders').innerHTML = FOUNDERS.map(function(f, i){
  return '<div class="frow' + (i % 2 ? ' flip' : '') + '"><div class="fc">' + hcard(f, true) + '</div>' +
    '<div class="finfo glass"><span class="label">' + f.role + '</span><h3 class="fname" aria-label="' + f.name + '"><span class="eng">Engineer</span><span class="type" data-text="' + f.short + '">' + f.short + '</span></h3>' +
    '<div class="roles">' + f.roles.map(function(r){ return '<span>' + r + '</span>'; }).join('') + '</div>' +
    '<div class="stats">' + f.stats.map(function(s){ return '<div><small>' + s[0] + '</small><b>' + (s[1] === 'auto' ? age(f.born) : s[1]) + '</b></div>'; }).join('') + '</div>' +
    '<p class="bio read">' + f.bio + '</p><p class="bio ar read">' + f.bioAr + '</p>' +
    '<div class="focus">' + f.focus.map(function(x){ return '<div><b>' + x[0] + '</b><small>' + x[1] + '</small></div>'; }).join('') + '</div></div></div>';
}).join('');
// hero cards: each one falls on its own, and a line of light crosses it as it lands.
// It waits until the page has fully loaded and the visitor is at the top.
if (!reduce) (function(){
  var cards = [].slice.call($('duo').querySelectorAll('.hwrap'));
  gsap.set(cards, { opacity: 0 });
  function play(){
    var tl = gsap.timeline();
    cards.forEach(function(c, i){
      var at = i * .7, sl = c.querySelector('.slash');
      tl.fromTo(c, { y: -innerHeight * .85, rotate: i ? 8 : -8, opacity: 1 }, { y: 0, rotate: 0, duration: .6, ease: 'power3.in' }, at)
        .fromTo(c, { scale: 1.05 }, { scale: 1, duration: .6, ease: 'elastic.out(1,.45)' }, at + .6)
        .fromTo(sl, { scaleX: 0, opacity: 1 }, { scaleX: 1, duration: .18, ease: 'power3.out' }, at + .62)
        .to(sl, { opacity: 0, duration: .3 }, at + .82);
    });
  }
  function ready(){
    if (scrollY < innerHeight * .5) setTimeout(play, 350);
    else ScrollTrigger.create({ trigger: '#duo', start: 'top 80%', once: true, onEnter: play });
  }
  if (document.readyState === 'complete') ready(); else addEventListener('load', ready);
})();
document.querySelectorAll('.frow').forEach(function(row, i){
  var card = row.querySelector('.fc .hcard'), slash = card.querySelector('.slash'), info = row.querySelector('.finfo');
  if (!reduce) gsap.set(card, { y: -700, rotate: i % 2 ? 18 : -18, opacity: 0 });
  ScrollTrigger.create({ trigger: row, start: 'top 70%', once: true, onEnter: function(){
    if (reduce) return;
   
    gsap.timeline()
      .to(card, { y: 0, rotate: 0, opacity: 1, duration: .55, ease: 'power4.in' })
      .fromTo(slash, { scaleX: 0, opacity: 1 }, { scaleX: 1, duration: .22, ease: 'power3.out' })
      .to(slash, { opacity: 0, duration: .35 })
      .fromTo(row, { x: -8 }, { x: 0, duration: .45, ease: 'elastic.out(1.2,.3)' }, '-=.55')
      .from(info, { x: i % 2 ? -60 : 60, opacity: 0, duration: .8, ease: 'expo.out' }, '-=.4')
      .add(function(){ typeIn(info.querySelector('.type')); });
  }});
});
function typeIn(h){
  if (h.dataset.done) return; h.dataset.done = 1;
  var full = h.dataset.text, n = 0; h.textContent = ''; h.classList.add('caret');
  (function step(){ h.textContent = full.slice(0, ++n);
    if (n < full.length) setTimeout(step, 45); else { h.classList.remove('caret'); h.classList.add('lit'); } })();
}
document.querySelectorAll('#founders .read').forEach(readWhenSeen);

/* ---------- brand icons (official marks, from Simple Icons / Devicon) ---------- */
var EYE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>';
var BR = {
  web: ['#2E9BFF', '<circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/><path d="M2 12h20M12 2c3 3.5 3 16.5 0 20M12 2c-3 3.5-3 16.5 0 20" fill="none" stroke="currentColor" stroke-width="2"/>'],
  whatsapp: ['#25D366', 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z'],
  instagram: ['#E4405F', 'M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.056 1.6884.069 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.6682 1.0745-1.3378 1.3795-2.1284.2957-.7632.4966-1.636.552-2.9124.056-1.2809.0692-1.6898.063-4.948-.0063-3.2583-.021-3.6668-.0817-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.2982 1.33 20.628.9208 19.8378.6165 19.074.321 18.2017.1197 16.9244.0645 15.6471.0093 15.236-.005 11.977.0014 8.718.0076 8.31.0215 7.0301.0839m.1402 21.6932c-1.17-.0509-1.8053-.2453-2.2287-.408-.5606-.216-.96-.4771-1.3819-.895-.422-.4178-.6811-.8186-.9-1.378-.1644-.4234-.3624-1.058-.4171-2.228-.0595-1.2645-.072-1.6442-.079-4.848-.007-3.2037.0053-3.583.0607-4.848.05-1.169.2456-1.805.408-2.2282.216-.5613.4762-.96.895-1.3816.4188-.4217.8184-.6814 1.3783-.9003.423-.1651 1.0575-.3614 2.227-.4171 1.2655-.06 1.6447-.072 4.848-.079 3.2033-.007 3.5835.005 4.8495.0608 1.169.0508 1.8053.2445 2.228.408.5608.216.96.4754 1.3816.895.4217.4194.6816.8176.9005 1.3787.1653.4217.3617 1.056.4169 2.2263.0602 1.2655.0739 1.645.0796 4.848.0058 3.203-.0055 3.5834-.061 4.848-.051 1.17-.245 1.8055-.408 2.2294-.216.5604-.4763.96-.8954 1.3814-.419.4215-.8181.6811-1.3783.9-.4224.1649-1.0577.3617-2.2262.4174-1.2656.0595-1.6448.072-4.8493.079-3.2045.007-3.5825-.006-4.848-.0608M16.953 5.5864A1.44 1.44 0 1 0 18.39 4.144a1.44 1.44 0 0 0-1.437 1.4424M5.8385 12.012c.0067 3.4032 2.7706 6.1557 6.173 6.1493 3.4026-.0065 6.157-2.7701 6.1506-6.1733-.0065-3.4032-2.771-6.1565-6.174-6.1498-3.403.0067-6.156 2.771-6.1496 6.1738M8 12.0077a4 4 0 1 1 4.008 3.9921A3.9996 3.9996 0 0 1 8 12.0077'],
  tiktok: ['#000000', 'M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z'],
  messenger: ['#0084FF', 'M.001 11.639C.001 4.949 5.241 0 12.001 0S24 4.95 24 11.639c0 6.689-5.24 11.638-12 11.638-1.21 0-2.38-.16-3.47-.46a.96.96 0 00-.64.05l-2.39 1.05a.96.96 0 01-1.35-.85l-.07-2.14a.97.97 0 00-.32-.68A11.39 11.389 0 01.002 11.64zm8.32-2.19l-3.52 5.6c-.35.53.32 1.139.82.75l3.79-2.87c.26-.2.6-.2.87 0l2.8 2.1c.84.63 2.04.4 2.6-.48l3.52-5.6c.35-.53-.32-1.13-.82-.75l-3.79 2.87c-.25.2-.6.2-.86 0l-2.8-2.1a1.8 1.8 0 00-2.61.48z'],
  facebook: ['#0866FF', 'M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z'],
  telegram: ['#26A5E4', 'M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z'],
  sheets: ['#34A853', 'M11.318 12.545H7.91v-1.909h3.41v1.91zM14.728 0v6h6l-6-6zm1.363 10.636h-3.41v1.91h3.41v-1.91zm0 3.273h-3.41v1.91h3.41v-1.91zM20.727 6.5v15.864c0 .904-.732 1.636-1.636 1.636H4.909a1.636 1.636 0 0 1-1.636-1.636V1.636C3.273.732 4.005 0 4.909 0h9.318v6.5h6.5zm-3.273 2.773H6.545v7.909h10.91v-7.91zm-6.136 4.636H7.91v1.91h3.41v-1.91z'],
  maps: ['#4285F4', 'M19.527 4.799c1.212 2.608.937 5.678-.405 8.173-1.101 2.047-2.744 3.74-4.098 5.614-.619.858-1.244 1.75-1.669 2.727-.141.325-.263.658-.383.992-.121.333-.224.673-.34 1.008-.109.314-.236.684-.627.687h-.007c-.466-.001-.579-.53-.695-.887-.284-.874-.581-1.713-1.019-2.525-.51-.944-1.145-1.817-1.79-2.671L19.527 4.799zM8.545 7.705l-3.959 4.707c.724 1.54 1.821 2.863 2.871 4.18.247.31.494.622.737.936l4.984-5.925-.029.01c-1.741.601-3.691-.291-4.392-1.987a3.377 3.377 0 0 1-.209-.716c-.063-.437-.077-.761-.004-1.198l.001-.007zM5.492 3.149l-.003.004c-1.947 2.466-2.281 5.88-1.117 8.77l4.785-5.689-.058-.05-3.607-3.035zM14.661.436l-3.838 4.563a.295.295 0 0 1 .027-.01c1.6-.551 3.403.15 4.22 1.626.176.319.323.683.377 1.045.068.446.085.773.012 1.22l-.003.016 3.836-4.561A8.382 8.382 0 0 0 14.67.439l-.009-.003zM9.466 5.868L14.162.285l-.047-.012A8.31 8.31 0 0 0 11.986 0a8.439 8.439 0 0 0-6.169 2.766l-.016.018 3.665 3.084z']
};
function brandSvg(k){ var b = BR[k], body = b[1].charAt(0) === '<' ? b[1] : '<path fill="currentColor" d="' + b[1] + '"/>'; return '<svg viewBox="0 0 24 24" style="color:' + b[0] + '" aria-hidden="true">' + body + '</svg>'; }
var BR_NAME = { web: 'Website', whatsapp: 'WhatsApp', instagram: 'Instagram', tiktok: 'TikTok', messenger: 'Messenger', facebook: 'Facebook', telegram: 'Telegram', sheets: 'Google Sheets', maps: 'Google Maps' };
function brands(list){ return '<span class="brands">' + list.map(function(k){ return '<i title="' + BR_NAME[k] + '">' + brandSvg(k) + '</i>'; }).join('') + '</span>'; }

/* ---------- screen builders for the app mock-ups ---------- */
var A = function(title, body, sub){ return '<div class="ua"><div class="ua-bar"><b>' + title + '</b>' + (sub ? '<small>' + sub + '</small>' : '') + '</div><div class="ua-body">' + body + '</div></div>'; };
var R = function(a, b, cls, tap){ return '<div class="ua-row ' + (cls || '') + '"' + (tap ? ' data-tap' : '') + '><span>' + a + '</span><span>' + (b || '') + '</span></div>'; };
var B = function(t, tap, alt){ return '<button type="button" class="ua-btn' + (alt ? ' alt' : '') + '"' + (tap ? ' data-tap' : '') + '>' + t + '</button>'; };
var C = function(k, v){ return '<div class="ua-card"><small>' + k + '</small><b>' + v + '</b></div>'; };
var G = function(){ return '<div class="ua-grid">' + [].join.call(arguments, '') + '</div>'; };
var M = function(t, me){ return '<div class="ua-msg' + (me ? ' me' : '') + '">' + t + '</div>'; };
var T = function(t){ return '<div class="ua-toast">' + t + '</div>'; };
var N = function(t){ return '<div class="ua-note">' + t + '</div>'; };
var BARS = function(arr){ return '<div class="ua-bars">' + arr.map(function(h){ return '<i style="height:' + h + '%"></i>'; }).join('') + '</div>'; };
var NAMES = ['محمد أحمد','يوسف علي','عمر خالد','مريم حسن','سارة محمود','أحمد سمير','نور الدين','حبيبة طارق','زياد إبراهيم','ملك عادل','كريم مصطفى','جنى وليد','آدم شريف','فرح ياسر'];
// a small data table inside a phone or browser screen
var TBL = function(head, rows){ return '<table class="ua-tbl"><thead><tr>' + head.map(function(h){ return '<th>' + h + '</th>'; }).join('') + '</tr></thead><tbody>' +
  rows.map(function(r){ return '<tr>' + r.map(function(c){ return '<td>' + c + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table>'; };
// a screen with its own colour (used for the social apps)
var AX = function(color, title, body, sub, chatBg){ return '<div class="ua" style="--app:' + color + (chatBg ? ';background:' + chatBg : '') + '"><div class="ua-bar"><b>' + title + '</b>' + (sub ? '<small>' + sub + '</small>' : '') + '</div><div class="ua-body">' + body + '</div></div>'; };
var NAMEGRID = function(abs, tapIdx){ return '<div class="ua-names">' + NAMES.map(function(n, i){ return '<span' + (abs.indexOf(i) > -1 ? ' class="abs"' : '') + (i === tapIdx ? ' data-tap' : '') + '>' + n + '</span>'; }).join('') + '</div>'; };

/* ---------- journey: how a real user uses it (auto, or step-by-step "try it") ---------- */
function journey(el, cfg, interactive){
  el.innerHTML = '<div class="jr' + (interactive ? ' try' : '') + '"><div class="jr-words"><span class="label">' + cfg.user + '</span><h4></h4><p class="ar"></p><div class="jr-note" hidden><i>' + EYE + '</i><div><b></b><p class="ar"></p></div></div><div class="dots">' +
    cfg.scenes.map(function(){ return '<i></i>'; }).join('') + '</div>' + (interactive ? '<p class="hint">TAP THE GLOWING BUTTON · اضغط على الحاجة اللي بتنوّر</p>' : '') + '</div>' +
    '<div class="jr-dev ' + cfg.device + '"><div class="screen" style="--app:' + cfg.color + '"></div><i class="tapdot"></i></div></div>';
  var h4 = el.querySelector('h4'), ar = el.querySelector('.jr-words > .ar'), scr = el.querySelector('.screen'), dev = el.querySelector('.jr-dev'), dot = el.querySelector('.tapdot'), dots = el.querySelectorAll('.dots i');
  var calls = [], idx = 0, dead = false;
  // every step waits while the animation is off screen, so it pauses (and stays silent) the moment you scroll away
  var later = function(s, fn){
    var c = gsap.delayedCall(s, function tick(){ if (dead) return; if (!seen) { calls.push(gsap.delayedCall(.3, tick)); return; } fn(); });
    calls.push(c);
  };
  // the animation plays only while the visitor is actually looking at it (most of it on screen)
  var seen = false, io = new IntersectionObserver(function(es){
    var e = es[0], need = Math.min(e.boundingClientRect.height, innerHeight) * .6;
    seen = e.isIntersecting && e.intersectionRect.height >= need;
  }, { threshold: [0, .2, .4, .5, .6, .7, .8, 1] });
  io.observe(el);
  function show(i){
    idx = i; var sc = cfg.scenes[i];
    dots.forEach(function(d, j){ d.classList.toggle('on', j <= i); });
    // the big line is in the visitor's language, the small line in the other one
    var isAr = prefs.lang === 'ar', big = isAr ? sc.ar : sc.en, small = isAr ? sc.en : sc.ar;
    h4.classList.toggle('is-ar', isAr); h4.dir = isAr ? 'rtl' : 'ltr';
    h4.innerHTML = big.split(' ').map(function(w){ return '<span>' + w + '</span>'; }).join(' ');
    ar.className = isAr ? 'en' : 'ar'; ar.textContent = small; scr.innerHTML = sc.s;
    var note = el.querySelector('.jr-note');
    note.hidden = !sc.note;
    if (sc.note) { note.querySelector('b').textContent = sc.note[0]; note.querySelector('.ar').textContent = sc.note[1]; if (!reduce) gsap.fromTo(note, { x: -14, opacity: 0 }, { x: 0, opacity: 1, duration: .5, delay: .45 }); }
    if (!reduce) {
      gsap.fromTo(h4.children, { y: 26, opacity: 0, }, { y: 0, opacity: 1, duration: .6, stagger: .06, ease: 'expo.out' });
      gsap.fromTo(ar, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: .5, delay: .3 });
      gsap.fromTo(scr.querySelectorAll('.ua-body > *'), { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: .45, stagger: .06, delay: .1 });
    }
    var target = scr.querySelector('[data-tap]');
    if (interactive) {
      if (target) target.addEventListener('click', function(){ target.classList.add('pressed'); later(.25, function(){ next(); }); }, { once: true });
      else later(2.6, function(){ if (i < cfg.scenes.length - 1) next(); });
      if (i === cfg.scenes.length - 1) later(1.2, function(){ ar.insertAdjacentHTML('afterend', '<button type="button" class="btn ghost" style="align-self:flex-start">↺ Try again · جرّب تاني</button>'); el.querySelector('.jr-words .btn').addEventListener('click', function(){ el.querySelector('.jr-words .btn').remove(); show(0); }); });
      return;
    }
    if (target) later(1.7, function(){
      var r = target.getBoundingClientRect(), d = dev.getBoundingClientRect();
      gsap.set(dot, { x: d.width * .5, y: d.height * .95, opacity: 0 });
      gsap.to(dot, { x: r.left - d.left + r.width / 2, y: r.top - d.top + r.height / 2, opacity: 1, duration: .7, ease: 'power3.inOut', onComplete: function(){
        target.classList.add('pressed'); gsap.fromTo(dot, { scale: 1 }, { scale: .7, yoyo: true, repeat: 1, duration: .12 }); later(.6, function(){ gsap.to(dot, { opacity: 0, duration: .2 }); next(); });
      } });
    });
    else later(3.4, next);
  }
  function next(){ show((idx + 1) % cfg.scenes.length); }
  show(0);
  return function(){ dead = true; io.disconnect(); calls.forEach(function(c){ c.kill(); }); };
}

/* ================= FULL DEMOS ================= */
function demoHader(el){
  var tab = 'teacher', abs = { 4: 1, 8: 1 }, sent = false, warned = {};
  el.innerHTML = '<div class="tabs" role="group">' + [['teacher','المدرس'],['raed','رائد الفصل'],['affairs','شؤون الطلاب'],['admin','المدير'],['student','الطالب'],['parent','ولي الأمر']].map(function(t){ return '<button type="button" data-t="' + t[0] + '">' + t[1] + '</button>'; }).join('') +
    '</div><div class="dphone"><div class="screen" id="hdr" style="--app:#0F766E"></div></div><p class="dnote">Simplified demo · sample names · نسخة تجريبية ببيانات وهمية</p>';
  function draw(){
    el.querySelectorAll('[data-t]').forEach(function(b){ b.setAttribute('aria-pressed', b.dataset.t === tab); });
    var s = $('hdr'), out = Object.keys(abs).filter(function(k){ return abs[k]; }).length, body;
    if (tab === 'teacher') body = R('فصل 3/2', 'الحصة الأولى') + '<p style="margin:2px 0;color:#64748B;font-size:11px;text-align:center">اضغط على الغايب بس، والباقي حاضر.</p><div class="ua-names">' +
      NAMES.map(function(n, i){ return '<button type="button" data-n="' + i + '" class="' + (abs[i] ? 'abs' : '') + '">' + n + '</button>'; }).join('') + '</div>' + R('حاضر ' + (NAMES.length - out), 'غائب ' + out) + B(sent ? 'اتبعت ✓ للرائد وشؤون الطلاب' : 'إرسال الغياب', false);
    else if (tab === 'raed') body = R('فصل 3/2 · النهارده', sent ? '<span class="s-done" style="padding:2px 8px;border-radius:999px">وصل</span>' : 'مستني المدرس') +
      NAMES.map(function(n, i){ return abs[i] ? R(n, 'غائب · الحصة 1', 'bad') : ''; }).join('') + N('الرائد بيتابع فصله ويتأكد إن الغياب مظبوط قبل ما يروح لشؤون الطلاب.') + B('تأكيد الكشف');
    else if (tab === 'affairs') body = R('طلاب غيابهم متكرر', 'الأسبوع ده') + [['يوسف علي · 3/2', 4], ['عمر خالد · 1/4', 5], ['زياد إبراهيم · 3/2', 3], ['جنى وليد · 2/1', 3], ['ملك عادل · 2/3', 3], ['سارة محمود · 3/2', 3]].map(function(x, i){ return '<div class="ua-row"><span>' + x[0] + ' · ' + x[1] + ' أيام</span><button type="button" data-w="' + i + '" class="' + (warned[i] ? 's-done' : 's-late') + '">' + (warned[i] ? 'اتبعت ✓' : 'تنبيه') + '</button></div>'; }).join('') + N('التنبيه بيوصل لولي الأمر برسالة فيها أيام الغياب.');
    else if (tab === 'admin') body = G(C('الحضور النهارده', '94.2%'), C('غياب', String(36 + out)), C('فصول بعتت', sent ? '24 / 24' : '23 / 24'), C('تنبيهات اتبعتت', String(11 + Object.keys(warned).length))) +
      TBL(['الفصل', 'الطلاب', 'غياب', 'الحضور'], [['1/1', '34', '2', '94%'], ['1/4', '33', '4', '88%'], ['2/1', '31', '3', '90%'], ['2/3', '30', '1', '97%'], ['3/2', '32', String(out), Math.round((32 - out) / 32 * 100) + '%'], ['3/5', '31', '2', '94%']]) +
      R('لسه ما بعتش', sent ? 'كل الفصول بعتت ✓' : 'أ. منى · فصل 1/3', sent ? 'ok' : 'bad');
    else if (tab === 'student') body = G(C('حضرت', '61 يوم'), C('غبت', '3 أيام'), C('متبقي للحد', '12 يوم'), C('الإنذارات', 'لا يوجد')) +
      TBL(['اليوم', 'الحالة'], [['الأحد', '✓ حاضر'], ['الإثنين', '✓ حاضر'], ['الثلاثاء', '✗ غائب (الحصة 1)'], ['الأربعاء', '✓ حاضر'], ['الخميس', '✓ حاضر']]);
    else body = N('🔔 ابنك زياد إبراهيم غاب الحصة الأولى النهارده (8:21 ص).') + G(C('حضور الترم', '61 / 64'), C('غياب', '3 أيام'), C('الحد', '15 يوم'), C('الإنذارات', 'لا يوجد')) + B('التواصل مع شؤون الطلاب');
    s.innerHTML = A({ teacher: 'حاضر · المدرس', raed: 'حاضر · الرائد', affairs: 'شؤون الطلاب', admin: 'لوحة المدير', student: 'حاضر · الطالب', parent: 'حاضر · ولي الأمر' }[tab], body, 'مدرسة النموذج');
    s.querySelectorAll('[data-n]').forEach(function(b){ b.addEventListener('click', function(){ abs[b.dataset.n] = !abs[b.dataset.n]; sent = false; draw(); }); });
    s.querySelectorAll('[data-w]').forEach(function(b){ b.addEventListener('click', function(){ warned[b.dataset.w] = 1; draw(); }); });
    var send = s.querySelector('.ua-btn');
    if (send && tab === 'teacher') send.addEventListener('click', function(){ sent = true; draw(); });
    if (send && tab === 'raed') send.addEventListener('click', function(){ send.textContent = 'اتأكد ✓'; });
  }
  el.querySelectorAll('[data-t]').forEach(function(b){ b.addEventListener('click', function(){ tab = b.dataset.t; draw(); }); });
  draw();
}
function demoCenter(el){
  var role = 'assistant', checkins = [['1043', 'ياسين محمود', '٤:٠٢ م']], group = [['يوسف علي', 1, 18], ['مريم حسن', 1, 20], ['زياد إبراهيم', 0, ''], ['جنى وليد', 1, 17]];
  el.innerHTML = '<div class="tabs" role="group">' + [['owner','صاحب السنتر'],['assistant','أسيستنت'],['teacher','مدرس'],['student','طالب'],['parent','ولي أمر']].map(function(t){ return '<button type="button" data-r="' + t[0] + '">' + t[1] + '</button>'; }).join('') +
    '</div><div class="dweb"><div class="screen" id="ctr" style="--app:#1D4ED8"></div></div><p class="dnote">Simplified demo · sample data · نسخة تجريبية ببيانات وهمية</p>';
  function draw(){
    el.querySelectorAll('[data-r]').forEach(function(b){ b.setAttribute('aria-pressed', b.dataset.r === role); });
    var s = $('ctr'), body;
    if (role === 'owner') body = G(C('الطلاب', '248'), C('دخل الشهر', '71,200 ج'), C('الحضور', '92%'), C('متأخرين في الدفع', '14')) +
      '<b style="font-size:12px">الدخل آخر 10 شهور</b>' + BARS([48, 55, 61, 58, 70, 76, 82, 88, 94, 100]) +
      '<b style="font-size:12px">المجموعات</b>' + TBL(['المجموعة', 'المدرس', 'القاعة', 'طلاب', 'حضور'], [['فيزياء 3ث · السبت 6م', 'أ. أحمد', 'A', '35', '94%'], ['كيمياء 2ث · الأحد 4م', 'أ. سامح', 'B', '28', '89%'], ['رياضيات 3ث · الإثنين 5م', 'أ. هبة', 'A', '41', '91%'], ['إنجليزي 1ث · الثلاثاء 7م', 'أ. منى', 'C', '33', '96%']]) +
      '<b style="font-size:12px">حسابات المدرسين</b>' + TBL(['المدرس', 'الدخل', 'النسبة', 'المستحق'], [['أ. أحمد', '24,500', '60%', '14,700'], ['أ. سامح', '14,000', '55%', '7,700'], ['أ. هبة', '18,450', '60%', '11,070']]) +
      G(C('المصاريف', '9,400 ج'), C('الصافي', '23,380 ج')) + R('عمر خالد · كيمياء 2ث', '<span class="s-late" style="padding:2px 8px;border-radius:999px">عليه 350 ج</span>');
    else if (role === 'assistant') body = '<b style="font-size:12px">تسجيل حضور بالكود</b><div class="ua-in"><input id="cCode" value="1057" inputmode="numeric" aria-label="كود الطالب"><button type="button" class="ua-btn" id="cGo">تسجيل</button></div>' + checkins.map(function(c){ return R(c[1] + ' · #' + c[0], c[2], 'ok'); }).join('');
    else if (role === 'teacher') body = '<b style="font-size:12px">تالتة ثانوي · امتحان الفصل الأول</b>' + group.map(function(g, i){ return '<div class="ua-row"><span>' + g[0] + '</span><span style="display:flex;gap:6px;align-items:center"><button type="button" data-g="' + i + '" class="' + (g[1] ? 's-in' : 's-out') + '">' + (g[1] ? 'حاضر' : 'غايب') + '</button><b style="font-family:var(--f-en)">' + (g[2] === '' ? '—' : g[2] + '/20') + '</b></span></div>'; }).join('') + B('حفظ وإرسال الدرجات');
    else if (role === 'student') body = R('فيزياء · السبت ٦ م', 'الحصة الجاية') + G(C('آخر امتحان', '18/20'), C('الحضور', '11/12')) + BARS([70, 85, 60, 90, 95]);
    else body = G(C('حضور ابنك', '11/12'), C('آخر امتحان', '18/20'), C('الشهر ده', 'مدفوع ✓')) + M('رسالة من المدرس: مستوى زياد بيتحسن، محتاج يراجع الفصل التالت.');
    s.innerHTML = A('سيستم السنتر', body, { owner: 'صاحب السنتر', assistant: 'الأسيستنت', teacher: 'المدرس', student: 'الطالب', parent: 'ولي الأمر' }[role]);
    s.querySelectorAll('[data-g]').forEach(function(b){ b.addEventListener('click', function(){ var g = group[b.dataset.g]; g[1] = g[1] ? 0 : 1; draw(); }); });
    var go = $('cGo');
    if (go) go.addEventListener('click', function(){ var code = $('cCode').value.replace(/\D/g, '').slice(0, 6) || '1057', pool = ['ملك عادل', 'آدم شريف', 'نور الدين', 'حبيبة طارق'];
      checkins.unshift([code, pool[checkins.length % pool.length], timeNow()]); draw(); $('cCode').value = String(+code + 1); });
    var sv = s.querySelector('.ua-btn:not(#cGo)');
    if (sv && role === 'teacher') sv.addEventListener('click', function(){ sv.textContent = 'اتحفظ ✓ وأولياء الأمور وصلهم الدرجات'; });
  }
  el.querySelectorAll('[data-r]').forEach(function(b){ b.addEventListener('click', function(){ role = b.dataset.r; draw(); }); });
  draw();
}
function demoTeacher(el){
  var size = 'phone', tab = 'teacher', att = [1, 1, 0, 1, 1], quiz = ['9', '8', '', '10', '7'];
  var kids = ['مالك سامح', 'ليلى عمرو', 'حمزة طارق', 'تاليا محمد', 'سليم وائل'];
  el.innerHTML = '<div class="sizes" role="group" aria-label="Screen size"><button type="button" data-s="phone">Phone</button><button type="button" data-s="tablet">Tablet</button><button type="button" data-s="desktop">Desktop</button></div>' +
    '<div class="tabs" role="group">' + [['teacher','المدرس'],['assistant','الأسيستنت'],['student','الطالب'],['parent','ولي الأمر']].map(function(t){ return '<button type="button" data-t="' + t[0] + '">' + t[1] + '</button>'; }).join('') + '</div>' +
    '<div class="frame" id="tfr"><div class="ua" id="tch" style="--app:#4338CA"></div></div><p class="dnote">Same system on every screen · نفس النظام على أي شاشة · بيانات وهمية</p>';
  var W = { phone: '300px', tablet: '520px', desktop: '100%' };
  function draw(){
    el.querySelectorAll('[data-s]').forEach(function(b){ b.setAttribute('aria-pressed', b.dataset.s === size); });
    el.querySelectorAll('[data-t]').forEach(function(b){ b.setAttribute('aria-pressed', b.dataset.t === tab); });
    $('tfr').style.width = W[size];
    var body;
    if (tab === 'teacher') body = '<b style="font-size:12px">حصة تالتة إعدادي · الحضور والكويز</b>' + kids.map(function(k, i){ return '<div class="ua-row"><span>' + k + '</span><span style="display:flex;gap:6px;align-items:center"><input aria-label="درجة الكويز" data-q="' + i + '" value="' + quiz[i] + '" style="width:44px;border:1px solid #E3E8F0;border-radius:8px;padding:3px;text-align:center;font:12px var(--f-mono)"><button type="button" data-a="' + i + '" class="' + (att[i] ? 's-in' : 's-out') + '">' + (att[i] ? 'حاضر' : 'غايب') + '</button></span></div>'; }).join('') + B('حفظ الحصة');
    else if (tab === 'assistant') body = G(C('اشتراكات الشهر', '42 / 50'), C('بالحصة النهارده', '6'), C('مصاريف الشهر', '1,200 ج'), C('الصافي', '9,800 ج')) + R('ليلى عمرو', '<span class="s-late" style="padding:2px 8px;border-radius:999px">لم يدفع</span>') + B('تسجيل دفعة');
    else if (tab === 'student') body = G(C('الحضور', '15/16'), C('آخر كويز', '9/10'), C('الحصة الجاية', 'الأحد ٥ م')) + M('<b>رسالة من المستر</b><br>حلّوا الورقة دي قبل حصة الأحد.<br><span style="display:inline-block;margin-top:4px;font:11px var(--f-mono);background:#EEF2FF;border-radius:6px;padding:2px 6px;direction:ltr">worksheet-unit5.pdf</span>');
    else body = G(C('حضور ابنك', '15/16'), C('متوسط الدرجات', '88%'), C('الاشتراك', 'مدفوع ✓')) + N('🔔 مالك حضر حصة النهارده وأخد 9/10 في الكويز.');
    $('tch').innerHTML = '<div class="ua-bar"><b>نظام مدرس</b><small>English · إعدادي</small></div><div class="ua-body">' + body + '</div>';
    $('tch').querySelectorAll('[data-a]').forEach(function(b){ b.addEventListener('click', function(){ att[b.dataset.a] = att[b.dataset.a] ? 0 : 1; draw(); }); });
    $('tch').querySelectorAll('[data-q]').forEach(function(inp){ inp.addEventListener('input', function(){ quiz[inp.dataset.q] = inp.value.replace(/\D/g, '').slice(0, 2); }); });
    var sv = $('tch').querySelector('.ua-btn');
    if (sv) sv.addEventListener('click', function(){ sv.textContent = tab === 'teacher' ? 'اتحفظت ✓ واتبعت إشعار لأولياء الأمور' : 'اتسجّلت الدفعة ✓'; });
  }
  el.querySelectorAll('[data-s]').forEach(function(b){ b.addEventListener('click', function(){ size = b.dataset.s; draw(); }); });
  el.querySelectorAll('[data-t]').forEach(function(b){ b.addEventListener('click', function(){ tab = b.dataset.t; draw(); }); });
  draw();
}
function demoChat(el){
  var QA = [['عندكم مقاس L من التيشيرت الأسود؟', 'أيوه، فيه <b>7 قطع</b> مقاس L. سعره <b>250 ج</b>، والتوصيل خلال يومين. أسجّلك طلب؟'],
            ['أيوه سجّل الطلب', 'تم ✓ طلبك اتسجّل باسمك، وهيوصلك رسالة تأكيد على الواتساب.'],
            ['مواعيدكم إيه؟', 'من <b>10 الصبح لـ 10 بالليل</b> كل يوم ما عدا الجمعة.'],
            ['عايز أكلم حد من الفريق', 'تمام، حوّلتك لـ <b>أحمد</b> من المبيعات، وهيرد عليك خلال دقايق.']];
  el.innerHTML = '<div class="tabs" role="group">' + QA.map(function(q, i){ return '<button type="button" data-q="' + i + '">' + q[0] + '</button>'; }).join('') + '</div><div class="dphone"><div class="screen" style="--app:#0891B2"><div class="ua"><div class="ua-bar"><b>HINDAWY Chat</b><small>متصل الآن</small></div><div class="ua-body" id="chatB" style="overflow:auto">' + M('أهلًا! أنا مساعد المحل. اسألني أي حاجة.') + '</div></div></div></div><p class="dnote">اضغط على أي سؤال فوق · tap a question</p>';
  var timer, body = $('chatB');
  el.querySelectorAll('[data-q]').forEach(function(b){ b.addEventListener('click', function(){
    clearTimeout(timer); var qa = QA[b.dataset.q]; body.insertAdjacentHTML('beforeend', M(qa[0], true));
    var bot = document.createElement('div'); bot.className = 'ua-msg'; bot.textContent = '…'; body.appendChild(bot); body.scrollTop = 1e6;
    var txt = qa[1].replace(/<[^>]+>/g, ''), n = 0;
    timer = setTimeout(function step(){ n += 2; bot.textContent = txt.slice(0, n); body.scrollTop = 1e6;
      if (n < txt.length) timer = setTimeout(step, 18); else { bot.innerHTML = qa[1]; } }, 500);
  }); });
  return function(){ clearTimeout(timer); };
}
// the ERP demo: every role works on the same data, so what the warehouse, factory and sales do shows up for the owner straight away
function demoErp(el){
  var role = 'owner', st = { sheet: 18, made: 214, ready: 140, sales: 284500, cash: 1460000, due: 620000, invoiced: false,
    log: [['10:20', 'أمر تشغيل #2241: اتعمل 214 من 350 دولاب'], ['09:58', 'الحضور: 46 من 48 موظف']] };
  var money = function(n){ return n.toLocaleString('en') + ' ج'; };
  el.innerHTML = '<div class="tabs" role="group">' + [['owner','صاحب الشركة'],['store','المخزن'],['factory','المصنع'],['sales','المبيعات'],['accounts','الحسابات']].map(function(t){ return '<button type="button" data-r="' + t[0] + '">' + t[1] + '</button>'; }).join('') +
    '</div><div class="dweb"><div class="screen" id="erpS" style="--app:#2563EB"></div></div><p class="dnote">جرّب تعمل حاجة في المخزن أو المصنع أو المبيعات، وارجع لصاحب الشركة تلاقيها وصلت · sample data</p>';
  function add(t){ st.log.unshift([timeNow(), t]); }
  function draw(){
    el.querySelectorAll('[data-r]').forEach(function(b){ b.setAttribute('aria-pressed', b.dataset.r === role); });
    var body, btn = '';
    if (role === 'owner') body = G(C('مبيعات النهارده', money(st.sales)), C('أمر #2241', st.made + ' / 350'), C('صاج في المخزن', st.sheet + ' طن'), C('الكاش في البنك', money(st.cash))) +
      (st.sheet < 12 ? R('تنبيه: الصاج قرّب يخلص', 'اطلب من المورد', 'bad') : '') +
      '<b style="font-size:12px">آخر حركة في الشركة</b>' + st.log.slice(0, 5).map(function(l){ return R(l[1], l[0]); }).join('');
    else if (role === 'store') { body = '<b style="font-size:12px">أرصدة المخزن الرئيسي</b>' + TBL(['الصنف', 'الرصيد', 'الحد الأدنى'], [['صاج 1.5 مم', st.sheet + ' طن', '10 طن'], ['دهان إيبوكسي أسود', '400 لتر', '150 لتر'], ['مسامير وصواميل', '18 كرتونة', '10'], ['دولاب معدن جاهز', st.ready + ' قطعة', '50']]) + R('عربية مورد الحديد على الباب', '12 طن صاج'); btn = B('استلام 12 طن صاج'); }
    else if (role === 'factory') { body = '<b style="font-size:12px">أمر تشغيل #2241 · دولاب معدن 4 ضلف</b>' + G(C('المطلوب', '350'), C('اتعمل', st.made), C('فاضل', 350 - st.made), C('الهالك', '1.8%')) + BARS([94, 81, 67, 88]) + R('خط 1 · قص وتشكيل', '94%', 'ok') + R('خط 2 · لحام', '81%') + R('خط 3 · دهان', '67%'); btn = st.made < 350 ? B('تسجيل إنتاج 50 دولاب') : T('الأمر خلص ✓ ودخل المخزن'); }
    else if (role === 'sales') { body = '<b style="font-size:12px">فاتورة #8812</b>' + R('العميل', 'شركة النور للتوريدات') + R('120 دولاب × 1,233 ج', '148,000 ج') + R('الضريبة 14%', '20,720 ج') + R('المتاح في المخزن', st.ready + ' دولاب', st.ready < 120 ? 'bad' : 'ok'); btn = st.invoiced ? T('الفاتورة اتعتمدت ✓ واتخصمت من المخزن') : B('اعتماد الفاتورة'); }
    else body = '<b style="font-size:12px">القيود اتعملت لوحدها من كل حركة</b>' + TBL(['الوقت', 'الحركة'], st.log.slice(0, 6).map(function(l){ return [l[0], l[1]]; })) + G(C('ليك عند العملاء', money(st.due)), C('الكاش في البنك', money(st.cash)));
    $('erpS').innerHTML = A('HINDAWY ERP', body + btn, { owner: 'صاحب الشركة · من البيت', store: 'أمين المخزن', factory: 'مدير المصنع', sales: 'المبيعات', accounts: 'المحاسب' }[role]);
    var b = $('erpS').querySelector('.ua-btn');
    if (b) b.addEventListener('click', function(){
      if (role === 'store') { st.sheet += 12; st.cash -= 212000; add('المخزن استلم 12 طن صاج من مورد الحديد · 212,000 ج'); }
      if (role === 'factory') { var n = Math.min(50, 350 - st.made); st.made += n; st.ready += n; st.sheet = Math.max(0, +(st.sheet - 2.5).toFixed(1)); add('المصنع سلّم ' + n + ' دولاب للمخزن · أمر #2241'); }
      if (role === 'sales' && st.ready >= 120) { st.ready -= 120; st.sales += 148000; st.due += 168720; st.invoiced = true; add('فاتورة #8812 لشركة النور · 148,000 ج'); }
      else if (role === 'sales') { b.textContent = 'المخزن مفيهوش كفاية، روح المصنع سجّل إنتاج'; return; }
      draw();
    });
  }
  el.querySelectorAll('[data-r]').forEach(function(b){ b.addEventListener('click', function(){ role = b.dataset.r; draw(); }); });
  draw();
}

/* ================= OUR PROJECTS (one full screen each) ================= */
var PROJECTS = [
  // the ERP section is written in the page itself (with its dashboard); here it only gets its story and demo
  { id: 'erp', static: true, demo: demoErp,
    jr: { user: 'PURCHASING → WAREHOUSE → FACTORY → SALES → ACCOUNTS → OWNER', device: 'web', color: '#2563EB', scenes: [
      { en: 'Every team logs in to its own screen.', ar: 'كل قسم بيدخل على شاشته هو.', note: ['Here: the login page', 'صاحب الشركة، ومدير المصنع، وأمين المخزن، والمشتريات، والمبيعات، والمحاسب. كل واحد بيشوف شغله بس.'],
        s: A('HINDAWY ERP · تسجيل الدخول', G(C('صاحب الشركة', '🔒'), C('مدير المصنع', '🔒'), C('أمين المخزن', '🔒'), C('المشتريات', '🔒'), C('المبيعات', '🔒'), C('المحاسب', '🔒')) + '<div class="ua-in"><input value="store.mahmoud" aria-label="اسم المستخدم" readonly><input value="••••••••" aria-label="كلمة السر" readonly></div>' + B('دخول', true), 'مصنع النور للأثاث المعدني') },
      { en: 'Sheet metal is running low. Purchasing orders more.', ar: 'الصاج قرّب يخلص، والمشتريات بتطلب.', note: ['Here: the purchasing screen', 'السيستم نبّه لوحده إن الرصيد تحت الحد الأدنى، وبيقارن أسعار الموردين.'],
        s: A('المشتريات · طلب شراء #512', R('صاج 1.5 مم', 'الرصيد 6 طن · الحد 10', 'bad') + TBL(['المورد', 'سعر الطن', 'التوصيل'], [['حديد المصريين', '17,650', 'بكرة'], ['الشرق للصلب', '18,100', '3 أيام'], ['النيل للمعادن', '17,900', 'يومين']]) + B('اعتماد الطلب من حديد المصريين', true)) },
      { en: 'The warehouse receives it and the stock updates.', ar: 'المخزن بيستلم والرصيد بيتحدّث.', note: ['Here: the storekeeper’s screen', 'بيستلم البضاعة بالباركود، والرصيد والحسابات بيتحدّثوا في نفس اللحظة.'],
        s: A('المخزن · استلام', R('صاج 1.5 مم', '+12 طن', 'ok') + R('دهان إيبوكسي أسود', '+400 لتر', 'ok') + R('مسامير وصواميل', '+18 كرتونة', 'ok') + G(C('صاج دلوقتي', '18 طن'), C('قيمة الاستلام', '212,000 ج')) + B('تأكيد الاستلام', true)) },
      { en: 'The factory runs the production order.', ar: 'المصنع بيشغّل أمر الإنتاج.', note: ['Here: the factory manager’s screen', 'كل خط إنتاج ونسبته، والكمية اللي اتعملت، والهالك.'],
        s: A('أمر تشغيل #2241 · دولاب معدن', G(C('المطلوب', '350'), C('اتعمل', '214'), C('الهالك', '1.8%'), C('التسليم', 'الخميس')) + R('خط 1 · قص وتشكيل', '94%', 'ok') + R('خط 2 · لحام', '81%') + R('خط 3 · دهان', '67%') + R('خط 4 · تغليف', '88%') + B('تسليم 50 دولاب للمخزن', true)) },
      { en: 'Sales issues the invoice. Stock goes down by itself.', ar: 'المبيعات بتطلع الفاتورة، والمخزن بيتخصم لوحده.', note: ['Here: the sales screen', 'الفاتورة بتتأكد إن البضاعة موجودة، وبتنزل في الحسابات أوتوماتيك.'],
        s: A('فاتورة #8812', R('العميل', 'شركة النور للتوريدات') + R('120 دولاب', '148,000 ج') + R('الضريبة 14%', '20,720 ج') + R('الإجمالي', '168,720 ج') + R('المخزن بعد الفاتورة', '20 دولاب') + B('اعتماد الفاتورة', true)) },
      { en: 'The accountant finds every entry already made.', ar: 'والمحاسب بيلاقي كل القيود اتعملت لوحدها.', note: ['Here: the accountant’s screen', 'مفيش قيد بيتكتب بالإيد. كل حركة في أي قسم بتعمل قيدها.'],
        s: A('الحسابات · النهارده', TBL(['الحركة', 'مدين', 'دائن'], [['فاتورة #8812', 'العملاء 168,720', 'المبيعات 148,000'], ['استلام صاج', 'المخزن 212,000', 'المورد 212,000'], ['إنتاج 50 دولاب', 'تام الصنع', 'تحت التشغيل'], ['مرتبات الأسبوع', 'الأجور 46,500', 'البنك 46,500']]) + G(C('ليك عند العملاء', '788,720 ج'), C('عليك للموردين', '412,000 ج'))) },
      { en: 'And the owner sees it all, from home.', ar: 'وصاحب الشركة شايف كل ده وهو في البيت.', note: ['Here: the owner’s phone', 'الأرقام المهمة وكل تنبيه، من غير ما يروح المصنع ولا يتصل بحد.'],
        s: A('صاحب الشركة · من البيت', G(C('مبيعات النهارده', '432,500 ج'), C('الإنتاج', '92%'), C('قيمة المخزون', '3.2 م ج'), C('صافي النهارده', '61,300 ج')) + BARS([38, 44, 41, 52, 58, 55, 63, 70, 66, 78, 86, 94]) + R('فاتورة #8812 اتعتمدت', '148,000 ج', 'ok') + R('خط 3 · دهان أبطأ من المعتاد', 'شوف', 'bad')) }] } },
  { id: 'hader', num: 'PROJECT 01 · SCHOOLS', en: 'Hader', ar: 'حاضر', arT: 'حاضر · نظام الحضور والغياب للمدارس', demo: demoHader,
    story: [['Before', 'Each class had a paper sheet that was walked to the office. Totals were added by hand at the end of the week, and parents heard about an absence days later.', 'كل فصل كان ليه كشف ورق بيتلف بيه على الإدارة، والإجماليات بتتحسب بالإيد آخر الأسبوع، وولي الأمر بيعرف إن ابنه غاب بعدها بأيام.', 'قبل'],
            ['What we built', 'One system with six screens: teacher, class leader, student affairs, principal, student and parent. Everything happens on the phone. No paper moves anywhere.', 'سيستم واحد بست شاشات: المدرس، ورائد الفصل، وشؤون الطلاب، والمدير، والطالب، وولي الأمر. كل حاجة بتحصل من الموبايل، ومفيش ورقة بتتنقل.', 'اللي عملناه'],
            ['After', 'A class is recorded in about 20 seconds, the office sees all 24 classes live, and the parent gets a message the same morning.', 'الفصل بيتسجّل في حوالي 20 ثانية، والإدارة بتشوف الـ 24 فصل لحظة بلحظة، وولي الأمر بيوصله رسالة في نفس الصبح.', 'بعد']],
    roles: [['Teacher', 'المدرس', ['يفتح الحصة من موبايله ويضغط على الغايب بس', 'الكشف بيروح للرائد وشؤون الطلاب في نفس اللحظة', 'يشوف غياب الأسبوع لكل فصل بيدرّسه']],
            ['Class leader', 'رائد الفصل', ['يتابع فصله حصة بحصة', 'يعرف مين اتأخر ومين مشي بدري', 'يأكّد كشف اليوم قبل ما يتقفل']],
            ['Student affairs', 'شؤون الطلاب', ['قايمة جاهزة بالغياب المتكرر في المدرسة كلها', 'تنبيه لولي الأمر بضغطة واحدة', 'تقرير كامل لأي طالب وقت ما تحتاجه']],
            ['Principal', 'المدير', ['نسبة الحضور لكل صف وكل فصل', 'يعرف مين من المدرسين لسه ما بعتش الكشف', 'تقارير يومية وأسبوعية وشهرية جاهزة']],
            ['Student', 'الطالب', ['يشوف أيام حضوره وغيابه', 'يعرف لو قرّب من حد الإنذار', 'مايشوفش بيانات أي طالب تاني']],
            ['Parent', 'ولي الأمر', ['رسالة في نفس اليوم لو ابنه غاب', 'سجل حضور ابنه طول الترم', 'يتواصل مع شؤون الطلاب من نفس الشاشة']]],
    jr: { user: 'TEACHER → CLASS LEADER → STUDENT AFFAIRS → PARENT → STUDENT → PRINCIPAL', device: 'phone', color: '#0F766E', scenes: [
      { en: 'Six roles. Each one logs in to their own screen.', ar: '6 أدوار، وكل واحد بيدخل على شاشته هو.', note: ['Here: the login page', 'كل دور ليه اسم مستخدم وكلمة سر، ومحدش بيقدر يفتح شاشة غيره.'],
        s: A('حاضر · تسجيل الدخول', G(C('المدرس', '🔒'), C('رائد الفصل', '🔒'), C('شؤون الطلاب', '🔒'), C('المدير', '🔒'), C('الطالب', '🔒'), C('ولي الأمر', '🔒')) + '<div class="ua-in"><input value="t.ahmed.samir" aria-label="اسم المستخدم" readonly><input value="••••••" aria-label="كلمة السر" readonly></div>' + B('دخول', true), 'مدرسة النموذج الثانوية') },
      { en: '8:02 AM. The teacher sees today’s classes.', ar: 'الساعة 8:02 الصبح، المدرس بيشوف حصص النهارده.', note: ['Here: the teacher’s screen', 'المدرس بيشوف الفصول اللي بيدرّسها النهارده بس، ومعاها عدد الطلبة واللي اتسجّل.'],
        s: A('حاضر · أ. أحمد سمير', R('فصل 3/2 · الحصة 1', '32 طالب', '', true) + R('فصل 2/4 · الحصة 3', '30 طالب') + R('فصل 1/1 · الحصة 4', '34 طالب') + R('فصل 3/5 · الحصة 6', '31 طالب') + G(C('حصص النهارده', '4'), C('اتسجّل', '0 / 4'), C('غياب الأسبوع', '17'), C('أعلى فصل غياب', '2/4')), 'رياضيات · الأحد') },
      { en: 'He taps only the absent students.', ar: 'بيضغط على الغايبين بس، والباقي بيتسجّل حاضر لوحده.', note: ['One tap per absent student', 'مش محتاج يندّه الأسماء واحد واحد. بيبص على الفصل ويضغط على اللي مش موجود.'],
        s: A('فصل 3/2 · الحصة 1', NAMEGRID([4, 10], 8) + R('حاضر 29 من 32', 'غائب 3')) },
      { en: 'One tap, and the class is recorded.', ar: 'ضغطة واحدة والكشف اتسجّل.', note: ['Sent in about 20 seconds', 'الكشف بيوصل للرائد وشؤون الطلاب والمدير في نفس اللحظة.'],
        s: A('فصل 3/2 · الحصة 1', G(C('حاضر', '29'), C('غائب', '3'), C('متأخر', '1'), C('الوقت', '00:19')) + R('سارة محمود', 'غائب', 'bad') + R('زياد إبراهيم', 'غائب', 'bad') + R('كريم مصطفى', 'غائب', 'bad') + B('إرسال الغياب', true)) },
      { en: 'The class leader follows his class all day.', ar: 'رائد الفصل بيتابع فصله طول اليوم.', note: ['Here: the class leader’s screen', 'فصله هو بس، حصة بحصة، ومين غاب في أنهي حصة.'],
        s: A('حاضر · رائد فصل 3/2', TBL(['الحصة', 'المادة', 'غائب', 'الحالة'], [['1', 'رياضيات', '3', '✓'], ['2', 'عربي', '3', '✓'], ['3', 'فيزياء', '2', '✓'], ['4', 'إنجليزي', '2', '✓'], ['5', 'كيمياء', '—', 'لسه']]) + B('تأكيد كشف اليوم', true)) },
      { en: 'Student affairs warns the parents.', ar: 'شؤون الطلاب بتبلّغ أولياء الأمور.', note: ['Here: the student affairs screen', 'قايمة بالغياب المتكرر في المدرسة كلها، والتنبيه بيتبعت بضغطة.'],
        s: A('شؤون الطلاب · الأسبوع ده', TBL(['الطالب', 'الفصل', 'أيام', 'إنذار'], [['يوسف علي', '3/2', '4', 'أول'], ['زياد إبراهيم', '3/2', '3', '—'], ['جنى وليد', '2/1', '3', '—'], ['عمر خالد', '1/4', '5', 'تاني'], ['ملك عادل', '2/3', '3', '—']]) + B('تنبيه أولياء الأمور (5)', true)) },
      { en: 'The parent knows the same morning.', ar: 'ولي الأمر بيعرف في نفس الصبح.', note: ['Here: the parent’s phone', 'بيوصله إشعار، ويقدر يفتح سجل ابنه هو بس.'],
        s: A('حاضر · ولي الأمر', N('🔔 ابنك زياد إبراهيم غاب الحصة الأولى النهارده (الأحد 8:21 ص).') + G(C('حضور الترم', '61 / 64'), C('غياب', '3 أيام'), C('الحد', '15 يوم'), C('الإنذارات', 'لا يوجد')) + B('التواصل مع شؤون الطلاب', true)) },
      { en: 'The student sees his own record.', ar: 'والطالب بيشوف سجله هو.', note: ['Here: the student’s screen', 'أيامه وغيابه والإنذارات، ومايشوفش أي حد تاني.'],
        s: A('حاضر · الطالب', G(C('حضرت', '61 يوم'), C('غبت', '3 أيام'), C('متبقي للحد', '12 يوم'), C('ترتيب الحضور', '9 / 32')) + BARS([100, 95, 100, 90, 100, 100])) },
      { en: 'The principal sees the whole school, live.', ar: 'والمدير بيشوف المدرسة كلها لحظة بلحظة.', note: ['Here: the principal’s screen', 'كل الصفوف والفصول، ومين لسه ما بعتش، من غير ما يلف على الفصول.'],
        s: A('لوحة المدير', G(C('الحضور النهارده', '94.2%'), C('غياب', '38 طالب'), C('فصول بعتت', '23 / 24'), C('تنبيهات اتبعتت', '11')) + TBL(['الصف', 'الحضور', 'غياب'], [['أولى', '96%', '9'], ['تانية', '93%', '14'], ['تالتة', '92%', '15']]) + R('لسه ما بعتش', 'أ. منى · فصل 1/3', 'bad')) }] } },

  { id: 'center', num: 'PROJECT 02 · EDUCATION CENTERS', en: 'Center System', ar: 'سيستم السنتر', arT: 'سيستم السنتر · إدارة السنتر كله من مكان واحد', demo: demoCenter,
    story: [['Before', 'Attendance in one notebook, payments in another, grades on WhatsApp. The owner learned the month’s income only after counting cash at the end of the month.', 'الحضور في كشكول، والفلوس في كشكول تاني، والدرجات على الواتساب. وصاحب السنتر مش بيعرف دخل الشهر غير لما يعدّ الفلوس آخر الشهر.', 'قبل'],
            ['What we built', 'The whole center in one system: groups and rooms, teachers and their shares, check-in by code, payments, grades and messages to parents. Five roles, each with its own screen.', 'السنتر كله في سيستم واحد: المجموعات والقاعات، والمدرسين ونسبهم، والحضور بالكود، والفلوس، والدرجات، والرسايل لأولياء الأمور. 5 أدوار، وكل دور ليه شاشته.', 'اللي عملناه'],
            ['After', 'A student checks in within two seconds, unpaid fees show up on their own, and the owner sees every pound in and out the moment it happens.', 'الطالب بيسجّل في ثانيتين، واللي عليه فلوس بيظهر لوحده، وصاحب السنتر بيشوف كل جنيه داخل وخارج في نفس اللحظة.', 'بعد']],
    roles: [['Center owner', 'صاحب السنتر', ['الدخل والمصاريف والصافي لحظة بلحظة', 'المجموعات والقاعات والمواعيد في جدول واحد', 'نسبة كل مدرس بتتحسب لوحدها']],
            ['Assistant', 'الأسيستنت', ['يسجّل الحضور بكود الطالب في ثانيتين', 'يستلم الفلوس ويطبع الإيصال', 'مايشوفش الدرجات ولا أرباح السنتر']],
            ['Teacher', 'المدرس', ['يشوف مجموعاته هو بس', 'يسجّل الدرجات والغياب', 'يبعت رسالة لمجموعة كاملة']],
            ['Student', 'الطالب', ['مواعيده ودرجاته وترتيبه', 'الواجبات والملفات من المدرس', 'حسابه هو بس']],
            ['Parent', 'ولي الأمر', ['حضور ابنه ودرجاته', 'الاشتراك مدفوع ولا لأ', 'رسايل المدرس']]],
    jr: { user: 'OWNER → ASSISTANT → TEACHER → PARENT', device: 'web', color: '#1D4ED8', scenes: [
      { en: 'Five roles. Five separate logins.', ar: '5 أدوار، وكل دور ليه دخول لوحده.', note: ['Here: the login page', 'كل واحد بيدخل بحسابه، ومحدش بيقدر يفتح شاشة غيره ولا يشوف بياناته.'],
        s: A('سيستم السنتر · تسجيل الدخول', G(C('صاحب السنتر', '🔒'), C('الأسيستنت', '🔒'), C('المدرس', '🔒'), C('الطالب', '🔒')) + R('ولي الأمر', '🔒') + '<div class="ua-in"><input value="owner.center" aria-label="اسم المستخدم" readonly><input value="••••••••" aria-label="كلمة السر" readonly></div>' + B('دخول', true)) },
      { en: 'The owner sees the whole center on one screen.', ar: 'صاحب السنتر بيشوف السنتر كله في شاشة واحدة.', note: ['Here: the owner’s dashboard', 'الطلاب والدخل والحضور والمتأخرين في الدفع، والرسم بيوضّح دخل كل شهر.'],
        s: A('صاحب السنتر · أكتوبر', G(C('الطلاب', '248'), C('دخل الشهر', '71,200 ج'), C('الحضور', '92%'), C('متأخرين في الدفع', '14')) + BARS([48, 55, 61, 58, 70, 76, 82, 88, 94, 100]) + R('أعلى مجموعة دخل', 'فيزياء تالتة ث · 38%')) },
      { en: 'Every group, room and teacher in one table.', ar: 'كل المجموعات والقاعات والمدرسين في جدول واحد.', note: ['Here: groups and rooms', 'مين بيدرّس إيه، في أنهي قاعة، وكام طالب، ونسبة الحضور.'],
        s: A('المجموعات', TBL(['المجموعة', 'المدرس', 'القاعة', 'طلاب', 'حضور'], [['فيزياء 3ث · السبت 6م', 'أ. أحمد', 'A', '35', '94%'], ['كيمياء 2ث · الأحد 4م', 'أ. سامح', 'B', '28', '89%'], ['رياضيات 3ث · الإثنين 5م', 'أ. هبة', 'A', '41', '91%'], ['إنجليزي 1ث · الثلاثاء 7م', 'أ. منى', 'C', '33', '96%'], ['أحياء 3ث · الأربعاء 6م', 'أ. كريم', 'B', '30', '88%']])) },
      { en: 'Teachers’ shares are calculated automatically.', ar: 'نسبة كل مدرس بتتحسب لوحدها.', note: ['Here: teacher payouts', 'كل مدرس ونسبته من دخل مجموعاته، من غير آلة حاسبة.'],
        s: A('حسابات المدرسين · أكتوبر', TBL(['المدرس', 'الدخل', 'النسبة', 'المستحق'], [['أ. أحمد', '24,500', '60%', '14,700'], ['أ. سامح', '14,000', '55%', '7,700'], ['أ. هبة', '18,450', '60%', '11,070'], ['أ. منى', '9,900', '50%', '4,950']]) + B('اعتماد المرتبات', true)) },
      { en: 'Unpaid fees show up by themselves.', ar: 'واللي عليه فلوس بيظهر لوحده.', note: ['Here: money', 'الدخل والمصاريف والصافي، وقايمة المتأخرين ورسالة تذكير بضغطة.'],
        s: A('الحسابات', G(C('الدخل', '71,200 ج'), C('المصاريف', '9,400 ج'), C('مستحق للمدرسين', '38,420 ج'), C('الصافي', '23,380 ج')) + R('عمر خالد · كيمياء 2ث', '350 ج', 'bad') + R('آدم شريف · فيزياء 3ث', '400 ج', 'bad') + R('ملك عادل · أحياء 3ث', '300 ج', 'bad') + B('تذكير المتأخرين (14)', true)) },
      { en: 'At the door, the assistant checks students in by code.', ar: 'على الباب، الأسيستنت بيسجّل الحضور بالكود.', note: ['Here: the assistant’s screen', 'بيسجّل الحضور ويستلم الفلوس بس. مايشوفش الدرجات ولا أرباح السنتر.'],
        s: A('الأسيستنت · منى', '<div class="ua-in"><input value="1057" aria-label="كود" readonly><button type="button" class="ua-btn" data-tap>تسجيل</button></div>' + R('ياسين محمود · #1043', '٥:٥٨ م', 'ok') + R('سارة محمود · #1031', '٥:٥٧ م', 'ok') + R('عمر خالد · #0988', 'عليه 350 ج', 'bad') + G(C('حضروا', '31 / 35'), C('اتدفع النهارده', '2,450 ج'))) },
      { en: 'The teacher saves grades for his group only.', ar: 'المدرس بيسجّل درجات مجموعته هو بس.', note: ['Here: the teacher’s screen', 'مجموعاته ودرجاتهم وغيابهم، والدرجات بتوصل لأولياء الأمور أوتوماتيك.'],
        s: A('أ. أحمد · فيزياء 3ث', TBL(['الطالب', 'حضور', 'الامتحان'], [['يوسف علي', '✓', '18/20'], ['مريم حسن', '✓', '20/20'], ['جنى وليد', '✓', '17/20'], ['زياد إبراهيم', '✓', '18/20'], ['كريم مصطفى', '✗', '—'], ['ملك عادل', '✓', '19/20']]) + B('حفظ وإرسال لأولياء الأمور', true)) },
      { en: 'The parent gets the result on the phone.', ar: 'وولي الأمر بيوصله النتيجة على موبايله.', note: ['Here: the parent’s screen', 'بيشوف ابنه هو بس: حضوره ودرجاته وفلوسه.'],
        s: A('ولي الأمر', M('زياد أخد 18/20 في امتحان الفيزياء النهارده ✓ ترتيبه 7 من 35.') + G(C('الحضور', '11/12'), C('الاشتراك', 'مدفوع ✓'), C('متوسط الدرجات', '87%'), C('الحصة الجاية', 'السبت 6م'))) }] } },

  { id: 'teacher', num: 'PROJECT 03 · PRIVATE TEACHERS', en: 'Teacher System', ar: 'نظام المدرس', arT: 'نظام المدرس · لمدرس الدروس الخصوصية', demo: demoTeacher,
    story: [['Before', 'A teacher with five groups tracked attendance on paper, collected payments in cash with no record, and sent quiz results one WhatsApp message at a time.', 'مدرس عنده 5 مجموعات بيسجّل الحضور في ورق، وبيستلم الفلوس كاش من غير ما يعرف مين دفع ومين لأ، وبيبعت نتايج الكويز رسالة رسالة على الواتساب.', 'قبل'],
            ['What we built', 'A system for one teacher and an assistant: groups, attendance with the quiz in the same screen, monthly or per-class payments, expenses and net, files and messages, and a portal for students and parents.', 'سيستم لمدرس وأسيستنت: المجموعات، والحضور مع الكويز في نفس الشاشة، والدفع شهري أو بالحصة، والمصاريف والصافي، والملفات والرسايل، وبوابة للطلاب وأولياء الأمور.', 'اللي عملناه'],
            ['After', 'A class is saved in one tap, parents get the quiz grade the same hour, and the teacher knows his net income at any moment.', 'الحصة بتتحفظ بضغطة، وولي الأمر بيعرف درجة الكويز في نفس الساعة، والمدرس عارف صافي دخله في أي لحظة.', 'بعد']],
    roles: [['Teacher', 'المدرس', ['كل مجموعاته وطلابه ومواعيده', 'الحضور والكويز في شاشة واحدة', 'الدخل والمصاريف والصافي']],
            ['Assistant', 'الأسيستنت', ['يسجّل الدفع والحضور', 'باسورد خاص بيه من المدرس', 'مايشوفش الصافي']],
            ['Student', 'الطالب', ['درجاته وترتيبه', 'الملفات والواجبات', 'مواعيد الحصص']],
            ['Parent', 'ولي الأمر', ['إشعار بعد كل حصة', 'الاشتراك مدفوع ولا لأ', 'رسايل المدرس']]],
    jr: { user: 'TEACHER → PARENT → STUDENT → ASSISTANT', device: 'phone', color: '#4338CA', scenes: [
      { en: 'Each person has their own login.', ar: 'كل واحد ليه دخول خاص بيه.', note: ['Here: the login page', 'المدرس والأسيستنت بباسورد، والطالب وولي الأمر بكود ورقم سري خاص.'],
        s: A('نظام المدرس', G(C('المدرس', '🔒'), C('الأسيستنت', '🔒'), C('الطالب', '🔒'), C('ولي الأمر', '🔒')) + '<div class="ua-in"><input value="كود الطالب: 2041" aria-label="الكود" readonly><input value="••••" aria-label="الرقم السري" readonly></div>' + B('دخول', true), 'English · إعدادي') },
      { en: 'The teacher opens today’s classes.', ar: 'المدرس بيفتح حصص النهارده.', note: ['Here: the teacher’s screen', 'كل المجموعات والطلاب، ومين عليه فلوس.'],
        s: A('نظام المدرس', R('تالتة إعدادي · ٥ م', '28 طالب', '', true) + R('تانية إعدادي · ٧ م', '24 طالب') + R('أولى إعدادي · بكرة ٤ م', '31 طالب') + G(C('طلاب', '83'), C('حصص الأسبوع', '9'), C('عليهم فلوس', '6'), C('متوسط الكويز', '8.1')), 'English · الأحد') },
      { en: 'Attendance and the quiz, on one screen.', ar: 'الحضور والكويز في شاشة واحدة.', note: ['Saved in one tap', 'لكل طالب: حاضر ولا غايب، ودرجة الكويز، ودفع ولا لأ.'],
        s: A('تالتة إعدادي · Quiz 6', TBL(['الطالب', 'حضور', 'كويز', 'دفع'], [['مالك سامح', '✓', '9', '✓'], ['ليلى عمرو', '✓', '8', '✗'], ['حمزة طارق', '✗', '—', '✓'], ['تاليا محمد', '✓', '10', '✓'], ['سليم وائل', '✓', '7', '✗'], ['جنى خالد', '✓', '9', '✓']]) + B('حفظ الحصة', true)) },
      { en: 'Parents get a notification within the hour.', ar: 'ولي الأمر بيوصله إشعار في نفس الساعة.', note: ['Here: the parent’s screen', 'بيشوف ابنه هو بس.'],
        s: A('ولي الأمر', N('🔔 مالك حضر حصة النهارده وأخد 9/10 في Quiz 6. ترتيبه 3 من 28.') + G(C('الحضور', '15/16'), C('المتوسط', '88%'), C('الاشتراك', 'مدفوع ✓'), C('الحصة الجاية', 'الأحد 5م'))) },
      { en: 'Students get files and grades on any device.', ar: 'الطالب بيشوف ملفاته ودرجاته من أي جهاز.', note: ['Here: the student’s screen', 'درجاته وملفاته ورسايل المستر، على الموبايل أو اللابتوب.'],
        s: A('الطالب · مالك', M('حلّوا الورقة دي قبل الأحد 📄 worksheet-unit5.pdf') + M('Quiz 6 results are out ✓') + TBL(['الكويز', 'الدرجة'], [['Quiz 4', '8/10'], ['Quiz 5', '9/10'], ['Quiz 6', '9/10']])) },
      { en: 'Monthly or per class, expenses and net, all counted.', ar: 'شهري أو بالحصة، والمصاريف والصافي، كله متحسب.', note: ['Here: the accounts screen', 'الأسيستنت بيسجّل الدفع، والمدرس بس اللي بيشوف الصافي.'],
        s: A('الحسابات · أكتوبر', G(C('الاشتراكات', '42/50'), C('بالحصة', '1,800 ج'), C('المصاريف', '1,200 ج'), C('الصافي', '9,800 ج')) + R('ليلى عمرو', 'لم يدفع', 'bad') + R('سليم وائل', 'لم يدفع', 'bad') + B('تذكير بالدفع (2)', true)) }] } },

  { id: 'chat', num: 'PROJECT 04 · BUSINESSES', en: 'HINDAWY Chat', ar: 'شات هنداوي', arT: 'شات بوت · بيرد على عملاءك على كل المنصات', demo: demoChat,
    story: [['Before', 'Messages came in on Instagram, WhatsApp and TikTok at all hours. Many were the same questions about price and size, and the ones sent at night waited until morning.', 'الرسايل بتيجي على إنستجرام وواتساب وتيك توك في كل وقت، وأغلبها نفس الأسئلة عن السعر والمقاس، واللي بيتبعت بالليل بيستنى للصبح.', 'قبل'],
            ['What we built', 'One AI assistant connected to every channel. It answers from your real prices and stock, takes orders, and passes anything unusual to a person.', 'مساعد ذكي واحد متوصّل بكل القنوات. بيرد من أسعارك ومخزونك الحقيقي، وبياخد الطلبات، وأي حاجة غريبة بيحوّلها لحد من فريقك.', 'اللي عملناه'],
            ['After', 'Every message gets an answer in seconds, day and night, and your team only handles what really needs them.', 'كل رسالة بيتردّ عليها في ثواني ليل ونهار، وفريقك بيتعامل بس مع اللي محتاجهم فعلًا.', 'بعد']],
    roles: [['Customer', 'العميل', ['يسأل على أي منصة يحبها', 'رد في ثواني بالعامية', 'يطلب من غير ما يستنى']],
            ['The bot', 'البوت', ['يرد من أسعارك ومخزونك', 'يسجّل الطلبات والمواعيد', 'يحوّل الحالات الصعبة لفريقك']],
            ['Your team', 'فريقك', ['كل الرسايل في شاشة واحدة', 'يستلم بس الحالات المهمة', 'تقرير بأكتر الأسئلة تكرارًا']]],
    on: ['web', 'whatsapp', 'instagram', 'tiktok', 'messenger', 'facebook', 'telegram'],
    jr: { user: 'INSTAGRAM → WHATSAPP → TIKTOK → WEBSITE → YOUR TEAM', device: 'phone', color: '#0891B2', scenes: [
      { en: 'On Instagram, a customer asks about a size.', ar: 'على إنستجرام، عميلة بتسأل على مقاس.', note: ['Instagram Direct', 'البوت بيرد في رسايل إنستجرام نفسها، باسم صفحتك.'],
        s: AX('linear-gradient(45deg,#F58529,#DD2A7B,#8134AF)', '📷 hindawy.store', M('عندكم الهودي الرمادي مقاس M؟', true) + M('أيوه، فيه 4 قطع مقاس M. سعره 450 ج. أبعتلك صورته؟') + M('أيوه لو سمحت', true) + B('ابعت الصورة', true), 'Instagram · Direct', '#fff') },
      { en: 'On WhatsApp, it takes the whole order.', ar: 'على واتساب، بياخد الطلب كامل.', note: ['WhatsApp Business', 'بياخد الاسم والعنوان، ويأكد الطلب، ويبعت رقمه.'],
        s: AX('#075E54', '💬 HINDAWY Store', M('عايز 2 تيشيرت أسود L', true) + M('تمام. الإجمالي 500 ج + توصيل 40 ج. ابعتلي العنوان.') + M('المعادي، شارع 9', true) + T('طلب #2041 اتسجّل ✓') + B('تأكيد الطلب', true), 'online', '#ECE5DD') },
      { en: 'On TikTok, it replies to comments.', ar: 'على تيك توك، بيرد على الكومنتات.', note: ['TikTok comments', 'بيرد على "بكام؟" تحت الفيديو، ويكمّل مع العميل في الرسايل.'],
        s: AX('#000000', '🎵 @hindawy.store', R('سارة: بكام الكاب ده؟', '') + R('↳ hindawy.store: بـ 120 ج، ابعتلنا رسالة نحجزهولك 🤍', '', 'ok') + R('عمر: فيه توصيل للإسكندرية؟', '') + R('↳ hindawy.store: أيوه خلال 3 أيام 🚚', '', 'ok') + B('رد على الكل', true), 'تعليقات الفيديو', '#111') },
      { en: 'On your website, it books appointments.', ar: 'على موقعك، بيحجز المواعيد.', note: ['Website chat', 'نفس البوت جوه موقعك، بيحجز ويرد على الأسئلة.'],
        s: AX('#0891B2', '🌐 hindawy.store', M('مواعيدكم إيه؟ ينفع أجي أقيس بكرة؟', true) + M('بنفتح من 10 ص لـ 10 م. فيه مواعيد بكرة: 1 م، 4 م، 7 م.') + '<div class="ua-slots"><span>1:00</span><span data-tap>4:00</span><span>7:00</span></div>', 'Chat') },
      { en: 'Your team sees every channel in one inbox.', ar: 'وفريقك بيشوف كل القنوات في مكان واحد.', note: ['Here: your team’s screen', 'كل الرسايل من كل المنصات، والبوت بيحوّل بس اللي محتاج إنسان.'],
        s: A('صندوق الرسايل · النهارده', G(C('رسايل', '186'), C('ردّ البوت', '171'), C('اتحوّلت لفريقك', '15'), C('متوسط الرد', '3 ث')) + R('📷 Instagram', '74') + R('💬 WhatsApp', '63') + R('🎵 TikTok', '31') + R('🌐 الموقع', '18') + R('أحمد: طلب استرجاع', 'محتاج رد', 'bad')) }] } }
];
// how each project keeps its users' data safe (shown with the project, not with the tools)
var SAFE_NOTE = {
  hader: ['Every role has its own login, and a teacher sees only his own classes. The data stays in the school’s own account.', 'كل دور ليه دخول خاص بيه، والمدرس بيشوف فصوله بس. والبيانات في حساب المدرسة نفسها.'],
  center: ['Five roles, five logins. Each person sees only their own data, and passwords are stored encrypted.', '5 أدوار و5 أنواع دخول. كل واحد بيشوف بياناته هو بس، والباسوردات متشفّرة.'],
  teacher: ['Students and parents sign in with a code and a private PIN, and each one sees only their own child.', 'الطالب وولي الأمر بيدخلوا بكود ورقم سري خاص، وكل واحد بيشوف ابنه هو بس.'],
  chat: ['The bot answers only from the information you approve, and never shares one customer’s details with another.', 'البوت بيرد من المعلومات اللي انت موافق عليها بس، وعمره ما يشارك بيانات عميل مع عميل تاني.']
};
var LOCK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5z"/><path d="M9 12l2 2 4-4"/></svg>';
$('projList').outerHTML = PROJECTS.map(function(p, i){
  if (p.static) return '';
  var safe = SAFE_NOTE[p.id];
  return '<section class="proj" id="p-' + p.id + '"><div class="wrap p-in">' +
    '<div class="p-head"><div><span class="num">' + p.num + '</span><h2 data-ar="' + p.ar + '">' + p.en + '</h2><span class="ar-t">' + p.arT + '</span></div>' +
    '<div class="modes" role="group" aria-label="View" data-p="' + i + '"><button type="button" data-m="how" aria-pressed="true" data-ar="شوف بيتستخدم إزاي<small>See how it’s used</small>">See how it’s used<small>شوف بيتستخدم إزاي</small></button><button type="button" data-m="demo" aria-pressed="false" data-ar="جرّب بنفسك<small>Try the demo</small>">Try the demo<small>جرّب بنفسك</small></button></div></div>' +
    '<div class="stage glass" id="stage-' + i + '"></div>' +
    '<div class="roles-grid">' + p.roles.map(function(r){ return '<div class="role glass"><b data-ar="' + r[1] + '<small>' + r[0] + '</small>">' + r[0] + '<small>' + r[1] + '</small></b><ul class="ar">' + r[2].map(function(x){ return '<li>' + x + '</li>'; }).join('') + '</ul></div>'; }).join('') + '</div>' +
    '<div class="p-story">' + p.story.map(function(s){ return '<div><b data-ar="' + s[3] + '">' + s[0] + '</b><p>' + s[1] + '</p><p class="ar">' + s[2] + '</p></div>'; }).join('') +
      '<div class="safe-box"><b><i>' + LOCK + '</i><span data-ar="الأمان">Security</span></b><p>' + safe[0] + '</p><p class="ar">' + safe[1] + '</p></div></div>' +
    (p.on ? '<div class="works glass"><b>Works on</b>' + brands(p.on) + '<p class="ar">بنركّب نفس البوت على موقعك، أو واتساب، أو إنستجرام، أو تيك توك، أو ماسنجر، أو تليجرام، وكله بيرد من نفس البيانات.</p></div>' : '') +
    '<div class="p-cta glass"><div><b data-ar="عايز حاجة زي دي؟">Want something like this?</b><p class="ar">كلّمنا ونبدأ مشروعك.</p></div><div class="cta"><a class="btn" href="#contact" data-ar="ابدأ مشروعك">Start a project</a><a class="btn solid" href="#contact" data-ar="كلّمنا">Talk to us</a></div></div>' +
    '</div></section>';
}).join('');

var pClean = {};
function openProject(i, mode){
  var p = PROJECTS[i], st = $('stage-' + i);
  if (pClean[i]) pClean[i]();
  document.querySelectorAll('.modes[data-p="' + i + '"] button').forEach(function(b){ b.setAttribute('aria-pressed', b.dataset.m === mode); });
  st.innerHTML = '<div></div>';
  pClean[i] = mode === 'how' ? journey(st.firstChild, p.jr, false) : (st.firstChild.className = 'demo', p.demo(st.firstChild) || null);
  if (!reduce) gsap.from(st.firstChild, { y: 20, opacity: 0, duration: .5 });
}
PROJECTS.forEach(function(p, i){
  document.querySelectorAll('.modes[data-p="' + i + '"] button').forEach(function(b){ b.addEventListener('click', function(){ openProject(i, b.dataset.m); }); });
  // start each project's story when it scrolls in, and pause it when it leaves
  ScrollTrigger.create({ trigger: $('stage-' + i), start: 'top 85%', end: 'bottom 10%',
    onEnter: function(){ if (!pClean[i]) openProject(i, 'how'); }, onEnterBack: function(){ if (!pClean[i]) openProject(i, 'how'); },
    onLeave: function(){ if (pClean[i]) { pClean[i](); pClean[i] = null; } }, onLeaveBack: function(){ if (pClean[i]) { pClean[i](); pClean[i] = null; } } });
  if (!reduce && !p.static) {
    var sec = $('stage-' + i).closest('.proj');
    gsap.from(sec.querySelectorAll('.p-head > *, .p-story > div'), { y: 50, opacity: 0, duration: .9, stagger: .08, ease: 'expo.out', scrollTrigger: { trigger: sec, start: 'top 70%' } });
  }
});

// the ERP section is written in the page, so it gets its own entrance
if (!reduce) gsap.from('.erp .p-head > *, .erp-lead, .erp-view, .erp-flow > *', { y: 40, opacity: 0, duration: .8, stagger: .05, ease: 'expo.out', scrollTrigger: { trigger: '.erp', start: 'top 70%' } });

/* ================= WHAT WE BUILD: the ideas spiralling around the engine ================= */
var IDEAS = [
  { en: 'ERP: Your Whole Business', ar: 'ERP يدير شركتك كلها', who: 'Owner & every team', color: '#2563EB', device: 'web', scenes: [
    { en: 'Raw material arrives at the warehouse.', ar: 'الخامة بتوصل المخزن وبتتسجّل.', s: A('المخزن · استلام بضاعة', R('صاج 1.5 مم', '12 طن', 'ok') + R('دهان إيبوكسي أسود', '400 لتر', 'ok') + R('مسامير وصواميل', '18 كرتونة', 'ok') + B('تأكيد الاستلام', true)) },
    { en: 'The factory runs the production order.', ar: 'المصنع بيشغّل أمر الإنتاج.', s: A('أمر تشغيل #2241', R('المنتج', 'دولاب معدن 4 ضلف') + R('الكمية', '350 قطعة') + R('اتعمل لحد دلوقتي', '214 قطعة') + BARS([20, 38, 51, 61, 72]) + B('تحويل للمخزن', true)) },
    { en: 'A sale updates the stock and the books.', ar: 'البيعة بتخصم من المخزن وبتنزل في الحسابات لوحدها.', s: A('فاتورة #8812', R('العميل', 'شركة النور للتوريدات') + R('120 دولاب', '148,000 ج') + R('الضريبة', '20,720 ج') + B('اعتماد الفاتورة', true)) },
    { en: 'And the owner sees it all from home.', ar: 'وصاحب الشركة شايف كل ده وهو في البيت.', s: A('لوحة صاحب الشركة', G(C('مبيعات النهارده', '284,500 ج'), C('الإنتاج', '92%'), C('قيمة المخزون', '3.2 م ج'), C('الكاش', '1.46 م ج')) + R('تنبيه: الصاج قرّب يخلص', 'اطلب', 'bad')) }] },
  { en: 'Clinic Booking', ar: 'حجز عيادات وتذكير المرضى', who: 'Receptionist & patient', color: '#0D9488', device: 'phone', scenes: [
    { en: 'The patient picks a time.', ar: 'المريض بيختار المعاد اللي يناسبه.', s: A('عيادة د. سارة', '<div class="ua-slots"><span>4:00</span><span class="off">4:30</span><span data-tap>5:00</span><span>5:30</span><span class="off">6:00</span><span>6:30</span></div>' + N('كشف عام · 300 ج'), 'الثلاثاء') },
    { en: 'A reminder goes out the day before.', ar: 'وقبلها بيوم بيوصله تذكير على الواتساب.', s: A('WhatsApp', M('تذكير: معادك بكرة الساعة 5:00 مع د. سارة. للتأكيد اضغط 1') + M('1', true)) },
    { en: 'The receptionist sees today’s list.', ar: 'والسكرتيرة بتشوف كشف النهارده.', s: A('العيادة · النهارده', R('أحمد سمير', '4:00 · وصل', 'ok') + R('منى علي', '5:00 · مأكد') + B('وصل المريض', true)) },
    { en: 'Fewer no-shows, a calmer clinic.', ar: 'غياب أقل وعيادة أهدى.', s: A('التقرير', G(C('المواعيد', '32'), C('الغياب', '−60%')) + BARS([40, 55, 70, 65, 80])) }] },
  { en: 'Restaurant QR Orders', ar: 'منيو QR وطلبات للمطبخ', who: 'Customer & kitchen', color: '#EA580C', device: 'phone', scenes: [
    { en: 'The customer scans and orders.', ar: 'الزبون بيعمل سكان ويطلب من الترابيزة.', s: A('منيو · ترابيزة 7', R('برجر كلاسيك', '120 ج') + R('بطاطس', '40 ج', '', true) + R('عصير مانجا', '35 ج')) },
    { en: 'The order lands in the kitchen.', ar: 'الطلب بيوصل المطبخ فورًا.', s: A('المطبخ', R('ترابيزة 7', 'برجر + بطاطس + عصير') + B('جاهز', true)) },
    { en: 'The table knows it’s on the way.', ar: 'والزبون بيعرف إن طلبه جاي.', s: A('ترابيزة 7', T('طلبك جاهز وجاي ✓') + G(C('الحساب', '195 ج'), C('الوقت', '12 د'))) }] },
  { en: 'Gym Memberships', ar: 'اشتراكات الجيم ودخول بالـ QR', who: 'Member & gym owner', color: '#7C3AED', device: 'phone', scenes: [
    { en: 'The member checks in with a QR.', ar: 'المشترك بيدخل بالـ QR.', s: A('My Gym', '<div class="ua-card" style="text-align:center;padding:20px"><b style="font-size:40px">▦</b><small>QR الدخول</small></div>' + B('دخول', true)) },
    { en: 'The owner sees who’s expiring.', ar: 'وصاحب الجيم بيشوف الاشتراكات اللي قرّبت تخلص.', s: A('لوحة الجيم', R('كريم مصطفى', 'بيخلص بعد 3 أيام', 'bad') + R('سارة محمود', 'بيخلص بكرة', 'bad') + B('ابعت تذكير', true)) },
    { en: 'Renewals come back on their own.', ar: 'والتجديدات بترجع لوحدها.', s: A('التقرير', G(C('تجديدات الشهر', '64'), C('نسبة التجديد', '82%'))) }] },
  { en: 'Online Store + WhatsApp', ar: 'متجر أونلاين وطلبات على الواتساب', who: 'Shop owner', color: '#16A34A', device: 'phone', scenes: [
    { en: 'A new order arrives.', ar: 'طلب جديد بيوصل.', s: A('الطلبات', R('منى · 2 تيشيرت', '500 ج', '', true) + R('عمر · كاب', '120 ج', 'ok')) },
    { en: 'One tap confirms it.', ar: 'ضغطة واحدة وتأكّده.', s: A('طلب منى', R('2 تيشيرت أسود', '500 ج') + R('العنوان', 'المعادي') + B('تأكيد الطلب', true)) },
    { en: 'The customer gets a WhatsApp.', ar: 'والعميل بيوصله واتساب.', s: A('WhatsApp', M('أهلًا منى، طلبك اتأكد وهيوصلك خلال يومين ✓')) }] },
  { en: 'Factory Monitor', ar: 'مراقبة الماكينات وتوقّع الأعطال', who: 'Shift engineer', color: '#DC2626', device: 'web', scenes: [
    { en: 'Every machine, one screen.', ar: 'كل الماكينات في شاشة واحدة.', s: A('خط الإنتاج 2', R('ماكينة 1', 'طبيعي', 'ok') + R('ماكينة 2', 'اهتزاز عالي', 'bad', true) + R('ماكينة 3', 'طبيعي', 'ok')) },
    { en: 'AI warns days before a failure.', ar: 'الذكاء الاصطناعي بينبّه قبل العطل بأيام.', s: A('ماكينة 2', N('الرولمان غالبًا بيتآكل. العطل متوقع خلال 3 أيام.') + BARS([30, 35, 40, 60, 85, 95]) + B('جدولة صيانة', true)) },
    { en: 'Fixed before it stops.', ar: 'واتصلّحت قبل ما تقف.', s: A('الصيانة', T('اتجدولت بكرة 8 ص ✓') + G(C('وقت التوقف', '0 س'), C('توفير', '45,000 ج'))) }] },
  { en: 'Real-Estate CRM', ar: 'متابعة عملاء العقارات', who: 'Sales agent', color: '#0369A1', device: 'phone', scenes: [
    { en: 'A new lead comes in.', ar: 'عميل جديد مهتم بشقة.', s: A('العملاء', R('محمد · شقة 3 أوض', 'جديد', '', true) + R('نهى · فيلا', 'متابعة')) },
    { en: 'The agent calls and logs it.', ar: 'المندوب بيكلّمه ويسجّل المكالمة.', s: A('محمد', R('الميزانية', '2 مليون') + R('المنطقة', 'التجمع') + B('حدّد معاد معاينة', true)) },
    { en: 'No follow-up is forgotten.', ar: 'ومفيش متابعة بتتنسي.', s: A('المتابعات', R('معاينة مع محمد', 'الخميس 4 م', 'ok') + G(C('صفقات الشهر', '6'), C('العمولة', '120,000 ج'))) }] },
  { en: 'Pharmacy Stock', ar: 'مخزون الصيدلية والصلاحية', who: 'Pharmacist', color: '#059669', device: 'phone', scenes: [
    { en: 'Every sale updates the stock.', ar: 'كل بيعة بتحدّث المخزون.', s: A('الصيدلية', R('بنادول 500', 'متبقي 4', 'bad', true) + R('فيتامين سي', 'متبقي 40', 'ok')) },
    { en: 'Low stock? Order in one tap.', ar: 'المخزون قلّ؟ اطلب في ضغطة.', s: A('بنادول 500', N('المخزون هيخلص خلال يومين.') + B('اطلب من المورد', true)) },
    { en: 'Expiry dates are watched for you.', ar: 'وتواريخ الصلاحية متراقبة.', s: A('الصلاحية', R('شراب كحة', 'ينتهي بعد 20 يوم', 'bad') + T('اتبعت الطلب للمورد ✓')) }] },
  { en: 'Delivery Tracking', ar: 'تتبّع التوصيل', who: 'Driver & customer', color: '#CA8A04', device: 'phone', scenes: [
    { en: 'The driver sees today’s route.', ar: 'المندوب بيشوف طلبات النهارده بالترتيب.', s: A('المندوب', R('1 · مدينة نصر', 'جاري', '', true) + R('2 · المعادي', 'بعده') + R('3 · الزمالك', 'بعده')) },
    { en: 'Delivered, with one tap.', ar: 'اتسلّم بضغطة.', s: A('طلب مدينة نصر', R('العميل', 'منى') + R('المبلغ', '250 ج') + B('تم التوصيل', true)) },
    { en: 'The customer is told right away.', ar: 'والعميل بيوصله تأكيد فورًا.', s: A('WhatsApp', M('طلبك اتسلّم ✓ شكرًا لثقتك!')) }] },
  { en: 'HR & Payroll', ar: 'الحضور والمرتبات', who: 'Employee & HR', color: '#9333EA', device: 'phone', scenes: [
    { en: 'The employee checks in.', ar: 'الموظف بيسجّل حضوره.', s: A('حضوري', '<div class="ua-card" style="text-align:center"><b style="font-size:26px">8:57</b><small>في الموعد</small></div>' + B('تسجيل حضور', true)) },
    { en: 'HR sees the whole team.', ar: 'وشؤون الموظفين بتشوف الفريق كله.', s: A('الموظفين', R('أحمد', 'حاضر 8:57', 'ok') + R('منى', 'إجازة') + R('كريم', 'متأخر 9:20', 'bad')) },
    { en: 'Payroll calculates itself.', ar: 'والمرتبات بتتحسب لوحدها.', s: A('مرتبات الشهر', G(C('الإجمالي', '184,000 ج'), C('الخصومات', '2,300 ج')) + B('اعتماد المرتبات', true)) }] },
  { en: 'Car Service Center', ar: 'مركز صيانة سيارات', who: 'Mechanic & car owner', color: '#475569', device: 'phone', scenes: [
    { en: 'Every car has a live status.', ar: 'كل عربية ليها حالة لحظة بلحظة.', s: A('الورشة', R('تويوتا كورولا', 'تغيير زيت', '', true) + R('هيونداي', 'فحص فرامل')) },
    { en: 'The mechanic marks it ready.', ar: 'الميكانيكي بيعلّمها جاهزة.', s: A('تويوتا كورولا', R('الشغل', 'زيت + فلتر') + R('الفاتورة', '850 ج') + B('العربية جاهزة', true)) },
    { en: 'The owner gets the invoice.', ar: 'وصاحب العربية بيوصله الفاتورة.', s: A('WhatsApp', M('عربيتك جاهزة ✓ الفاتورة 850 ج. تقدر تستلمها لحد 9 م.')) }] }
];
// one line per idea: what it does (EN, AR) and where it can live
var IDEA_INFO = [
  ['One system for the whole company, from manufacturing to the money, and you watch it from anywhere.', 'سيستم واحد للشركة كلها، من التصنيع لحد الفلوس، وانت متابعه من أي مكان.', ['web', 'whatsapp', 'sheets']],
  ['Patients book online and get reminders, so fewer appointments are missed.', 'المريض يحجز أونلاين ويوصله تذكير، فالمواعيد الضايعة بتقل.', ['web', 'whatsapp', 'maps']],
  ['Guests order from the table; the kitchen gets it in a second.', 'الزبون يطلب من الترابيزة، والمطبخ يستلم في ثانية.', ['web', 'instagram', 'whatsapp']],
  ['Members check in with a QR; renewals remind themselves.', 'المشترك يدخل بالـ QR، والتجديد بيفكّر نفسه.', ['web', 'whatsapp', 'instagram']],
  ['Orders from the site and social media land in one list.', 'طلبات الموقع والسوشيال بتنزل في قايمة واحدة.', ['web', 'instagram', 'tiktok', 'whatsapp', 'facebook']],
  ['AI watches every machine and warns days before a failure.', 'الذكاء الاصطناعي بيراقب الماكينات وبينبّه قبل العطل بأيام.', ['web', 'whatsapp', 'telegram']],
  ['Every lead, call and visit in one place, with follow-ups.', 'كل عميل ومكالمة ومعاينة في مكان واحد، مع المتابعة.', ['web', 'whatsapp', 'facebook', 'instagram']],
  ['Stock and expiry dates watched for you, with one-tap reorders.', 'المخزون والصلاحية متراقبين، والطلب من المورد بضغطة.', ['web', 'whatsapp', 'sheets']],
  ['Drivers follow a route; customers get live updates.', 'المندوب ماشي بخط سير، والعميل بيتابع لحظة بلحظة.', ['web', 'whatsapp', 'maps']],
  ['Check-ins, leaves and payroll that calculates itself.', 'حضور وإجازات ومرتبات بتتحسب لوحدها.', ['web', 'whatsapp', 'sheets']],
  ['Every car has a live status; owners get the invoice by message.', 'كل عربية ليها حالة لايف، وصاحبها يوصله الفاتورة برسالة.', ['web', 'whatsapp', 'maps']]
];
(function(){
  /* the cards climb a spiral around the engine as you scroll (the engine itself is the 3D scene at the end of the page) */
  var helix = $('helix');
  var cards = IDEAS.map(function(d, i){
    var info = IDEA_INFO[i]; d.d = info[0]; d.da = info[1]; d.on = info[2];
    var c = document.createElement('button'); c.type = 'button'; c.className = 'icard';
    c.addEventListener('click', function(){ openIdea(d, i); }); helix.appendChild(c); return c;
  });
  function fill(){
    cards.forEach(function(c, i){
      var d = IDEAS[i], ar = prefs.lang === 'ar';
      c.innerHTML = '<span class="n">IDEA ' + String(i + 1).padStart(2, '0') + ' / ' + cards.length + '</span>' +
        (ar ? '<b class="is-ar">' + d.ar + '</b><span>' + d.en + '</span><p class="ar">' + d.da + '</p>'
            : '<b>' + d.en + '</b><span class="ar">' + d.ar + '</span><p>' + d.d + '</p>') +
        '<div class="row"><span class="who">' + d.who + '</span>' + brands(d.on) + '</div>';
    });
  }
  fill(); onLang.push(fill);
  ScrollTrigger.create({ trigger: '#build', start: 'top top', end: 'bottom bottom', onUpdate: function(st){ HB.p = st.progress; } });
  // the ideas wind up around the gears like tape on a reel, and never run out: each one comes back in at the bottom.
  // Left alone, the reel turns one card, stops for a moment so it can be read, then turns to the next.
  // Scrolling spins it freely, and when the scroll stops it settles on the nearest card. Idea 01 starts in front.
  var n = cards.length, half = n / 2, flow = 0, target = 0, lastT = 0, lastP = 0, lastScroll = -1e9, nextStep = 2600;
  var raf = 0;
  // the reel only runs while its section is on screen
  new IntersectionObserver(function(es){
    if (es[0].isIntersecting) { if (!raf) { lastT = 0; raf = requestAnimationFrame(loop); } }
    else if (raf) { cancelAnimationFrame(raf); raf = 0; }
  }).observe($('build'));
  function loop(t){
    var small = innerWidth < 700, dt = lastT ? Math.min(64, t - lastT) : 16; lastT = t;
    var dp = HB.p - lastP; lastP = HB.p;
    if (dp) { target += dp * 8; lastScroll = t; }
    else if (t - lastScroll > 600 && target !== Math.round(target)) { target = Math.round(target); nextStep = t + 2400; }
    else if (!reduce && t > nextStep) { target += 1; nextStep = t + 3000; }
    flow += (target - flow) * Math.min(1, dt / 240);
    // on phones the spiral is narrower and fewer cards show at once, so nothing spills off the screen
    var R = small ? Math.min(48, innerWidth * .13) : Math.min(440, innerWidth * .3), step = small ? 150 : 125, reach = small ? 2 : 2.6;
    cards.forEach(function(c, i){
      var u = ((flow - i + half) % n + n) % n - half;       // where this card is on the spiral: 0 is the front, positive is higher up
      var a = u * 1.25;
      var x = Math.sin(a) * R, z = Math.cos(a) * R, y = -u * step;
      var topRoom = Math.min(1, Math.max(0, (y + innerHeight * .57 - (small ? 230 : 250)) / 120)); // fade before the heading
      var vis = Math.max(0, 1 - Math.pow(Math.abs(u) / reach, 4)) * topRoom, front = (z / R + 1) / 2;
      c.style.visibility = vis > .005 ? 'visible' : 'hidden';   // cards you can't see cost nothing
      if (vis <= .005) return;
      c.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0) scale(' + (.7 + .32 * front) + ')';
      c.style.opacity = vis * (.35 + .65 * front);
      c.style.zIndex = z > 0 ? 10 + Math.round(z) : Math.max(1, Math.round(4 + z / R * 3));   // the gears sit at 5: near side in front, far side behind
      c.style.pointerEvents = vis > .45 && z > -R * .2 ? 'auto' : 'none';
    });
    raf = requestAnimationFrame(loop);
  }
})();
var modal = $('modal'), mClean = null;
function openIdea(d, i){
  modal.hidden = false; document.body.style.overflow = 'hidden';
  var st = $('mstage');
  st.innerHTML = '<div class="m-head"><div><span class="label">IDEA ' + String(i + 1).padStart(2, '0') + ' · ' + d.who + '</span><h3>' + d.en + '</h3><p class="ar">' + d.ar + '</p>' +
    '<p style="margin:8px 0 0;max-width:60ch">' + d.d + '</p><p class="ar">' + d.da + '</p><div class="works" style="padding:10px 0 0"><b>Works on</b>' + brands(d.on) + '</div>' +
    '<div class="cta" style="margin-top:12px"><a class="btn" href="#contact" data-close>Build this with us</a><a class="btn ghost" href="#contact" data-close>Talk to us</a></div></div>' +
    '<div style="display:flex;gap:8px;align-items:center"><div class="modes" role="group"><button type="button" data-m="how" aria-pressed="true">See how it’s used<small>شوف بيتستخدم إزاي</small></button><button type="button" data-m="try" aria-pressed="false">Try the demo<small>جرّب بنفسك</small></button></div><button class="xb" type="button" aria-label="Close">✕</button></div></div><div id="mbody"></div>';
  var cfg = { user: d.who.toUpperCase(), device: d.device, color: d.color, scenes: d.scenes };
  function run(mode){
    if (mClean) mClean();
    st.querySelectorAll('.modes button').forEach(function(b){ b.setAttribute('aria-pressed', b.dataset.m === mode); });
    mClean = journey($('mbody'), cfg, mode === 'try');
  }
  st.querySelectorAll('.modes button').forEach(function(b){ b.addEventListener('click', function(){ run(b.dataset.m); }); });
  st.querySelector('.xb').addEventListener('click', closeIdea);
  st.querySelectorAll('[data-close]').forEach(function(a){ a.addEventListener('click', closeIdea); });
  run('how');
  if (!reduce) gsap.from(st, { y: 40, scale: .96, opacity: 0, duration: .5, ease: 'expo.out' });
  st.querySelector('.xb').focus();
}
function closeIdea(){ modal.hidden = true; document.body.style.overflow = ''; if (mClean) mClean(); mClean = null; }
modal.addEventListener('click', function(e){ if (e.target === modal) closeIdea(); });
addEventListener('keydown', function(e){ if (e.key === 'Escape' && !modal.hidden) closeIdea(); });

/* ================= WHAT WE USE + SECURITY ================= */
// [icon svg, name, what for (EN, AR), its security (EN, AR), brand colour]
var TOOLS = [
  ['<svg viewBox="0 0 128 128"><path fill="#007ACC" fill-rule="evenodd" d="M90.767 127.126a7.968 7.968 0 0 0 6.35-.244l26.353-12.681a8 8 0 0 0 4.53-7.209V21.009a8 8 0 0 0-4.53-7.21L97.117 1.12a7.97 7.97 0 0 0-9.093 1.548l-50.45 46.026L15.6 32.013a5.328 5.328 0 0 0-6.807.302l-7.048 6.411a5.335 5.335 0 0 0-.006 7.888L20.796 64 1.74 81.387a5.336 5.336 0 0 0 .006 7.887l7.048 6.411a5.327 5.327 0 0 0 6.807.303l21.974-16.68 50.45 46.025a7.96 7.96 0 0 0 2.743 1.793Zm5.252-92.183L57.74 64l38.28 29.058V34.943Z"/></svg>',
    'Visual Studio Code', 'Where we write and test every line.', 'هنا بنكتب ونجرّب كل سطر كود.', 'Trusted extensions only. No passwords saved in project files.', 'إضافات موثوقة بس، ومفيش باسوردات بتتحفظ في ملفات المشروع.', '#007ACC'],
  ['<svg viewBox="0 0 24 24"><path fill="#D97757" d="m4.7144 15.9555 4.7174-2.6471.079-.2307-.079-.1275h-.2307l-.7893-.0486-2.6956-.0729-2.3375-.0971-2.2646-.1214-.5707-.1215-.5343-.7042.0546-.3522.4797-.3218.686.0608 1.5179.1032 2.2767.1578 1.6514.0972 2.4468.255h.3886l.0546-.1579-.1336-.0971-.1032-.0972L6.973 9.8356l-2.55-1.6879-1.3356-.9714-.7225-.4918-.3643-.4614-.1578-1.0078.6557-.7225.8803.0607.2246.0607.8925.686 1.9064 1.4754 2.4893 1.8336.3643.3035.1457-.1032.0182-.0728-.164-.2733-1.3539-2.4467-1.445-2.4893-.6435-1.032-.17-.6194c-.0607-.255-.1032-.4674-.1032-.7285L6.287.1335 6.6997 0l.9957.1336.419.3642.6192 1.4147 1.0018 2.2282 1.5543 3.0296.4553.8985.2429.8318.091.255h.1579v-.1457l.1275-1.706.2368-2.0947.2307-2.6957.0789-.7589.3764-.9107.7468-.4918.5828.2793.4797.686-.0668.4433-.2853 1.8517-.5586 2.9021-.3643 1.9429h.2125l.2429-.2429.9835-1.3053 1.6514-2.0643.7286-.8196.85-.9046.5464-.4311h1.0321l.759 1.1293-.34 1.1657-1.0625 1.3478-.8804 1.1414-1.2628 1.7-.7893 1.36.0729.1093.1882-.0183 2.8535-.607 1.5421-.2794 1.8396-.3157.8318.3886.091.3946-.3278.8075-1.967.4857-2.3072.4614-3.4364.8136-.0425.0304.0486.0607 1.5482.1457.6618.0364h1.621l3.0175.2247.7892.522.4736.6376-.079.4857-1.2142.6193-1.6393-.3886-3.825-.9107-1.3113-.3279h-.1822v.1093l1.0929 1.0686 2.0035 1.8092 2.5075 2.3314.1275.5768-.3218.4554-.34-.0486-2.2039-1.6575-.85-.7468-1.9246-1.621h-.1275v.17l.4432.6496 2.3436 3.5214.1214 1.0807-.17.3521-.6071.2125-.6679-.1214-1.3721-1.9246L14.38 17.959l-1.1414-1.9428-.1397.079-.674 7.2552-.3156.3703-.7286.2793-.6071-.4614-.3218-.7468.3218-1.4753.3886-1.9246.3157-1.53.2853-1.9004.17-.6314-.0121-.0425-.1397.0182-1.4328 1.9672-2.1796 2.9446-1.7243 1.8456-.4128.164-.7164-.3704.0667-.6618.4008-.5889 2.386-3.0357 1.4389-1.882.929-1.0868-.0062-.1579h-.0546l-6.3385 4.1164-1.1293.1457-.4857-.4554.0608-.7467.2307-.2429 1.9064-1.3114Z"/></svg>',
    'Claude', 'Our AI partner for building, reviewing and explaining.', 'شريكنا في الذكاء الاصطناعي: بيساعدنا نبني ونراجع ونشرح.', 'Never given passwords or customer data. We review every line it writes.', 'مش بنديله باسوردات ولا بيانات عملاء، وبنراجع كل سطر بيكتبه.', '#D97757'],
  ['<svg viewBox="0 0 24 24"><path fill="#3ECF8E" d="M11.9 1.036c-.015-.986-1.26-1.41-1.874-.637L.764 12.05C-.33 13.427.65 15.455 2.409 15.455h9.579l.113 7.51c.014.985 1.259 1.408 1.873.636l9.262-11.653c1.093-1.375.113-3.403-1.645-3.403h-9.642z"/></svg>',
    'Supabase', 'Database and logins for our systems.', 'الداتابيز وتسجيل الدخول للأنظمة.', 'Row Level Security: every user can read only their own rows.', 'كل مستخدم بيقدر يشوف بياناته هو بس، والباقي مقفول عليه.', '#3ECF8E'],
  ['<svg viewBox="0 0 24 24"><path fill="#181717" d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>',
    'GitHub + GitHub Pages', 'Code history, and free hosting for our sites.', 'تاريخ الكود، واستضافة مجانية للمواقع.', 'Two-factor login, protected main branch, HTTPS on every page.', 'تأكيد بخطوتين، وحماية للفرع الأساسي، وHTTPS على كل صفحة.', '#181717'],
  ['<svg viewBox="0 0 24 24"><path fill="#34A853" d="M11.318 12.545H7.91v-1.909h3.41v1.91zM14.728 0v6h6l-6-6zm1.363 10.636h-3.41v1.91h3.41v-1.91zm0 3.273h-3.41v1.91h3.41v-1.91zM20.727 6.5v15.864c0 .904-.732 1.636-1.636 1.636H4.909a1.636 1.636 0 0 1-1.636-1.636V1.636C3.273.732 4.005 0 4.909 0h9.318v6.5h6.5zm-3.273 2.773H6.545v7.909h10.91v-7.91zm-6.136 4.636H7.91v1.91h3.41v-1.91z"/></svg>',
    'Google Sheets + Apps Script', 'Live reports and simple automations.', 'تقارير لايف وأتمتة بسيطة.', 'Shared with named accounts only, never public links.', 'متشارك مع حسابات محددة بس، ومفيش لينكات مفتوحة للكل.', '#34A853'],
  ['<svg viewBox="0 0 24 24"><path fill="#3776AB" d="M14.25.18l.9.2.73.26.59.3.45.32.34.34.25.34.16.33.1.3.04.26.02.2-.01.13V8.5l-.05.63-.13.55-.21.46-.26.38-.3.31-.33.25-.35.19-.35.14-.33.1-.3.07-.26.04-.21.02H8.77l-.69.05-.59.14-.5.22-.41.27-.33.32-.27.35-.2.36-.15.37-.1.35-.07.32-.04.27-.02.21v3.06H3.17l-.21-.03-.28-.07-.32-.12-.35-.18-.36-.26-.36-.36-.35-.46-.32-.59-.28-.73-.21-.88-.14-1.05-.05-1.23.06-1.22.16-1.04.24-.87.32-.71.36-.57.4-.44.42-.33.42-.24.4-.16.36-.1.32-.05.24-.01h.16l.06.01h8.16v-.83H6.18l-.01-2.75-.02-.37.05-.34.11-.31.17-.28.25-.26.31-.23.38-.2.44-.18.51-.15.58-.12.64-.1.71-.06.77-.04.84-.02 1.27.05zm-6.3 1.98l-.23.33-.08.41.08.41.23.34.33.22.41.09.41-.09.33-.22.23-.34.08-.41-.08-.41-.23-.33-.33-.22-.41-.09-.41.09zm13.09 3.95l.28.06.32.12.35.18.36.27.36.35.35.47.32.59.28.73.21.88.14 1.04.05 1.23-.06 1.23-.16 1.04-.24.86-.32.71-.36.57-.4.45-.42.33-.42.24-.4.16-.36.09-.32.05-.24.02-.16-.01h-8.22v.82h5.84l.01 2.76.02.36-.05.34-.11.31-.17.29-.25.25-.31.24-.38.2-.44.17-.51.15-.58.13-.64.09-.71.07-.77.04-.84.01-1.27-.04-1.07-.14-.9-.2-.73-.25-.59-.3-.45-.33-.34-.34-.25-.34-.16-.33-.1-.3-.04-.25-.02-.2.01-.13v-5.34l.05-.64.13-.54.21-.46.26-.38.3-.32.33-.24.35-.2.35-.14.33-.1.3-.06.26-.04.21-.02.13-.01h5.84l.69-.05.59-.14.5-.21.41-.28.33-.32.27-.35.2-.36.15-.36.1-.35.07-.32.04-.28.02-.21V6.07h2.09l.14.01zm-6.47 14.25l-.23.33-.08.41.08.41.23.33.33.23.41.08.41-.08.33-.23.23-.33.08-.41-.08-.41-.23-.33-.33-.23-.41-.08-.41.08z"/></svg>',
    'Python', 'AI models and data work.', 'موديلات الذكاء الاصطناعي وتحليل البيانات.', 'Runs on our own machines; customer data never leaves them.', 'بيشتغل على أجهزتنا، وبيانات العملاء مابتطلعش برّاها.', '#3776AB'],
  ['<svg viewBox="0 0 24 24"><path fill="#111" d="M.38 0a.268.268 0 0 0-.256.332l2.894 11.716a.268.268 0 0 0 .01.04l2.89 11.708a.268.268 0 0 0 .447.128L23.802 7.15a.268.268 0 0 0-.112-.45l-5.784-1.667a.268.268 0 0 0-.123-.035L6.38 1.715a.268.268 0 0 0-.144-.04L.456.01A.268.268 0 0 0 .38 0zm.374.654L5.71 2.08 1.99 5.664zM6.61 2.34l4.864 1.4-3.65 3.515zm-.522.12l1.217 4.926-4.877-1.4zm6.28 1.538l4.878 1.404-3.662 3.53zm-.52.13l1.208 4.9-4.853-1.392zm6.3 1.534l4.947 1.424-3.715 3.574zm-.524.12l1.215 4.926-4.876-1.398zm-15.432.696l4.964 1.424-3.726 3.586zM8.047 8.15l4.877 1.4-3.66 3.527zm-.518.137l1.236 5.017-4.963-1.432zm6.274 1.535l4.965 1.425-3.73 3.586zm-.52.127l1.235 5.012-4.958-1.43zm-9.63 2.438l4.873 1.406-3.656 3.523zm5.854 1.687l4.863 1.403-3.648 3.51zm-.54.04l1.214 4.927-4.875-1.4zm-3.896 4.02l5.037 1.442-3.782 3.638z"/></svg>',
    'Three.js + GSAP', '3D and motion, like this website.', 'الثري دي والحركة، زي الموقع ده.', 'Loaded only from trusted sources, under a strict content policy.', 'بيتحمّلوا من مصادر موثوقة بس، تحت سياسة أمان صارمة.', '#111111']
];
// tools are shown plainly: the mark, the name and what kind of tool it is
var KIND = ['EDITOR', 'AI', 'DATABASE', 'CODE & HOSTING', 'SHEETS & AUTOMATION', 'AI & DATA', '3D & MOTION'];
$('uList').innerHTML = TOOLS.map(function(t, i){
  return '<div class="tool glass" style="--c:' + t[6] + '"><span class="tm">' + t[0] + '</span><div><b>' + t[1] + '</b><span class="kind">' + KIND[i] + '</span></div></div>';
}).join('');
document.querySelectorAll('.read-lab').forEach(readWhenSeen);
if (!reduce) {
  gsap.to('#uLine', { scaleY: 1, ease: 'none', scrollTrigger: { trigger: '.uses', start: 'top 70%', end: 'bottom 60%', scrub: true } });
  // each tool card flips in from its side, its logo spins into place, and a pulse of light runs around it
  document.querySelectorAll('.tool').forEach(function(t, i){
    var side = i % 2 ? 1 : -1, logo = t.querySelector('.tm');
    var tl = gsap.timeline({ paused: true });
    tl.fromTo(t, { x: side * 140, y: 30, opacity: 0, rotateY: side * -55, scale: .86, transformPerspective: 900 },
               { x: 0, y: 0, opacity: 1, rotateY: 0, scale: 1, duration: .9, ease: 'expo.out' })
      .fromTo(logo, { rotate: -200, scale: 0 }, { rotate: 0, scale: 1, duration: .8, ease: 'back.out(1.8)' }, .15)
      .fromTo(t, { boxShadow: '0 0 0 0 rgba(74,174,255,0)' }, { boxShadow: '0 0 0 2px rgba(74,174,255,.9), 0 0 50px 4px rgba(74,174,255,.45)', duration: .3, yoyo: true, repeat: 1, ease: 'power2.out' }, .55)
      .set(t, { clearProps: 'boxShadow' });
    ScrollTrigger.create({ trigger: t, start: 'top 88%', onEnter: function(){ tl.play(); }, onLeaveBack: function(){ tl.reverse(); } });
  });
  gsap.from('.lab', { y: 80, rotateX: -25, opacity: 0, stagger: .12, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: '.lab-grid', start: 'top 80%' } });
  gsap.from('.slogan h2', { y: 60, opacity: 0, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: '.slogan', start: 'top 80%' } });
  gsap.from('.contact .panel', { y: 60, opacity: 0, stagger: .15, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: '.contact', start: 'top 75%' } });
}

/* ---------- copy email ---------- */
$('copyMail').addEventListener('click', function(e){
  e.preventDefault(); e.stopPropagation(); var b = this, t = $('mail').textContent;
  var ok = function(){ b.textContent = 'COPIED'; setTimeout(function(){ b.textContent = 'COPY'; }, 1600); };
  try { navigator.clipboard.writeText(t).then(ok, function(){ sel($('mail')); }); } catch (err) { sel($('mail')); }
});
function sel(el){ var r = document.createRange(); r.selectNodeContents(el); var s = getSelection(); s.removeAllRanges(); s.addRange(r); }

/* ---------- cursor, magnetic buttons, tilt ---------- */
if (fine && !reduce) {
  var ring = document.querySelector('.cring');
  var qx = gsap.quickTo(ring, 'x', { duration: .4, ease: 'power3' }), qy = gsap.quickTo(ring, 'y', { duration: .4, ease: 'power3' });
  addEventListener('pointermove', function(e){ qx(e.clientX); qy(e.clientY); });
  document.addEventListener('pointerover', function(e){ ring.classList.toggle('big', !!e.target.closest('a,button')); });
  document.querySelectorAll('.magnetic').forEach(function(b){
    b.addEventListener('pointermove', function(e){ var r = b.getBoundingClientRect(); gsap.to(b, { x: (e.clientX - r.left - r.width / 2) * .3, y: (e.clientY - r.top - r.height / 2) * .4, duration: .4 }); });
    b.addEventListener('pointerleave', function(){ gsap.to(b, { x: 0, y: 0, duration: .8, ease: 'elastic.out(1,.4)' }); });
  });
  document.querySelectorAll('.hwrap').forEach(function(c){
    c.addEventListener('pointermove', function(e){ var r = c.getBoundingClientRect(); gsap.to(c, { rotateY: ((e.clientX - r.left) / r.width - .5) * 18, rotateX: -((e.clientY - r.top) / r.height - .5) * 18, transformPerspective: 900, duration: .5 }); });
    c.addEventListener('pointerleave', function(){ gsap.to(c, { rotateX: 0, rotateY: 0, duration: .9, ease: 'power3' }); });
  });
}
// everything is built now: switch the generated parts to the chosen language too
applyLang(true);
// sections that are off screen pause their endless animations
var offScreen = new IntersectionObserver(function(es){ es.forEach(function(e){ e.target.classList.toggle('off', !e.isIntersecting); }); }, { rootMargin: '10% 0px' });
document.querySelectorAll('main > *').forEach(function(s){ offScreen.observe(s); });
// sections get their real height when first drawn, so re-measure the scroll effects after that
var remeasure = 0, lastH = 0;
new ResizeObserver(function(){ var h = document.querySelector('main').offsetHeight; if (h === lastH) return; lastH = h; clearTimeout(remeasure); remeasure = setTimeout(function(){ ScrollTrigger.refresh(); }, 300); }).observe(document.querySelector('main'));
})();
