/* Modulación · Sesión 1 · minijuego sobre el CORAL (C1)
   El viajero avanza A COMPÁS con la música (♩ = 72): cada acorde del coral es una insignia colocada justo donde suena.
   El acompañamiento de 16 bits suena siempre en su sitio; si el jugador recoge la insignia, suena además el acorde al piano (a tiempo).
   Alturas por grado: I · IV · V · V7 en el suelo · II · VI · II7 un escalón · III · VII6 · V/V dos escalones (un salto llega a cualquiera).
   Cadencia lograda (los dos acordes recogidos) → sonido de logro + cartelito que nace junto al viajero y se desvanece.
   API: S1Coral.monta(lienzo, {D:CORAL, img:{fondo, suelo, plataforma, gemas, sprites}, spr:{…}, auto, musica:'chip'|url,
                               alSalto, alAterriza, alPaso, alAcorde(i, ac, cad), alFin({cogidos:[i…], cads:[…]})})
        → {jugar(), para(), reinicia(), auto(bool), salta()} */
(function(){
  var NIV = {I:0, IV:1, V:1, V7:1, II:2, VI:2, II7:2, III:3, VII6:3, 'V/V':3, 'V/VI':3};   /* V/VI (Mi mayor, c. 17): Iago 1-nov */   /* cuanto más arriba, más «exótico» dentro de la tonalidad */
  var Y = [.715, .605, .495, .385];                 /* superficie de cada altura (fracción del alto) */
  var UB = .32;                               /* distancia por pulso (en altos de pantalla) */
  var LEAD = .30;                             /* la plataforma empieza un poco antes de la insignia */
  var PX = .30;                               /* el viajero, al 30 % del ancho: se ve lo que viene */
  var GRAV = 4.2, V0 = Math.sqrt(2*4.2*.39);  /* salto de .39 → llega holgado a tres escalones (.33) */
  var NOMBRE = {semicadencia:'Semicadencia', 'auténtica':'Cadencia auténtica', rota:'Cadencia rota', plagal:'Cadencia plagal', 'dominante de la dominante':'¡Dominante de la dominante!'};
  var PC = {c:0, d:2, e:4, f:5, g:7, a:9, b:11};
  function midi(k){ var p = k.split('/'), n = p[0]; return 12*(+p[1] + 1) + PC[n[0]] + (n.slice(1).split('').reduce(function(s, ch){ return s + (ch === '#' ? 1 : ch === 'b' ? -1 : 0); }, 0)); }
  function hz(m){ return 440*Math.pow(2, (m - 69)/12); }

  /* ---------- acompañamiento de 16 bits sintetizado (sin descargas): bajo triangular, soprano en pulso, arpegio, batería suave ---------- */
  function Chip(ctx, salida){
    var ondas = {};
    function pulso(d){
      if(ondas[d]) return ondas[d];
      var n = 32, re = new Float32Array(n), im = new Float32Array(n);
      for(var k = 1; k < n; k++){ re[k] = 2*Math.sin(Math.PI*k*d)/(Math.PI*k); }
      return (ondas[d] = ctx.createPeriodicWave(re, im));
    }
    var bus = ctx.createGain(); bus.gain.value = 1.1; bus.connect(salida);
    var ruido = (function(){ var b = ctx.createBuffer(1, ctx.sampleRate*.5, ctx.sampleRate), x = b.getChannelData(0); for(var i = 0; i < x.length; i++) x[i] = Math.random()*2 - 1; return b; })();
    var vivos = [];
    function osc(tipo, f, t, dur, vol, ataque, caida){
      var o = ctx.createOscillator(), g = ctx.createGain();
      if(typeof tipo === 'number') o.setPeriodicWave(pulso(tipo)); else o.type = tipo;
      o.frequency.setValueAtTime(f, t);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + (ataque || .006));
      g.gain.setValueAtTime(vol, t + Math.max(.01, dur - (caida || .04))); g.gain.linearRampToValueAtTime(0, t + dur);
      o.connect(g); g.connect(bus); o.start(t); o.stop(t + dur + .02); vivos.push(o); return o;
    }
    function golpe(t, tipo){
      var s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(); s.buffer = ruido;
      if(tipo === 'hat'){ f.type = 'highpass'; f.frequency.value = 7000; g.gain.setValueAtTime(.05, t); g.gain.exponentialRampToValueAtTime(.001, t + .05); }
      else { f.type = 'bandpass'; f.frequency.value = 1800; g.gain.setValueAtTime(.11, t); g.gain.exponentialRampToValueAtTime(.001, t + .14); }
      s.connect(f); f.connect(g); g.connect(bus); s.start(t); s.stop(t + .2); vivos.push(s);
    }
    function bombo(t){
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(42, t + .12);
      g.gain.setValueAtTime(.32, t); g.gain.exponentialRampToValueAtTime(.001, t + .18);
      o.connect(g); g.connect(bus); o.start(t); o.stop(t + .2); vivos.push(o);
    }
    /* lista de sucesos: [segundo relativo, función] */
    function programa(D, bpm, cuenta){
      var q = 60/bpm, ev = [], tot = D[D.length - 1].pos + D[D.length - 1].d;
      for(var b = -cuenta; b < tot; b += .5){                 /* batería: bombo 1 y 3 · caja 2 y 4 · charles en corcheas */
        (function(b){
          var t = b*q, ent = Math.abs(b - Math.round(b)) < .01;
          if(b < 0){ if(ent) ev.push([t, function(T){ golpe(T, 'hat'); }]); return; }
          ev.push([t, function(T){ golpe(T, 'hat'); }]);
          if(ent && (b % 4 === 0 || b % 4 === 2)) ev.push([t, function(T){ bombo(T); }]);
          if(ent && (b % 4 === 1 || b % 4 === 3)) ev.push([t, function(T){ golpe(T, 'caja'); }]);
        })(b);
      }
      D.forEach(function(a, i){
        var t = a.pos*q, dur = a.d*q;
        /* bajo: negras (las blancas se repiten a negras para que empuje) */
        var tb = t;
        (a.Bn || [[a.B, a.d === 4 ? 'w' : 'h']]).forEach(function(b){
          var n = {q:1, h:2, w:4}[b[1]];
          for(var k = 0; k < n; k++){ (function(f, T){ ev.push([T, function(TT){ osc('triangle', f, TT, q*.82, .30); }]); })(hz(midi(b[0])), tb + k*q); }
          tb += n*q;
        });
        /* soprano (la melodía del coral) en pulso del 25 %, ligada si la nota sigue */
        if(i === 0 || D[i-1].S !== a.S){
          var j = i, dd = dur; while(j + 1 < D.length && D[j+1].S === a.S){ j++; dd += D[j].d*q; }
          (function(f, T, d){ ev.push([T, function(TT){ osc(.25, f, TT, d*.96, .075, .01, .08); }]); })(hz(midi(a.S)), t, dd);
        }
        /* arpegio en pulso del 12,5 % por corcheas, con las notas del acorde entre sol4 y do6 */
        var pcs = [a.B, a.T, a.A, a.S].map(function(k){ return midi(k) % 12; }), notas = [];
        for(var m = 67; m <= 84; m++) if(pcs.indexOf(m % 12) >= 0) notas.push(m);
        var pat = [0, 1, 2, 1, 0, 1, 2, 3].map(function(x){ return notas[Math.min(x, notas.length - 1)]; });
        for(var k = 0; k < a.d*2; k++){ (function(f, T){ ev.push([T, function(TT){ osc(.125, f, TT, q*.42, .035); }]); })(hz(pat[k % 8]), t + k*q/2); }
      });
      ev.sort(function(x, y){ return x[0] - y[0]; });
      return {ev:ev, fin:tot*q};
    }
    var reloj = null;
    return {
      toca: function(D, bpm, t0, cuenta){          /* t0 = segundo del contexto en que empieza el compás 1 */
        this.para();
        var P = programa(D, bpm, cuenta), k = 0;
        function bucle(){ var lim = ctx.currentTime + .3; while(k < P.ev.length && t0 + P.ev[k][0] < lim){ var T = t0 + P.ev[k][0]; if(T > ctx.currentTime - .01) P.ev[k][1](Math.max(T, ctx.currentTime)); k++; } if(k >= P.ev.length){ clearInterval(reloj); reloj = null; } }
        bucle(); reloj = setInterval(bucle, 60);
      },
      para: function(){ if(reloj){ clearInterval(reloj); reloj = null; } vivos.forEach(function(o){ try{ o.stop(); }catch(e){} }); vivos = []; },
      logro: function(t){                          /* sonido de logro: arpegio brillante + destello */
        [72, 76, 79, 84, 88].forEach(function(m, i){ osc(.25, hz(m), t + i*.055, .16, .09); osc('sine', hz(m + 12), t + i*.055, .3, .04); });
        osc('sine', hz(96), t + .3, .45, .03, .005, .4);
      }
    };
  }

  /* ---------- el nivel ---------- */
  function construye(D){
    var objs = [], plats = [];
    D.forEach(function(a, i){
      var L = NIV[a.g] || 0, x = a.pos*UB, xs = x - LEAD, xe = (i + 1 < D.length ? D[i+1].pos*UB : x + a.d*UB) - LEAD;
      if(L > 0) plats.push({x0:xs, x1:xe + .02, y:Y[L], L:L});
      objs.push({x:x, y:Y[L] - .05, L:L, i:i, a:a, cogido:false, quiere:xs - .16});
    });
    var tot = D[D.length - 1].pos + D[D.length - 1].d;
    var meta = tot*UB + .15;                    /* aquí termina el puente y empieza la explanada de la meta */
    return {objs:objs, plats:plats, meta:meta, stop:meta + .62, fin:meta + .62, tot:tot};
  }

  function monta(lienzo, op){
    op = op || {};
    var D = op.D.acordes, BPM = op.bpm || op.D.tempo || 72, CUENTA = op.cuenta || 4, CAD = {};
    (op.D.cadencias || []).forEach(function(c){ CAD[c.i] = c.tipo; });
    var spr = op.spr || {celdaW:300, celdaH:724, pie:567, alto:.34, andar:[1, 2, 3, 4, 5, 6], sube:7, baja:8, parado:0};
    var c = lienzo.getContext('2d'), I = {}, faltan = 0;
    Object.keys(op.img || {}).forEach(function(k){
      faltan++; var im = new Image(); im.onload = im.onerror = function(){ faltan--; if(!faltan){ ajusta(); pinta(); } }; im.src = op.img[k]; I[k] = im;
    });
    var N, J, auto = !!op.auto, reloj = null, t0 = 0, quiereSaltar = false, pulsado = false, chip = null, ultT = 0, popups = [], chispas = [];
    function ahora(){ return window.Sonido ? Sonido.ahora() : performance.now()/1000; }
    function pulsos(){ return reloj ? (ahora() - t0)*BPM/60 : -CUENTA; }
    function reinicia(){
      N = construye(D);
      if(op.fin && op.fin.puerta){ N.stop = N.meta + op.fin.puerta; N.fin = N.stop; }   /* el viajero se para delante de la puerta del castillo */
      J = {x:-CUENTA*UB, y:Y[0], vy:0, suelo:true, cogidos:[], cads:[], fin:false, ultPaso:-99, aterriza:0};
      popups = []; chispas = [];
    }
    reinicia();
    function ajusta(){
      var r = lienzo.getBoundingClientRect(), d = Math.min(window.devicePixelRatio || 1, 1.5);
      lienzo.width = Math.round(r.width*d); lienzo.height = Math.round(r.width*d*9/16);
    }
    function soporte(x, y0, y1){
      var s = Y[0];
      N.plats.forEach(function(p){ if(x > p.x0 && x < p.x1 && y0 <= p.y + .003 && y1 >= p.y) s = Math.min(s, p.y); });
      return s;
    }
    function sobre(x, y){
      if(Math.abs(y - Y[0]) < .004) return true;
      return N.plats.some(function(p){ return x > p.x0 && x < p.x1 && Math.abs(y - p.y) < .004; });
    }
    function salta(){ if(J.suelo && !J.fin){ J.vy = -V0; J.suelo = false; if(op.alSalto) op.alSalto(); } }
    function impacto(t){
      if(!window.Sonido) return;
      try{ var c = Sonido.ctx, out = c.createGain(); out.gain.value = .55; out.connect(Sonido.salida);
        var o = c.createOscillator(), g = c.createGain(); o.type = 'sine';                       /* bombo: 150 → 45 Hz */
        o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(45, t + .16);
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(1, t + .004); g.gain.exponentialRampToValueAtTime(.001, t + .28);
        o.connect(g); g.connect(out); o.start(t); o.stop(t + .3);
        var q = c.createOscillator(), gq = c.createGain(); q.type = 'square';                    /* «puf» de 16 bits */
        q.frequency.setValueAtTime(220, t); q.frequency.exponentialRampToValueAtTime(70, t + .1);
        gq.gain.setValueAtTime(.18, t); gq.gain.exponentialRampToValueAtTime(.001, t + .12);
        var lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1400;
        q.connect(lp); lp.connect(gq); gq.connect(out); q.start(t); q.stop(t + .14);
        var n = Math.floor(c.sampleRate*.06), b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
        for(var i = 0; i < n; i++) d[i] = (Math.random()*2 - 1)*Math.pow(1 - i/n, 3);          /* chasquido de ataque */
        var r = c.createBufferSource(), gr = c.createGain(), bp = c.createBiquadFilter(); r.buffer = b; bp.type = 'bandpass'; bp.frequency.value = 2500; gr.gain.value = .25;
        r.connect(bp); bp.connect(gr); gr.connect(out); r.start(t);
      }catch(e){}
    }
    function nivelEn(x){ var L = 0; N.plats.forEach(function(p){ if(x > p.x0 && x < p.x1) L = p.L; }); return L; }
    function paso(dt){
      var b = pulsos();
      J.x = Math.min(b*UB, N.stop); J.parado = b*UB >= N.stop;
      if(J.fin) return;
      if(auto){                                   /* piloto automático: salta cuando la insignia que viene está más alta */
        var obj = N.objs.filter(function(o){ return !o.cogido && o.x > J.x - .05; })[0];
        if(obj && J.suelo && obj.L > Math.round((Y[0] - J.y)/.11) && J.x >= obj.quiere) salta();
      } else if(quiereSaltar){ salta(); quiereSaltar = false; }
      /* salto variable, como en los plataformas: si se suelta pronto, el salto se corta (salto corto); si se mantiene, llega arriba */
      if(!auto && !pulsado && J.vy < -V0*.6) J.vy = -V0*.6;
      var y0 = J.y; J.vy += GRAV*dt; J.y += J.vy*dt;
      if(J.vy >= 0){ var s = soporte(J.x, y0, J.y); if(J.y >= s){ var venia = !J.suelo; J.y = s; J.vy = 0; J.suelo = true; if(venia){ J.aterriza = .2; if(op.alAterriza) op.alAterriza(); } } }
      if(J.suelo && !sobre(J.x, J.y)) J.suelo = false;   /* al bajar de altura sin saltar también cae y aterriza */
      if(J.aterriza > 0) J.aterriza -= dt;
      /* pasos a tiempo: dos por pulso (un ciclo de andar por pulso) */
      var pb = Math.floor(b*2); if(J.suelo && !J.parado && pb !== J.ultPaso && b >= -CUENTA){ J.ultPaso = pb; if(op.alPaso) op.alPaso(); }
      N.objs.forEach(function(o){
        if(o.cogido || o.perdido) return;
        if(J.x - o.x > .025){ o.perdido = true; return; }   /* Iago 31-oct: el acorde suena EN el pulso; si llegas tarde, se pierde */
        if(o.x - J.x < .09 && J.y > Y[o.L] - .075 && J.y < Y[o.L] + .02){   /* se recoge con los PIES, a la altura de su escalón */
          o.cogido = true; J.cogidos.push(o.i);
          var tAc = t0 + o.a.pos*60/BPM, tq = Math.max(ahora() + .005, tAc);
          if(window.Sonido) Sonido.acorde([o.a.B, o.a.T, o.a.A, o.a.S], Math.max(ahora() + .005, tAc - .04), o.a.d*60/BPM*.95, .4);   /* Iago 1-nov: el piano tarda ~40 ms en «sonar» (ataque de la muestra): se adelanta para caer con la música */
          var tipo = CAD[o.i], logro = tipo && J.cogidos.indexOf(o.i - 1) >= 0;
          if(logro){ J.cads.push({i:o.i, tipo:tipo}); if(chip) chip.logro(tq); }
          impacto(tq);                                  /* Iago 1-nov: golpe grave de 16 bits que da impulso, en el pulso */
          o.tq = tq; o.logro = logro ? tipo : null;   /* lo visible (insignia que estalla, timbre, cartel) espera al instante del acorde */
        }
      });
      N.objs.forEach(function(o){
        if(!o.cogido || o.hecho || ahora() < o.tq - .01) return;
        o.hecho = true; var tipo = o.logro;
        if(tipo) popups.push({txt:NOMBRE[tipo] || tipo, x:J.x, y:J.y - .25, t:0, rara:tipo === 'rota' || tipo === 'dominante de la dominante'});
        for(var k = 0; k < 14; k++) chispas.push({x:o.x, y:o.y, vx:(Math.random() - .5)*.5, vy:-Math.random()*.5 - .1, t:0, L:o.L});
        if(op.alAcorde) op.alAcorde(o.i, o.a, tipo);
      });
      popups.forEach(function(p){ p.t += dt; p.y -= dt*.06; }); popups = popups.filter(function(p){ return p.t < 1.9; });
      chispas.forEach(function(p){ p.t += dt; p.x += p.vx*dt; p.y += p.vy*dt; p.vy += 1.2*dt; }); chispas = chispas.filter(function(p){ return p.t < .7; });
      if(b*UB >= N.stop + .55){
        J.fin = true;
        if(op.alFin) op.alFin({cogidos:J.cogidos.slice().sort(function(a, b){ return a - b; }), total:D.length, cads:J.cads.slice()});
      }
    }
    var COL = ['#f1c24a', '#ffd98a', '#bcd2ff', '#b27cff', '#ff5a4e'];
    function pinta(){
      if(faltan) return;
      var w = lienzo.width, h = lienzo.height, ox = J.x*h - PX*w;
      /* al llegar a la meta la cámara se para con el castillo en el borde derecho y el viajero camina hasta la puerta */
      if(I.fin && I.fin.naturalWidth){ var fm = op.fin || {left:0, alto:.686}; var finX = (N.meta + fm.left + fm.alto*I.fin.naturalWidth/I.fin.naturalHeight)*h; ox = Math.min(ox, finX - w); }
      var F = I.fondo;
      c.fillStyle = '#0b1636'; c.fillRect(0, 0, w, h);
      if(F && F.naturalWidth){
        var fh = h*.86, fw = fh*F.naturalWidth/F.naturalHeight, prog = Math.max(0, Math.min(1, J.x/N.fin));
        c.drawImage(F, -(fw - w)*prog, 0, fw, fh);
      }
      /* vidilla del fondo, en píxeles: estrellas que titilan (cruz de 8 bits) y motas que flotan con el viento */
      vida(c, w, h, performance.now()/1000);
      var S = I.suelo;
      if(S && S.naturalWidth){
        var sh = h*.345, sw = sh*S.naturalWidth/S.naturalHeight, sy = h - sh, x0 = -((ox % sw) + sw) % sw;
        var MF = op.fin || {left:0, alto:.686, top:.314};
        var tope = I.fin && I.fin.naturalWidth ? (N.meta + MF.left)*h - ox + h*.01 : w;     /* el puente del mosaico acaba donde empieza la pieza de la meta */
        for(var xx = x0; xx < Math.min(w, tope); xx += sw - 1){ var dw = Math.min(sw, tope - xx); if(dw > 0) c.drawImage(S, 0, 0, S.naturalWidth*dw/sw, S.naturalHeight, xx, sy, dw, sh); }
      }
      var M = I.fin;
      if(M && M.naturalWidth){                    /* final del puente, explanada de hierba, bandera con clave de sol y castillo */
        var mh = h*MF.alto, mw = mh*M.naturalWidth/M.naturalHeight, mx = (N.meta + MF.left)*h - ox, my = MF.top*h;
        if(mx < w && mx + mw > 0) c.drawImage(M, mx, my, mw, mh);
      }
      var P = I.plataforma;
      N.plats.forEach(function(p){
        var a = p.x0*h - ox, b = p.x1*h - ox; if(b < 0 || a > w) return;
        if(P && P.naturalWidth){ var ph = h*.12; c.drawImage(P, a - h*.02, p.y*h - ph*.19, b - a + h*.04, ph); }
        else { c.fillStyle = '#8a95b8'; c.fillRect(a, p.y*h, b - a, h*.04); }
      });
      /* insignias: cifrado (menores con guion) y grado */
      var G = I.gemas, tt = ahora();
      N.objs.forEach(function(o){
        if(o.hecho || (o.cogido && !(o.tq > tt))) return;
        var x = o.x*h - ox, y = (o.y + Math.sin(tt*3 + o.i)*.006)*h, r = h*.046, celda = /^V\//.test(o.a.g) ? 3 : [0, 0, 1, 2][o.L], col = /^V\//.test(o.a.g) ? 4 : o.L;
        if(x < -r*3 || x > w + r*3) return;
        c.save(); if(o.perdido) c.globalAlpha = .35;
        if(G && G.naturalWidth){ var gw = G.naturalWidth/4, gh = r*1.7*G.naturalHeight/gw; c.drawImage(G, celda*gw, 0, gw, G.naturalHeight, x - r*.85, y - gh/2, r*1.7, gh); }
        else { c.fillStyle = COL[col]; c.beginPath(); c.arc(x, y, r*.8, 0, 7); c.fill(); }
        c.textAlign = 'center'; c.lineJoin = 'round';
        c.font = '700 ' + Math.round(h*.036) + 'px "DotGothic16", monospace'; c.lineWidth = h*.008; c.strokeStyle = 'rgba(10,14,34,.92)'; c.fillStyle = '#fff6dc';
        c.strokeText(o.a.cif, x, y + h*.013); c.fillText(o.a.cif, x, y + h*.013);
        c.font = '700 ' + Math.round(h*.024) + 'px "DotGothic16", monospace';
        c.strokeText(o.a.g, x, y + r + h*.032); c.fillStyle = COL[col]; c.fillText(o.a.g, x, y + r + h*.032);
        c.restore();
      });
      chispas.forEach(function(p){ c.globalAlpha = 1 - p.t/.7; c.fillStyle = COL[p.L]; var s = h*.008; c.fillRect(p.x*h - ox - s/2, p.y*h - s/2, s, s); });
      c.globalAlpha = 1;
      /* viajero */
      var SP = I.sprites;
      if(SP && SP.naturalWidth){
        var b = pulsos(), fr;
        if(!J.suelo) fr = J.vy < 0 ? spr.sube : spr.baja;
        else if(J.aterriza > 0 && spr.aterriza != null) fr = spr.aterriza;   /* piernas flexionadas al tocar suelo */
        else if(!reloj || J.parado) fr = spr.parado;
        else fr = spr.andar[Math.floor(((b % 1) + 1) % 1*spr.andar.length)];      /* un ciclo de pasos por pulso */
        var alto = spr.alto*h, ancho = alto*spr.celdaW/spr.celdaH, col = fr % (spr.cols || 99), fila = Math.floor(fr/(spr.cols || 99));
        c.save(); c.imageSmoothingEnabled = false;
        c.drawImage(SP, col*spr.celdaW, fila*spr.celdaH, spr.celdaW, spr.celdaH, J.x*h - ox - ancho/2, J.y*h - alto*spr.pie/spr.celdaH, ancho, alto);
        c.restore();
      }
      /* cartelitos de cadencia: nacen junto al viajero, suben y se desvanecen */
      popups.forEach(function(p){
        var a = p.t < .15 ? p.t/.15 : (p.t > 1.3 ? Math.max(0, 1 - (p.t - 1.3)/.6) : 1), esc = .8 + .2*Math.min(1, p.t/.15);
        c.save(); c.globalAlpha = a; c.translate(p.x*h - ox + h*.05, p.y*h); c.scale(esc, esc);
        c.font = '400 ' + Math.round(h*.04) + 'px "DotGothic16", monospace'; c.textAlign = 'left';
        c.lineWidth = h*.01; c.strokeStyle = 'rgba(8,12,30,.9)'; c.lineJoin = 'round';
        c.strokeText('✦ ' + p.txt, 0, 0); c.fillStyle = p.rara ? '#ff9c80' : '#ffe39a'; c.fillText('✦ ' + p.txt, 0, 0);
        c.restore();
      });
      /* marcador: compás y acordes recogidos (op.sinMarcador: sin él, p. ej. para grabar vídeo) */
      if(op.sinMarcador) return;
      var bb = pulsos(), comp = Math.max(0, Math.min(24, Math.floor(bb/4) + 1));
      c.save(); c.font = '700 ' + Math.round(h*.03) + 'px "DotGothic16", monospace'; c.textAlign = 'left';
      c.fillStyle = 'rgba(8,12,30,.6)'; c.fillRect(h*.02, h*.02, h*.5, h*.06);
      c.fillStyle = '#ffe39a'; c.fillText((bb < 0 ? 'Prepárate… ' + Math.ceil(-bb) : 'Compás ' + comp + ' / 24') + '   ·   ♦ ' + J.cogidos.length + ' / ' + D.length, h*.04, h*.062);
      c.restore();
    }
    function bucle(){
      reloj = requestAnimationFrame(bucle);
      var s = ahora(), dt = Math.min(.05, Math.max(0, s - (ultT || s))); ultT = s;
      paso(dt); pinta();
    }
    function esSalto(e){ return e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W'; }
    function tecla(e){ if(esSalto(e)){ if(reloj){ e.preventDefault(); if(!e.repeat){ quiereSaltar = true; pulsado = true; } } } }
    window.addEventListener('keyup', function(e){ if(esSalto(e)) pulsado = false; });
    window.addEventListener('pointerup', function(){ pulsado = false; });
    window.addEventListener('pointercancel', function(){ pulsado = false; });
    window.addEventListener('keydown', tecla);
    lienzo.addEventListener('pointerdown', function(e){ if(reloj && !auto){ e.preventDefault(); quiereSaltar = true; pulsado = true; } });
    window.addEventListener('resize', function(){ ajusta(); pinta(); });
    ajusta();
    /* acompañamiento grabado (p. ej. la versión de 16 bits de Suno): op.musica = {src, inicio: segundo del archivo en que cae el c. 1, bpm} */
    var buf = null, fuente = null;
    var cargaMus = null;
    if(op.musica && window.Sonido){
      var bytes = fetch(op.musica.src).then(function(r){ return r.arrayBuffer(); });
      cargaMus = Sonido.listo().then(function(){ return bytes; })
        .then(function(ab){ return new Promise(function(ok, ko){ Sonido.ctx.decodeAudioData(ab, ok, ko); }); }).then(function(b){ buf = b; }).catch(function(){ buf = null; });
    }
    function para(){ cancelAnimationFrame(reloj); reloj = null; if(chip) chip.para(); if(fuente){ try{ fuente.stop(); }catch(e){} fuente = null; } }
    return {
      jugar: function(){
        var arranca = function(){
          if(reloj) return;
          var ctx = Sonido.ctx; if(!chip) chip = Chip(ctx, Sonido.salida);
          if(buf){                                   /* música grabada: el juego sigue su reloj */
            var T = ctx.currentTime + .15; fuente = ctx.createBufferSource(); fuente.buffer = buf;
            var g = ctx.createGain(); g.gain.value = op.musica.vol || .9; fuente.connect(g); g.connect(Sonido.salida); fuente.start(T);
            t0 = T + (op.musica.inicio || 0); ultT = 0;
          } else {
            t0 = ctx.currentTime + .25 + CUENTA*60/BPM; ultT = 0;
            chip.toca(D, BPM, t0, CUENTA);
          }
          reloj = requestAnimationFrame(bucle);
        };
        /* si la pista grabada aún se está cargando, se espera a ella (como mucho 8 s) para que no arranque con el acompañamiento sintetizado */
        if(window.Sonido) Sonido.listo().then(function(){ return cargaMus ? Promise.race([cargaMus, new Promise(function(ok){ setTimeout(ok, 8000); })]) : null; }).then(arranca);
        else arranca();
      },
      para: para,
      reinicia: function(){ para(); reinicia(); pinta(); },
      auto: function(v){ auto = !!v; },
      salta: function(){ quiereSaltar = true; },
      N: function(){ return N; }
    };
  }
  var MOTAS = null, ESTR = null;
  function vida(c, w, h, t){
    if(!MOTAS){
      var r = function(i){ var x = Math.sin(i*12.9898 + 78.233)*43758.5453; return x - Math.floor(x); };
      ESTR = []; for(var i = 0; i < 26; i++) ESTR.push({x:r(i), y:r(i + 50)*.42, f:.6 + r(i + 90)*1.6, d:r(i + 130)*6.28, g:r(i + 170) > .75});
      MOTAS = []; for(var j = 0; j < 34; j++) MOTAS.push({x:r(j + 200), y:r(j + 260), v:.012 + r(j + 300)*.03, a:r(j + 340)*6.28, o:r(j + 380) > .55});
    }
    var px = Math.max(2, Math.round(h/260));
    c.save();
    ESTR.forEach(function(e){
      var b = .5 + .5*Math.sin(t*e.f*3 + e.d); if(b < .25) return;
      var x = Math.round(e.x*w/px)*px, y = Math.round(e.y*h/px)*px;
      c.globalAlpha = b*.95; c.fillStyle = e.g ? '#ffe9a8' : '#e8f0ff';
      c.fillRect(x, y, px, px);
      if(b > .8){ c.globalAlpha = (b - .8)*4; c.fillRect(x - px, y, px, px); c.fillRect(x + px, y, px, px); c.fillRect(x, y - px, px, px); c.fillRect(x, y + px, px, px); }
    });
    MOTAS.forEach(function(m){
      var y = ((m.y - t*m.v) % 1 + 1) % 1, x = ((m.x + Math.sin(t*.7 + m.a)*.012 - t*m.v*.35) % 1 + 1) % 1;
      c.globalAlpha = .35 + .35*Math.sin(t*2 + m.a); c.fillStyle = m.o ? '#ffd98a' : '#bcd2ff';
      c.fillRect(Math.round(x*w/px)*px, Math.round(y*h*.9/px)*px, px, px);
    });
    c.restore();
  }
  window.S1Coral = {monta:monta, NIV:NIV, NOMBRE:NOMBRE};
})();
