/**
 * Lista de invitados de la Fiesta 21, guardada en una hoja de Google Sheets.
 *
 * Cómo activarla (una sola vez, unos 5 minutos):
 *  1. Crea una hoja nueva en https://sheets.new y ponle de nombre "Fiesta 21".
 *  2. En el menú: Extensiones > Apps Script. Borra lo que aparece y pega este archivo entero. Guarda.
 *  3. Botón azul "Implementar" > "Nueva implementación" > tipo "Aplicación web".
 *       - Ejecutar como: Yo
 *       - Quién tiene acceso: Cualquier usuario
 *     Pulsa "Implementar" y autoriza con tu cuenta de Google.
 *  4. Copia la "URL de la aplicación web" (termina en /exec) y pégala en main.js, en FIESTA.lista.
 *
 * Cada confirmación aparece como una fila nueva: fecha, nombre, disfraz y acompañante.
 * Si cambias este código, vuelve a "Implementar" > "Gestionar implementaciones" > editar > "Nueva versión".
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
