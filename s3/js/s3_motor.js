/* Modulación · Sesión 3 · motor (C1, 1-nov-2026).
   Teoría igual que TEORÍA at home PRO → Modulación (modulacion.html): tríadas diatónicas, acordes comunes, notas a evitar,
   estructura 7 casillas (I IV V7 I | puente | V7 I) u 8 (I IV V7 I | puente | IV V7 I).
   Añade: deletreo de cada acorde y enlace de voces (bajo en clave de fa + tres voces en clave de sol, movimiento mínimo).
   API: S3M.ejercicio(n, A, B, puente) · S3M.voces(acordes) → [{t:[], b:[]}] · S3M.veredicto(EX, user, i) · nombres y cifrados. */
(function(){
  var LETTERS = ['C','D','E','F','G','A','B'], LPC = {C:0,D:2,E:4,F:5,G:7,A:9,B:11};
  var NOMBRE = {C:'Do',D:'Re',E:'Mi',F:'Fa',G:'Sol',A:'La',B:'Si'};
  var SH = ['F','C','G','D','A','E','B'], FL = ['B','E','A','D','G','C','F'];
  var MAJ = [{name:'C',sig:0},{name:'G',sig:1},{name:'D',sig:2},{name:'A',sig:3},{name:'E',sig:4},{name:'F',sig:-1},{name:'Bb',sig:-2},{name:'Eb',sig:-3},{name:'Ab',sig:-4}];
  var MIN = [{name:'A',sig:0},{name:'E',sig:1},{name:'B',sig:2},{name:'F#',sig:3},{name:'C#',sig:4},{name:'D',sig:-1},{name:'G',sig:-2},{name:'C',sig:-3},{name:'F',sig:-4}];
  function mapa(sig){ var m = {C:0,D:0,E:0,F:0,G:0,A:0,B:0}, i; if(sig > 0) for(i = 0; i < sig; i++) m[SH[i]] = 1; else for(i = 0; i < -sig; i++) m[FL[i]] = -1; return m; }
  function parse(nm){ return {letter:nm[0], alter: nm.indexOf('#') >= 0 ? 1 : (nm.length > 1 && nm.indexOf('b') > 0 ? -1 : 0)}; }
  function gl(a){ return a === 1 ? '♯' : a === -1 ? '♭' : a === 2 ? '×' : a === -2 ? '♭♭' : ''; }
  function pc(l, a){ return ((LPC[l] + a) % 12 + 12) % 12; }
  function tonalidad(nombre, modo){ var L = modo === 'minor' ? MIN : MAJ; for(var i = 0; i < L.length; i++) if(L[i].name === nombre) return {name:nombre, mode:modo || 'major', sig:L[i].sig}; return null; }
  function keyLabel(k){ var p = parse(k.name); return NOMBRE[p.letter] + gl(p.alter) + (k.mode === 'major' ? ' Mayor' : ' menor'); }
  function keyCorto(k){ var p = parse(k.name); return NOMBRE[p.letter] + gl(p.alter) + (k.mode === 'major' ? ' M' : ' m'); }
  function sigLabel(s){ if(!s) return 'sin alteraciones'; var n = Math.abs(s); return n + (s > 0 ? (n === 1 ? ' sostenido' : ' sostenidos') : (n === 1 ? ' bemol' : ' bemoles')); }
  function sigNotas(s){ if(!s) return ''; var L = s > 0 ? SH : FL; return L.slice(0, Math.abs(s)).map(function(l){ return NOMBRE[l].toLowerCase() + (s > 0 ? '♯' : '♭'); }).join(', '); }
  function triadas(key, natural){
    var m = mapa(key.sig), t = parse(key.name), ti = LETTERS.indexOf(t.letter), gr = [], out = [], g;
    for(g = 0; g < 7; g++){ var l = LETTERS[(ti + g) % 7]; gr.push({letter:l, alter:m[l]}); }
    var minor = key.mode === 'minor', sev = gr[6].letter;
    function sube(l, a){ return (!natural && minor && l === sev) ? a + 1 : a; }
    for(g = 0; g < 7; g++){
      var r = gr[g], th = gr[(g + 2) % 7], f = gr[(g + 4) % 7];
      var rA = sube(r.letter, r.alter), tA = sube(th.letter, th.alter), fA = sube(f.letter, f.alter);
      var rp = pc(r.letter, rA), tp = pc(th.letter, tA), fp = pc(f.letter, fA), i3 = (tp - rp + 12) % 12, i5 = (fp - rp + 12) % 12;
      var modo = i3 === 4 && i5 === 7 ? 'M' : i3 === 3 && i5 === 7 ? 'm' : i3 === 3 && i5 === 6 ? 'dim' : i3 === 4 && i5 === 8 ? 'aug' : '?';
      out.push({grado:g, root:{letter:r.letter, alter:rA}, modo:modo, notesPc:[rp, tp, fp]});
    }
    return out;
  }
  function romano(g, modo){ var b = ['I','II','III','IV','V','VI','VII'][g]; return modo === 'M' ? b : modo === 'm' ? b.toLowerCase() : modo === 'dim' ? b.toLowerCase() + '°' : b; }
  function nombreAcorde(a){ var b = NOMBRE[a.root.letter] + gl(a.root.alter); if(a.seventh && a.modo === 'M') return b + '7'; return b + (a.modo === 'M' ? 'M' : a.modo === 'm' ? 'm' : a.modo === 'dim' ? '°' : '') + (a.seventh ? '7' : ''); }
  function cifrado(a){ var b = a.root.letter + gl(a.root.alter); if(a.seventh && a.modo === 'M') return b + '7'; return b + (a.modo === 'm' ? '−' : a.modo === 'dim' ? '°' : '') + (a.seventh ? '7' : ''); }
  function comunes(A, B){
    var ta = triadas(A, true), tb = triadas(B, true), out = [];
    ta.forEach(function(a){ tb.forEach(function(b){
      if(a.notesPc.slice().sort().join() === b.notesPc.slice().sort().join() && a.modo === b.modo && a.modo !== 'dim')
        out.push({root:a.root, modo:a.modo, seventh:false, gradoA:a.grado, gradoB:b.grado, romA:romano(a.grado, a.modo), romB:romano(b.grado, b.modo)});
    }); });
    return out;
  }
  function evitar(A, B){ var ma = mapa(A.sig), mb = mapa(B.sig), o = []; LETTERS.forEach(function(L){ if(ma[L] !== mb[L]) o.push({letter:L, a:ma[L], b:mb[L]}); }); return o; }
  function evitarTexto(A, B){ return evitar(A, B).map(function(n){ var a = NOMBRE[n.letter].toLowerCase() + gl(n.a), b = NOMBRE[n.letter].toLowerCase() + gl(n.b); return a === b ? a : a + ' / ' + b; }).join(', '); }
  function ac(t, sev, mayor){ return {root:{letter:t.root.letter, alter:t.root.alter}, modo: mayor ? 'M' : t.modo, seventh:!!sev, grado:t.grado}; }
  /* pares válidos (mismas reglas que modulacion.html); soloMayores para la S3 */
  function pares(soloMayores){
    var K = MAJ.map(function(k){ return {name:k.name, mode:'major', sig:k.sig}; });
    if(!soloMayores) K = K.concat(MIN.map(function(k){ return {name:k.name, mode:'minor', sig:k.sig}; }));
    var c = [];
    K.forEach(function(A){ K.forEach(function(B){
      if(A.sig === B.sig) return; var d = Math.abs(A.sig - B.sig); if(d < 1 || d > 2) return;
      var cm = comunes(A, B); if(cm.length) c.push({A:A, B:B});
    }); });
    return c;
  }
  /* ejercicio: n = 7 u 8; A, B opcionales (si no, al azar entre mayores) */
  function ejercicio(n, A, B, soloMayores){
    n = n === 8 ? 8 : 7;
    if(!A || !B){ var P = pares(soloMayores !== false), e = P[Math.floor(Math.random()*P.length)]; A = e.A; B = e.B; }
    var ta = triadas(A, true), tb = triadas(B, true), cm = comunes(A, B);
    var sol = [
      {fixed:true, acc:[ac(ta[0])], g:'I', r:'A'},
      {acc:[ac(ta[3])], g:'IV', r:'A'},
      {acc:[ac(ta[4], true, true)], g:'V7', r:'A'},
      {acc:[ac(ta[0])], g:'I', r:'A'},
      {magic:true, acc:cm.map(function(c){ return {root:c.root, modo:c.modo, seventh:false, _p:c}; }), g:'', r:'P'}
    ];
    if(n === 8) sol.push({acc:[ac(tb[3])], g:'IV', r:'B'});
    sol.push({acc:[ac(tb[4], true, true)], g:'V7', r:'B'});
    sol.push({fixed:true, acc:[ac(tb[0])], g:'I', r:'B'});
    return {n:n, A:A, B:B, sol:sol, comunes:cm, evitar:evitarTexto(A, B)};
  }
  function igual(u, s){ return u && s && u.root.letter === s.root.letter && u.root.alter === s.root.alter && u.modo === s.modo; }
  /* veredicto de una casilla: ok · bad · amber (falta 7ª) · vacía (bad) */
  function veredicto(EX, user, i){
    var d = EX.sol[i], u = user[i];
    if(d.fixed) return {cls:'ok', label:''};
    if(!u) return {cls:'bad', label:'vacía'};
    var m = d.acc.filter(function(s){ return igual(u, s); });
    if(!m.length) return {cls:'bad', label:'incorrecto'};
    if(d.acc.some(function(s){ return s.seventh; }) && !u.seventh) return {cls:'amber', label:'falta 7ª'};
    return {cls:'ok', label:'correcto'};
  }
  /* ---------- deletreo y enlace de voces ---------- */
  function tonos(a){   /* [{letter, alter, pc, papel}] fundamental, 3ª, 5ª, (7ª) */
    var li = LETTERS.indexOf(a.root.letter), r = pc(a.root.letter, a.root.alter);
    var iv = [0, a.modo === 'M' || a.modo === 'aug' ? 4 : 3, a.modo === 'dim' ? 6 : a.modo === 'aug' ? 8 : 7];
    if(a.seventh) iv.push(a.modo === 'M' ? 10 : a.modo === 'dim' ? 9 : 10);
    return iv.map(function(s, k){
      var l = LETTERS[(li + 2*k) % 7], p = (r + s) % 12, al = ((p - LPC[l] + 18) % 12) - 6;
      return {letter:l, alter:al, pc:p, papel:['R','3','5','7'][k]};
    });
  }
  function clave(t, midi){   /* VexFlow: 'f#/4' */
    var oct = Math.floor((midi - t.alter - LPC[t.letter])/12) - 1;
    return t.letter.toLowerCase() + ({'1':'#','2':'##','-1':'b','-2':'bb'}[t.alter] || '') + '/' + oct;
  }
  function midisDe(t, lo, hi){ var o = []; for(var m = lo; m <= hi; m++) if(((m % 12) + 12) % 12 === t.pc) o.push(m); return o; }
  function voces(acordes){
    var prevS = null, prevB = null, out = [];
    acordes.forEach(function(a){
      if(!a){ out.push(null); return; }
      var T = tonos(a), R = T[0];
      /* bajo: la fundamental entre mi2 (40) y re3 (50), cerca del anterior */
      var cb = midisDe(R, 40, 51), b = cb[0];
      cb.forEach(function(m){ if(prevB == null ? Math.abs(m - 46) < Math.abs(b - 46) : Math.abs(m - prevB) < Math.abs(b - prevB)) b = m; });
      /* tres voces de sol (la3 57 – sol5 79): tríada completa; con 7ª: 3ª, 7ª y 5ª o fundamental */
      var juegos = a.seventh ? [[T[1], T[2], T[3]], [T[0], T[1], T[3]]] : [[T[0], T[1], T[2]]];
      var mejor = null, coste = 1e9;
      juegos.forEach(function(J){
        var c0 = midisDe(J[0], 57, 79), c1 = midisDe(J[1], 57, 79), c2 = midisDe(J[2], 57, 79);
        c0.forEach(function(x){ c1.forEach(function(y){ c2.forEach(function(z){
          var v = [{t:J[0], m:x}, {t:J[1], m:y}, {t:J[2], m:z}].sort(function(p, q){ return p.m - q.m; });
          if(v[0].m === v[1].m || v[1].m === v[2].m || v[2].m - v[0].m > 12) return;
          var k = prevS ? Math.abs(v[0].m - prevS[0]) + Math.abs(v[1].m - prevS[1]) + Math.abs(v[2].m - prevS[2]) : Math.abs(v[0].m + v[1].m + v[2].m - 3*65);
          if(v[0].m - b < 7) k += 20;   /* que no se pegue al bajo */
          if(k < coste){ coste = k; mejor = v; }
        }); }); });
      });
      prevS = mejor.map(function(v){ return v.m; }); prevB = b;
      out.push({t:mejor.map(function(v){ return clave(v.t, v.m); }), b:[clave(R, b)], midi:prevS.concat([b])});
    });
    return out;
  }
  window.S3M = {LETTERS:LETTERS, NOMBRE:NOMBRE, gl:gl, tonalidad:tonalidad, keyLabel:keyLabel, keyCorto:keyCorto, sigLabel:sigLabel, sigNotas:sigNotas,
    triadas:triadas, comunes:comunes, evitarTexto:evitarTexto, ejercicio:ejercicio, veredicto:veredicto, igual:igual,
    nombreAcorde:nombreAcorde, cifrado:cifrado, romano:romano, voces:voces, tonos:tonos, pares:pares};
})();
