/* Modulación · S1 · el coral del minijuego (C1). VexFlow 4.
   Coral.pinta(cont, D, op) dibuja el coral a 4 voces en gran pentagrama: soprano y contralto en clave de sol
   (plicas arriba / abajo), tenor y bajo en clave de fa; las notas comunes que se mantienen de un acorde al siguiente van ligadas.
   Debajo del pentagrama de abajo: cifrado americano (menores con guion), grado y corchetes de cadencia.
   D = [{c:compás, d:negras, pos, S, A, T, B, Bn:[[clave, dur]...], cif, g}]
   op = {porSistema:4, actual:i, apagados:{i:true}, marcas:[{i, txt, color}], ancho} */
(function(){
  function acc(k){ var m = /^[a-g](#|b)?\//.exec(k); return m && m[1] ? m[1] : null; }
  function pinta(cont, D, op){
    op = op || {};
    var VF = Vex.Flow, porS = op.porSistema || 4, tinta = op.tinta || '#2a1d10', acento = op.acento || '#b5402a', tenue = 'rgba(42,29,16,.32)';
    var ultimo = D[D.length - 1].c, W = op.ancho || cont.clientWidth || 900, filaH = op.filaH || 310;
    var nS = Math.ceil(ultimo/porS);
    cont.innerHTML = '';
    var r = new VF.Renderer(cont, VF.Renderer.Backends.SVG); r.resize(W, nS*filaH + 10);
    var c = r.getContext();
    var notas = {S:[], A:[], T:[], B:[]};       /* por índice de acorde, para ligaduras y textos */
    var xsAcorde = [];
    for(var s = 0; s < nS; s++){
      var y0 = s*filaH + 10, x = 24, cab = 60, anchoC = (W - 34 - cab)/porS, porSistema = {S:[], A:[], T:[], B:[]};
      for(var cc = s*porS + 1; cc <= Math.min(ultimo, (s + 1)*porS); cc++){
        var w = anchoC + (cc === s*porS + 1 ? cab : 0);
        var ts = new VF.Stave(x, y0, w), bs = new VF.Stave(x, y0 + 95, w);
        if(cc === s*porS + 1){ ts.addClef('treble'); bs.addClef('bass'); if(cc === 1){ ts.addTimeSignature('4/4'); bs.addTimeSignature('4/4'); } }
        ts.setContext(c).draw(); bs.setContext(c).draw();
        if(cc === s*porS + 1){ new VF.StaveConnector(ts, bs).setType('brace').setContext(c).draw(); new VF.StaveConnector(ts, bs).setType('singleLeft').setContext(c).draw(); }
        new VF.StaveConnector(ts, bs).setType(cc === ultimo ? 'boldDoubleRight' : 'singleRight').setContext(c).draw();
        var enC = D.map(function(x, i){ return i; }).filter(function(i){ return D[i].c === cc; });
        var V = {S:[], A:[], T:[], B:[]};
        enC.forEach(function(i){
          var x_ = D[i], dur = x_.d === 4 ? 'w' : (x_.d === 1 ? 'q' : 'h');
          var col = op.apagados && op.apagados[i] ? tenue : (i === op.actual ? acento : tinta);
          [['S','treble',1],['A','treble',-1],['T','bass',1]].forEach(function(v){
            var n = new VF.StaveNote({clef:v[1], keys:[x_[v[0]]], duration:dur, stem_direction:v[2]});
            var a = acc(x_[v[0]]); if(a) n.addModifier(new VF.Accidental(a), 0);
            n.setStemDirection(v[2]); n.setStyle({fillStyle:col, strokeStyle:col}); V[v[0]].push(n); notas[v[0]][i] = n;
          });
          (x_.Bn || [[x_.B, dur]]).forEach(function(b, j){
            var n = new VF.StaveNote({clef:'bass', keys:[b[0]], duration:b[1], stem_direction:-1});
            var a = acc(b[0]); if(a) n.addModifier(new VF.Accidental(a), 0);
            n.setStemDirection(-1); n.setStyle({fillStyle:col, strokeStyle:col}); V.B.push(n); if(j === 0) notas.B[i] = n;
          });
        });
        var vs = ['S','A','T','B'].map(function(k){ return new VF.Voice({num_beats:4, beat_value:4}).setStrict(false).addTickables(V[k]); });
        var fmt = new VF.Formatter(); fmt.joinVoices([vs[0], vs[1]]).joinVoices([vs[2], vs[3]]);
        fmt.format(vs, w - (ts.getNoteStartX() - x) - 14);
        vs[0].draw(c, ts); vs[1].draw(c, ts); vs[2].draw(c, bs); vs[3].draw(c, bs);
        enC.forEach(function(i){ xsAcorde[i] = {x:notas.S[i].getAbsoluteX() + 5, yb:bs.getYForLine(4), yt:ts.getYForLine(0), s:s}; });
        x += w;
      }
    }
    /* ligaduras de notas comunes (misma voz, misma nota, mismo sistema) */
    ['S','A','T'].forEach(function(k){
      for(var i = 1; i < D.length; i++){
        if(D[i][k] === D[i-1][k] && xsAcorde[i].s === xsAcorde[i-1].s && notas[k][i] && notas[k][i-1])
          new VF.StaveTie({first_note:notas[k][i-1], last_note:notas[k][i], first_indices:[0], last_indices:[0]}).setContext(c).draw();
      }
    });
    /* textos debajo */
    function txt(t, x, y, tam, col, peso){ c.save(); c.setFont((window.fuenteCifra ? window.fuenteCifra() : 'Atkinson Hyperlegible, sans-serif'), tam, peso || 'bold'); c.setFillStyle(col); var w = c.measureText ? c.measureText(t).width : t.length*tam*.55; c.fillText(t, x - w/2, y); c.restore(); }
    D.forEach(function(x_, i){
      var p = xsAcorde[i]; if(!p) return; var apag = op.apagados && op.apagados[i];
      txt(x_.cif, p.x, p.yb + 50, 15, apag ? tenue : (i === op.actual ? acento : '#3f6fd8'));
      txt(x_.g, p.x, p.yb + 68, 12, apag ? tenue : '#6b5537');
    });
    (op.marcas || []).forEach(function(m, k){
      var a = xsAcorde[m.i - 1], b = xsAcorde[m.i]; if(!a || !b || a.s !== b.s) return;
      var y = b.yb + 84 + (k % 2)*16, col = m.color || acento;
      c.save(); c.setStrokeStyle(col); c.setLineWidth(1.4); c.beginPath(); c.moveTo(a.x - 6, y - 5); c.lineTo(a.x - 6, y); c.lineTo(b.x + 6, y); c.lineTo(b.x + 6, y - 5); c.stroke(); c.restore();
      txt(m.txt, (a.x + b.x)/2, y + 12, 11, col);
    });
    /* regiones tonales (coral modulante): rótulo encima del pentagrama de arriba */
    (op.regiones || []).forEach(function(r){
      var p = xsAcorde[r.i]; if(!p) return;
      c.save(); c.setStrokeStyle(r.color || acento); c.setLineWidth(2); c.beginPath(); c.moveTo(p.x - 7, p.yt - 32); c.lineTo(p.x - 7, p.yt - 10); c.stroke(); c.restore();
      c.save(); c.setFont((window.fuenteCifra ? window.fuenteCifra() : 'Atkinson Hyperlegible, sans-serif'), 15, 'bold'); c.setFillStyle(r.color || acento); c.fillText(r.txt, p.x, p.yt - 18); c.restore();
    });
    return {xs:xsAcorde};
  }
  window.Coral = {pinta:pinta};
})();
