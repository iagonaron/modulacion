/* Modulación · partitura que se lee mientras suena (común, C1). VexFlow 4 (global Vex).
   Partitura.monta(cont, D, op) → {pinta(t), sistemas, fin}
   D = {armadura:'Dm'|'C', compas:'4/4', porSistema:4,
        compases:[{d:[['d/4','q'], ['f/4','8'], ['e/4','q~']...], i:[[['d/3','f/3','a/3'],'h'], ...], cif:['Dm','Gm']}],
        anclas:[[posicion en corcheas desde el inicio, segundo del audio], ...]}
   Duraciones: w h q 8 16 · con «d» = con puntillo (hd, qd) · «~» = ligada a la siguiente · «r» = silencio (qr).
   pinta(t) dibuja el sistema que toca en el segundo t, con la nota que suena en color de acento. */
(function(){
  var OCH = {w:8, h:4, q:2, '8':1, '16':.5, '32':.25};
  function dur(s){ var b = s.replace(/[d~r]/g, ''), v = OCH[b]; if(/d/.test(s.replace(/^\d+/, ''))) v *= 1.5; return v; }
  var ARM = {C:{}, Am:{}, G:{f:'#'}, Em:{f:'#'}, F:{b:'b'}, Dm:{b:'b'}, Bb:{b:'b', e:'b'}, Gm:{b:'b', e:'b'}};
  function partes(k){ var m = /^([a-g])(##|#|bb|b|n)?\/(\d)$/.exec(k); return {l:m[1], a:m[2] || '', o:m[3]}; }
  function monta(cont, D, op){
    op = op || {};
    var VF = Vex.Flow, arm = ARM[D.armadura || 'C'] || {}, porS = D.porSistema || 4;
    var tinta = op.tinta || '#2a1d10', acento = op.acento || '#b5402a';
    /* posición absoluta de cada nota de la mano derecha (para saber cuál suena) */
    /* inicio de cada compás en corcheas (admite compases de distinta longitud, p. ej. un 2/4 en medio de un 4/4) */
    var PB = [0]; D.compases.forEach(function(c){ PB.push(PB[PB.length-1] + c.d.reduce(function(a, n){ return a + dur(n[1]); }, 0)); });
    var pos = 0, notasD = [];
    D.compases.forEach(function(c, ci){
      var p = PB[ci];
      c.d.forEach(function(n, ni){ notasD.push({c:ci, n:ni, p:p, sil:/r/.test(n[1]), lig:ni > 0 ? /~/.test(c.d[ni-1][1]) : (ci > 0 && /~/.test(D.compases[ci-1].d.slice(-1)[0][1]))}); p += dur(n[1]); });
    });
    var A = D.anclas;
    function tDePos(p){
      if(p <= A[0][0]) return A[0][1] + (p - A[0][0]) * (A.length > 1 ? (A[1][1] - A[0][1])/(A[1][0] - A[0][0]) : .25);
      for(var i = 1; i < A.length; i++) if(p <= A[i][0]) return A[i-1][1] + (p - A[i-1][0]) * (A[i][1] - A[i-1][1])/(A[i][0] - A[i-1][0]);
      var a = A[A.length-2], b = A[A.length-1]; return b[1] + (p - b[0]) * (b[1] - a[1])/(b[0] - a[0]);
    }
    notasD.forEach(function(x){ x.t = tDePos(x.p); });
    var fin = tDePos(PB[D.compases.length]);
    function actualEn(t){
      var k = -1; for(var i = 0; i < notasD.length; i++){ if(notasD[i].t <= t + .03 && !notasD[i].sil) k = i; else if(notasD[i].t > t + .03) break; }
      if(k >= 0) while(k > 0 && notasD[k].lig) k--;      /* una nota ligada sigue siendo la misma */
      return k;
    }
    var ultimo = '', XS = [], cursor = null;
    var IDX = {}; notasD.forEach(function(x, i){ IDX[x.c + ':' + x.n] = i; });
    /* cursor que avanza de forma continua entre nota y nota: así se ve que la partitura va con el audio */
    function mueveCursor(t){
      if(!cursor || !XS.length) return;
      var x = XS[0].x, op_ = (t >= XS[0].t - .05 && t <= fin + .3) ? .6 : 0;
      for(var i = 0; i < XS.length - 1; i++){
        if(t >= XS[i].t && t < XS[i+1].t){ x = XS[i].x + (XS[i+1].x - XS[i].x)*(t - XS[i].t)/(XS[i+1].t - XS[i].t); break; }
        if(t >= XS[i+1].t) x = XS[i+1].x;
      }
      cursor.style.transform = 'translateX(' + x.toFixed(1) + 'px)'; cursor.style.opacity = op_;
    }
    function notas(lista, clef, ci, mano, marca){
      var estado = {};
      return lista.map(function(n, ni){
        var keys = typeof n[0] === 'string' ? [n[0]] : n[0], d = n[1], sil = /r/.test(d);
        var base = d.replace(/[~]/g, '');
        var sn = new VF.StaveNote({clef:clef, keys: sil ? [clef === 'bass' ? 'd/3' : 'b/4'] : keys, duration: base.replace(/[dr]/g, '') + (sil ? 'r' : ''), dots: /d/.test(base.replace(/^\d+/, '')) ? 1 : 0});
        if(/d/.test(base.replace(/^\d+/, ''))) VF.Dot.buildAndAttach([sn], {all:true});
        if(!sil) keys.forEach(function(k, j){
          var q = partes(k), quiere = q.a || 'n', firma = arm[q.l] || 'n', id = q.l + q.o;
          var vigente = estado[id] || firma;
          if(quiere !== vigente){ sn.addModifier(new VF.Accidental(quiere), j); estado[id] = quiere; }
        });
        var col = (marca && marca(ni)) ? acento : tinta;
        sn.setStyle({fillStyle:col, strokeStyle:col});
        return sn;
      });
    }
    function pinta(t){
      var k = actualEn(t), cAct = k >= 0 ? notasD[k].c : 0, sis = Math.floor(cAct/porS);
      if(t >= fin + .5) sis = Math.floor((D.compases.length - 1)/porS);
      var firma = sis + ':' + k;
      if(firma === ultimo){ mueveCursor(t); return; } ultimo = firma;
      cont.innerHTML = ''; cont.style.position = 'relative'; XS = [];
      var W = (typeof op.ancho === 'function' ? op.ancho() : op.ancho) || cont.clientWidth || 700, H = 250;
      var r = new VF.Renderer(cont, VF.Renderer.Backends.SVG); r.resize(W, H);
      var c = r.getContext(); c.setFillStyle(tinta); c.setStrokeStyle(tinta);
      var desde = sis*porS, hasta = Math.min(D.compases.length, desde + porS), x = 10, cab = 70 + (Object.keys(arm).length*10);
      var anchoC = (W - 20 - cab)/(hasta - desde), lig = [];
      for(var ci = desde; ci < hasta; ci++){
        var C = D.compases[ci], w = anchoC + (ci === desde ? cab : 0);
        var ts = new VF.Stave(x, 6, w), bs = new VF.Stave(x, 100, w);
        if(ci === desde){
          ts.addClef('treble').addKeySignature(D.armadura || 'C'); bs.addClef(D.claveI || 'bass').addKeySignature(D.armadura || 'C');
          if(ci === 0){ ts.addTimeSignature(D.compas || '4/4'); bs.addTimeSignature(D.compas || '4/4'); }
          if(D.primerCompas) ts.setMeasure(D.primerCompas + ci);
        }
        if(C.compas && ci !== desde){ ts.addTimeSignature(C.compas); bs.addTimeSignature(C.compas); } else if(C.compas && ci === desde && ci !== 0){ ts.addTimeSignature(C.compas); bs.addTimeSignature(C.compas); }
        ts.setContext(c).draw(); bs.setContext(c).draw();
        if(ci === desde){ new VF.StaveConnector(ts, bs).setType('brace').setContext(c).draw(); new VF.StaveConnector(ts, bs).setType('singleLeft').setContext(c).draw(); }
        new VF.StaveConnector(ts, bs).setType(ci === D.compases.length - 1 ? 'boldDoubleRight' : 'singleRight').setContext(c).draw();
        var nd = notas(C.d, 'treble', ci, 'd', function(ni){ return k >= 0 && notasD[k].c === ci && notasD[k].n === ni; });
        var ni_ = notas(C.i, D.claveI || 'bass', ci, 'i');
        var nb = (PB[ci+1] - PB[ci])/2;
        var vd = new VF.Voice({num_beats:nb, beat_value:4}).setStrict(false).addTickables(nd);
        var vi = new VF.Voice({num_beats:nb, beat_value:4}).setStrict(false).addTickables(ni_);
        var bD = VF.Beam.generateBeams(nd), bI = VF.Beam.generateBeams(ni_);
        new VF.Formatter().joinVoices([vd]).joinVoices([vi]).format([vd, vi], w - (ts.getNoteStartX() - x) - 12);
        vd.draw(c, ts); vi.draw(c, bs);
        bD.concat(bI).forEach(function(b){ b.setContext(c).draw(); });
        /* ligaduras dentro del sistema */
        /* ligaduras: a la nota siguiente del compás o, si es la última, a la primera del compás siguiente (una sola vez);
           si el compás siguiente está en otro sistema, media ligadura hasta el final / desde el principio */
        if(ci === desde && ci > 0 && /~/.test(D.compases[ci-1].d.slice(-1)[0][1])) lig.push({de:null, a:nd[0]});
        lig.forEach(function(L){ if(!L.a && L.ult && L.ci === ci - 1) L.a = nd[0]; });
        C.d.forEach(function(n, ni){ if(/~/.test(n[1])) lig.push({de:nd[ni], ci:ci, ni:ni, ult:ni === nd.length - 1, a: ni < nd.length - 1 ? nd[ni + 1] : null}); });
        /* cifrado encima */
        if(C.cif){
          /* cifrado americano DEBAJO del pentagrama de abajo, alineado con su acorde */
          var slots = C.cif.length, yC = bs.getYForLine(4) + 40;
          C.cif.forEach(function(s, j){
            var texto = typeof s === 'string' ? s : s.s, x0; if(window.menor) texto = menor(texto);
            if(!texto) return;
            if(typeof s !== 'string' && ni_[j]) x0 = ni_[j].getAbsoluteX() + 6;
            else x0 = ts.getNoteStartX() + (ts.getNoteEndX() - ts.getNoteStartX())*j/slots;
            c.save(); var tam = texto.length > 4 ? 12 : 14; c.setFont((window.fuenteCifra ? window.fuenteCifra() : 'Atkinson Hyperlegible, sans-serif'), tam, 'bold'); c.setFillStyle(op.colCif || '#3f6fd8');
            var an = c.measureText ? c.measureText(texto).width : texto.length*tam*.55;
            c.fillText(texto, x0 - an/2, yC + (j % 2 && slots > 3 ? 15 : 0)); c.restore();
          });
        }
        nd.forEach(function(n, ni){ var i = IDX[ci + ':' + ni]; if(i != null) XS.push({t:notasD[i].t, x:n.getAbsoluteX() + 4}); });
        if(ci === hasta - 1) XS.push({t:tDePos(PB[ci + 1]), x:x + w - 8});
        nd.__ci = ci; x += w;
      }
      lig.forEach(function(L){
        if(!L.de && !L.a) return;
        new VF.StaveTie({first_note:L.de || undefined, last_note:L.a || undefined, first_indices:[0], last_indices:[0]}).setContext(c).draw();
      });
      cursor = document.createElement('div');
      cursor.style.cssText = 'position:absolute;left:0;top:4px;height:184px;width:3px;background:' + acento + ';opacity:0;pointer-events:none;border-radius:1px;box-shadow:0 0 6px ' + acento;
      cont.appendChild(cursor); mueveCursor(t);
      if(op.alSistema) op.alSistema(sis, k);
    }
    return {pinta:pinta, fin:fin, notas:notasD, reinicia:function(){ ultimo = ''; }};
  }
  window.Partitura = {monta:monta};
})();
