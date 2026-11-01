# Coordinación entre conversaciones de Claude · modulacion (portal U8)

Antes de subir nada: mira el último commit de `main`, lee esto, apunta abajo fecha, quién eres, qué vas a tocar y «EN CURSO»
(en un commit solo con este fichero); al acabar, cambia tu línea a «HECHO · commit xxxxxxx» con cómo deshacer.
El index.html de siempre (el portal antiguo) no se toca: lo nuevo va en prueba.html, s1/, s2/…

## Registro (lo más reciente arriba · hora de Galicia)
- 1-nov 16:30 · C1 · EN CURSO · S2 v10: cinemáticas a velocidad constante (la música se adapta), letrero fijo en cada vídeo, texto del desafío en el centro. Ficheros: s2/index.html, s2/js/s2_datos.js, s2/video/*.
- 1-nov 16:10 · C1 · HECHO · solo s2/index.html: música de fondo casi inaudible en las partituras (0,012) y acordes algo más fuertes. DESHACER: volver s2/index.html al commit anterior.
- 1-nov 15:45 · C1 · HECHO · S1 v47 y S2 v9, commits b82f48b → 2454b3e: controles arriba (s1/js/controles.js y s2/js/controles.js: volver, pausa, pantalla completa; cada escena cabe sin scroll),
  texto antes de cada cinemática, cinemáticas rehechas (flauta, sin cámara lenta, portal continuo; la diatónica va en un solo fichero video/diatonica.mp4 y sus .1/.2 viejos ya no se usan),
  A→B animado (s2/sfx/viaje_ab.mp3), negritas en el texto, pitido más alto, «Continuar» parpadea al acabar. DESHACER: volver esos ficheros a fcdc2b3.
- 1-nov 15:05 · C1 · HECHO · S2 v8, commits 862c692 → 618f0f8: cinemáticas nuevas (s2/video/*.mp4.1-2, música orquestal exacta, un acorde por compás
  con su casilla), s2/index.html, s2/js/s2_datos.js y s2_test.js, s2/css/s2_test.css, s2/img (C1 C2 D1-3 E1-3) y prueba.html («desnivel»).
  Antes, sin apuntar: a3b3c6e (S1 v46) y aaafe45 (S2 v7), ambos de C1. DESHACER: volver esos ficheros a aaafe45.
- 1-nov 13:45 · C1 · HECHO · S1 v45 (s1/index.html, video/wow.mp4.1-2 = wow v13: escalada a 30 fps y sin paradita en la puerta; ♯/♭ dorados;
  «Continuar» en el hueco de «Siguiente»; Mozart como fragmento) y S2 v6 (s2/index.html, js/s2_test.js; sin «pegotes»). DESHACER: volver esos ficheros al commit anterior.
- 1-nov 13:45 · C1 · HECHO · S1 v44 (s1/index.html + js/coral_datos, s1_coral_juego, coral, partitura, pentagrama) y S2 v4 (s2/index.html, js/pentagrama):
  pergamino de 8 bits con esquina enrollada (sin varillas), llave del sistema entera, acorde 32 del coral = Mi mayor (V/VI).
  DESHACER: volver esos ficheros al commit anterior a este bloque.
- 1-nov 13:25 · C1 · HECHO · solo s1/index.html (v43) y s2/index.html (v3): voz de Iago solo en los vídeos; el resto, texto en cuadros con «Continuar ▶».
  DESHACER: volver esos dos ficheros a c454c91.
- 1-nov 11:55 · C1 (coordinadora de Modulación) · HECHO, comprobado en vivo · ficheros NUEVOS: prueba.html, s1/ (sesión 1, v42), s2/ (sesión 2, v2).
  16 commits, de 933be8e a 6bdc820. En vivo: prueba.html, s1 (wow reconstruido de 2 trozos, 67,2 s) y s2 (cinemáticas) se reproducen; ?compat94=forzar sin errores.
  OJO: la subida desde Chrome añade metadatos C2PA a imágenes, audio y vídeo (los ficheros pesan algo más); se comprobó que todo se descodifica bien.
  DESHACER: borrar prueba.html, s1/ y s2/ (el index.html de siempre no se tocó), o volver a 656d89b. Copia local: Dropbox APPs/LMATHOME GP (github lmpro)/subidas de Claude/1-nov-2026-modulacion/
  Solo los ve Protester (entrada u8 en PRUEBAS de lmpro, con «?»). Los vídeos de más de 9 MB van partidos (.1, .2) y la página los junta.
