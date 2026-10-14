// js/tarifario.js
// Regla de negocio del caso: LuzCentro Perú — derecho de prueba de contraste de medidor.
// Funciones PURAS: reciben datos y devuelven un valor. No tocan el DOM ni la base de datos,
// por eso se pueden probar en la consola:
//   calcularMontoServicio({ tipo_medidor: 'trifasico', km_fuera_zona: 8 })   // 95
//   calcularMontoServicio({ tipo_medidor: 'monofasico', km_fuera_zona: 0 })  // 35

export function redondear(valor) {
  return Math.round(valor * 100) / 100;
}

export function formatearSoles(monto) {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(monto);
}

// Utilidad: un checkbox marcado llega en FormData como 'on'; si no está marcado, NO llega
export const marcado = (valor) => valor === 'on';

// Solo el reclamo por facturación excesiva requiere la prueba de contraste (y por tanto el cobro).
// Los demás trámites (nuevo suministro, cambio de titular, otros) no pagan este derecho.
export const MOTIVO_CON_COBRO = 'Reclamo por Monto Excesivo';
export const requiereContraste = (motivo) => motivo === MOTIVO_CON_COBRO;

// Regla: Monofásico S/ 35.00 o Trifásico S/ 75.00 + S/ 2.50 por km fuera de la zona urbana.
export function calcularMontoServicio(d) {
  const base = d.tipo_medidor === 'trifasico' ? 75.00 : 35.00;
  return redondear(base + 2.50 * Math.max(0, Number(d.km_fuera_zona) || 0));
}

// Monto final de una solicitud según su motivo: 0 si el trámite no paga contraste.
export function montoSegunMotivo(motivo, datos) {
  return requiereContraste(motivo) ? calcularMontoServicio(datos) : 0;
}
