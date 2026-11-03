/* home page: typed slogan, founder cards, contact. No libraries here, so it opens fast. */
(function(){
// always open at the top, so the opening animation is the first thing people see
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
if (!location.hash) window.scrollTo({ top: 0, behavior: 'instant' });

/* hero: the slogan types itself */
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
    if (ti < plain.length) setTimeout(step, it[0] === ' ' ? 70 : 45);
    else setTimeout(function(){ typed.classList.remove('caret'); }, 1200);
  })();
}

/* founders */
var PERSON = '<svg viewBox="0 0 100 100" fill="currentColor"><circle cx="50" cy="34" r="20"/><path d="M8 100c4-26 22-40 42-40s38 14 42 40z"/></svg>';
var FOUNDERS = [
  { no: '001', rank: 'SS', name: 'Eng. Ahmed Hindawy', short: 'AHMED HINDAWY', role: 'Co-Founder & CEO', born: '2010-04-01', photo: 'assets/ahmed-bw.webp',
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
    '<div class="hc-foot"><span>HINDAWY</span><span>' + (big ? 'FOUNDER' : 'F-' + f.no) + '</span></div></div><div class="slash"></div></div></div>';
}
$('duo').innerHTML = FOUNDERS.map(function(f){ return hcard(f, false); }).join('');
$('founders').innerHTML = FOUNDERS.map(function(f, i){
  return '<div class="frow' + (i % 2 ? ' flip' : '') + '"><div class="fc">' + hcard(f, true) + '</div>' +
    '<div class="finfo glass"><span class="label">' + f.role + '</span><h3 class="fname" aria-label="' + f.name + '"><span class="eng">Engineer</span><span class="type" data-text="' + f.short + '">' + f.short + '</span></h3>' +
    '<div class="roles">' + f.roles.map(function(r){ return '<span>' + r + '</span>'; }).join('') + '</div>' +
    '<div class="stats">' + f.stats.map(function(s){ return '<div><small>' + s[0] + '</small><b>' + (s[1] === 'auto' ? age(f.born) : s[1]) + '</b></div>'; }).join('') + '</div>' +
    '<p class="bio">' + f.bio + '</p><p class="bio ar">' + f.bioAr + '</p>' +
    '<div class="focus">' + f.focus.map(function(x){ return '<div><b>' + x[0] + '</b><small>' + x[1] + '</small></div>'; }).join('') + '</div></div></div>';
}).join('');

/* the neon and the scan line run only on cards that are on screen */
var live = new IntersectionObserver(function(es){ es.forEach(function(e){ e.target.classList.toggle('live', e.isIntersecting); }); });
document.querySelectorAll('.hwrap').forEach(function(c){ live.observe(c); });

/* hero cards drop once the page has loaded and the visitor is at the top */
function play(){ $('duo').classList.add('play'); }
function ready(){ setTimeout(play, 300); }
if (reduce) play();
else if (document.readyState === 'complete') ready();
else addEventListener('load', ready);

/* team cards drop as they come into view, then the name types itself */
function typeIn(h){
  if (h.dataset.done) return; h.dataset.done = 1;
  var full = h.dataset.text, n = 0; h.textContent = ''; h.classList.add('caret');
  (function step(){ h.textContent = full.slice(0, ++n);
    if (n < full.length) setTimeout(step, 40); else { h.classList.remove('caret'); h.classList.add('lit'); } })();
}
var rows = new IntersectionObserver(function(es){ es.forEach(function(e){ if (!e.isIntersecting) return; rows.unobserve(e.target); e.target.classList.add('in');
  var t = e.target.querySelector('.type'); if (reduce) t.classList.add('lit'); else setTimeout(function(){ typeIn(t); }, 800); }); }, { threshold: .25 });
document.querySelectorAll('.frow').forEach(function(r){ rows.observe(r); });

/* copy email */
$('copyMail').addEventListener('click', function(e){
  e.preventDefault(); e.stopPropagation(); var b = this, t = $('mail').textContent;
  var ok = function(){ b.textContent = 'COPIED'; setTimeout(function(){ b.textContent = 'COPY'; }, 1600); };
  try { navigator.clipboard.writeText(t).then(ok, function(){ sel($('mail')); }); } catch (err) { sel($('mail')); }
});
function sel(el){ var r = document.createRange(); r.selectNodeContents(el); var s = getSelection(); s.removeAllRanges(); s.addRange(r); }
applyLang(true);
})();
