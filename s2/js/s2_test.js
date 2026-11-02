/* ==========================================================================
   S2Test - Test-juego "El viaje de las tonalidades" (modulación)
   JS vanilla, sin dependencias. API:
     S2Test.monta(contenedor, {retos: S2Test.RETOS, alFin: fn(res), sonido: true})
     res = {aciertos, total, puntos, tiempo}   (tiempo en segundos)
   Devuelve {reiniciar(), destruir()}.
   Tipos de reto (ver RETOS más abajo): unica, multi, unir, puente, ordenar, vf.
   Los acordes se escriben en notación americana con "m" para menor ("Em");
   solo al mostrarlos se cambia la "m" final por "-" (E-).
   ========================================================================== */
(function () {
  'use strict';

  /* ------------------------------------------------------------------------
     DATOS EDITABLES POR EL PROFESOR
     unica   : {opciones:[texto,...], correcta: índice}
     multi   : {opciones:[{t:texto, ok:true|false},...]}
     unir    : {pares:[[izquierda, derecha],...]}   (3-4 pares)
     puente  : {a:{nombre,color,acordes:[7],grados:[7]}, b:{...}, comunes:[acordes]}
     ordenar : {orden:[acordes en el orden correcto]}  (se barajan solos)
     vf      : {afirmacion, verdadero:true|false, segundos:10}
     Comunes: titulo (corto), enunciado (pregunta), pista (explicación),
              modo (etiqueta opcional), fijo:true (no barajar opciones).
     ------------------------------------------------------------------------ */
  var RETOS = [
    { tipo: 'unica', titulo: 'La gran pregunta', enunciado: '¿Qué es modular?',
      opciones: ['Ir de una tonalidad A a una tonalidad B de forma coherente',
                 'Cambiar de compás a mitad de la obra',
                 'Tocar la misma melodía más rápido',
                 'Repetir la tonalidad inicial al final'],
      correcta: 0,
      pista: 'Modular es viajar de una tonalidad a otra de forma coherente, que el oído acepte el cambio.' },
    { tipo: 'multi', titulo: 'Las ventajas del viaje', enunciado: '¿Qué ventajas tiene modular? (marca todas)',
      opciones: [{ t: 'Obras más largas y variadas', ok: true },
                 { t: 'Más riqueza armónica', ok: true },
                 { t: 'Contraste y sensación de viaje', ok: true },
                 { t: 'Que la obra tenga menos acordes', ok: false }],
      pista: 'Sin modular, solo tienes los acordes de una tonalidad.' },
    { tipo: 'unir', titulo: 'Tres formas de viajar', enunciado: 'Une cada tipo de modulación con su definición',
      pares: [['Diatónica', 'Un acorde común a las dos tonalidades (tonalidades cercanas)'],
              ['Cromática', 'Un acorde parecido: una de sus notas sube o baja un semitono'],
              ['Enarmónica', 'Notas del acorde que suenan igual pero se escriben con otro nombre, para ir a una tonalidad lejana']],
      pista: 'Diatónica: un acorde común. Cromática: un semitono de diferencia. Enarmónica: misma nota, otro nombre.' },   /* (Iago 2-nov) en lenguaje técnico */
    { tipo: 'puente', titulo: 'Encuentra el puente', enunciado: 'Encuentra los acordes comunes',
      a: { nombre: 'Do mayor', color: '#6f8fe0', acordes: ['C', 'Dm', 'Em', 'F', 'G', 'Am', 'B°'] },
      b: { nombre: 'Sol mayor', color: '#7cc96a', acordes: ['G', 'Am', 'Bm', 'C', 'D', 'Em', 'F♯°'] },
      comunes: ['C', 'Em', 'G', 'Am'],
      pista: 'Evita los acordes con fa natural o con fa♯: el fa es la nota que no comparten.' },
    { tipo: 'vf', titulo: 'La dominante', enunciado: 'Verdadero o falso: ¡tienes 10 segundos!',
      afirmacion: 'La dominante siempre es un acorde mayor, aunque la armadura diga lo contrario',
      verdadero: true, segundos: 10,
      pista: 'Por definición la dominante es mayor, y la escribes con 7ª: le da impulso hacia el I.' },
    { tipo: 'unica', titulo: 'El desnivel cromático', enunciado: 'En la modulación cromática del libro, F pasa a F-. ¿Qué nota cambia?',
      opciones: ['la → la♭', 'fa → fa♯', 'do → do♯', 'si → si♭'],
      correcta: 0, pista: 'Un solo cromatismo: el la baja medio tono.' },
    { tipo: 'unica', titulo: 'Rumbo a Mi♭ mayor', enunciado: 'F- es el acorde puente hacia Mi♭ mayor. ¿Qué grado es en Mi♭?',
      opciones: ['II', 'IV', 'VI', 'V'], correcta: 0, pista: 'Mi♭–Fa: segundo grado.' },
    { tipo: 'vf', titulo: 'La enarmonía', enunciado: 'Verdadero o falso: ¡tienes 10 segundos!',
      afirmacion: 'En la modulación enarmónica, la♭ y sol♯ suenan igual pero se escriben distinto',
      verdadero: true, segundos: 10,
      pista: 'Eso es una enarmonía: el truco del portal.' },
    { tipo: 'multi', titulo: 'El portal enarmónico', enunciado: '¿Qué es cierto de la modulación enarmónica? (marca todas)',
      opciones: [{ t: 'Permite ir a tonalidades muy lejanas, como Fa♯ mayor desde Do', ok: true },
                 { t: 'Reinterpreta las notas de un acorde (p. ej. Si°7 = Mi♯°7)', ok: true },
                 { t: 'Es la más común de las tres', ok: false },
                 { t: 'Necesita un acorde idéntico en las dos tonalidades sin cambiar ninguna nota de nombre', ok: false }],
      pista: 'Es la menos común: que te suene.' }
  ];

  /* ------------------------------------------------------------------------
     Utilidades
     ------------------------------------------------------------------------ */
  var COLORES = ['#6f8fe0', '#7cc96a', '#b07cff', '#4fd6e0'];   // azul, verde, violeta, cian
  var SVGNS = 'http://www.w3.org/2000/svg';
  var MODOS = { unica: 'Elige una', multi: 'Marca todas las correctas', unir: 'Une las parejas',
                puente: 'Marca los comunes', ordenar: 'Ordena las cartas', vf: 'Verdadero o falso' };

  function el(tag, cls, txt) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    return e;
  }
  // Mezcla Fisher-Yates (copia)
  function mezclar(a) {
    var b = a.slice(), i, j, t;
    for (i = b.length - 1; i > 0; i--) { j = Math.floor(Math.random() * (i + 1)); t = b[i]; b[i] = b[j]; b[j] = t; }
    return b;
  }
  // Acorde para mostrar: la "m" final (menor) se escribe como "-"
  function fmt(s) { return String(s).replace(/m$/, '-'); }
  function mm(seg) { var m = Math.floor(seg / 60), s = seg % 60; return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s; }

  /* ========================================================================
     TIPOS DE RETO. Cada uno recibe (reto, ctx) y devuelve:
       { el, listo(), comprobar(forzado) -> {ok, extra}, tecla(k), iniciar(), destruir() }
     ctx = { avisa(), bloqueado(), escala(), raiz, tiempoAgotado() }
     Estados visuales: s2t-ok (bien), s2t-bad (mal), s2t-miss (te faltaba)
     ======================================================================== */

  // ---- 1. Elección única -------------------------------------------------
  function tUnica(r, ctx) {
    var idx = r.opciones.map(function (_, i) { return i; });
    if (!r.fijo) idx = mezclar(idx);
    var sel = -1, tiles = [];
    var wrap = el('div', 's2t-opts');
    idx.forEach(function (o, pos) {
      var b = el('button', 's2t-tile'); b.type = 'button'; b.setAttribute('role', 'radio');
      b.appendChild(el('span', 's2t-mark s2t-mark-r', String.fromCharCode(65 + pos)));
      b.appendChild(el('span', 's2t-tt', r.opciones[o]));
      b.onclick = function () {
        if (ctx.bloqueado()) return;
        sel = o;
        tiles.forEach(function (t) { var on = t.o === o; t.b.classList.toggle('s2t-sel', on); t.b.setAttribute('aria-checked', on); });
        ctx.auto(b);   /* (Iago, 1-nov) sin botón «Comprobar»: se corrige al pulsar */
      };
      tiles.push({ b: b, o: o }); wrap.appendChild(b);
    });
    return {
      el: wrap,
      listo: function () { return sel >= 0; },
      tecla: function (k) { var n = parseInt(k, 10); if (n >= 1 && tiles[n - 1]) tiles[n - 1].b.click(); },
      comprobar: function () {
        tiles.forEach(function (t) {
          if (t.o === r.correcta) t.b.classList.add(sel === t.o ? 's2t-ok' : 's2t-miss');
          else if (t.o === sel) t.b.classList.add('s2t-bad');
        });
        return { ok: sel === r.correcta };
      }
    };
  }

  // ---- 2. Selección múltiple ---------------------------------------------
  function tMulti(r, ctx) {
    var idx = r.opciones.map(function (_, i) { return i; });
    if (!r.fijo) idx = mezclar(idx);
    var sel = {}, tiles = [];
    var wrap = el('div', 's2t-opts');
    idx.forEach(function (o) {
      var b = el('button', 's2t-tile'); b.type = 'button'; b.setAttribute('role', 'checkbox');
      b.appendChild(el('span', 's2t-mark s2t-mark-c'));
      b.appendChild(el('span', 's2t-tt', r.opciones[o].t));
      b.onclick = function () {
        if (ctx.bloqueado()) return;
        sel[o] = !sel[o];
        b.classList.toggle('s2t-sel', sel[o]); b.setAttribute('aria-checked', !!sel[o]);
        ctx.avisa();
      };
      tiles.push({ b: b, o: o }); wrap.appendChild(b);
    });
    return {
      el: wrap,
      listo: function () { return Object.keys(sel).some(function (k) { return sel[k]; }); },
      tecla: function (k) { var n = parseInt(k, 10); if (n >= 1 && tiles[n - 1]) tiles[n - 1].b.click(); },
      comprobar: function () {
        var ok = true;
        tiles.forEach(function (t) {
          var debe = !!r.opciones[t.o].ok, puso = !!sel[t.o];
          if (debe && puso) t.b.classList.add('s2t-ok');
          else if (debe && !puso) { t.b.classList.add('s2t-miss'); ok = false; }
          else if (!debe && puso) { t.b.classList.add('s2t-bad'); ok = false; }
        });
        return { ok: ok };
      }
    };
  }

  // ---- 3. Unir parejas (clic izquierda + clic derecha, con líneas) ---------
  function tUnir(r, ctx) {
    var n = r.pares.length, par = {}, sel = null, izq = [], der = [], fin = false, ro = null;
    var orden, k;
    do { orden = mezclar(r.pares.map(function (_, i) { return i; })); }
    while (n > 1 && orden.every(function (v, i) { return v === i; }));     // derecha nunca en orden
    var wrap = el('div', 's2t-unir');
    var svg = document.createElementNS(SVGNS, 'svg'); svg.setAttribute('class', 's2t-lineas');
    var cI = el('div', 's2t-col'), cD = el('div', 's2t-col');
    wrap.appendChild(svg); wrap.appendChild(cI); wrap.appendChild(el('div', 's2t-hueco')); wrap.appendChild(cD);

    function crea(txt, lado, kk, cls) {
      var b = el('button', 's2t-tile ' + cls); b.type = 'button';
      b.appendChild(el('span', 's2t-tt', txt));
      b.onclick = function () { clic(lado, kk); };
      return b;
    }
    for (k = 0; k < n; k++) { izq.push(crea(r.pares[k][0], 'i', k, 's2t-izq')); cI.appendChild(izq[k]); }
    orden.forEach(function (o, pos) { der.push(crea(r.pares[o][1], 'd', pos, 's2t-der')); cD.appendChild(der[pos]); });

    function clic(lado, kk) {
      if (ctx.bloqueado()) return;
      if (sel && sel.lado !== lado) {                    // completa pareja
        var i = lado === 'i' ? kk : sel.k, d = lado === 'd' ? kk : sel.k;
        delete par[i];
        Object.keys(par).forEach(function (x) { if (par[x] === d) delete par[x]; });
        par[i] = d; sel = null;
      } else if (sel && sel.k === kk) { sel = null; }
      else {                                             // coge el elemento (deshace su pareja si la tenía)
        if (lado === 'i') delete par[kk];
        else Object.keys(par).forEach(function (x) { if (par[x] === kk) delete par[x]; });
        sel = { lado: lado, k: kk };
      }
      pinta(); ctx.avisa();
    }
    function pinta() {
      izq.forEach(function (b, i) {
        var tiene = par[i] != null;
        b.classList.toggle('s2t-par', tiene);
        b.classList.toggle('s2t-sel', !!sel && sel.lado === 'i' && sel.k === i);
        b.style.setProperty('--c', COLORES[i % 4]);
      });
      der.forEach(function (b, d) {
        var dueno = -1;
        Object.keys(par).forEach(function (x) { if (par[x] === d) dueno = +x; });
        b.classList.toggle('s2t-par', dueno >= 0);
        b.classList.toggle('s2t-sel', !!sel && sel.lado === 'd' && sel.k === d);
        b.style.setProperty('--c', dueno >= 0 ? COLORES[dueno % 4] : '');
      });
      dibuja();
    }
    function linea(a, b, color, cls) {
      var base = wrap.getBoundingClientRect(), e = ctx.escala();
      var ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
      var x1 = (ra.right - base.left) / e, y1 = (ra.top + ra.height / 2 - base.top) / e;
      var x2 = (rb.left - base.left) / e, y2 = (rb.top + rb.height / 2 - base.top) / e, m = (x1 + x2) / 2;
      var p = document.createElementNS(SVGNS, 'path');
      p.setAttribute('d', 'M' + x1 + ' ' + y1 + ' C' + m + ' ' + y1 + ' ' + m + ' ' + y2 + ' ' + x2 + ' ' + y2);
      p.setAttribute('class', 's2t-linea ' + (cls || '')); p.style.stroke = color;
      svg.appendChild(p);
    }
    function dibuja() {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      Object.keys(par).forEach(function (i) {
        var bien = fin && orden[par[i]] === +i;
        linea(izq[i], der[par[i]], fin ? (bien ? '#4fd18b' : '#ff6b7a') : COLORES[i % 4], fin && !bien ? 's2t-mal' : '');
      });
      if (fin) Object.keys(par).forEach(function (i) {        // pistas: la unión correcta, punteada
        if (orden[par[i]] !== +i) linea(izq[i], der[orden.indexOf(+i)], '#4fd18b', 's2t-corr');
      });
    }
    if (window.ResizeObserver) { ro = new ResizeObserver(dibuja); ro.observe(wrap); }
    setTimeout(pinta, 0);
    return {
      el: wrap,
      listo: function () { return Object.keys(par).length === n; },
      destruir: function () { if (ro) ro.disconnect(); },
      comprobar: function () {
        var ok = true;
        fin = true;
        izq.forEach(function (b, i) {
          var bien = par[i] != null && orden[par[i]] === i;
          b.classList.add(bien ? 's2t-ok' : 's2t-bad'); der[par[i]].classList.add(bien ? 's2t-ok' : 's2t-bad');
          if (!bien) ok = false;
        });
        pinta();
        return { ok: ok };
      }
    };
  }

  // ---- 4. Puente: acordes comunes de dos tonalidades -----------------------
  function tPuente(r, ctx) {
    var sel = {}, tiles = [], GR = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
    var wrap = el('div', 's2t-puente');
    function reino(t) {
      var p = el('div', 's2t-reino'); p.style.setProperty('--c', t.color);
      p.appendChild(el('div', 's2t-reino-n', t.nombre));
      var g = el('div', 's2t-acordes');
      t.acordes.forEach(function (a, i) {
        var b = el('button', 's2t-tile s2t-acd'); b.type = 'button'; b.setAttribute('role', 'checkbox');
        b.appendChild(el('span', 's2t-gr', (t.grados || GR)[i]));
        b.appendChild(el('span', 's2t-ac', fmt(a)));
        b.onclick = function () {
          if (ctx.bloqueado()) return;
          sel[a] = !sel[a]; refresca(); ctx.avisa();
        };
        tiles.push({ b: b, a: a }); g.appendChild(b);
      });
      p.appendChild(g); return p;
    }
    // centro: arco del puente + acordes elegidos
    var centro = el('div', 's2t-centro');
    var arco = document.createElementNS(SVGNS, 'svg');
    arco.setAttribute('viewBox', '0 0 120 54'); arco.setAttribute('class', 's2t-arco');
    arco.innerHTML = '<path d="M4 46 Q60 -14 116 46" fill="none" stroke="#ffd98a" stroke-width="3"/>' +
      '<path d="M4 46 H116" stroke="#ffd98a" stroke-width="3"/><path d="M30 46 V28 M60 46 V16 M90 46 V28" stroke="#f4d58a" stroke-width="2" opacity=".6"/>';
    var chips = el('div', 's2t-chips');
    centro.appendChild(arco); centro.appendChild(el('div', 's2t-centro-t', 'Acordes comunes'));
    centro.appendChild(chips);
    wrap.appendChild(reino(r.a)); wrap.appendChild(centro); wrap.appendChild(reino(r.b));

    function refresca(final) {
      var elegidos = Object.keys(sel).filter(function (k) { return sel[k]; });
      tiles.forEach(function (t) {
        var on = !!sel[t.a], com = r.comunes.indexOf(t.a) >= 0;
        t.b.setAttribute('aria-checked', on);
        if (!final) { t.b.classList.toggle('s2t-sel', on); return; }
        t.b.classList.remove('s2t-sel');
        if (on && com) t.b.classList.add('s2t-ok');
        else if (on) t.b.classList.add('s2t-bad');
        else if (com) t.b.classList.add('s2t-miss');
      });
      chips.innerHTML = '';
      var lista = final ? elegidos.concat(r.comunes.filter(function (c) { return !sel[c]; })) : elegidos;
      lista.forEach(function (c) {
        var ch = el('span', 's2t-chip', fmt(c));
        if (final) ch.classList.add(!sel[c] ? 's2t-miss' : (r.comunes.indexOf(c) >= 0 ? 's2t-ok' : 's2t-bad'));
        chips.appendChild(ch);
      });
      if (!lista.length) chips.appendChild(el('span', 's2t-chip-v', 'Toca los acordes que están en las dos'));
    }
    refresca();
    return {
      el: wrap,
      listo: function () { return Object.keys(sel).some(function (k) { return sel[k]; }); },
      comprobar: function () {
        var elegidos = Object.keys(sel).filter(function (k) { return sel[k]; });
        var ok = elegidos.length === r.comunes.length && elegidos.every(function (c) { return r.comunes.indexOf(c) >= 0; });
        refresca(true);
        return { ok: ok };
      }
    };
  }

  // ---- 5. Ordenar cartas: arrastrar (pointer events), tocar-y-tocar, flechas ---
  function tOrdenar(r, ctx) {
    var n = r.orden.length, ord, moved = false, selC = null, drag = null, quitaClic = false, i;
    var items = r.orden.map(function (t, k) { return { t: t, k: k }; });
    do { ord = mezclar(items); } while (n > 1 && ord.every(function (it, p) { return it.t === r.orden[p]; }));
    var wrap = el('div', 's2t-ord');
    wrap.appendChild(el('div', 's2t-ord-flecha', 'INICIO  ⟶  FINAL DEL VIAJE'));
    var fila = el('div', 's2t-fila'); wrap.appendChild(fila);
    wrap.appendChild(el('div', 's2t-ayuda', 'Arrastra las cartas, o toca una y luego otra para intercambiarlas (teclado: ← →).'));

    function cartas() { return Array.prototype.slice.call(fila.children); }
    function intercambia(a, b) {
      var cs = cartas(), ia = cs.indexOf(a), ib = cs.indexOf(b), t = cs[ia];
      cs[ia] = cs[ib]; cs[ib] = t;
      cs.forEach(function (c) { fila.appendChild(c); });
    }
    ord.forEach(function (it) {
      var c = el('button', 's2t-card'); c.type = 'button'; c._t = it.t;
      c.appendChild(el('span', 's2t-num')); c.appendChild(el('span', 's2t-acorde', fmt(it.t)));
      c.addEventListener('pointerdown', function (e) {
        if (ctx.bloqueado() || (e.button != null && e.button > 0)) return;
        var rc = c.getBoundingClientRect();
        drag = { c: c, x0: e.clientX, y0: e.clientY, dx: e.clientX - rc.left, dy: e.clientY - rc.top, w: rc.width, h: rc.height, g: null };
      });
      c.addEventListener('click', function () {                      // toque / teclado
        if (quitaClic || ctx.bloqueado()) return;
        if (!selC) { selC = c; c.classList.add('s2t-sel'); }
        else if (selC === c) { c.classList.remove('s2t-sel'); selC = null; }
        else { intercambia(selC, c); selC.classList.remove('s2t-sel'); selC = null; moved = true; ctx.avisa(); }
      });
      c.addEventListener('keydown', function (e) {
        if (ctx.bloqueado() || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight')) return;
        var cs = cartas(), p = cs.indexOf(c) + (e.key === 'ArrowLeft' ? -1 : 1);
        if (p < 0 || p >= cs.length) return;
        e.preventDefault(); intercambia(c, cs[p]); moved = true; c.focus(); ctx.avisa();
      });
      fila.appendChild(c);
    });

    function mueve(e) {
      if (!drag) return;
      if (!drag.g) {
        if (Math.abs(e.clientX - drag.x0) + Math.abs(e.clientY - drag.y0) < 7) return;
        var g = drag.c.cloneNode(true); g.className = 's2t-card s2t-ghost';          // "fantasma" que sigue al puntero
        var s = ctx.escala(); g.style.width = drag.w / s + 'px'; g.style.height = drag.h / s + 'px';
        ctx.raiz.appendChild(g); drag.g = g; drag.c.classList.add('s2t-drag');
        if (selC) { selC.classList.remove('s2t-sel'); selC = null; }
      }
      var rr = ctx.raiz.getBoundingClientRect(), es = ctx.escala();
      drag.g.style.left = (e.clientX - rr.left - drag.dx) / es + 'px';
      drag.g.style.top = (e.clientY - rr.top - drag.dy) / es + 'px';
      var otras = cartas().filter(function (c) { return c !== drag.c; }), pos = 0;
      otras.forEach(function (c) { var q = c.getBoundingClientRect(); if (q.left + q.width / 2 < e.clientX) pos++; });
      fila.insertBefore(drag.c, otras[pos] || null);                                 // el hueco se mueve en vivo
      e.preventDefault();
    }
    function suelta() {
      if (!drag) return;
      if (drag.g) {
        drag.g.parentNode.removeChild(drag.g); drag.c.classList.remove('s2t-drag');
        quitaClic = true; setTimeout(function () { quitaClic = false; }, 0);
        moved = true; ctx.avisa();
      }
      drag = null;
    }
    window.addEventListener('pointermove', mueve, { passive: false });
    window.addEventListener('pointerup', suelta);
    window.addEventListener('pointercancel', suelta);
    return {
      el: wrap,
      listo: function () { return moved; },
      destruir: function () {
        window.removeEventListener('pointermove', mueve); window.removeEventListener('pointerup', suelta);
        window.removeEventListener('pointercancel', suelta);
      },
      comprobar: function () {
        var ok = true;
        cartas().forEach(function (c, p) {
          var bien = c._t === r.orden[p];
          c.classList.remove('s2t-sel'); c.classList.add(bien ? 's2t-ok' : 's2t-bad');
          if (!bien) ok = false;
        });
        return { ok: ok, extra: ok ? '' : 'Orden correcto: ' + r.orden.map(fmt).join(' · ') };
      }
    };
  }

  // ---- 6. Verdadero / Falso con cuenta atrás -------------------------------
  function tVF(r, ctx) {
    var seg = r.segundos || 10, resp = null, t0 = 0, iv = null, bV, bF;
    var wrap = el('div', 's2t-vf');
    var q = el('div', 's2t-afirma', r.afirmacion);
    var barra = el('div', 's2t-barra'), rel = el('i', 's2t-barra-i'), num = el('b', 's2t-barra-n', seg + ' s');
    barra.appendChild(rel); barra.appendChild(num);
    var bs = el('div', 's2t-vfbs');
    function boton(txt, val, cls) {
      var b = el('button', 's2t-vfb ' + cls, txt); b.type = 'button'; b.setAttribute('role', 'radio');
      b.onclick = function () {
        if (ctx.bloqueado()) return;
        resp = val; bV.classList.toggle('s2t-sel', val === true); bF.classList.toggle('s2t-sel', val === false); parar(); ctx.auto(val ? bV : bF);
      };
      return b;
    }
    bV = boton('Verdadero', true, 's2t-v'); bF = boton('Falso', false, 's2t-f');
    bs.appendChild(bV); bs.appendChild(bF);
    wrap.appendChild(q); wrap.appendChild(barra); wrap.appendChild(bs);
    function parar() { if (iv) { clearInterval(iv); iv = null; } }
    function tick() {
      var resto = seg - (Date.now() - t0) / 1000;
      if (resto <= 0) { parar(); rel.style.width = '0%'; ctx.tiempoAgotado(); return; }
      rel.style.width = (resto / seg * 100) + '%'; num.textContent = Math.ceil(resto) + ' s';
      barra.classList.toggle('s2t-poco', resto <= 3);
    }
    return {
      el: wrap,
      iniciar: function () { t0 = Date.now(); tick(); iv = setInterval(tick, 50); },
      listo: function () { return resp !== null; },
      destruir: parar,
      tecla: function (k) { k = String(k).toLowerCase(); if (k === 'v' || k === '1') bV.click(); if (k === 'f' || k === '2') bF.click(); },
      comprobar: function (forzado) {
        parar();
        var ok = !forzado && resp === r.verdadero;
        var bc = r.verdadero ? bV : bF, bm = r.verdadero ? bF : bV;
        if (ok) bc.classList.add('s2t-ok');
        else { bc.classList.add('s2t-miss'); if (resp === !r.verdadero) bm.classList.add('s2t-bad'); }
        return { ok: ok };
      }
    };
  }

  var TIPOS = { unica: tUnica, multi: tMulti, unir: tUnir, puente: tPuente, ordenar: tOrdenar, vf: tVF };

  /* ========================================================================
     MONTAJE DEL QUIZ
     ======================================================================== */
  function monta(cont, opts) {
    opts = opts || {};
    var retos = (opts.retos && opts.retos.length) ? opts.retos : RETOS;
    var total = retos.length, sonido = opts.sonido !== false, hayAudio = sonido;
    var S, ctrl = null, ac = null, vivo = true, timers = [];

    // ---------- Estructura DOM ----------
    var raiz = el('div', 's2t'); raiz.tabIndex = -1;
    raiz.setAttribute('role', 'region'); raiz.setAttribute('aria-label', 'Test de modulación');
    raiz.innerHTML =
      '<div class="s2t-hud">' +
        '<div class="s2t-hearts" aria-label="Vidas"></div>' +
        '<div class="s2t-score"><span class="s2t-lbl">Puntos</span><b class="s2t-pts">0</b><span class="s2t-combo">x1</span></div>' +
        '<div class="s2t-pips" aria-hidden="true"></div>' +
        '<div class="s2t-cuenta"></div>' +
        '<button type="button" class="s2t-snd" aria-label="Sonido" title="Sonido">♪</button>' +
      '</div>' +
      '<div class="s2t-main">' +
        '<div class="s2t-head"><h2 class="s2t-titulo"></h2><span class="s2t-modo"></span></div>' +
        '<p class="s2t-enun"></p>' +
        '<div class="s2t-area"></div>' +
        '<div class="s2t-pie">' +
          '<div class="s2t-pista" aria-live="polite"></div>' +
          '<div class="s2t-btns">' +
            '<button type="button" class="s2t-btn s2t-btn-chk" disabled>Comprobar</button>' +
            '<button type="button" class="s2t-btn s2t-btn-sig">Siguiente ▶</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="s2t-final"></div>';
    function q(c) { return raiz.querySelector('.s2t-' + c); }
    var hearts = q('hearts'), pts = q('pts'), combo = q('combo'), pips = q('pips'), cuenta = q('cuenta'),
        snd = q('snd'), titulo = q('titulo'), modo = q('modo'), enun = q('enun'), area = q('area'),
        pista = q('pista'), bChk = q('btn-chk'), bSig = q('btn-sig'), fin = q('final');
    cont.innerHTML = ''; cont.appendChild(raiz);
    for (var i = 0; i < total; i++) pips.appendChild(el('i', 's2t-pip'));
    if (!hayAudio) snd.style.display = 'none';

    // ---------- Sonido (WebAudio, se crea en el primer clic) ----------
    function audio() {
      if (!sonido) return null;
      if (!ac) {
        try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { sonido = false; return null; }
      }
      if (ac.state === 'suspended' && ac.resume) ac.resume();
      return ac;
    }
    function nota(f, ini, dur, tipo, vol) {
      var a = audio(); if (!a) return;
      try {
        var o = a.createOscillator(), g = a.createGain(), t = a.currentTime + ini;
        o.type = tipo; o.frequency.setValueAtTime(f, t);
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + dur + 0.02);
      } catch (e) { /* sin audio, no pasa nada */ }
    }
    function sBien() { nota(523, 0, 0.09, 'square', 0.07); nota(784, 0.1, 0.16, 'square', 0.07); }
    function sMal() { nota(110, 0, 0.32, 'square', 0.09); nota(104, 0, 0.32, 'sawtooth', 0.05); }
    function sFin() { [523, 659, 784, 1047].forEach(function (f, k) { nota(f, k * 0.12, 0.18, 'square', 0.06); }); }
    raiz.addEventListener('pointerdown', audio);
    raiz.addEventListener('keydown', audio);
    snd.onclick = function () { sonido = !sonido; snd.classList.toggle('s2t-off', !sonido); snd.setAttribute('aria-pressed', !sonido); if (sonido) sBien(); };

    // ---------- Contexto para los tipos de reto ----------
    var ctx = {
      raiz: raiz,
      avisa: function () { bChk.disabled = !(ctrl && ctrl.listo()); },
      auto: function (b) {   /* comprobación inmediata: un destello de «comprobando» y el veredicto */
        if (S.comprobado || S.auto) return; S.auto = true; area.classList.add('s2t-lock');
        if (b) b.classList.add('s2t-chk');
        espera(function () { if (b) b.classList.remove('s2t-chk'); comprueba(false); }, 520);
      },
      bloqueado: function () { return S.comprobado || S.auto; },
      escala: function () { return (raiz.offsetWidth ? raiz.getBoundingClientRect().width / raiz.offsetWidth : 1) || 1; },
      tiempoAgotado: function () { comprueba(true); }
    };

    // ---------- HUD ----------
    function multiplo() { return Math.min(3, S.racha + 1); }
    function hud() {
      hearts.innerHTML = '';
      for (var v = 0; v < 3; v++) hearts.appendChild(el('span', 's2t-heart' + (v < S.vidas ? '' : ' s2t-perdida'), '♥'));
      pts.textContent = S.puntos;
      combo.textContent = 'x' + multiplo(); combo.classList.toggle('s2t-on', multiplo() > 1);
      Array.prototype.forEach.call(pips.children, function (p, k) {
        p.className = 's2t-pip' + (S.res[k] === true ? ' s2t-ok' : S.res[k] === false ? ' s2t-bad' : '') +
          (k === S.i && !S.fin ? ' s2t-act' : '');
      });
      cuenta.textContent = 'Reto ' + Math.min(S.i + 1, total) + '/' + total;
    }
    function espera(fn, ms) { var t = setTimeout(function () { if (vivo) fn(); }, ms); timers.push(t); }

    // Texto flotante "+100"
    function flota(txt, cls) {
      var f = el('div', 's2t-flota ' + cls, txt), rr = raiz.getBoundingClientRect(), br = bChk.getBoundingClientRect(), s = ctx.escala();
      f.style.right = (rr.right - br.right) / s + 14 + 'px'; f.style.top = (br.top - rr.top) / s - 26 + 'px';   // alineado a la derecha, sobre el botón
      raiz.appendChild(f);
      f.addEventListener('animationend', function () { if (f.parentNode) f.parentNode.removeChild(f); });
      espera(function () { if (f.parentNode) f.parentNode.removeChild(f); }, 1800);
    }

    // ---------- Flujo ----------
    function nuevo() {
      S = { i: 0, vidas: 3, puntos: 0, racha: 0, aciertos: 0, res: [], comprobado: false, fin: false, t0: Date.now() };
      raiz.classList.remove('s2t-end'); muestra(0);
    }
    function muestra(k) {
      if (ctrl && ctrl.destruir) ctrl.destruir();
      S.i = k; S.comprobado = false; S.auto = false;
      var r = retos[k];
      titulo.textContent = r.titulo || ('Reto ' + (k + 1));
      enun.textContent = r.enunciado || '';
      modo.textContent = r.modo || MODOS[r.tipo] || '';
      area.className = 's2t-area s2t-t-' + r.tipo; area.innerHTML = '';
      ctrl = TIPOS[r.tipo](r, ctx); area.appendChild(ctrl.el);
      var auto = r.tipo === 'unica' || r.tipo === 'vf';
      pista.className = 's2t-pista s2t-vacia'; pista.textContent = auto ? 'Pulsa tu respuesta: se corrige al momento. Si fallas, pierdes un corazón.' : 'Responde y pulsa «Comprobar». Si te equivocas, perderás un corazón.';
      bChk.hidden = auto; bChk.disabled = true; bSig.hidden = true;
      bSig.textContent = k === total - 1 ? 'Ver resultado ▶' : 'Siguiente ▶';
      hud(); area.scrollTop = 0;
      if (ctrl.iniciar) ctrl.iniciar();
      raiz.focus({ preventScroll: true });
    }
    function comprueba(forzado) {
      if (S.comprobado || (!forzado && !ctrl.listo())) return;
      S.comprobado = true; area.classList.add('s2t-lock');
      var r = retos[S.i], res = ctrl.comprobar(forzado), ok = res.ok, ganados = 0;
      if (ok) {
        S.racha++; ganados = 100 * Math.min(3, S.racha); S.puntos += ganados; S.aciertos++;
        sBien(); flota('+' + ganados + (S.racha > 1 ? '  combo x' + Math.min(3, S.racha) : ''), 's2t-f-ok');
      } else {
        S.racha = 0; var tenia = S.vidas > 0; S.vidas = Math.max(0, S.vidas - 1);
        sMal(); flota(tenia ? '−♥' : '✗', 's2t-f-mal');
        area.classList.add('s2t-tiembla');
      }
      S.res[S.i] = ok; hud();
      pista.className = 's2t-pista ' + (ok ? 's2t-pista-ok' : 's2t-pista-mal');
      pista.innerHTML = '';
      pista.appendChild(el('b', 's2t-veredicto', ok ? '¡Correcto! +' + ganados + '  ' : (forzado ? '¡Tiempo!  ' : 'Casi…  ')));
      pista.appendChild(document.createTextNode(r.pista || ''));
      if (res.extra) pista.appendChild(el('div', 's2t-extra', res.extra));
      bChk.hidden = true; bSig.hidden = false; bSig.focus({ preventScroll: true });
    }
    function siguiente() {
      if (!S.comprobado) return;
      if (S.i + 1 < total) muestra(S.i + 1); else termina();
    }
    function termina() {
      if (ctrl && ctrl.destruir) ctrl.destruir();
      S.fin = true; hud();
      var seg = Math.round((Date.now() - S.t0) / 1000), a = S.aciertos, rel = a / total;
      var t = rel >= 10 / 12 ? '¡Maestro del viaje!' : rel >= 7 / 12 ? '¡Buen viaje!' : 'Sigue explorando';
      var est = rel >= 10 / 12 ? 3 : rel >= 7 / 12 ? 2 : 1;
      var sub = est === 3 ? 'Dominas el puente, el desnivel y el portal.' :
                est === 2 ? 'Ya sabes cruzar entre tonalidades. Repasa los fallos y vuelve.' :
                'Repasa los apuntes de modulación y vuelve a intentarlo.';
      fin.innerHTML = '';
      fin.appendChild(el('div', 's2t-fin-t', t));
      var st = el('div', 's2t-stars');
      for (var s = 1; s <= 3; s++) { var e = el('span', 's2t-star' + (s <= est ? ' s2t-gana' : ''), '★'); e.style.animationDelay = (0.3 + s * 0.25) + 's'; st.appendChild(e); }
      fin.appendChild(st);
      fin.appendChild(el('div', 's2t-fin-s', sub));
      var dat = el('div', 's2t-datos');
      [['Aciertos', a + '/' + total], ['Puntos', String(S.puntos)], ['Tiempo', mm(seg)]].forEach(function (d) {
        var c = el('div', 's2t-dato'); c.appendChild(el('span', 's2t-dato-l', d[0])); c.appendChild(el('b', 's2t-dato-v', d[1])); dat.appendChild(c);
      });
      fin.appendChild(dat);
      var rep = el('button', 's2t-btn s2t-btn-rep', 'Repetir desafío'); rep.type = 'button';
      rep.onclick = nuevo; fin.appendChild(rep);
      raiz.classList.add('s2t-end'); sFin();
      rep.focus({ preventScroll: true });
      if (typeof opts.alFin === 'function') {
        try { opts.alFin({ aciertos: a, total: total, puntos: S.puntos, tiempo: seg }); } catch (e2) { if (window.console) console.error(e2); }
      }
    }

    // ---------- Eventos ----------
    bChk.onclick = function () { comprueba(false); };
    bSig.onclick = siguiente;
    raiz.addEventListener('keydown', function (e) {
      if (S.fin || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === 'Enter' && e.target === raiz) {                  // Intro con el foco en el panel = acción principal
        e.preventDefault(); if (!bChk.hidden) comprueba(false); else siguiente();
      } else if (ctrl && ctrl.tecla && !S.comprobado && /^[1-9vVfF]$/.test(e.key)) ctrl.tecla(e.key);
    });
    area.addEventListener('animationend', function (e) { if (e.target === area) area.classList.remove('s2t-tiembla'); });

    nuevo();
    return {
      reiniciar: nuevo,
      destruir: function () {
        vivo = false; timers.forEach(clearTimeout);
        if (ctrl && ctrl.destruir) ctrl.destruir();
        if (raiz.parentNode) raiz.parentNode.removeChild(raiz);
        if (ac && ac.close) { try { ac.close(); } catch (e) { /* nada */ } }
      }
    };
  }

  window.S2Test = { monta: monta, RETOS: RETOS };
})();
