/*
  Prueba funcional. Monto un DOM falso mínimo, cargo la app de verdad y
  recorro el flujo completo comprobando los resultados. No es un navegador,
  pero sí ejecuta toda la lógica: modelo, consultas, cálculos y el pintado
  de cada pantalla (comprobando que no lanza y que dice lo que debe).
*/

const fs = require("fs");

let almacen = {};
const nodo = () => ({
  _html: "",
  set innerHTML(v){ this._html = v; },
  get innerHTML(){ return this._html; },
  textContent: "",
  setAttribute(){}, getAttribute(){ return null; },
  focus(){}, setSelectionRange(){}, select(){},
  appendChild(){}, removeChild(){}, click(){},
  querySelectorAll(){ return []; }, querySelector(){ return null; },
  style:{}, files:[], value:""
});

const nodos = { app: nodo(), nav: nodo(), capa: nodo(), modal: nodo() };

global.window = {
  localStorage: {
    getItem: k => (k in almacen ? almacen[k] : null),
    setItem: (k,v) => { almacen[k] = String(v); },
  },
  crypto: { randomUUID: () => "u" + (++contador) },
  addEventListener(){},
};
let contador = 0;
global.document = {
  getElementById: id => nodos[id] || nodo(),
  querySelector: () => null,
  querySelectorAll: () => [],
  createElement: () => nodo(),
  body: { appendChild(){}, removeChild(){} },
  activeElement: null,
};
global.navigator = {};
global.setInterval = () => 0;
global.clearInterval = () => {};
global.confirm = () => respuestaConfirm;
global.alert = () => {};
let respuestaConfirm = true;
global.Blob = class {}; global.URL = { createObjectURL:()=>"", revokeObjectURL(){} };
global.FileReader = class {};
global.crypto = global.window.crypto;
global.localStorage = global.window.localStorage;

// La app usa `window.addEventListener` y `window.localStorage`, y tambien
// referencias globales sueltas. Cargo el script en este ambito.
// Quito "use strict" y uso eval indirecto para que las declaraciones var
// del script acaben siendo globales y las pruebas puedan verlas.
const codigo = fs.readFileSync("/tmp/app.js", "utf8").replace('"use strict";', "");
(0, eval)(codigo);

// -------------------------------------------------------------------------
let fallos = 0, pruebas = 0;
function comprueba(nombre, condicion, detalle){
  pruebas++;
  if(condicion){ console.log("  ok   " + nombre); }
  else { fallos++; console.log("  FALLA " + nombre + (detalle ? "  -> " + detalle : "")); }
}
function seccion(t){ console.log("\n" + t); }

// -------------------------------------------------------------------------
seccion("Arranque y datos iniciales");
comprueba("se siembran los ejercicios", datos.ejercicios.length === 41,
          datos.ejercicios.length + " ejercicios");
comprueba("todos tienen grupo válido",
          datos.ejercicios.every(e => GRUPOS.some(g => g[0] === e.grupo)));
comprueba("se ha guardado en el almacén", Object.keys(almacen).length === 1);
comprueba("sin entrenos ni rutinas al empezar",
          datos.entrenos.length === 0 && datos.rutinas.length === 0);

seccion("Formateo");
comprueba("peso redondo sin decimales", textoPeso(80) === "80", textoPeso(80));
comprueba("peso con medio kilo", textoPeso(82.5) === "82,5", textoPeso(82.5));
comprueba("volumen en toneladas", textoVolumen(4250) === "4,3 t", textoVolumen(4250));
comprueba("volumen pequeño en kilos", textoVolumen(400) === "400 kg", textoVolumen(400));
comprueba("duración con horas", textoDuracion(3900000) === "1 h 5 min", textoDuracion(3900000));
comprueba("mes capitalizado", mesDe(new Date(2026,2,14).getTime()) === "Marzo 2026",
          mesDe(new Date(2026,2,14).getTime()));
comprueba("escapa HTML", esc('<b>"x"</b>') === "&lt;b&gt;&quot;x&quot;&lt;/b&gt;", esc('<b>"x"</b>'));

seccion("Rutinas");
creaRutina();
const rut = datos.rutinas[0];
comprueba("se crea una rutina", datos.rutinas.length === 1);
renombraRutina(rut.id, "Empuje");
comprueba("se renombra", rutinaPorId(rut.id).nombre === "Empuje");
renombraRutina(rut.id, "   ");
comprueba("nombre vacío recibe uno por defecto",
          rutinaPorId(rut.id).nombre === "Rutina sin nombre");
renombraRutina(rut.id, "Empuje");

const press = datos.ejercicios.find(e => e.nombre === "Press banca");
const militar = datos.ejercicios.find(e => e.nombre === "Press militar");
const lateral = datos.ejercicios.find(e => e.nombre === "Elevaciones laterales");
rut.ejercicioIds = [press.id, militar.id, lateral.id];
guardar();
comprueba("tiene tres ejercicios", rut.ejercicioIds.length === 3);
mueveEnRutina(rut.id, 0, 1);
comprueba("se reordena hacia abajo", rut.ejercicioIds[0] === militar.id);
mueveEnRutina(rut.id, 1, -1);
comprueba("se reordena hacia arriba", rut.ejercicioIds[0] === press.id,
          rut.ejercicioIds.map(id => (ejercicioPorId(id)||{}).nombre).join(" / "));
mueveEnRutina(rut.id, 0, -1);
comprueba("no se sale por arriba", rut.ejercicioIds[0] === press.id);
mueveEnRutina(rut.id, 2, 1);
comprueba("no se sale por abajo", rut.ejercicioIds[2] === lateral.id);

seccion("Primer entreno");
empezar(rut.id);
let act = entrenoActivo();
comprueba("hay entreno activo", !!act);
comprueba("hereda el nombre de la rutina", act.nombreRutina === "Empuje");
comprueba("precarga los tres ejercicios", act.ejercicios.length === 3);
comprueba("en el orden de la rutina",
          act.ejercicios[0].ejercicioId === press.id && act.ejercicios[2].ejercicioId === lateral.id);
comprueba("guarda copia del nombre", act.ejercicios[0].nombreEjercicio === "Press banca");
comprueba("cada registro lleva su fecha", act.ejercicios[0].fecha === act.inicio);

empezar(rut.id);
comprueba("no se abren dos entrenos a la vez", datos.entrenos.length === 1);

const regPress = act.ejercicios[0];
nuevaSerie(regPress.id);
comprueba("sin historial propone 20 kg × 10",
          modalEstado.peso === 20 && modalEstado.reps === 10,
          modalEstado.peso + "x" + modalEstado.reps);
modalEstado.peso = 80; modalEstado.reps = 8;
guardaSerie();
comprueba("se registra la serie", regPress.series.length === 1);
comprueba("con los valores puestos",
          regPress.series[0].peso === 80 && regPress.series[0].reps === 8);
comprueba("sin RIR si no se activa", regPress.series[0].rir === null);

nuevaSerie(regPress.id);
comprueba("la siguiente serie copia la anterior",
          modalEstado.peso === 80 && modalEstado.reps === 8);
guardaSerie();
repiteSerie(regPress.id);
comprueba("repetir añade una tercera", regPress.series.length === 3);
comprueba("los órdenes son 0,1,2",
          ordenados(regPress.series).map(s=>s.orden).join(",") === "0,1,2");

comprueba("volumen del ejercicio", volumenRegistro(regPress) === 1920,
          String(volumenRegistro(regPress)));
comprueba("volumen del entreno", volumenEntreno(act) === 1920);
comprueba("total de series", totalSeries(act) === 3);
comprueba("mejor serie es la más pesada", mejorSerie(regPress).peso === 80);

seccion("Ajuste de campos");
nuevaSerie(regPress.id);
ajusta("peso", 2.5);
comprueba("subir peso usa pasos de 2,5", modalEstado.peso === 82.5, String(modalEstado.peso));
ajusta("reps", -1);
comprueba("bajar repeticiones", modalEstado.reps === 7, String(modalEstado.reps));
modalEstado.reps = 1; ajusta("reps", -1);
comprueba("las repeticiones no bajan de 1", modalEstado.reps === 1);
modalEstado.peso = 0; ajusta("peso", -2.5);
comprueba("el peso no baja de 0", modalEstado.peso === 0);
modalEstado.usaRir = true; modalEstado.rir = 10; ajusta("rir", 1);
comprueba("el RIR no pasa de 10", modalEstado.rir === 10);
escribe("peso", "72,5");
comprueba("acepta coma decimal al escribir", modalEstado.peso === 72.5, String(modalEstado.peso));
escribe("peso", "abc");
comprueba("ignora texto no numérico", modalEstado.peso === 72.5);
cierraModal();
comprueba("cancelar no añade nada", regPress.series.length === 3);

seccion("Terminar entreno");
// El tercer ejercicio se queda sin series a proposito.
const regMilitar = act.ejercicios[1];
nuevaSerie(regMilitar.id);
modalEstado.peso = 40; modalEstado.reps = 10; modalEstado.usaRir = true; modalEstado.rir = 2;
guardaSerie();
comprueba("guarda el RIR cuando se activa", regMilitar.series[0].rir === 2);

const idPrimero = act.id;
terminaEntreno();
comprueba("ya no hay entreno activo", entrenoActivo() === null);
const e1 = entrenoPorId(idPrimero);
comprueba("queda marcado como terminado", e1.terminado === true && e1.fin > 0);
comprueba("se descartan los ejercicios sin series", e1.ejercicios.length === 2,
          e1.ejercicios.length + " ejercicios");
comprueba("aparece en el historial", terminados().length === 1);

seccion("Segundo entreno: la última vez");
// Retraso el primero una semana para que las fechas sean distintas.
const semana = 7*24*3600*1000;
e1.inicio -= semana; e1.fin -= semana;
e1.ejercicios.forEach(r => { r.fecha -= semana; });
guardar();

empezar(rut.id);
act = entrenoActivo();
const reg2 = act.ejercicios[0];
const ant = vezAnterior(reg2.ejercicioId, reg2.fecha);
comprueba("encuentra la vez anterior", !!ant);
comprueba("es la sesión de la semana pasada", ant && ant.fecha === e1.ejercicios[0].fecha);
comprueba("resume bien lo que se hizo", ant && resumenRegistro(ant) === "80 × 8, 80 × 8, 80 × 8",
          ant && resumenRegistro(ant));
comprueba("no se cuenta a sí mismo como anterior",
          vezAnterior(reg2.ejercicioId, reg2.fecha).fecha < reg2.fecha);

nuevaSerie(reg2.id);
comprueba("propone lo de la última vez",
          modalEstado.peso === 80 && modalEstado.reps === 8,
          modalEstado.peso + "x" + modalEstado.reps);
modalEstado.peso = 85; modalEstado.reps = 6;
guardaSerie();

comprueba("récord anterior a esta sesión es 80",
          mejorPeso(reg2.ejercicioId, reg2.fecha) === 80,
          String(mejorPeso(reg2.ejercicioId, reg2.fecha)));
comprueba("récord absoluto ahora es 85", mejorPeso(reg2.ejercicioId) === 85);
comprueba("85 se marcaría como récord", 85 > mejorPeso(reg2.ejercicioId, reg2.fecha));

seccion("Editar y borrar series");
const serie = reg2.series[0];
editaSerie(reg2.id, serie.id);
comprueba("el editor carga los valores", modalEstado.peso === 85 && modalEstado.reps === 6);
modalEstado.peso = 90;
guardaSerie();
comprueba("se guarda el cambio", reg2.series[0].peso === 90);
editaSerie(reg2.id, serie.id);
borraSerie();
comprueba("se borra la serie", reg2.series.length === 0);

seccion("Quitar ejercicio y descartar entreno");
nuevaSerie(reg2.id); guardaSerie();
respuestaConfirm = true;
quitaEjercicioSesion(reg2.id);
comprueba("se quita el ejercicio de la sesión", entrenoActivo().ejercicios.length === 2);
descartaEntreno();
comprueba("descartar borra el entreno entero", datos.entrenos.length === 1);
comprueba("el historial anterior sigue intacto", terminados().length === 1);

seccion("Historial de un ejercicio y progresión");
// Tres sesiones mas de press banca con pesos crecientes.
[[100, 6], [105, 5], [110, 5]].forEach(function(par, i){
  const t = Date.now() - (3-i)*2*24*3600*1000;
  datos.entrenos.push({
    id: uid(), inicio: t, fin: t + 3600000, terminado: true,
    nombreRutina: "Empuje", notas: "", ejercicios: [{
      id: uid(), ejercicioId: press.id, nombreEjercicio: "Press banca",
      orden: 0, fecha: t,
      series: [{ id: uid(), peso: par[0], reps: par[1], rir: null, orden: 0 }]
    }]
  });
});
guardar();
const hist = historialDe(press.id);
comprueba("el historial tiene cuatro sesiones", hist.length === 4, hist.length + "");
comprueba("ordenado de más reciente a más antigua",
          hist.every((r,i) => i === 0 || hist[i-1].fecha >= r.fecha));
comprueba("récord actualizado a 110", mejorPeso(press.id) === 110);

const puntos = hist.slice().sort((a,b)=>a.fecha-b.fecha)
  .map(r => ({ fecha:r.fecha, valor: mejorSerie(r).peso }));
comprueba("progresión creciente", puntos.map(p=>p.valor).join(",") === "80,100,105,110",
          puntos.map(p=>p.valor).join(","));
const svg = dibujaGrafica(puntos);
comprueba("la gráfica es un SVG", svg.indexOf("<svg") === 0);
comprueba("con una línea de cuatro puntos", (svg.match(/<circle/g)||[]).length === 4);
comprueba("y una polilínea", svg.indexOf("<polyline") > 0);
const svg1 = dibujaGrafica([{fecha:Date.now(), valor:50}]);
comprueba("no se rompe con un solo punto", svg1.indexOf("<svg") === 0);
const svgPlano = dibujaGrafica([{fecha:1,valor:50},{fecha:2,valor:50}]);
comprueba("no divide por cero si no hay progreso", svgPlano.indexOf("NaN") < 0);

seccion("Borrar y archivar ejercicios");
rut.ejercicioIds = [press.id, militar.id];
guardar();
archiva(militar.id);
comprueba("se archiva", ejercicioPorId(militar.id).archivado === true);
archiva(militar.id);
comprueba("se desarchiva", ejercicioPorId(militar.id).archivado === false);

const nEjercicios = datos.ejercicios.length;
const nHistorial = historialDe(militar.id).length;
respuestaConfirm = true;
borraEjercicio(militar.id);
comprueba("desaparece de la biblioteca", datos.ejercicios.length === nEjercicios - 1);
comprueba("desaparece de la rutina", rut.ejercicioIds.indexOf(militar.id) < 0);
comprueba("el historial se conserva", nHistorial > 0 && historialDe(militar.id).length === nHistorial);
comprueba("el registro conserva el nombre",
          e1.ejercicios[1].nombreEjercicio === "Press militar");
comprueba("no revienta al pedir un ejercicio borrado", ejercicioPorId(militar.id) === null);

seccion("Pintado de todas las pantallas");
function pinta_ok(nombre, fn){
  try{
    const h = fn();
    comprueba(nombre, typeof h === "string" && h.length > 0 && h.indexOf("undefined") < 0,
              typeof h === "string" && h.indexOf("undefined") >= 0 ? "contiene 'undefined'" : "");
  }catch(err){
    comprueba(nombre, false, err.message);
  }
}
pinta_ok("Entrenar", pantallaEntrenar);
pinta_ok("Ejercicios", pantallaEjercicios);
pinta_ok("Historial", pantallaHistorial);
pinta_ok("Rutinas", pantallaRutinas);
pinta_ok("Ajustes", pantallaAjustes);
pinta_ok("Detalle de rutina", () => pantallaDetalleRutina(rut.id));
pinta_ok("Ficha de ejercicio", () => pantallaDetalleEjercicio(press.id));
pinta_ok("Detalle de entreno", () => pantallaDetalleEntreno(e1.id));
pinta_ok("Rutina inexistente no rompe", () => pantallaDetalleRutina("noexiste"));
pinta_ok("Entreno inexistente no rompe", () => pantallaDetalleEntreno("noexiste"));
pinta_ok("Ejercicio inexistente no rompe", () => pantallaDetalleEjercicio("noexiste"));

// Con un entreno en curso
empezar(null);
comprueba("el entreno libre se llama así", entrenoActivo().nombreRutina === "Entreno libre");
comprueba("y empieza sin ejercicios", entrenoActivo().ejercicios.length === 0);
pinta_ok("Entrenar con sesión en curso", pantallaEntrenar);
selectorParaSesion();
comprueba("el selector se abre", selector !== null);
alternaSelector(press.id);
comprueba("se puede elegir un ejercicio", selector.elegidos.length === 1);
alternaSelector(press.id);
comprueba("y desmarcar", selector.elegidos.length === 0);
alternaSelector(press.id);
confirmaSelector();
comprueba("se añade a la sesión", entrenoActivo().ejercicios.length === 1);
pinta_ok("Bloque de ejercicio en sesión",
         () => bloqueEjercicio(entrenoActivo().ejercicios[0], entrenoActivo()));
descartaEntreno();

seccion("Filtros y búsqueda");
filtroEjercicios.busqueda = "banca";
const conBusqueda = pantallaEjercicios();
comprueba("la búsqueda encuentra Press banca", conBusqueda.indexOf("Press banca") > 0);
comprueba("y descarta lo que no coincide", conBusqueda.indexOf("Sentadilla") < 0);
filtroEjercicios.busqueda = "zzzzz";
comprueba("sin resultados muestra el estado vacío",
          pantallaEjercicios().indexOf("Sin resultados") > 0);
filtroEjercicios.busqueda = "";
filtroEjercicios.archivados = true;
comprueba("la pestaña de archivados se muestra vacía",
          pantallaEjercicios().indexOf("Nada archivado") > 0);
filtroEjercicios.archivados = false;

seccion("Persistencia");
const copia = JSON.stringify(datos);
datos = { version:1, ejercicios:[], rutinas:[], entrenos:[] };
cargar();
comprueba("recarga desde el almacén", JSON.stringify(datos) === copia);

almacen = {};
datos = { version:1, ejercicios:[], rutinas:[], entrenos:[] };
cargar();
comprueba("sin datos previos vuelve a sembrar", datos.ejercicios.length === 41);

almacen["gymlog.datos.v1"] = "{roto";
cargar();
comprueba("un almacén corrupto no impide arrancar",
          datos && datos.ejercicios.length === 41);

// -------------------------------------------------------------------------
console.log("\n" + "=".repeat(46));
console.log(pruebas + " comprobaciones, " + fallos + " fallos");
process.exit(fallos ? 1 : 0);
