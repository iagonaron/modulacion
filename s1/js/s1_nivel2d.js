/* Modulación · Sesión 1 · el nivel 2D de Do Mayor (C1)
   Plataformas de una sola pantalla: el viajero recoge las 7 notas de Do Mayor (cada una suena);
   el fa♯ es un bloque que «no está en el menú». Con las 7, suena la escala y la cadencia: se puede modular.
   Modo jugable (flechas / A-D + espacio, o botones táctiles) y modo vídeo (piloto automático, para el aula).
   API: S1Nivel.monta(lienzo, {fondo, sprites, auto, alNota(n), alFin(), alBloque()}) → {jugar(), auto(bool), reinicia(), para()} */
(function(){
  var SUELO = .715, GRAV = 2.6, SALTO = Math.sqrt(2*2.6*.30), VEL = .26, ALTO = .17;
  var PLAT = [ [0,.078,.389], [.089,.184,.444], [.359,.476,.528], [.589,.698,.476], [.779,.878,.311], [.833,.988,.528] ];
  var NOTAS = [ {n:'Do', k:'c/4', x:.20, y:SUELO}, {n:'Re', k:'d/4', x:.137, y:.444}, {n:'Mi', k:'e/4', x:.32, y:SUELO},
                {n:'Fa', k:'f/4', x:.43, y:.528},  {n:'Sol', k:'g/4', x:.645, y:.476}, {n:'La', k:'a/4', x:.83, y:.311},
                {n:'Si', k:'b/4', x:.94, y:.528} ];
  var BLOQUE = {n:"fa♯", x:.085, y:SUELO};   /* la frontera de la región: no se puede salir de Do Mayor */
  /* piloto automático: puntos de paso {x, salta} */
  var RUTA = [ {x:.09, choca:1}, {x:.20}, {x:.125, salta:1}, {x:.137}, {x:.25}, {x:.32}, {x:.39, salta:1}, {x:.43}, {x:.44, salta:1},
               {x:.645}, {x:.69, salta:1}, {x:.83}, {x:.90}, {x:.94} ];

  function monta(lienzo, op){
    op = op || {};
    var c = lienzo.getContext('2d'), fondo = new Image(), spr = new Image(), listo = 0;
    fondo.onload = spr.onload = function(){ listo++; if(listo === 2){ ajusta(); pinta(); } };
    fondo.src = op.fondo; spr.src = op.sprites;
    var J = {}, teclas = {}, auto = !!op.auto, reloj = null, ult = 0, t = 0;
    function reinicia(){
      J = {x:.17, y:SUELO, vy:0, dir:-1, suelo:true, anda:false, f:0, tengo:{}, cuenta:0, fin:false, ruta:0, bloqueo:0, msg:'', msgT:0};
    }
    reinicia();
    function W(){ return lienzo.width; } function H(){ return lienzo.height; }
    function ajusta(){
      var r = lienzo.getBoundingClientRect(), d = Math.min(window.devicePixelRatio || 1, 1.5);
      var asp = (fondo.naturalHeight && fondo.naturalWidth) ? fondo.naturalHeight/fondo.naturalWidth : 1072/1920;
      lienzo.width = Math.round(r.width*d); lienzo.height = Math.round(r.width*d*asp);
    }
    function sueloBajo(x, yAntes, yAhora){
      var mejor = SUELO;
      PLAT.forEach(function(p){ if(x > p[0] && x < p[1] && yAntes <= p[2] + .002 && yAhora >= p[2]) mejor = Math.min(mejor, p[2]); });
      return mejor;
    }
    function sobrePlataforma(x, y){
      if(Math.abs(y - SUELO) < .003) return true;
      return PLAT.some(function(p){ return x > p[0] && x < p[1] && Math.abs(y - p[2]) < .003; });
    }
    function aviso(m){ J.msg = m; J.msgT = 2.4; }
    function paso(dt){
      t += dt;
      var izq = teclas.izq, der = teclas.der, salta = teclas.salta;
      if(auto && !J.fin){
        var w = RUTA[J.ruta]; izq = der = salta = false;
        if(w){
          var dx = w.x - J.x;
          if(Math.abs(dx) > .008){ if(dx > 0) der = true; else izq = true; }
          else if(J.suelo){ if(w.salta) salta = true; J.ruta++; }
        }
      }
      J.anda = !!(izq || der);
      if(der){ J.x += VEL*dt; J.dir = 1; } if(izq){ J.x -= VEL*dt; J.dir = -1; }
      J.x = Math.max(.02, Math.min(.995, J.x));
      if(salta && J.suelo){ J.vy = -SALTO; J.suelo = false; }
      var y0 = J.y;
      J.vy += GRAV*dt; J.y += J.vy*dt;
      if(J.vy >= 0){ var s = sueloBajo(J.x, y0, J.y); if(J.y >= s){ J.y = s; J.vy = 0; J.suelo = true; } }
      if(J.suelo && !sobrePlataforma(J.x, J.y)){ J.suelo = false; }   /* se cae al salir del borde */
      /* notas */
      NOTAS.forEach(function(n){
        if(J.tengo[n.n]) return;
        if(Math.abs(J.x - n.x) < .03 && J.y - ALTO*.9 < n.y - .03 && J.y > n.y - .09){
          J.tengo[n.n] = 1; J.cuenta++;
          if(window.Sonido) Sonido.nota(n.k, null, .9, .6);
          if(op.alNota) op.alNota(n, J.cuenta);
          if(J.cuenta === 7) fin();
        }
      });
      /* fa♯: no está en el menú */
      if(J.bloqueo > 0) J.bloqueo -= dt;
      if(Math.abs(J.x - BLOQUE.x) < .03 && J.suelo && Math.abs(J.y - SUELO) < .01 && J.bloqueo <= 0){
        J.bloqueo = 1.2; J.x += (J.dir > 0 ? -.035 : .035);
        if(auto && RUTA[J.ruta] && RUTA[J.ruta].choca) J.ruta++;
        if(window.Sonido){ Sonido.acorde(['c/4','e/4','g/4'], null, .5, .35); Sonido.nota('f#/4', null, .6, .7); }
        aviso('fa♯ no está en el menú de Do Mayor');
        if(op.alBloque) op.alBloque();
      }
      if(J.msgT > 0) J.msgT -= dt;
      J.f += dt * (J.anda ? 11 : 2.2);
    }
    function fin(){
      J.fin = true;
      if(window.Sonido){
        var a = Sonido.ahora() + .3;
        ['c/4','d/4','e/4','f/4','g/4','a/4','b/4','c/5'].forEach(function(k, i){ Sonido.nota(k, a + i*.22, .3, .5); });
        var b = a + 8*.22 + .2;
        [['c/3','e/4','g/4','c/5'],['f/2','f/4','a/4','c/5'],['g/2','f/4','g/4','b/4'],['c/3','e/4','g/4','c/5']].forEach(function(ac, i){ Sonido.acorde(ac, b + i*.7, i === 3 ? 1.6 : .65, .5); });
      }
      aviso('¡Do Mayor completo! Pero aquí solo se puede ir a izquierda o derecha…');
      if(op.alFin) setTimeout(op.alFin, 4200);
    }
    function pinta(){
      if(listo < 2) return;
      var w = W(), h = H();
      c.imageSmoothingEnabled = true; c.drawImage(fondo, 0, 0, w, h);
      /* notas por recoger: cabeza dorada con su nombre */
      NOTAS.forEach(function(n, i){
        if(J.tengo[n.n]) return;
        var x = n.x*w, y = (n.y - .085 + Math.sin(t*3 + i)*.008)*h, r = h*.022;
        c.save(); c.shadowColor = 'rgba(255,210,90,.9)'; c.shadowBlur = r*1.4;
        c.fillStyle = '#ffd35a'; c.beginPath(); c.ellipse(x, y, r*1.25, r*.9, -.35, 0, 7); c.fill();
        c.fillRect(x + r*1.05, y - r*3, r*.28, r*3); c.restore();
        c.font = '700 ' + Math.round(h*.03) + 'px "Atkinson Hyperlegible", sans-serif'; c.textAlign = 'center';
        c.fillStyle = '#fff3c8'; c.strokeStyle = 'rgba(10,20,50,.85)'; c.lineWidth = h*.006;
        c.strokeText(n.n, x, y + r*2.6); c.fillText(n.n, x, y + r*2.6);
      });
      /* el bloque del fa♯ */
      var bx = BLOQUE.x*w, by = (SUELO - .12)*h, bs = h*.09;
      c.save(); c.fillStyle = J.bloqueo > 0 ? '#e0563e' : '#8a2a22'; c.strokeStyle = '#2a0c08'; c.lineWidth = h*.006;
      c.fillRect(bx - bs/2, by, bs, bs); c.strokeRect(bx - bs/2, by, bs, bs);
      c.fillStyle = '#ffe3d8'; c.font = '700 ' + Math.round(h*.035) + 'px "Atkinson Hyperlegible", sans-serif'; c.textAlign = 'center';
      c.fillText('fa♯', bx, by + bs*.62); c.restore();
      /* el viajero */
      var fr = !J.suelo ? (J.vy < 0 ? 7 : 8) : (J.anda ? 1 + (Math.floor(J.f) % 6) : 0);
      var CH = op.celda || [300, 724, 567];  /* ancho, alto y línea de los pies de cada fotograma */
      var alto = ALTO*h*CH[1]/362, ancho = alto*CH[0]/CH[1], pie = CH[2]/CH[1];
      c.save(); c.imageSmoothingEnabled = false;
      c.translate(J.x*w, J.y*h); if(J.dir < 0) c.scale(-1, 1);
      c.drawImage(spr, fr*CH[0], 0, CH[0], CH[1], -ancho/2 + ancho*.07, -alto*pie, ancho, alto);
      c.restore();
      /* marcador y aviso */
      if(J.msgT > 0){
        c.save(); c.globalAlpha = Math.min(1, J.msgT*2);
        c.font = '700 ' + Math.round(h*.04) + 'px "Atkinson Hyperlegible", sans-serif'; c.textAlign = 'center';
        var tw = c.measureText(J.msg).width + h*.06;
        c.fillStyle = 'rgba(8,12,30,.82)'; c.fillRect(w/2 - tw/2, h*.07, tw, h*.075);
        c.fillStyle = '#fff3c8'; c.fillText(J.msg, w/2, h*.123); c.restore();
      }
    }
    function bucle(ms){
      reloj = requestAnimationFrame(bucle);
      var s = ms/1000, dt = Math.min(.05, s - (ult || s)); ult = s;
      paso(dt); pinta();
    }
    function tecla(e, v){
      var k = e.key;
      if(k === 'ArrowLeft' || k === 'a' || k === 'A') teclas.izq = v;
      else if(k === 'ArrowRight' || k === 'd' || k === 'D') teclas.der = v;
      else if(k === ' ' || k === 'ArrowUp' || k === 'w' || k === 'W') teclas.salta = v;
      else return;
      if(reloj) e.preventDefault();
    }
    window.addEventListener('keydown', function(e){ tecla(e, true); });
    window.addEventListener('keyup', function(e){ tecla(e, false); });
    ajusta(); window.addEventListener('resize', function(){ ajusta(); pinta(); });
    return {
      jugar: function(){ if(window.Sonido) Sonido.listo(); if(!reloj){ ult = 0; reloj = requestAnimationFrame(bucle); } },
      para: function(){ cancelAnimationFrame(reloj); reloj = null; },
      auto: function(v){ auto = !!v; },
      reinicia: function(){ reinicia(); pinta(); },
      boton: function(nombre, v){ teclas[nombre] = v; },
      get cuenta(){ return J.cuenta; }
    };
  }
  window.S1Nivel = {monta: monta};
})();
