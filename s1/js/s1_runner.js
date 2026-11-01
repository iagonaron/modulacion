/* Modulación · Sesión 1 · minijuego 2D «el camino de Do Mayor» (C1)
   Runner en pixel art: la pantalla avanza sola y el viajero SOLO SALTA. Se recogen acordes de Do Mayor:
   I, IV y V a ras de suelo; II y VI en escalones de una altura; III y VII a dos alturas; bonus V/V (Re) a tres alturas.
   Al encadenar: V→I auténtica · IV→I plagal · V→VI rota · IV→V y II→V semicadencia · V/V→V dominante de la dominante.
   API: S1Runner.monta(lienzo, {img:{fondo, suelo, plataforma, gemas, sprites}, auto, alAcorde(ac, cad), alFin(res)})
        → {jugar(), para(), reinicia(), auto(bool), boton(bool)} */
(function(){
  /* ---- teoría (Do Mayor) ---- */
  var AC = {
    C:{g:'I',  n:1, t:0, k:['c/3','e/4','g/4','c/5']},  F:{g:'IV', n:4, t:0, k:['f/2','f/4','a/4','c/5']},
    G:{g:'V',  n:5, t:0, k:['g/2','d/4','g/4','b/4']},  Dm:{g:'II', n:2, t:1, k:['d/3','d/4','f/4','a/4']},
    Am:{g:'VI', n:6, t:1, k:['a/2','e/4','a/4','c/5']}, Em:{g:'III', n:3, t:2, k:['e/3','e/4','g/4','b/4']},
    'B°':{g:'VII', n:7, t:2, k:['b/2','d/4','f/4','b/4']}, D:{g:'V/V', n:9, t:3, k:['d/3','d/4','f#/4','a/4']}
  };
  function cadencia(a, b){
    if(!a) return null;
    var x = AC[a].n, y = AC[b].n;
    if(x === 5 && y === 1) return 'Cadencia auténtica';
    if(x === 4 && y === 1) return 'Cadencia plagal';
    if(x === 5 && y === 6) return 'Cadencia rota';
    if((x === 4 || x === 2) && y === 5) return 'Semicadencia';
    if(x === 9 && y === 5) return '¡Dominante de la dominante!';
    return null;
  }
  /* ---- el nivel: secuencia pensada para que salgan cadencias (II → V, V → VI, círculo de quintas, bonus final) ---- */
  var SEC = ['C','F','G','C','F','C','Dm','G','C','G','Am','F','G','C','Em','Am','Dm','G','C','B°','C','F','D','G','C'];
  var Y = [.715, .555, .395, .235];            /* superficie de cada altura (fracción del alto) */
  var PASO = .78;                              /* distancia entre acordes (en altos de pantalla) */
  function construye(){
    var objs = [], plats = [], saltos = [], x = 1.9;
    var ant = null;
    SEC.forEach(function(c, i){
      var t = AC[c].t;
      if(ant !== null) x += PASO + (t > 0 ? (t - 1)*.42 + .25 : 0) - (i > 18 ? .06 : 0);
      if(t > 0){
        /* escalones: uno por altura, solapados, que suben hasta la del acorde */
        for(var k = 1; k <= t; k++){
          var x0 = x - .55 - (t - k)*.42, x1 = x + .28;
          plats.push({x0:x0, x1:x1, y:Y[k]});
          saltos.push(x0 - .18);               /* dónde salta el piloto automático */
        }
      }
      objs.push({x:x, y:Y[t] - .075, c:c, i:i, cogido:false});
      ant = c;
    });
    saltos.sort(function(a, b){ return a - b; });
    return {objs:objs, plats:plats, saltos:saltos, fin:x + .6};
  }

  function monta(lienzo, op){
    op = op || {};
    var c = lienzo.getContext('2d'), I = {}, faltan = 0;
    Object.keys(op.img || {}).forEach(function(k){
      faltan++; var im = new Image(); im.onload = im.onerror = function(){ faltan--; if(!faltan){ ajusta(); pinta(); } }; im.src = op.img[k]; I[k] = im;
    });
    var N, J, auto = !!op.auto, reloj = null, ult = 0, t = 0, pulsado = false, quiereSaltar = false;
    var GRAV = 3.1, V0 = Math.sqrt(2*3.1*.205), PX = .42;
    function reinicia(){
      N = construye();
      J = {x:0, y:Y[0], vy:0, suelo:true, f:0, cogidos:[], cads:[], ult:null, msg:'', msgT:0, fin:false, vel:.34, saltoAuto:0};
      t = 0;
    }
    reinicia();
    function ajusta(){
      var r = lienzo.getBoundingClientRect(), d = Math.min(window.devicePixelRatio || 1, 1.5);
      lienzo.width = Math.round(r.width*d); lienzo.height = Math.round(r.width*d*9/16);
    }
    function soporte(x, y0, y1){                 /* superficie bajo los pies al caer de y0 a y1 */
      var s = Y[0];
      N.plats.forEach(function(p){ if(x > p.x0 && x < p.x1 && y0 <= p.y + .003 && y1 >= p.y) s = Math.min(s, p.y); });
      return s;
    }
    function sobre(x, y){
      if(Math.abs(y - Y[0]) < .004) return true;
      return N.plats.some(function(p){ return x > p.x0 && x < p.x1 && Math.abs(y - p.y) < .004; });
    }
    function salta(){ if(J.suelo && !J.fin){ J.vy = -V0; J.suelo = false; if(op.alSalto) op.alSalto(); } }
    function paso(dt){
      t += dt;
      if(J.fin){ J.msgT -= dt; return; }
      J.vel = .34 + Math.min(.12, J.x/N.fin*.12);           /* se va complicando */
      J.x += J.vel*dt;
      if(auto){
        var sx = N.saltos[J.saltoAuto];
        if(sx != null && J.x >= sx){ if(J.suelo){ salta(); J.saltoAuto++; } else if(J.x > sx + .2) J.saltoAuto++; }
      }
      else if(quiereSaltar){ salta(); quiereSaltar = false; }
      var y0 = J.y; J.vy += GRAV*dt; J.y += J.vy*dt;
      if(J.vy >= 0){ var s = soporte(J.x, y0, J.y); if(J.y >= s){ var venia = !J.suelo; J.y = s; J.vy = 0; J.suelo = true; if(venia && op.alAterriza) op.alAterriza(); } }
      if(J.suelo && !sobre(J.x, J.y)) J.suelo = false;
      N.objs.forEach(function(o){
        if(o.cogido) return;
        if(Math.abs(o.x - J.x) < .07 && Math.abs((J.y - .09) - o.y) < .1){
          o.cogido = true;
          var cad = cadencia(J.ult, o.c); J.ult = o.c; J.cogidos.push(o.c); if(cad) J.cads.push(cad);
          if(window.Sonido) Sonido.acorde(AC[o.c].k, null, .9, .5);
          if(cad){ J.msg = cad; J.msgT = 1.8; }
          if(op.alAcorde) op.alAcorde(o.c, AC[o.c], cad);
        }
      });
      if(J.msgT > 0) J.msgT -= dt;
      J.f += dt * 10;
      if(J.x >= N.fin){
        J.fin = true;
        if(op.alFin) op.alFin({cogidos:J.cogidos.slice(), total:SEC.length, cads:J.cads.slice()});
      }
    }
    function pinta(){
      if(faltan) return;
      var w = lienzo.width, h = lienzo.height, ox = (J.x - PX*16/9)*h;   /* desplazamiento de cámara en píxeles */
      /* fondo panorámico: avanza despacio (paralaje) */
      var F = I.fondo;
      if(F && F.naturalWidth){
        var fh = h*.86, fw = fh*F.naturalWidth/F.naturalHeight, prog = Math.min(1, J.x/N.fin);
        c.fillStyle = '#0b1636'; c.fillRect(0, 0, w, h);
        c.drawImage(F, -(fw - w)*prog, 0, fw, fh);
      } else { c.fillStyle = '#0b1636'; c.fillRect(0, 0, w, h); }
      /* suelo: tira del puente-pentagrama en mosaico */
      var S = I.suelo;
      if(S && S.naturalWidth){
        var sh = h*.345, sw = sh*S.naturalWidth/S.naturalHeight, sy = h - sh, x0 = -((ox % sw) + sw) % sw;
        c.imageSmoothingEnabled = true;
        for(var xx = x0; xx < w; xx += sw - 1) c.drawImage(S, xx, sy, sw, sh);
      }
      /* plataformas */
      var P = I.plataforma;
      N.plats.forEach(function(p){
        var a = p.x0*h - ox, b = p.x1*h - ox; if(b < 0 || a > w) return;
        if(P && P.naturalWidth){ var ph = h*.13; c.drawImage(P, a - h*.03, p.y*h - ph*.19, b - a + h*.06, ph); }
        else { c.fillStyle = '#8a95b8'; c.fillRect(a, p.y*h, b - a, h*.04); }
      });
      /* acordes */
      var G = I.gemas, colores = ['#f1c24a','#bcd2ff','#b27cff','#ff5a4e'];
      N.objs.forEach(function(o){
        if(o.cogido) return;
        var x = o.x*h - ox, y = (o.y + Math.sin(t*3 + o.i)*.006)*h, r = h*.05, tier = AC[o.c].t;
        if(x < -r*2 || x > w + r*2) return;
        if(G && G.naturalWidth){ var gw = G.naturalWidth/4; var gh = r*1.7*G.naturalHeight/gw; c.drawImage(G, tier*gw, 0, gw, G.naturalHeight, x - r*.85, y - gh/2, r*1.7, gh); }
        else { c.fillStyle = colores[tier]; c.beginPath(); c.arc(x, y, r*.8, 0, 7); c.fill(); }
        c.font = '700 ' + Math.round(h*.042) + 'px "Marcellus SC", Georgia, serif'; c.textAlign = 'center';
        c.lineWidth = h*.008; c.strokeStyle = 'rgba(10,14,34,.92)'; c.fillStyle = '#fff6dc';
        c.strokeText(o.c, x, y + h*.015); c.fillText(o.c, x, y + h*.015);
        c.font = '700 ' + Math.round(h*.024) + 'px "Atkinson Hyperlegible", sans-serif';
        c.strokeText(AC[o.c].g, x, y + r + h*.03); c.fillStyle = colores[tier]; c.fillText(AC[o.c].g, x, y + r + h*.03);
      });
      /* viajero */
      var SP = I.sprites;
      if(SP && SP.naturalWidth){
        var fr = !J.suelo ? (J.vy < 0 ? 7 : 8) : 1 + (Math.floor(J.f) % 6);
        var alto = .17*h*724/362, ancho = alto*300/724;
        c.save(); c.imageSmoothingEnabled = false;
        c.drawImage(SP, fr*300, 0, 300, 724, PX*16/9*h - ancho/2 + ancho*.07, J.y*h - alto*567/724, ancho, alto);
        c.restore();
      }
      /* cartel de cadencia */
      if(J.msgT > 0 && J.msg){
        c.save(); c.globalAlpha = Math.min(1, J.msgT*2.5);
        c.font = '400 ' + Math.round(h*.06) + 'px "Marcellus SC", Georgia, serif'; c.textAlign = 'center';
        var tw = c.measureText(J.msg).width + h*.08;
        c.fillStyle = 'rgba(8,12,30,.78)'; c.fillRect(w/2 - tw/2, h*.06, tw, h*.1);
        c.fillStyle = J.msg.charAt(0) === '¡' ? '#ff8a6e' : '#ffe39a'; c.fillText(J.msg, w/2, h*.13);
        c.restore();
      }
    }
    function bucle(ms){
      reloj = requestAnimationFrame(bucle);
      var s = ms/1000, dt = Math.min(.05, s - (ult || s)); ult = s;
      paso(dt); pinta();
    }
    function tecla(e){
      if(e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W'){ if(reloj){ e.preventDefault(); quiereSaltar = true; } }
    }
    window.addEventListener('keydown', tecla);
    lienzo.addEventListener('pointerdown', function(e){ if(reloj && !auto){ e.preventDefault(); quiereSaltar = true; } });
    window.addEventListener('resize', function(){ ajusta(); pinta(); });
    ajusta();
    return {
      jugar: function(){ if(window.Sonido) Sonido.listo(); if(!reloj){ ult = 0; reloj = requestAnimationFrame(bucle); } },
      para: function(){ cancelAnimationFrame(reloj); reloj = null; },
      reinicia: function(){ reinicia(); pinta(); },
      auto: function(v){ auto = !!v; },
      salta: function(){ quiereSaltar = true; },
      AC: AC, SEC: SEC
    };
  }
  window.S1Runner = {monta: monta, AC: AC, SEC: SEC, cadencia: cadencia};
})();
