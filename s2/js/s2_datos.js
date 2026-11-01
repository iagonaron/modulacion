/* Modulación · Sesión 2 · los tres ejemplos de los apuntes de 2.º GP (págs. 35-37).
   Acordes en bloque como en el libro: t = clave de sol, b = clave de fa (VexFlow: 'ab/4', 'f#/4', 'e#/3').
   La cromática y la enarmónica copian las voces exactas del libro; la diatónica (que el libro da en casillas) va en posición cerrada. */
window.S2_EJ = {
  diatonica: {
    titulo: 'Do mayor → Sol mayor', A: 'Do M', B: 'Sol M', armA: '0', armB: '1♯',
    acordes: [
      {t:['c/4','e/4','g/4'],  b:['c/3'], cif:'C',   g:'I',      r:'A'},
      {t:['c/4','f/4','a/4'],  b:['f/3'], cif:'F',   g:'IV',     r:'A'},
      {t:['b/3','d/4','f/4'],  b:['g/2'], cif:'G7',  g:'V7',     r:'A'},
      {t:['c/4','e/4','g/4'],  b:['c/3'], cif:'C',   g:'I',      r:'A'},
      {t:['b/3','e/4','g/4'],  b:['e/3'], cif:'E-',  g:'III/VI', r:'P'},
      {t:['a/3','c/4','f#/4'], b:['d/3'], cif:'D7',  g:'V7',     r:'B'},
      {t:['b/3','d/4','g/4'],  b:['g/2'], cif:'G',   g:'I',      r:'B'}
    ],
    puente: 4,
    cine: [2.5, 5.0, 7.5, 10.0, 13.75, 16.25, 17.5],   /* (1-nov 21:13, Iago) clip 1 = entrada + 3 acordes; clip 2 = casilla 4 en adelante */   /* segundo del vídeo en que SUENA cada acorde y se enciende su casilla (la música se adapta al vídeo, que va a velocidad constante) */
    /* pasos del libro: qué casillas se ven en cada uno */
    pasos: [
      {vis:[1,0,0,0,0,0,1], tit:'Paso 0 · Las armaduras', txt:'Do mayor no tiene alteraciones. Sol mayor tiene un sostenido, fa♯.'},
      {vis:[1,1,1,1,0,0,1], tit:'Paso 1 · Asentar la tonalidad A', txt:'Una cadencia básica en Do mayor: I · IV · V7 · I.'},
      {pu:1, vis:[1,1,1,1,1,0,1], tit:'Paso 2 · El acorde común', txt:'Evita el fa (natural en Do, sostenido en Sol). Mi menor está en las dos: III de Do y VI de Sol. Es el puente.'},
      {pu:1, vis:[1,1,1,1,1,1,1], tit:'Paso 3 · Asentar la tonalidad B', txt:'Solo queda una casilla: la dominante de Sol, D7 → G. La dominante siempre es mayor y con séptima.'}
    ]
  },
  cromatica: {
    titulo: 'Do mayor → Mi♭ mayor', A: 'Do M', B: 'Mi♭ M',
    acordes: [
      {t:['c/4','e/4','g/4'],   b:['c/3'],  cif:'C',     g:'I',  r:'A'},
      {t:['c/4','f/4','a/4'],   b:['f/3'],  cif:'F',     g:'IV', r:'A'},
      {t:['c/4','f/4','ab/4'],  b:['f/3'],  cif:'F-',    g:'II', r:'P'},
      {t:['bb/3','f/4','bb/4'], b:['d/3'],  cif:'B♭/D',  g:'V',  r:'B'},
      {t:['bb/3','eb/4','g/4'], b:['eb/3'], cif:'E♭',    g:'I',  r:'B'},
      {t:['c/4','eb/4','ab/4'], b:['ab/2'], cif:'A♭',    g:'IV', r:'B'},
      {t:['ab/3','d/4','f/4'],  b:['bb/2'], cif:'B♭7',   g:'V7', r:'B'},
      {t:['g/3','bb/3','eb/4'], b:['eb/2'], cif:'E♭',    g:'I',  r:'B'}
    ],
    puente: 2,
    cine: [5.12, 7.68, 10.24, 12.8, 14.08, 15.36, 16.64, 17.92],   /* tras el salto, medio compás por acorde */
    marcas: [{i:2, txt:'la → la♭ · el desnivel'}],
    pasos: [
      {hasta:1, tit:'Estás en Do mayor', txt:'I y IV: C y F.'},
      {hasta:2, tit:'El desnivel cromático', txt:'Al Fa mayor le bajas el la a la♭: se convierte en Fa menor.'},
      {pu:1, hasta:2, tit:'El acorde puente', txt:'Fa menor no existe en Do mayor, pero es el II de Mi♭ mayor. Por ahí cruzas.'},
      {pu:1, hasta:7, tit:'Ya en Mi♭ mayor', txt:'La asientas: V · I · IV · V7 · I.'}
    ]
  },
  enarmonica: {
    titulo: 'Do mayor → Fa♯ mayor', A: 'Do M', B: 'Fa♯ M',
    acordes: [
      {t:['e/4','g/4'],   b:['c/3','c/4'],  cif:'C',    g:'I',   r:'A'},
      {t:['f/4','a/4'],   b:['f/3','c/4'],  cif:'F',    g:'IV',  r:'A'},
      {t:['f/4','g/4'],   b:['g/3','b/3'],  cif:'G7',   g:'V7',  r:'A'},
      {t:['e/4','g/4'],   b:['c/3','c/4'],  cif:'C',    g:'I',   r:'A'},
      {t:['d/4','ab/4'],  b:['f/3','b/3'],  cif:'B°7',  g:'VII', r:'A'},
      {t:['d/4','g#/4'],  b:['e#/3','b/3'], cif:'E♯°7', g:'VII', r:'B'},
      {t:['c#/4','g#/4'], b:['e#/3','b/3'], cif:'C♯7',  g:'V7',  r:'B'},
      {t:['c#/4','f#/4'], b:['f#/3','a#/3'],cif:'F♯',   g:'I',   r:'B'}
    ],
    puente: 5, igual: [4, 5],
    cine: [0.44, 2.84, 5.24, 7.64, 10.04, 13.24, 15.64, 18.04],
    marcas: [{i:5, txt:'la♭ = sol♯ · fa = mi♯'}],
    pasos: [
      {hasta:3, tit:'Estás en Do mayor', txt:'Cadencia: I · IV · V7 · I.'},
      {hasta:4, tit:'Si° con séptima', txt:'Si, re, fa, la♭: el VII de Do mayor.'},
      {pu:1, hasta:5, tit:'El portal: reescribe dos notas', txt:'La♭ pasa a ser sol♯ y fa pasa a ser mi♯. Suena exactamente igual, pero ahora es Mi♯°7, el VII de Fa♯ mayor.'},
      {pu:1, hasta:7, tit:'Al otro extremo del mapa', txt:'C♯7 → F♯. Fa♯ mayor es la tonalidad más lejana posible de Do mayor.'}
    ]
  }
};
