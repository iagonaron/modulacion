/* Modulación · Sesión 3 · orquesta en el navegador (C1, 1-nov-2026).
   Toca los acordes del alumno con muestras orquestales (MusyngKite, una cada 3 semitonos) y efectos de Splice.
   Usa el mismo AudioContext que Sonido (piano), para que la pausa global y el volumen sean los mismos.
   API: Orq.listo() → Promise · Orq.nota(instr, midi, t, dur, vol, ataque) · Orq.fx(nombre, t, vol) · Orq.parar() · Orq.ahora() */
(function(){
  var INS = {cu:[36,84]};   /* (Iago 1-nov) solo la cuerda tenida bajo los acordes; nada de arreglo orquestal */
  var FX = ['boom','revela','tecla','maquina','boton','ding','raton'];   /* (Iago 2-nov) raton = clic de ratón para seleccionar */
  var buf = {}, fxb = {}, vivas = [], cargando = null, bus = null;
  function ctx(){ return Sonido.ctx; }
  function salida(){
    if(bus) return bus;
    var c = ctx(); bus = c.createGain(); bus.gain.value = .85;
    /* reverberación sencilla (ruido con caída) para dar sala */
    var n = c.sampleRate*2.2, ir = c.createBuffer(2, n, c.sampleRate);
    for(var ch = 0; ch < 2; ch++){ var d = ir.getChannelData(ch); for(var i = 0; i < n; i++) d[i] = (Math.random()*2 - 1)*Math.pow(1 - i/n, 3.2); }
    var cv = c.createConvolver(); cv.buffer = ir; var wet = c.createGain(); wet.gain.value = .32;
    bus.connect(Sonido.salida); bus.connect(cv); cv.connect(wet); wet.connect(Sonido.salida);
    return bus;
  }
  function baja(url){ return fetch(url).then(function(r){ return r.arrayBuffer(); }).then(function(ab){ return new Promise(function(ok, ko){ ctx().decodeAudioData(ab, ok, ko); }); }); }
  function listo(){
    if(cargando) return cargando;
    var B = (window.MOD_S3 || '') , P = [];
    Object.keys(INS).forEach(function(k){ buf[k] = {}; for(var m = INS[k][0]; m <= INS[k][1]; m += 3) (function(m){
      P.push(baja(B + 'mus/orq/' + k + '_' + m + '.mp3').then(function(b){ buf[k][m] = b; }).catch(function(){})); })(m); });
    FX.forEach(function(f){ P.push(baja(B + 'sfx/' + f + '.mp3').then(function(b){ fxb[f] = b; }).catch(function(){})); });
    cargando = Sonido.listo().then(function(){ return Promise.all(P); });
    return cargando;
  }
  function fuente(b, rate, t, dur, vol, ataque, salidaN){
    var c = ctx(), s = c.createBufferSource(); s.buffer = b; s.playbackRate.value = rate || 1;
    var g = c.createGain(); ataque = ataque || .02;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + ataque);
    if(dur){ g.gain.setValueAtTime(vol, t + dur); g.gain.exponentialRampToValueAtTime(.0008, t + dur + .5); }
    s.connect(g); g.connect(salidaN || salida()); s.start(t); if(dur) s.stop(t + dur + .6);
    vivas.push({s:s, g:g}); s.onended = function(){ vivas = vivas.filter(function(v){ return v.s !== s; }); };
    return {s:s, g:g};
  }
  function nota(ins, midi, t, dur, vol, ataque){
    var L = buf[ins]; if(!L) return; var best = null, d = 99;
    for(var k in L){ var dd = Math.abs(k - midi); if(dd < d){ d = dd; best = +k; } }
    if(best == null) return;
    return fuente(L[best], Math.pow(2, (midi - best)/12), t, dur, vol, ataque);
  }
  function fx(nombre, t, vol, dur){ var b = fxb[nombre]; if(!b) return; return fuente(b, 1, t, dur || 0, vol == null ? .7 : vol, .002, Sonido.salida); }   /* (Iago 2-nov) teclas y efectos, en seco: sin reverberación */
  /* (Iago 2-nov) arpegiador: sinte con filtro que se cierra, en semicorcheas cosidas a la percusión del vídeo */
  function arp(midi, t, dur, vol){
    var c = ctx(), o = c.createOscillator(), o2 = c.createOscillator(), f = c.createBiquadFilter(), g = c.createGain(), hz = 440*Math.pow(2, (midi - 69)/12);
    o.type = 'sawtooth'; o2.type = 'square'; o.frequency.value = hz; o2.frequency.value = hz; o2.detune.value = 7;
    f.type = 'lowpass'; f.Q.value = 3; f.frequency.setValueAtTime(3200, t); f.frequency.exponentialRampToValueAtTime(600, t + dur);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .006); g.gain.exponentialRampToValueAtTime(.0006, t + dur);
    o.connect(f); o2.connect(f); f.connect(g); g.connect(salida()); o.start(t); o2.start(t); o.stop(t + dur + .05); o2.stop(t + dur + .05);
    vivas.push({s:o, g:g}); vivas.push({s:o2, g:g});
    o.onended = function(){ vivas = vivas.filter(function(v){ return v.s !== o && v.s !== o2; }); };
  }
  /* corta todo con un fundido corto (el puente se rompe) */
  function corta(t, f){ t = t || ctx().currentTime; vivas.forEach(function(v){ try{ v.g.gain.cancelScheduledValues(t); v.g.gain.setTargetAtTime(0, t, (f || .08)); v.s.stop(t + .6); }catch(e){} }); }
  function parar(){ vivas.forEach(function(v){ try{ v.s.stop(); }catch(e){} }); vivas = []; Sonido.parar(); }
  window.Orq = {listo:listo, nota:nota, fx:fx, arp:arp, corta:corta, parar:parar, ahora:function(){ return ctx().currentTime; }};
})();
