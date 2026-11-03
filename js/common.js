/* shared by both pages: colour mode, language, header */
var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
var root = document.documentElement;
var $ = function(id){ return document.getElementById(id); };
var esc = function(s){ return String(s).replace(/[&<>"]/g, function(c){ return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
var timeNow = function(){ return new Date().toLocaleTimeString('ar-EG', { hour: 'numeric', minute: '2-digit' }); };

var prefs = { mode: 'dark', lang: 'en' };
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

/* header: turns solid on scroll, the phone menu */
(function(){
  var top = $('top');
  addEventListener('scroll', function(){ top.classList.toggle('solid', scrollY > 30); }, { passive: true });
  $('burger').addEventListener('click', function(){ $('menu').hidden = false; });
  $('menuX').addEventListener('click', function(){ $('menu').hidden = true; });
  $('menu').querySelectorAll('a').forEach(function(a){ a.addEventListener('click', function(){ $('menu').hidden = true; }); });
})();
