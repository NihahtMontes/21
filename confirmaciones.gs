/**
 * Lista de invitados de la Fiesta 21, guardada en una hoja de Google Sheets.
 *
 * Cómo activarla (una sola vez, unos 5 minutos):
 *  1. Crea una hoja nueva en https://sheets.new y ponle de nombre "Fiesta 21".
 *  2. En el menú: Extensiones > Apps Script. Borra lo que aparece y pega este archivo entero. Guarda.
 *  3. Botón azul "Implementar" > "Nueva implementación" > tipo "Aplicación web".
 *       - Ejecutar como: Yo
 *       - Quién tiene acceso: Cualquier usuario (no "Cualquier usuario con cuenta de Google":
 *         con esa opción Google pide iniciar sesión y las confirmaciones se pierden)
 *     Pulsa "Implementar" y autoriza con tu cuenta de Google.
 *  4. Copia la "URL de la aplicación web" (termina en /exec) y pégala en main.js, en FIESTA.lista.
 *
 * Cada confirmación aparece como una fila nueva: fecha, nombre, disfraz y acompañante.
 * La página lee la misma hoja para mostrar la lista "Ya vienen" (solo nombre, disfraz y si viene con alguien).
 * Para sacar a alguien de la lista, borra su fila.
 *
 * Si cambias este código, vuelve a "Implementar" > "Gestionar implementaciones" > el lápiz >
 * Versión: "Nueva versión" > "Implementar". La URL no cambia; sin este paso la página no ve los cambios.
 */

function doPost(e) {
  const hoja = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  if (hoja.getLastRow() === 0) {
    hoja.appendRow(['Fecha', 'Nombre', 'Disfraz', 'Acompañante']);
    hoja.setFrozenRows(1);
  }
  const p = e.parameter;
  const limpio = (v) => String(v || '').slice(0, 60).replace(/^[=+\-@]/, "'$&");
  hoja.appendRow([new Date(), limpio(p.nombre), limpio(p.disfraz), limpio(p.acompanante)]);
  return ContentService.createTextOutput('ok');
}

// La lista para la página: de la confirmación más nueva a la más vieja, sin repetir nombres.
function doGet() {
  const hoja = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  const total = hoja.getLastRow() - 1;
  const filas = total > 0 ? hoja.getRange(2, 1, total, 4).getValues() : [];
  const texto = (v) => String(v || '').replace(/^'/, '').trim();
  const vistos = {};
  const invitados = [];
  for (let i = filas.length - 1; i >= 0; i--) {
    const nombre = texto(filas[i][1]);
    const clave = nombre.toLowerCase();
    if (!nombre || vistos[clave]) continue;
    vistos[clave] = true;
    invitados.push({ nombre: nombre, disfraz: texto(filas[i][2]), con: texto(filas[i][3]) !== '' });
  }
  const personas = invitados.reduce((n, g) => n + (g.con ? 2 : 1), 0);
  return ContentService.createTextOutput(JSON.stringify({ personas: personas, invitados: invitados }))
    .setMimeType(ContentService.MimeType.JSON);
}
