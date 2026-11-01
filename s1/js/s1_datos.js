/* Modulación · Sesión 1 · las dos frases de la introducción, en partitura (C1)
   Transcritas de los audios del portal antiguo (mus/mozart.mp3 y mus/rachmaninov.mp3) y sincronizadas con ellos.
   ⚠️ Pendiente de revisión de Iago: compás 4 de Mozart (adorno) y la armonía simplificada de Rachmaninov. */
(function(){
  /* W. A. Mozart · Sonata en Do mayor K. 545, I. Allegro, cc. 1-4 · la frase que apenas sale de casa */
  var alb = function(a, b, c){ return [[a,'8'],[b,'8'],[c,'8'],[b,'8']]; };
  var MOZART = {
    titulo:'W. A. Mozart · Sonata en Do mayor, K. 545 (I)', armadura:'C', compas:'C', claveI:'treble', porSistema:4,
    compases:[
      {d:[['c/5','h'],['e/5','q'],['g/5','q']], i:alb('c/4','g/4','e/4').concat(alb('c/4','g/4','e/4')), cif:['C']},
      {d:[['b/4','qd'],['c/5','16'],['d/5','16'],['c/5','h']], i:alb('d/4','g/4','f/4').concat(alb('c/4','g/4','e/4')), cif:['G7','C']},
      {d:[['a/5','h'],['g/5','q'],['c/6','q']], i:alb('c/4','a/4','f/4').concat(alb('c/4','g/4','e/4')), cif:['F/C','C']},
      {d:[['g/5','q'],['f/5','q'],['e/5','h']], i:alb('b/3','g/4','d/4').concat(alb('c/4','g/4','e/4')), cif:['G7','C']}
    ],
    anclas:[[0,.22],[8,2.26],[16,4.2],[24,6.16],[32,8.1]]
  };
  /* S. Rachmaninov · Concierto para piano n.º 3 en re menor, op. 30, I · el tema: la línea larga que se aleja y tarda en volver */
  /* S. Rachmaninov · Concierto para piano n.º 3 en re menor, op. 30, I · el tema (cc. 3-27 de la partitura)
     En C (4/4) como el original, con el c. 25 en 2/4. La melodía entra tras un silencio de negra.
     cc. 3-8 y 21-27 copiados de la partitura; cc. 9-20 transcritos del audio. Sincronía v3 (31-oct 23:25): la melodía seguida EN LA GRABACIÓN de la página (que es la misma interpretación que la pista
     «sólo melodía» pero ~10 % más lenta): DTW melodía↔grabación + seguidor de ataques; anclas cada negra → /home/claude/rach/anclas_v3.py. */
  var RACH = {
    titulo:'S. Rachmaninov · Concierto para piano n.º 3 en re menor, op. 30 (I) · cc. 3-27', armadura:'Dm', compas:'C', porSistema:4, primerCompas:3,
    compases:[{"d": [["qr", "qr"], ["d/4", "q"], ["f/4", "8"], ["e/4", "8"], ["d/4", "q"]], "h": [["Dm", 0, 2, 0], ["Dm", 1, 2, 0], ["B♭/D", 2, 4, 0]]}, {"d": [["c#/4", "8"], ["d/4", "8"], ["e/4", "q"], ["d/4", "qd"], ["e/4", "8"]], "h": [["Dm", 0, 2, 0], ["Dm/A", 1, 2, 0], ["Dm", 2, 4, 0]]}, {"d": [["d/4", "8"], ["e/4", "8"], ["f/4", "q"], ["f/4", "q"], ["f/4", "q"]], "h": [["Dm", 0, 2, 1], ["Dm", 1, 2, 0], ["B♭7", 2, 4, 0]]}, {"d": [["e/4", "8"], ["d/4", "8"], ["c#/4", "h"], ["bn/3", "8"], ["c/4", "8"]], "h": [["B♭7", 0, 2, 1], ["Dm/A", 1, 4, 0], ["A", 3, 2, 0]]}, {"d": [["d/4", "q"], ["d/4", "q"], ["f/4", "8"], ["e/4", "8"], ["d/4", "q"]], "h": [["A7", 0, 2, 0], ["Dm", 1, 2, 0], ["B♭/D", 2, 2, 0], ["Dm", 3, 2, 0]]}, {"d": [["c#/4", "8"], ["d/4", "8"], ["e/4", "q"], ["d/4", "h"]], "h": [["Dm", 0, 2, 1], ["A", 1, 2, 0], ["A7", 2, 2, 0], ["Dm", 3, 2, 0]]}, {"d": [["g/4", "q"], ["f/4", "q"], ["e/4", "q"], ["d/4", "q"]], "h": [["Dm", 0, 2, 1], ["Eø", 1, 6, 0]]}, {"d": [["e/4", "q~"], ["e/4", "qd"], ["d/4", "8"], ["c#/4", "8"], ["b/3", "8"]], "h": [["Gm6", 0, 2, 0], ["B♭7", 1, 2, 0], ["A7", 2, 2, 0], ["A", 3, 2, 0]]}, {"d": [["c/4", "8"], ["d/4", "8"], ["e/4", "hd~"]], "h": [["A", 0, 2, 1], ["E7", 1, 4, 0], ["A", 3, 2, 0]]}, {"d": [["e/4", "q"], ["eb/4", "q"], ["d/4", "qd"], ["c/4", "8"]], "h": [["A", 0, 2, 1], ["F", 1, 2, 0], ["F♯°7", 2, 2, 0], ["Cm", 3, 2, 0]]}, {"d": [["bb/3", "8"], ["c/4", "8"], ["d/4", "q"], ["e/4", "q"], ["f/4", "q"]], "h": [["Cm", 0, 2, 1], ["Cm", 1, 2, 0], ["D7", 2, 2, 0], ["D7/F♯", 3, 2, 0]]}, {"d": [["eb/4", "q~"], ["eb/4", "q"], ["d/4", "qd"], ["c/4", "8"]], "h": [["Cm/G", 0, 2, 0], ["Gm", 1, 2, 0], ["A7", 2, 2, 0], ["Dm", 3, 2, 0]]}, {"d": [["bb/3", "8"], ["c/4", "8"], ["d/4", "q"], ["e/4", "8"], ["g/4", "8"], ["f/4", "q"]], "h": [["E♭", 0, 2, 0], ["E♭", 1, 2, 0], ["D7/F♯", 2, 4, 0]]}, {"d": [["f#/4", "q~"], ["f#/4", "8"], ["a/4", "8"], ["g/4", "h"]], "h": [["D7/F♯", 0, 2, 1], ["Gm", 1, 4, 0], ["A7", 3, 2, 0]]}, {"d": [["ab/4", "q~"], ["ab/4", "8"], ["bb/4", "8"], ["a/4", "h"]], "h": [["Dm/A", 0, 2, 0], ["D7", 1, 4, 0], ["Gm", 3, 2, 0]]}, {"d": [["a/4", "q~"], ["a/4", "qd"], ["g/4", "8"], ["a/4", "8"], ["c/5", "8~"]], "h": [["Gm", 0, 2, 1], ["E7", 1, 4, 0], ["A", 3, 2, 0]]}, {"d": [["c/5", "8"], ["bb/4", "8~"], ["bb/4", "h"], ["a/4", "q"]], "h": [["F", 0, 2, 0], ["F7", 1, 4, 0], ["Dm/F", 3, 2, 0]]}, {"d": [["g/4", "q"], ["f/4", "8"], ["e/4", "8"], ["d/4", "h"]], "h": [["Dm/F", 0, 2, 1], ["F", 1, 2, 0], ["B♭m", 2, 2, 0], ["B♭/A", 3, 2, 0]]}, {"d": [["a/4", "hd"], ["g/4", "q"]], "h": [["B♭/F", 0, 2, 0], ["B♭/D", 1, 2, 0], ["D7", 2, 2, 0], ["Gm", 3, 2, 0]]}, {"d": [["f/4", "q"], ["e/4", "8"], ["f/4", "8"], ["d/4", "q"], ["g/4", "q"]], "h": [["A7", 0, 2, 0], ["Dm", 1, 2, 0], ["Dm7", 2, 2, 0], ["F", 3, 2, 0]]}, {"d": [["f/4", "q"], ["e/4", "q"], ["d/4", "q"], ["f/4", "q~"]], "h": [["F", 0, 2, 1], ["D7/F♯", 1, 2, 0], ["Gm", 2, 2, 0], ["B♭7", 3, 2, 0]]}, {"d": [["f/4", "q"], ["e/4", "h"], ["eb/4", "q~"]], "h": [["B♭7", 0, 2, 1], ["A7", 1, 2, 0], ["Eø", 2, 2, 0], ["Fm7", 3, 2, 0]]}, {"d": [["eb/4", "q"], ["d/4", "q"]], "h": [["Dm/F", 0, 2, 0], ["A7", 1, 2, 0]], "compas": "2/4"}, {"d": [["d/4", "hd"], ["c#/4", "q"]], "h": [["Dm/A", 0, 2, 0], ["B♭7", 1, 2, 0], ["Dm/A", 2, 2, 0], ["A7", 3, 2, 0]], "compas": "C"}, {"d": [["d/4", "h"], ["hr", "hr"]], "h": [["Dm", 0, 8, 0]]}],
    anclas:[[2.0, 4.99], [4.0, 5.523], [6.0, 6.049], [8.0, 6.575], [10.0, 7.106], [12.0, 7.634], [14.0, 8.16], [16.0, 8.692], [18.0, 9.221], [20.0, 9.762], [22.0, 10.29], [24.0, 10.83], [26.0, 11.375], [28.0, 11.893], [30.0, 12.414], [32.0, 12.97], [34.0, 13.507], [36.0, 14.048], [38.0, 14.575], [40.0, 15.093], [42.0, 15.643], [44.0, 16.182], [46.0, 16.723], [48.0, 17.279], [50.0, 17.87], [52.0, 18.403], [54.0, 18.938], [56.0, 19.589], [58.0, 20.171], [60.0, 20.721], [62.0, 21.262], [64.0, 21.777], [66.0, 22.313], [68.0, 22.875], [70.0, 23.447], [72.0, 24.023], [74.0, 24.597], [76.0, 25.17], [78.0, 25.745], [80.0, 26.287], [82.0, 26.802], [84.0, 27.384], [86.0, 27.932], [88.0, 28.476], [90.0, 29.021], [92.0, 29.562], [94.0, 30.091], [96.0, 30.637], [98.0, 31.16], [100.0, 31.684], [102.0, 32.226], [104.0, 32.791], [106.0, 33.334], [108.0, 33.889], [110.0, 34.423], [112.0, 34.943], [114.0, 35.447], [116.0, 36.041], [118.0, 36.943], [120.0, 37.762], [122.0, 38.173], [124.0, 38.513], [126.0, 39.145], [128.0, 39.797], [130.0, 40.412], [132.0, 41.135], [134.0, 41.802], [136.0, 42.323], [138.0, 42.866], [140.0, 43.407], [142.0, 43.955], [144.0, 44.504], [146.0, 45.052], [148.0, 45.6], [150.0, 46.138], [152.0, 46.661], [154.0, 47.198], [156.0, 47.713], [158.0, 48.234], [160.0, 48.783], [162.0, 49.348], [164.0, 49.852], [166.0, 50.353], [168.0, 50.923], [170.0, 51.499], [172.0, 52.018], [174.0, 52.529], [176.0, 53.067], [178.0, 53.614], [180.0, 54.168], [182.0, 54.709], [184.0, 55.245], [186.0, 55.795], [188.0, 56.374], [190.0, 56.952], [192.0, 57.531], [194.0, 58.109], [196.0, 58.688]]
  };
  /* ---- Rachmaninov: armonía completa pulso a pulso (detectada del audio restando la melodía y revisada a mano) ----
     [compás, [[pulso (0-3), cifrado], ...]]  · B♭7 = sexta aumentada alemana (B♭-D-F-G♯) que resuelve en la dominante */
  var LET = 'cdefgab', SEMI = {c:0,d:2,e:4,f:5,g:7,a:9,b:11};
  var CAL = {'':[[2,4],[4,7]], m:[[2,3],[4,7]], '7':[[2,4],[4,7],[6,10]], m7:[[2,3],[4,7],[6,10]], '°7':[[2,3],[4,6],[6,9]], 'ø':[[2,3],[4,6],[6,10]], m6:[[2,3],[4,7],[5,9]]};
  function nota(nombre){ var l = nombre[0].toLowerCase(), a = nombre.slice(1).replace('♭','b').replace('♯','#'); return {l:l, a:a, pc:(SEMI[l] + (a === '#' ? 1 : a === 'b' ? -1 : 0) + 12) % 12}; }
  function intervalo(r, pasos, semis){ var l = LET[(LET.indexOf(r.l) + pasos) % 7], pc = (r.pc + semis) % 12, d = ((pc - SEMI[l]) + 18) % 12 - 6; return {l:l, a: d === 1 ? '#' : d === -1 ? 'b' : d === 2 ? '##' : d === -2 ? 'bb' : '', pc:pc}; }
  function clave(n, oct){ return n.l + n.a + '/' + oct; }
  function midi(n, oct){ return 12*(oct + 1) + SEMI[n.l] + (n.a === '#' ? 1 : n.a === 'b' ? -1 : n.a === '##' ? 2 : n.a === 'bb' ? -2 : 0); }
  function acordeI(cif){                       /* mano izquierda: bajo (mi2-re3) + acorde cerrado entre do3 y do4 */
    var partes = cif.split('/'), m = /^([A-G][♭♯]?)(.*)$/.exec(partes[0]), r = nota(m[1]), q = m[2] in CAL ? m[2] : '';
    var tonos = [r].concat(CAL[q].map(function(x){ return intervalo(r, x[0], x[1]); }));
    var bajo = partes[1] ? nota(partes[1]) : r;
    var bo = 2; while(midi(bajo, bo) < 40) bo++; while(midi(bajo, bo) > 51) bo--;
    var keys = [{k:clave(bajo, bo), m:midi(bajo, bo)}];
    tonos.forEach(function(t){ if(t.pc === bajo.pc && tonos.length > 3) return; var o = 3; while(midi(t, o) <= keys[0].m) o++; if(midi(t, o) > 60) o--; if(midi(t, o) <= keys[0].m) o++; keys.push({k:clave(t, o), m:midi(t, o)}); });
    keys.sort(function(a, b){ return a.m - b.m; });
    var vistos = {}; return keys.filter(function(x){ if(vistos[x.m]) return false; vistos[x.m] = 1; return true; }).map(function(x){ return x.k; });
  }
  var DUR = {2:'q', 4:'h', 6:'hd', 8:'w'};
  /* cifrado SIMPLIFICADO (Iago 31-oct: «es una locura la de cosas que hay»): un acorde por medio compás como mucho,
     sin bajos invertidos; no se repite el que ya venía sonando */
  var previo = '';
  RACH.compases.forEach(function(c){
    var largo = c.compas === '2/4' ? 2 : 4, nuevo = [];
    for(var b = 0; b < largo; b += 2){
      var act = null; c.h.forEach(function(x){ if(x[1] <= b) act = x; });
      if(!act) continue;
      var nom = act[0].split('/')[0], u = nuevo[nuevo.length-1];
      if(u && u[0] === nom){ u[2] += 4; continue; }
      nuevo.push([nom, b, 4, nom === previo ? 1 : 0]); previo = nom;
    }
    /* cadencia: si el último pulso es A7 y el compás siguiente empieza en Dm, se conserva (es la llegada a casa) */
    var sig = RACH.compases[RACH.compases.indexOf(c) + 1], ult = c.h[c.h.length-1];
    if(sig && ult && ult[0] === 'A7' && ult[1] === largo - 1 && /^Dm/.test(sig.h[0][0]) && nuevo[nuevo.length-1][0] !== 'A7'){
      var z = nuevo[nuevo.length-1]; z[2] = (largo - 1 - z[1])*2; nuevo.push(['A7', largo - 1, 2, 0]); previo = 'A7';
    }
    c.h = nuevo;
  });
  RACH.compases.forEach(function(c){
    /* une acordes iguales seguidos dentro del compás (si la suma es una figura simple) */
    var h = [];
    c.h.forEach(function(x){ var u = h[h.length-1]; if(u && u[0] === x[0] && DUR[u[2] + x[2]]) u[2] += x[2]; else h.push(x.slice()); });
    c.h = h;
    c.i = c.h.map(function(x){ return [acordeI(x[0]), DUR[x[2]]]; });
    c.cif = c.h.map(function(x){ return {b:x[1], s: x[3] ? '' : x[0]}; });
  });
  window.S1Datos = {MOZART:MOZART, RACH:RACH};
})();
