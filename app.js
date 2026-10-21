(() => {
  "use strict";

  const $ = (selector) => document.querySelector(selector);
  const audio = $("#audioPlayer");
  const grid = $("#contentGrid");
  const playPause = $("#playPause");
  const timerSelect = $("#timerSelect");
  const fadeSelect = $("#fadeSelect");
  const timerStatus = $("#timerStatus");
  const nowTitle = $("#nowTitle");
  const nowSubtitle = $("#nowSubtitle");
  const elapsed = $("#elapsed");
  const remaining = $("#remaining");
  const progress = $("#progress");
  const favoritesToggle = $("#favoritesToggle");

  const tracks = [
    {id:"med-1", title:"Soltar el día", category:"meditacion", type:"speech", icon:"☾", art:"", duration:"5 min", description:"Una pausa guiada para dejar atrás las tensiones.", text:"Buscá una posición cómoda. Dejá que tus hombros bajen un poco. No necesitás resolver nada en este instante. Sentí el apoyo de tu cuerpo. Inhalá suavemente por la nariz y exhalá sin apuro. Con cada exhalación, permití que el día quede un poco más lejos. Si aparece un pensamiento, no hace falta luchar con él. Reconocelo y volvé, con amabilidad, a tu respiración. Aflojá la frente, la mandíbula y las manos. Por estos minutos, alcanza con estar acá. Respirás. Descansás. No hay nada más que demostrar."},
    {id:"med-2", title:"Un lugar tranquilo", category:"meditacion", type:"speech", icon:"✧", art:"rose", duration:"4 min", description:"Imaginá un refugio sereno y seguro.", text:"Cerrá los ojos si te resulta cómodo. Imaginá un lugar en el que puedas sentirte en calma. Tal vez sea una playa tranquila, un claro del bosque o una habitación tibia. No necesitás verlo con claridad. Notá la temperatura del aire y el apoyo bajo tu cuerpo. Cada respiración te invita a estar un poco más presente. Si la mente se aleja, está bien. Volvé a ese lugar a tu manera. Permitite descansar sin exigirte dormir. El descanso también empieza cuando dejás de perseguirlo."},
    {id:"rel-1", title:"La casa junto al mar", category:"relato", type:"speech", icon:"⌂", art:"blue", duration:"4 min", description:"Un relato breve para bajar el ritmo.", text:"Al final de un camino de arena había una casa pequeña, con ventanas azules y una galería de madera. Cada tarde, cuando el sol empezaba a bajar, Clara dejaba una taza de té junto a la ventana y escuchaba el mar. No esperaba nada especial. Le gustaba el sonido regular de las olas y la forma en que la luz cambiaba sobre las paredes. Una noche encontró una concha sobre el escalón, lisa y blanca. La guardó en un cuenco y sonrió. Desde entonces, cada vez que el día parecía demasiado largo, se sentaba un rato en la galería. El mar nunca le pedía explicaciones. Llegaba, se retiraba y volvía a llegar. Y poco a poco, Clara aprendió a dejar que sus pensamientos hicieran lo mismo."},
    {id:"rel-2", title:"El farol de las luciérnagas", category:"relato", type:"speech", icon:"✦", art:"gold", duration:"3 min", description:"Una pequeña historia nocturna y luminosa.", text:"En un jardín escondido había un sendero que solo se veía de noche. No porque estuviera oscuro, sino porque las luciérnagas encendían pequeñas luces entre las plantas. Tomás caminaba despacio por allí cuando necesitaba ordenar sus ideas. Nunca intentaba atrapar una luz. Solo observaba cómo aparecía y desaparecía entre las hojas. Una noche se sentó bajo un árbol y descubrió que el jardín seguía siendo hermoso incluso cuando algunas luces se apagaban. Se quedó quieto, escuchando el viento en las ramas. Por primera vez en mucho tiempo, no buscó una respuesta. Dejó que la noche fuera simplemente noche."},
    {id:"breath-1", title:"Respiración pausada", category:"respiracion", type:"breath", icon:"◌", art:"mint", duration:"3 min", description:"Seguí el ritmo visual: inhalá y exhalá suavemente.", pattern:[4,6], text:"Inhalá suave. Exhalá lentamente."},
    {id:"breath-2", title:"Volver al presente", category:"respiracion", type:"breath", icon:"◎", art:"blue", duration:"2 min", description:"Un ejercicio corto para anclarte en el momento.", pattern:[3,4], text:"Tomá aire con suavidad y soltalo lentamente."},
    {id:"sound-rain", title:"Lluvia sobre el techo", category:"sonido", type:"ambient", sound:"rain", icon:"☂", art:"blue", duration:"∞", description:"Ruido suave y constante para acompañar el descanso."},
    {id:"sound-ocean", title:"Olas tranquilas", category:"sonido", type:"ambient", sound:"ocean", icon:"≈", art:"mint", duration:"∞", description:"Un vaivén lento inspirado en el mar."},
    {id:"sound-forest", title:"Noche en el bosque", category:"sonido", type:"ambient", sound:"forest", icon:"♧", art:"mint", duration:"∞", description:"Un ambiente natural suave, creado en tu dispositivo."},
    {id:"music-1", title:"Tono de descanso", category:"musica", type:"ambient", sound:"tone", icon:"♫", art:"rose", duration:"∞", description:"Un tono ambiental continuo y discreto."}
  ];

  // Agregá aquí los MP3 que quieras incluir en el repositorio.
  const customTracks = [
    // { id: "audio-1", title: "Mi meditación", category: "meditacion", type: "audio", src: "./audio/mi-meditacion.mp3", icon: "♫", duration: "8 min", description: "Una descripción breve." }
  ];
  const allTracks = [...tracks, ...customTracks];

  let currentTrack = null;
  let activeFilter = "todo";
  let showFavoritesOnly = false;
  let timerEnd = null;
  let timerInterval = null;
  let fadeStart = null;
  let fadeInterval = null;
  let speechActive = false;
  let speechPaused = false;
  let breathTimeout = null;
  let audioContext = null;
  let sourceNode = null;
  let gainNode = null;
  let ambientNodes = [];
  let noiseBuffer = null;
  let startedAt = 0;
  let accumulated = 0;
  let lastFadeValue = 1;
  let selectedFileUrl = null;

  const favorites = new Set(readFavorites());

  function readFavorites() {
    try { return JSON.parse(localStorage.getItem("suenacalma-favorites") || "[]"); }
    catch (_) { return []; }
  }
  function saveFavorites() {
    try { localStorage.setItem("suenacalma-favorites", JSON.stringify([...favorites])); } catch (_) {}
  }
  function formatTime(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) return "00:00";
    const n = Math.floor(seconds);
    return `${String(Math.floor(n / 60)).padStart(2, "0")}:${String(n % 60).padStart(2, "0")}`;
  }
  function categoryName(category) {
    return ({meditacion:"Meditación", relato:"Relato", respiracion:"Respiración", sonido:"Naturaleza", musica:"Música"})[category] || "Audio";
  }
  function render() {
    const visible = allTracks.filter(t =>
      (activeFilter === "todo" || t.category === activeFilter) &&
      (!showFavoritesOnly || favorites.has(t.id))
    );
    grid.innerHTML = "";
    if (!visible.length) {
      const empty = document.createElement("div");
      empty.className = "empty-state";
      empty.textContent = showFavoritesOnly ? "Todavía no guardaste favoritos. Tocá el corazón de una tarjeta para tenerla a mano." : "No hay contenido en esta categoría todavía.";
      grid.appendChild(empty);
      return;
    }
    visible.forEach(track => {
      const card = document.createElement("article");
      card.className = "track-card";
      const top = document.createElement("div"); top.className = "track-top";
      const art = document.createElement("div"); art.className = `track-art ${track.art || ""}`; art.textContent = track.icon || "♫"; art.setAttribute("aria-hidden","true");
      const fav = document.createElement("button"); fav.className = `favorite-btn ${favorites.has(track.id) ? "is-favorite" : ""}`; fav.type = "button"; fav.textContent = favorites.has(track.id) ? "♥" : "♡"; fav.setAttribute("aria-label", favorites.has(track.id) ? "Quitar de favoritos" : "Agregar a favoritos"); fav.setAttribute("aria-pressed", String(favorites.has(track.id)));
      fav.addEventListener("click", () => { favorites.has(track.id) ? favorites.delete(track.id) : favorites.add(track.id); saveFavorites(); render(); });
      top.append(art, fav);
      const title = document.createElement("h3"); title.textContent = track.title;
      const desc = document.createElement("p"); desc.textContent = track.description || "Un momento para vos.";
      const bottom = document.createElement("div"); bottom.className = "track-bottom";
      const kind = document.createElement("span"); kind.className = "track-kind"; kind.textContent = `${categoryName(track.category)} · ${track.duration || "Audio"}`;
      const play = document.createElement("button"); play.className = "mini-play"; play.type = "button"; play.textContent = currentTrack?.id === track.id && isPlaying() ? "Ⅱ" : "▶"; play.setAttribute("aria-label", `Reproducir ${track.title}`); play.addEventListener("click", () => selectTrack(track));
      bottom.append(kind, play); card.append(top, title, desc, bottom); grid.appendChild(card);
    });
  }
  function isPlaying() { return speechActive || (currentTrack && (currentTrack.type === "ambient" ? ambientNodes.length > 0 : !audio.paused)); }

  function stopSpeech() {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    speechActive = false; speechPaused = false;
  }
  function stopAmbient() {
    ambientNodes.forEach(node => { try { node.stop(); } catch (_) {} try { node.disconnect(); } catch (_) {} });
    ambientNodes = [];
    if (gainNode) { try { gainNode.disconnect(); } catch (_) {} gainNode = null; }
    sourceNode = null;
  }
  function stopBreathing() { if (breathTimeout) clearTimeout(breathTimeout); breathTimeout = null; }
  function stopCurrentMedia() {
    stopSpeech(); stopAmbient(); stopBreathing();
    audio.pause(); audio.removeAttribute("src"); audio.load();
    if (selectedFileUrl) { URL.revokeObjectURL(selectedFileUrl); selectedFileUrl = null; }
    accumulated = 0; startedAt = 0; lastFadeValue = 1;
    clearInterval(fadeInterval); fadeInterval = null; fadeStart = null;
    progress.style.width = "0%"; elapsed.textContent = "00:00"; remaining.textContent = "∞";
    playPause.textContent = "▶"; playPause.setAttribute("aria-label","Reproducir");
  }
  function updateNow(track, subtitle) {
    nowTitle.textContent = track.title;
    nowSubtitle.textContent = subtitle || `${categoryName(track.category)} · ${track.duration || "A tu ritmo"}`;
  }
  async function ensureAudioContext() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) throw new Error("Este navegador no permite generar sonido ambiental. Probá con un archivo MP3.");
    if (!audioContext) audioContext = new AC();
    if (audioContext.state === "suspended") await audioContext.resume();
  }
  function makeNoiseBuffer() {
    if (noiseBuffer || !audioContext) return noiseBuffer;
    const length = audioContext.sampleRate * 3;
    noiseBuffer = audioContext.createBuffer(1, length, audioContext.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * 0.65;
    return noiseBuffer;
  }
  async function startAmbient(sound) {
    await ensureAudioContext();
    stopAmbient();
    const ctx = audioContext;
    gainNode = ctx.createGain(); gainNode.gain.value = 0.22; gainNode.connect(ctx.destination);
    if (sound === "tone") {
      const osc = ctx.createOscillator(); const low = ctx.createOscillator();
      osc.type = "sine"; osc.frequency.value = 174.61;
      low.type = "sine"; low.frequency.value = 130.81;
      const g1 = ctx.createGain(); const g2 = ctx.createGain(); g1.gain.value = .12; g2.gain.value = .07;
      osc.connect(g1); low.connect(g2); g1.connect(gainNode); g2.connect(gainNode);
      osc.start(); low.start(); ambientNodes = [osc, low, g1, g2]; return;
    }
    const noise = ctx.createBufferSource(); noise.buffer = makeNoiseBuffer(); noise.loop = true;
    const filter = ctx.createBiquadFilter();
    const out = ctx.createGain();
    if (sound === "rain") { filter.type = "lowpass"; filter.frequency.value = 1700; out.gain.value = .55; }
    else if (sound === "ocean") { filter.type = "lowpass"; filter.frequency.value = 650; out.gain.value = .9; }
    else { filter.type = "bandpass"; filter.frequency.value = 1200; filter.Q.value = .7; out.gain.value = .16; }
    noise.connect(filter); filter.connect(out); out.connect(gainNode); noise.start();
    ambientNodes = [noise, filter, out];
    if (sound === "ocean") {
      const lfo = ctx.createOscillator(); const lfoGain = ctx.createGain();
      lfo.frequency.value = .09; lfoGain.gain.value = .35; lfo.connect(lfoGain); lfoGain.connect(out.gain); lfo.start();
      ambientNodes.push(lfo, lfoGain);
    }
  }
  function speakText(track) {
    if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
      nowSubtitle.textContent = "Tu navegador no admite voz automática. Podés usar un MP3 propio.";
      playPause.textContent = "▶"; return;
    }
    const utterance = new SpeechSynthesisUtterance(track.text || "");
    utterance.lang = "es-AR"; utterance.rate = .83; utterance.pitch = .9; utterance.volume = 1;
    const voices = window.speechSynthesis.getVoices();
    const spanishVoice = voices.find(v => /^es(-|_)/i.test(v.lang) && /Argentina|Spanish|español/i.test(v.name)) || voices.find(v => /^es(-|_)/i.test(v.lang));
    if (spanishVoice) utterance.voice = spanishVoice;
    utterance.onstart = () => { speechActive = true; speechPaused = false; playPause.textContent = "Ⅱ"; };
    utterance.onend = () => { speechActive = false; speechPaused = false; playPause.textContent = "▶"; accumulated = 0; startedAt = 0; };
    utterance.onerror = () => { speechActive = false; playPause.textContent = "▶"; };
    window.speechSynthesis.speak(utterance);
    speechActive = true; startedAt = Date.now();
    playPause.textContent = "Ⅱ";
  }
  function startBreathing(track) {
    const [inhale, exhale] = track.pattern || [4,6];
    let cycle = 0;
    const status = $("#timerStatus");
    const tick = () => {
      if (!currentTrack || currentTrack.id !== track.id) return;
      const isInhale = cycle % 2 === 0;
      const duration = isInhale ? inhale : exhale;
      nowSubtitle.textContent = isInhale ? `Inhalá suavemente · ${duration} segundos` : `Exhalá despacio · ${duration} segundos`;
      status.textContent = isInhale ? "Tomá aire sin forzarlo." : "Soltá el aire lentamente.";
      cycle++;
      breathTimeout = setTimeout(tick, duration * 1000);
    };
    tick(); startedAt = Date.now(); playPause.textContent = "Ⅱ";
  }
  async function selectTrack(track) {
    stopCurrentMedia();
    currentTrack = track;
    updateNow(track);
    if (track.type === "speech") speakText(track);
    else if (track.type === "breath") startBreathing(track);
    else if (track.type === "ambient") {
      try { await startAmbient(track.sound); playPause.textContent = "Ⅱ"; }
      catch (error) { nowSubtitle.textContent = error.message; playPause.textContent = "▶"; }
    } else if (track.type === "audio") {
      audio.src = track.src; audio.volume = 1; audio.play().then(() => { playPause.textContent = "Ⅱ"; }).catch(() => { nowSubtitle.textContent = "Tocá reproducir para iniciar el audio."; playPause.textContent = "▶"; });
    }
    render();
  }
  function pauseCurrent() {
    if (!currentTrack) return;
    if (currentTrack.type === "speech") {
      if (!("speechSynthesis" in window)) return;
      if (speechPaused) { window.speechSynthesis.resume(); speechPaused = false; speechActive = true; playPause.textContent = "Ⅱ"; }
      else { window.speechSynthesis.pause(); speechPaused = true; speechActive = false; playPause.textContent = "▶"; }
    } else if (currentTrack.type === "ambient") {
      if (ambientNodes.length) { stopAmbient(); playPause.textContent = "▶"; }
      else { startAmbient(currentTrack.sound).then(() => playPause.textContent = "Ⅱ").catch(() => {}); }
    } else if (currentTrack.type === "breath") {
      if (breathTimeout) { clearTimeout(breathTimeout); breathTimeout = null; playPause.textContent = "▶"; nowSubtitle.textContent = "Pausa. Cuando quieras, retomá."; }
      else { startBreathing(currentTrack); }
    } else {
      if (audio.paused) audio.play().then(() => playPause.textContent = "Ⅱ").catch(() => {});
      else { audio.pause(); playPause.textContent = "▶"; }
    }
    render();
  }
  function stopTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = null; timerEnd = null; fadeStart = null;
    if (fadeInterval) clearInterval(fadeInterval);
    fadeInterval = null;
    if (gainNode && audioContext) gainNode.gain.setTargetAtTime(.22, audioContext.currentTime, .1);
    audio.volume = 1;
    timerStatus.textContent = "El temporizador está desactivado.";
  }
  function startTimer(minutes) {
    stopTimer();
    if (!minutes) return;
    timerEnd = Date.now() + minutes * 60 * 1000;
    const fadeSeconds = Number(fadeSelect.value);
    fadeStart = fadeSeconds ? timerEnd - fadeSeconds * 1000 : null;
    timerStatus.textContent = `El audio se detendrá en ${minutes} minutos.`;
    timerInterval = setInterval(() => {
      const now = Date.now(); const left = Math.max(0, timerEnd - now);
      timerStatus.textContent = `Tiempo restante: ${Math.ceil(left / 60000)} min${fadeStart && now >= fadeStart ? " · bajando el volumen" : ""}.`;
      if (fadeStart && now >= fadeStart) {
        const factor = Math.max(0, (timerEnd - now) / Math.max(1, Number(fadeSelect.value) * 1000));
        if (audioContext && gainNode) gainNode.gain.setTargetAtTime(.22 * factor, audioContext.currentTime, .08);
        audio.volume = factor;
      }
      if (left <= 0) {
        stopTimer();
        stopCurrentMedia();
        nowSubtitle.textContent = "Que descanses. El temporizador terminó.";
        timerStatus.textContent = "El temporizador terminó. Buen descanso.";
        currentTrack = null; render();
      }
    }, 500);
  }
  playPause.addEventListener("click", () => currentTrack ? pauseCurrent() : selectTrack(tracks[0]));
  timerSelect.addEventListener("change", () => startTimer(Number(timerSelect.value)));
  fadeSelect.addEventListener("change", () => { if (timerSelect.value !== "0") startTimer(Number(timerSelect.value)); });
  favoritesToggle.addEventListener("click", () => {
    showFavoritesOnly = !showFavoritesOnly;
    favoritesToggle.setAttribute("aria-pressed", String(showFavoritesOnly));
    favoritesToggle.textContent = showFavoritesOnly ? "♥ Ver todo" : "♡ Favoritos";
    render();
  });
  $("#filters").addEventListener("click", event => {
    const button = event.target.closest("[data-filter]");
    if (!button) return;
    activeFilter = button.dataset.filter;
    $("#filters").querySelectorAll(".filter").forEach(b => b.classList.toggle("active", b === button));
    render();
  });
  $("#audioUpload").addEventListener("change", event => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("audio/")) { nowSubtitle.textContent = "Elegí un archivo de audio compatible."; return; }
    stopCurrentMedia();
    currentTrack = {id:"local-upload", title:file.name.replace(/\.[^.]+$/, ""), category:"musica", type:"local", icon:"♫", duration:"Archivo local", description:"Audio elegido desde tu dispositivo."};
    selectedFileUrl = URL.createObjectURL(file);
    audio.src = selectedFileUrl; updateNow(currentTrack, "Archivo local · no se sube a internet");
    audio.play().then(() => { playPause.textContent = "Ⅱ"; render(); }).catch(() => { nowSubtitle.textContent = "Tocá reproducir para iniciar el archivo."; });
  });
  audio.addEventListener("timeupdate", () => {
    if (!Number.isFinite(audio.duration)) return;
    elapsed.textContent = formatTime(audio.currentTime);
    remaining.textContent = `-${formatTime(audio.duration - audio.currentTime)}`;
    progress.style.width = `${Math.min(100, audio.currentTime / audio.duration * 100)}%`;
  });
  audio.addEventListener("ended", () => { playPause.textContent = "▶"; progress.style.width = "0%"; });
  audio.addEventListener("play", () => { playPause.textContent = "Ⅱ"; });
  audio.addEventListener("pause", () => { playPause.textContent = "▶"; });
  document.addEventListener("visibilitychange", () => {
    // No forzamos reproducción al volver de segundo plano. El navegador gestiona el audio.
  });

  let installPrompt = null;
  window.addEventListener("beforeinstallprompt", event => {
    event.preventDefault(); installPrompt = event; $("#installBtn").classList.remove("hidden");
  });
  $("#installBtn").addEventListener("click", async () => {
    if (!installPrompt) return;
    installPrompt.prompt(); await installPrompt.userChoice; installPrompt = null; $("#installBtn").classList.add("hidden");
  });

  render();
  if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {
      timerStatus.textContent = "La app funciona, pero el modo sin conexión no pudo activarse en este navegador.";
    }));
  }
})();