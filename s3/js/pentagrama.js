/* Modulación · pentagrama vivo de piano (común, C1). VexFlow 4 (global Vex).
   Pentagrama.pinta(contenedor, acordes, {hasta, actual, puente, ancho, tinta, acento, tenue})
   acordes: [{t:['e/4','g/4','c/5'], b:['c/3'], cif:'C'}]  ·  solo se dibujan los acordes con índice <= hasta;
   el «actual» va en color de acento; el acorde puente con marca; las alteraciones nuevas (♯/♭) resaltadas. */
(function(){
  function acc(k){ var m = /^[a-g](##|#|bb|b|n)?\//.exec(k); return m && m[1] ? m[1] : null; }
  function pinta(cont, acordes, op){
    op = op || {};
    var VF = Vex.Flow, n = acordes.length, hasta = op.hasta == null ? n-1 : op.hasta;
    cont.innerHTML = '';
    var conTexto = !!(op.cifras || op.grados || op.marcas);
    var Y0 = 8, W = op.ancho || cont.clientWidth || 640, H = 190 + (conTexto ? 96 : 0) + (op.extraH || 0);
    var r = new VF.Renderer(cont, VF.Renderer.Backends.SVG); r.resize(W, H);
    var c = r.getContext();
    var tinta = op.tinta || '#2a1d10', acento = op.acento || '#b5402a', tenue = op.tenue || 'rgba(42,29,16,.18)';
    c.setFillStyle(tinta); c.setStrokeStyle(tinta);
    var x0 = 24, ancho = W - 34;   /* que la llave no se corte (Iago, 1-nov) */
    var ts = new VF.Stave(x0, Y0, ancho), bs = new VF.Stave(x0, Y0 + 90, ancho);
    ts.addClef('treble'); bs.addClef('bass');
    if(op.armadura){ ts.addKeySignature(op.armadura); bs.addKeySignature(op.armadura); }
    ts.setContext(c).draw(); bs.setContext(c).draw();
    new VF.StaveConnector(ts, bs).setType('brace').setContext(c).draw();
    new VF.StaveConnector(ts, bs).setType('singleLeft').setContext(c).draw();
    new VF.StaveConnector(ts, bs).setType('singleRight').setContext(c).draw();
    var tn = [], bn = [];
    acordes.forEach(function(a, i){
      var oculto = i > hasta || (op.vis && !op.vis[i]);
      var col = oculto ? 'rgba(0,0,0,0)' : (i === op.actual ? acento : ((op.colores && op.colores[i]) || tinta));   /* S3: color por acorde (verde/rojo al corregir) */
      var t = new VF.StaveNote({clef:'treble', keys:a.t, duration:'w'});
      var sinB = !a.b || !a.b.length;
      var b = new VF.StaveNote({clef:'bass', keys: sinB ? ['d/3'] : a.b, duration: sinB ? 'wr' : 'w'});
      [[t,a.t],[b,sinB ? [] : a.b]].forEach(function(p){
        p[1].forEach(function(k, j){
          var s = acc(k);
          if(s && s !== 'n'){
            var A = new VF.Accidental(s);
            /* la alteración nueva de la tonalidad B, siempre en color de acento */
            var ca = op.colores !== undefined ? col : acento;   /* S3: la alteración, del color de su acorde */
            A.setStyle({fillStyle: oculto ? 'rgba(0,0,0,0)' : ca, strokeStyle: oculto ? 'rgba(0,0,0,0)' : ca});
            p[0].addModifier(A, j);
          }
        });
        var cc = (p[0] === b && sinB) ? 'rgba(0,0,0,0)' : col;
        p[0].setStyle({fillStyle:cc, strokeStyle:cc});
        if(p[0].setLedgerLineStyle) p[0].setLedgerLineStyle({fillStyle:cc, strokeStyle:cc});   /* la línea adicional del do no aparece antes que su nota */
      });
      tn.push(t); bn.push(b);
    });
    var vt = new VF.Voice({num_beats:4*n, beat_value:4}).setStrict(false).addTickables(tn);
    var vb = new VF.Voice({num_beats:4*n, beat_value:4}).setStrict(false).addTickables(bn);
    new VF.Formatter().joinVoices([vt]).joinVoices([vb]).format([vt, vb], ancho - 70);
    vt.draw(c, ts); vb.draw(c, bs);
    /* recuadro del acorde puente (como los recuadros del libro) */
    if(op.puente != null && op.puente <= hasta){
      var nt = tn[op.puente], xx = nt.getAbsoluteX() - 12;
      var rect = c.openGroup ? null : null;
      c.save(); c.setStrokeStyle(acento); c.setLineWidth(1.6);
      c.beginPath(); c.rect(xx, 4, 40, H - 10); c.stroke(); c.restore();
    }
    /* textos: cifrado arriba, grado y cadencias debajo (solo lo ya sonado) */
    if(conTexto){
      var xs = tn.map(function(t){ return t.getAbsoluteX() + t.getGlyphWidth()/2; });
      var yb = bs.getYForLine(4) + 40;
      function txt(s, x, y, tam, color, peso){
        c.save(); c.setFont(op.fuente || (window.fuenteCifra ? window.fuenteCifra() : 'Atkinson Hyperlegible, sans-serif'), tam, peso || 'bold'); c.setFillStyle(color);
        var w = c.measureText ? c.measureText(s).width : s.length*tam*.55; c.fillText(s, x - w/2, y); c.restore();
      }
      for(var i = 0; i < n; i++){
        if(i > hasta || (op.vis && !op.vis[i])) continue;
        var colT = i === op.actual ? acento : ((op.colores && op.colores[i]) || tinta);
        if(op.cifras && op.cifras[i]) txt(window.menor ? menor(op.cifras[i]) : op.cifras[i], xs[i], yb, 15, colT);
        if(op.grados && op.grados[i]){ var cg = Array.isArray(op.colGrado) ? op.colGrado[i] : op.colGrado;   /* S2: color por tonalidad; «III/VI» en dos renglones */
          String(op.grados[i]).split('/').forEach(function(g, r){ txt(g, xs[i], yb + 19 + r*15, 13, i === op.actual ? acento : (cg || tinta), 'bold'); }); }
      }
      (op.marcas || []).forEach(function(m, k){
        if(m.i > hasta || m.i < 1) return;
        var a = xs[m.i - 1] - 6, b = xs[m.i] + 6, y = yb + 33 + (op.marcasDy || 0) + (k % 2)*18, col = m.color || acento;
        c.save(); c.setStrokeStyle(col); c.setLineWidth(1.4);
        c.beginPath(); c.moveTo(a, y - 6); c.lineTo(a, y); c.lineTo(b, y); c.lineTo(b, y - 6); c.stroke(); c.restore();
        txt(m.txt, (a + b)/2, y + 12, 11.5, col, 'bold');
      });
    }
    return {r:r, xs: tn.map(function(t){ return t.getAbsoluteX() + t.getGlyphWidth()/2; })};
  }
  window.Pentagrama = {pinta: pinta};
})();
