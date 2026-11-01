/* Modulación · controles comunes de las sesiones (C1, 1-nov-2026, a petición de Iago):
   ↩ volver al portal · ⏸/▶ pausa general · ⛶ pantalla completa · y que cada escena quepa en pantalla sin scroll.
   Se carga ANTES que el resto de scripts: la pausa congela el reloj de la página (performance.now, setTimeout,
   requestAnimationFrame), los audios/vídeos y el sonido Web Audio, así que se para cualquier secuencia a medias
   (texto que se escribe, acordes, juego, cinemáticas) y al reanudar sigue justo donde estaba.               */
(function(){
  'use strict';
  var P = {on:false, desde:0, perdido:0, media:[], ctxs:[], raf:[]};
  var realNow = performance.now.bind(performance);
  window.__pausa = P;

  /* ---- reloj: el tiempo en pausa no cuenta ---- */
  performance.now = function(){ return (P.on ? P.desde : realNow()) - P.perdido; };

  /* ---- requestAnimationFrame: en pausa, las vueltas esperan ---- */
  var rRaf = window.requestAnimationFrame.bind(window), rCaf = window.cancelAnimationFrame.bind(window);
  var nRaf = 0, vivosRaf = {};
  function pideRaf(id, cb){ vivosRaf[id] = rRaf(function(){ delete vivosRaf[id]; if(P.on){ P.raf.push([id, cb]); return; } cb(performance.now()); }); }
  window.requestAnimationFrame = function(cb){ var id = ++nRaf; pideRaf(id, cb); return id; };
  window.cancelAnimationFrame = function(id){ if(vivosRaf[id] != null){ rCaf(vivosRaf[id]); delete vivosRaf[id]; } P.raf = P.raf.filter(function(x){ return x[0] !== id; }); };

  /* ---- setTimeout: en pausa se guarda lo que faltaba ---- */
  var rST = window.setTimeout.bind(window), rCT = window.clearTimeout.bind(window);
  var nT = 0, T = {};
  function arma(id){ var t = T[id]; t.real = rST(function(){ delete T[id]; t.cb.apply(window, t.args); }, Math.max(0, t.fin - realNow())); }
  window.setTimeout = function(cb, ms){
    if(typeof cb !== 'function') return rST.apply(window, arguments);
    var id = 'm' + (++nT), args = [].slice.call(arguments, 2);
    T[id] = {cb:cb, args:args, fin:realNow() + (+ms || 0), falta:0};
    if(P.on) T[id].falta = +ms || 0; else arma(id);
    return id;
  };
  window.clearTimeout = function(id){ if(T[id]){ if(T[id].real != null) rCT(T[id].real); delete T[id]; } else rCT(id); };

  /* ---- setInterval: en pausa se saltan las vueltas ---- */
  var rSI = window.setInterval.bind(window);
  window.setInterval = function(cb, ms){
    if(typeof cb !== 'function') return rSI.apply(window, arguments);
    var args = [].slice.call(arguments, 2);
    return rSI(function(){ if(!P.on) cb.apply(window, args); }, ms);
  };

  /* ---- audio y vídeo: se apuntan los que suenan ---- */
  var todos = [];
  var rPlay = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function(){
    if(todos.indexOf(this) < 0) todos.push(this);
    if(P.on){ if(P.media.indexOf(this) < 0) P.media.push(this); return Promise.resolve(); }   /* algo quiso sonar en pausa: sonará al reanudar */
    return rPlay.apply(this, arguments);
  };
  /* ---- Web Audio: se suspenden todos los contextos y no se dejan despertar en pausa ---- */
  ['AudioContext', 'webkitAudioContext'].forEach(function(n){
    var C = window[n]; if(!C) return;
    var Envuelto = function(){ var c = new (Function.prototype.bind.apply(C, [null].concat([].slice.call(arguments))))(); P.ctxs.push(c); if(P.on) try{ c.suspend(); }catch(e){} return c; };
    Envuelto.prototype = C.prototype; window[n] = Envuelto;
  });
  if(window.AudioContext || window.BaseAudioContext){
    var proto = (window.BaseAudioContext || window.AudioContext).prototype, rRes = proto.resume;
    if(rRes) proto.resume = function(){ return P.on ? Promise.resolve() : rRes.apply(this, arguments); };
  }

  function pausa(){
    if(P.on) return;
    P.on = true; P.desde = realNow();
    Object.keys(T).forEach(function(id){ var t = T[id]; if(t.real != null){ rCT(t.real); t.real = null; } t.falta = Math.max(0, t.fin - realNow()); });
    P.media = todos.filter(function(m){ return !m.paused && !m.ended; });
    P.media.forEach(function(m){ try{ m.pause(); }catch(e){} });
    P.ctxs.forEach(function(c){ try{ if(c.state === 'running') c.suspend(); }catch(e){} });
    pinta();
  }
  function sigue(){
    if(!P.on) return;
    P.perdido += realNow() - P.desde; P.on = false;
    P.ctxs.forEach(function(c){ try{ rRes ? rRes.call(c) : c.resume(); }catch(e){} });
    var m = P.media; P.media = [];
    m.forEach(function(x){ try{ var p = rPlay.call(x); if(p && p.catch) p.catch(function(){}); }catch(e){} });
    Object.keys(T).forEach(function(id){ var t = T[id]; if(t.real == null){ t.fin = realNow() + t.falta; arma(id); } });
    var r = P.raf; P.raf = []; r.forEach(function(x){ pideRaf(x[0], x[1]); });
    pinta();
  }
  window.Pausa = {pausa:pausa, sigue:sigue, get on(){ return P.on; }};

  /* ---- pantalla completa ---- */
  function enCompleta(){ return !!(document.fullscreenElement || document.webkitFullscreenElement); }
  function completa(){
    var d = document.documentElement;
    if(enCompleta()) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
    else (d.requestFullscreen || d.webkitRequestFullscreen).call(d);
  }

  /* ---- que la escena quepa sin scroll: primero se encoge el vídeo/juego (16:9), si no basta se escala la escena ---- */
  function encaja(){
    var e = document.querySelector('section.escena.on'); if(!e) return;
    var m = e.querySelector('.marco');
    if(m){ m.style.maxWidth = ''; m.style.marginInline = ''; }
    e.style.transform = ''; e.style.transformOrigin = ''; e.style.marginBottom = '';
    var sobra = document.documentElement.scrollHeight - innerHeight;
    if(sobra <= 2) return;
    if(m && m.offsetHeight > 160){
      var h = Math.max(200, m.offsetHeight - sobra - 4);
      m.style.maxWidth = Math.round(h*16/9) + 'px'; m.style.marginInline = 'auto';
      sobra = document.documentElement.scrollHeight - innerHeight;
      if(sobra <= 2) return;
    }
    var H = e.getBoundingClientRect().height, f = (H - sobra - 4)/H;
    if(f >= .45){   /* se escala la escena entera (transform: todo encoge igual, también el pergamino) y se recoge el hueco que deja */
      e.style.transformOrigin = '50% 0'; e.style.transform = 'scale(' + f.toFixed(3) + ')'; e.style.marginBottom = (-(H*(1 - f))).toFixed(0) + 'px'; }
  }
  var tEnc = [];
  function encajaLuego(){ tEnc.forEach(rCT); tEnc = [0, 350, 1200, 2500].map(function(ms){ return rST(encaja, ms); }); }
  window.Encaja = encaja;

  /* ---- botones en la cabecera, junto a ♪ y al modo (sin franja propia) ---- */
  var SVG = {
    volver:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 6 4 12l6 6v-4h5a4 4 0 0 1 0 8h-2v2h2a6 6 0 0 0 0-12h-5V6z" transform="translate(0 -3)"/></svg>',
    pausa:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="5" width="4" height="14"/><rect x="14" y="5" width="4" height="14"/></svg>',
    play:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5v15l12.5-7.5z"/></svg>',
    full:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h6v2H6v4H4zm10 0h6v6h-2V6h-4zM4 14h2v4h4v2H4zm14 0h2v6h-6v-2h4z"/></svg>',
    sale:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 4h2v6H4V8h4zm6 0h2v4h4v2h-6zM4 14h6v6H8v-4H4zm10 0h6v2h-4v4h-2z"/></svg>'
  };
  var bP, bF;
  function pinta(){
    if(bP){ bP.innerHTML = P.on ? SVG.play : SVG.pausa; bP.title = P.on ? 'Seguir (P)' : 'Pausa (P)'; bP.setAttribute('aria-pressed', P.on); }
    if(bF){ bF.innerHTML = enCompleta() ? SVG.sale : SVG.full; bF.title = enCompleta() ? 'Salir de pantalla completa' : 'Pantalla completa'; }
    document.body && document.body.classList.toggle('enPausa', P.on);
  }
  function boton(id, titulo, svg, fn){
    var b = document.createElement('button'); b.type = 'button'; b.id = id; b.className = 'mute ctlB'; b.title = titulo; b.setAttribute('aria-label', titulo); b.innerHTML = svg;
    b.addEventListener('click', function(ev){ ev.stopPropagation(); fn(); b.blur(); }); return b;
  }
  document.addEventListener('DOMContentLoaded', function(){
    var css = document.createElement('style');
    css.textContent = '.ctlB svg{width:18px;height:18px;fill:currentColor;display:block;margin:auto}.ctlB{display:inline-flex;align-items:center;justify-content:center;width:42px}' +
      '.ctlB[aria-pressed="true"]{background-color:#c9a24a;color:#fff}' +
      'body.enPausa .app::after{content:"⏸ EN PAUSA";position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:60;padding:10px 22px;background:rgba(5,8,20,.82);border:3px double #f4d58a;color:#ffe7a3;font:400 22px/1.2 "DotGothic16",monospace;letter-spacing:.15em;pointer-events:none}' +
      'html:fullscreen,html:-webkit-full-screen{overflow:auto}';
    document.head.appendChild(css);
    var fila = document.querySelector('.cab .fila'); if(!fila) return;
    var volverA = window.MOD_VOLVER || '../prueba.html';
    var bV = boton('bVolver', 'Volver al portal', SVG.volver, function(){ location.href = volverA; });
    bP = boton('bPausa', 'Pausa (P)', SVG.pausa, function(){ P.on ? sigue() : pausa(); });
    bF = boton('bFull', 'Pantalla completa', SVG.full, completa);
    if(!(document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen)) bF.hidden = true;
    fila.insertBefore(bF, fila.firstChild); fila.insertBefore(bP, fila.firstChild); fila.insertBefore(bV, fila.firstChild);
    pinta();
    /* si en pausa se toca cualquier otra cosa de la página, primero se reanuda */
    document.addEventListener('pointerdown', function(ev){ if(P.on && !(ev.target.closest && ev.target.closest('#bPausa'))) sigue(); }, true);
    document.addEventListener('keydown', function(ev){
      if((ev.key === 'p' || ev.key === 'P') && !/INPUT|TEXTAREA/.test((document.activeElement || {}).tagName || '')){ ev.preventDefault(); P.on ? sigue() : pausa(); }
    }, true);
    ['fullscreenchange', 'webkitfullscreenchange'].forEach(function(n){ document.addEventListener(n, function(){ pinta(); encajaLuego(); }); });
    window.addEventListener('resize', encajaLuego);
    new MutationObserver(encajaLuego).observe(document.querySelector('.app') || document.body, {subtree:true, attributes:true, attributeFilter:['class']});
    encajaLuego();
  });
})();
