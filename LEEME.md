# GymLog (versión web)

App de registro de entrenos que se instala en la pantalla de inicio del iPhone
y funciona sin conexión. No necesita Mac, ni Xcode, ni cuenta de desarrollador,
ni caduca cada 7 días.

Los datos se guardan solo en el teléfono. Cada móvil tiene los suyos: si lo
instaláis las dos, cada una lleva su propio registro.

---

## Cómo ponerla en marcha

La app necesita estar servida por **https** para funcionar sin conexión. Abrir
el `index.html` directamente desde la app Archivos no vale. Elige una:

### Opción A — Netlify Drop (lo más rápido, sin cuenta ni consola)

1. Entra en `app.netlify.com/drop` desde el ordenador.
2. Arrastra la carpeta `gymlog-web` entera a la página.
3. Te da una dirección tipo `nombre-raro-123.netlify.app`. Esa es tu app.

Gratis e indefinido. Si te registras luego, puedes cambiarle el nombre.

### Opción B — GitHub Pages

1. Crea un repositorio en GitHub y sube el contenido de `gymlog-web`.
2. En **Settings → Pages**, en *Source* elige la rama `main` y la carpeta `/`.
3. A los dos minutos está en `tu-usuario.github.io/nombre-del-repo`.

## Cómo instalarla en el iPhone

1. Abre la dirección **en Safari** (no en Chrome: en iOS solo Safari puede
   instalar apps en la pantalla de inicio).
2. Botón de compartir, abajo en el centro.
3. **Añadir a pantalla de inicio**.

A partir de ahí se abre desde su icono, a pantalla completa, sin barra de
navegador y sin conexión.

---

## Lo importante: haz copias

Los datos viven en el almacenamiento del navegador. En una app instalada en la
pantalla de inicio eso es bastante estable, pero **no es tan intocable como un
archivo**: si borras los datos de Safari, o cambias de móvil, se van.

Por eso está **Historial → ⚙ → Exportar a un archivo**. Te descarga un `.json`
con absolutamente todo. Guárdalo en iCloud Drive o donde quieras, y de vez en
cuando repite. Para recuperarlo, *Importar* desde la misma pantalla.

Es la única cosa de esta versión que requiere algo de disciplina por tu parte.
Con la app nativa no haría falta. Compensa hacerlo una vez al mes.

---

## Qué hay en cada archivo

| Archivo | Qué contiene |
|---|---|
| `index.html` | La app entera: estilos, modelo, pantallas y lógica |
| `manifest.webmanifest` | Nombre, icono y colores para instalarla |
| `sw.js` | Hace que funcione sin conexión |
| `iconos/` | Icono de la app en tres tamaños |

Todo es JavaScript normal, sin librerías ni paso de compilación. Puedes editar
`index.html` con cualquier editor de texto y volver a subirlo.

**Si editas algo, sube el número de `VERSION` en `sw.js`.** Si no, el móvil
seguirá sirviendo la versión guardada en caché y parecerá que tus cambios no
han hecho nada. Es el único tropiezo habitual con este tipo de app.

## Qué hace

- Crear ejercicios y organizarlos por grupo muscular
- Crear rutinas (una rutina es un día de entreno: empuje, pierna, lunes)
- Empezar un entreno desde una rutina o libre, y añadir ejercicios a mitad
- Registrar peso, repeticiones y RIR opcional
- **Ver lo que hiciste la última vez** en cada ejercicio, sobre las series
- Marca en latón con trofeo cuando superas tu récord de peso
- Historial permanente agrupado por mes, con notas por sesión
- Ficha por ejercicio: mejor peso, sesiones, gráfica de evolución (peso máximo
  o volumen) y todo el historial
- Exportar e importar todos los datos
- Si cierras la app a mitad de entreno, al volver sigues donde estabas

## Cómo está montado

**Los registros del historial guardan el id del ejercicio y una copia de su
nombre.** Renombrar o borrar un ejercicio no toca ni un entreno pasado. Es la
decisión de diseño que hace que los datos sean difíciles de corromper.

**Una rutina es un día**, no hay jerarquía rutina → día → ejercicio. Un nombre
y una lista ordenada de ejercicios.

**Archivar antes que borrar.** Un ejercicio archivado sale de las listas pero
conserva su historial. El borrado real pide confirmación y avisa de que el
historial se mantiene.

**Se repinta todo en cada cambio.** Con estos volúmenes es instantáneo y evita
toda la complejidad de ir sincronizando la pantalla a mano. Los formularios se
pintan aparte para que escribir no pierda el foco del campo.

## Decisiones tomadas

- Solo kilos, sin conmutador kg/lb
- RIR opcional, apagado por defecto en cada serie nueva
- Sin temporizador de descanso
- Sin series de calentamiento marcadas aparte: todas cuentan para el volumen
- Marca personal = peso máximo levantado en ese ejercicio
- El peso que introduces es el total, incluida la barra
- Solo modo oscuro

## Qué se ha comprobado

La lógica pasa 106 comprobaciones automáticas (`prueba.js`): modelo, consultas,
cálculos de volumen y récords, la búsqueda de "la última vez", el flujo
completo de un entreno, editar y borrar, persistencia, almacén corrupto, y que
las once pantallas se pintan sin errores. La estructura HTML también está
validada.

Lo que **no** se ha probado es la app en un iPhone real: aquí no hay navegador.
La disposición en pantalla, el teclado numérico y los gestos habrá que verlos
en el móvil. Si algo se ve raro, dime qué y se ajusta.
