# Sueña Calma

Web ligera de meditación y sueño hecha con HTML, CSS y JavaScript puro. No necesita cuentas, APIs ni servicios pagos.

## Incluye

- Meditaciones y relatos leídos por la voz disponible en el navegador (Speech Synthesis).
- Ejercicios de respiración con indicaciones por texto.
- Sonidos ambientales generados en el dispositivo con Web Audio API.
- Reproducción de MP3 desde el repositorio o desde el dispositivo.
- Filtros, favoritos guardados en el navegador, temporizador y apagado gradual.
- PWA básica con caché offline para la interfaz.

## Publicar en GitHub Pages

1. Creá un repositorio nuevo en GitHub.
2. Subí `index.html`, `styles.css`, `app.js`, `sw.js`, `manifest.webmanifest`, `icon.svg`, `README.md` y la carpeta `audio`.
3. En el repositorio, abrí **Settings → Pages**.
4. En **Build and deployment**, seleccioná **Deploy from a branch**.
5. Elegí la rama `main` y la carpeta `/ (root)`, y guardá.
6. Esperá a que GitHub Pages publique el sitio y abrí la URL que te indique.

Para que el modo offline funcione, abrí el sitio publicado al menos una vez mientras tengas conexión. Los service workers requieren HTTPS o localhost. En iPhone, abrí el sitio en Safari y usá **Compartir → Añadir a pantalla de inicio** si querés tenerlo como acceso directo tipo app.

## Agregar audios propios

1. Subí MP3 livianos a la carpeta `audio/`.
2. En `app.js`, buscá `const customTracks = [` y agregá objetos como este:

```js
{
  id: "audio-lluvia",
  title: "Lluvia suave",
  category: "sonido",
  type: "audio",
  src: "./audio/lluvia.mp3",
  icon: "☂",
  art: "blue",
  duration: "10 min",
  description: "Lluvia suave para descansar."
}
```

Categorías admitidas: `meditacion`, `relato`, `respiracion`, `sonido`, `musica`.

Los archivos subidos desde el selector local solo se reproducen en ese dispositivo y no se envían a internet. Los favoritos se guardan localmente en el navegador.

## Notas importantes

- La voz automática depende de las voces y capacidades del navegador/dispositivo. La disponibilidad de voces puede variar y algunas voces pueden necesitar conexión. Para una experiencia de voz totalmente predecible, agregá MP3 propios.
- Los sonidos ambientales son síntesis sencilla generada en el dispositivo, no grabaciones reales.
- La caché offline guarda los archivos de la interfaz y los recursos del mismo origen que se soliciten. Para asegurar que un MP3 esté disponible sin conexión, visitá su ruta al menos una vez online o implementá una lista de precaché de los MP3 seleccionados.
- Los navegadores pueden limitar audio en segundo plano, especialmente en móviles. El temporizador funciona mientras el navegador mantiene activa la página.
- Esta web es una ayuda de relajación, no un tratamiento médico ni una garantía de sueño.
