/* Modulación · enlace automático de voces (común, C1)
   Enlace.realiza(acordes, {tonica:'c'}) → [{t:[3 voces en clave de sol], b:[bajo en clave de fa]}]
   acordes: [{n:['c','e','g']}]  → nombres sin octava; el primero es la fundamental (va al bajo).
   Con 4 notas (séptima) las voces de arriba llevan 3.ª, 7.ª y fundamental (sin 5.ª) o 3.ª, 5.ª y 7.ª.
   Programación dinámica (Viterbi) que minimiza: movimiento de voces, 5.as y 8.as paralelas,
   sensible que no sube, séptima que no baja y soprano lejos del centro. */
(function(){
  var PC = {c:0, d:2, e:4, f:5, g:7, a:9, b:11};
  function pc(n){ var p = PC[n[0]]; for(var i = 1; i < n.length; i++){ if(n[i] === '#') p++; else if(n[i] === 'b') p--; } return (p + 12) % 12; }
  function clave(n, midi){                      /* 'f#' + 66 → 'f#/4' (la octava sale del nombre, no del pc alterado) */
    var base = PC[n[0]], alt = 0; for(var i = 1; i < n.length; i++) alt += n[i] === '#' ? 1 : (n[i] === 'b' ? -1 : 0);
    var oct = Math.round((midi - base - alt)/12) - 1;
    return n + '/' + oct;
  }
  function combos(nombres, lo, hi, uni){              /* todas las disposiciones de 3 voces dentro de [lo, hi], abiertas como mucho una 10.ª */
    var out = [];
    function rec(i, acc){
      if(i === nombres.length){
        var s = acc.slice().sort(function(a, b){ return a.m - b.m; });
        for(var k = 1; k < s.length; k++) if(s[k].m === s[k-1].m && !uni) return;
        if(s[s.length-1].m - s[0].m > 16) return;
        out.push(s); return;
      }
      var p = pc(nombres[i]);
      for(var m = lo; m <= hi; m++) if((m % 12) === p){ acc.push({n:nombres[i], m:m}); rec(i + 1, acc); acc.pop(); }
    }
    rec(0, []); return out;
  }
  function candidatos(a){
    var n = a.n, raiz = n[0], bajo = pc(raiz), bm = 40 + ((bajo - 40 % 12 + 12) % 12);   /* bajo entre mi2 y re#3 */
    var mayor = (pc(n[1]) - bajo + 12) % 12 === 4;
    var arriba = n.length === 3 ? [n] : [[n[1], n[3], n[0]], [n[1], n[2], n[3]]];
    var cs = [];
    arriba.forEach(function(s){ combos(s, 60, 81).forEach(function(v){ cs.push({b:{n:raiz, m:bm}, v:v, sept:n.length === 4 ? n[3] : null, ter:n[1], mayor:mayor, extra:0}); }); });
    /* acordes menores: también con la 3.ª doblada (lo que pide la cadencia rota V → VI) */
    if(n.length === 3 && !mayor) [[n[1], n[1], n[2]], [n[0], n[1], n[1]]].forEach(function(s){
      combos(s, 60, 81, true).forEach(function(v){ cs.push({b:{n:raiz, m:bm}, v:v, sept:null, ter:n[1], mayor:false, extra:5}); });
    });
    return cs;
  }
  function coste(A, B, sigRaiz){
    var c = 0, va = [A.b].concat(A.v), vb = [B.b].concat(B.v);
    for(var i = 1; i < 4; i++) c += Math.abs(vb[i].m - va[i].m) * (i === 3 ? 1.2 : 1);
    for(var i = 0; i < 4; i++) for(var j = i + 1; j < 4; j++){
      var i1 = (va[j].m - va[i].m) % 12, i2 = (vb[j].m - vb[i].m) % 12;
      var mov = vb[i].m !== va[i].m && vb[j].m !== va[j].m;
      if(mov && i1 === i2 && (i1 === 7 || i1 === 0)) c += 30;
      if(mov && (i2 === 7 || i2 === 0) && (vb[i].m - va[i].m)*(vb[j].m - va[j].m) > 0 && i === 0 && j === 3) c += 4;  /* 5.ª/8.ª directas extremas */
    }
    /* sensible: si B está una 5.ª por debajo… mejor: la nota de A a un semitono por debajo de la fundamental de B, sube */
    var rb = pc(B.b.n), salto = (rb - pc(A.b.n) + 12) % 12, pcsB = B.v.map(function(x){ return x.m % 12; });
    for(var i = 1; i < 4; i++){
      /* la 3.ª de un acorde mayor (sensible) sube un semitono si el siguiente acorde tiene esa nota */
      if(A.mayor && va[i].n === A.ter && pcsB.indexOf((va[i].m + 1) % 12) >= 0 && vb[i].m !== va[i].m + 1) c += (salto === 5 || (SENS != null && va[i].m % 12 === SENS)) ? 14 : (salto === 2 ? 6 : 0);
      else if((va[i].m % 12) === (rb + 11) % 12 && vb[i].m !== va[i].m + 1) c += 8;
      if(A.sept && va[i].n === A.sept && !(vb[i].m < va[i].m && va[i].m - vb[i].m <= 2)) c += 8;
    }
    return c;
  }
  var SENS = null;
  function realiza(acordes, op){
    SENS = op && op.tonica ? (pc(op.tonica) + 11) % 12 : null;   /* sensible de la tonalidad, si se da */
    var C = acordes.map(candidatos), D = [], P = [];
    D[0] = C[0].map(function(v){ return Math.abs(v.v[2].m - 74)*.6 + Math.abs(v.v[0].m - 64)*.3; });
    for(var k = 1; k < C.length; k++){
      D[k] = []; P[k] = [];
      C[k].forEach(function(v, j){
        var best = 1e9, arg = 0;
        C[k-1].forEach(function(u, i){ var x = D[k-1][i] + coste(u, v); if(x < best){ best = x; arg = i; } });
        D[k][j] = best + v.extra + Math.abs(v.v[2].m - 74)*.25; P[k][j] = arg;
      });
    }
    var last = C.length - 1, j = D[last].indexOf(Math.min.apply(null, D[last])), res = [];
    for(var k = last; k >= 0; k--){ var v = C[k][j]; res[k] = {t:v.v.map(function(x){ return clave(x.n, x.m); }).filter(function(k, i, a){ return a.indexOf(k) === i; }), b:[clave(v.b.n, v.b.m)]}; if(k) j = P[k][j]; }
    return res;
  }
  window.Enlace = {realiza:realiza, pc:pc};
})();
