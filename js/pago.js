// js/pago.js — script propio de pago.html (pasarela del cliente)
import { exigirRol } from './auth.js';
import { formatearSoles } from './tarifario.js';
import {
  formatearNumeroTarjeta, formatearVencimiento, detectarMarca, validarFormularioTarjeta,
  validarCelular, validarCodigoAprobacion
} from './validaciones.js';
import { obtenerRegistro, listarPendientesCliente, pagarConTarjeta, pagarConBilletera } from './pasarela.js';

const usuario = exigirRol('cliente');
if (!usuario) throw new Error('Acceso denegado');

const selectRegistro = document.querySelector('#registro');
const resumenMonto = document.querySelector('#resumen-monto');
const mensaje = document.querySelector('#mensaje-pago');
const bloquePago = document.querySelector('#bloque-pago');
const formTarjeta = document.querySelector('#form-tarjeta');
const formBilletera = document.querySelector('#form-billetera');
const inputNumero = document.querySelector('#numero');
const inputVenc = document.querySelector('#vencimiento');
const marcaDetectada = document.querySelector('#marca-detectada');

let registroActual = null;

function mostrarMensaje(texto, tipo) {
  mensaje.textContent = texto;
  mensaje.className = `mensaje mensaje--${tipo}`;
}

function mostrarError(campo, texto = '') {
  document.querySelector(`#error-${campo}`).textContent = texto;
  document.querySelector(`#${campo}`).setAttribute('aria-invalid', texto ? 'true' : 'false');
}

// 1. Cargar las solicitudes pendientes del cliente
async function cargarPendientes() {
  let pendientes;
  try {
    pendientes = await listarPendientesCliente(usuario.id);
  } catch (error) {
    console.error(error);
    mostrarMensaje('No se pudo conectar con la base de datos. Intenta nuevamente.', 'error');
    bloquePago.hidden = true;
    return;
  }

  selectRegistro.replaceChildren();
  if (pendientes.length === 0) {
    resumenMonto.textContent = '—';
    selectRegistro.disabled = true;
    bloquePago.hidden = true;                  // sin pendientes no hay nada que cobrar
    mostrarMensaje('No tienes solicitudes pendientes de pago.', 'info');
    return;
  }
  for (const p of pendientes) {
    const opcion = document.createElement('option');
    opcion.value = p.id;
    opcion.textContent = `${p.codigo_seguimiento} — ${formatearSoles(Number(p.monto_calculado))}`;
    selectRegistro.append(opcion);
  }
  // Si llegó desde formulario.html o actualizar.html con ?id=, preseleccionarlo
  const idUrl = new URLSearchParams(location.search).get('id');
  if (idUrl) {
    if (pendientes.some(p => String(p.id) === idUrl)) selectRegistro.value = idUrl;
    else mostrarMensaje('La solicitud indicada ya no está pendiente de pago.', 'info');
  }
  await seleccionarRegistro();
}

async function seleccionarRegistro() {
  registroActual = await obtenerRegistro(Number(selectRegistro.value), usuario.id);
  resumenMonto.textContent = registroActual ? formatearSoles(Number(registroActual.monto_calculado)) : '—';
}

// 2. Alternar entre tarjeta y billetera
function mostrarMetodo() {
  const metodo = document.querySelector('input[name="metodo"]:checked').value;
  formTarjeta.hidden = metodo !== 'tarjeta';
  formBilletera.hidden = metodo !== 'billetera';
}

// 3. Formato en vivo
inputNumero.addEventListener('input', () => {
  inputNumero.value = formatearNumeroTarjeta(inputNumero.value);
  marcaDetectada.textContent = detectarMarca(inputNumero.value) ?? '';
});
inputVenc.addEventListener('input', () => {
  inputVenc.value = formatearVencimiento(inputVenc.value);
});

// 4. Procesar un pago (común a tarjeta y billetera)
async function procesar(formulario, operacion) {
  if (!registroActual || registroActual.estado_pago !== 'pendiente') {
    mostrarMensaje('Selecciona una solicitud pendiente de pago.', 'error');
    return;
  }
  const boton = formulario.querySelector('button[type="submit"]');
  const textoOriginal = boton.innerHTML;
  boton.disabled = true;                       // evita el doble clic = doble cobro
  boton.textContent = 'Procesando...';
  mostrarMensaje('Conectando con la entidad...', 'info');
  try {
    const resultado = await operacion();
    if (resultado.aprobado) {
      formulario.reset();
      marcaDetectada.textContent = '';
      mostrarMensaje(`Pago aprobado. Operación ${resultado.codigo}. Redirigiendo a tu comprobante...`, 'exito');
      setTimeout(() => {
        window.location.href = `comprobante.html?op=${encodeURIComponent(resultado.codigo)}`;
      }, 1500);
      return;                                  // se queda deshabilitado hasta redirigir
    }
    mostrarMensaje(`Pago rechazado: ${resultado.motivo}`, 'error');
  } catch (error) {
    console.error(error);
    mostrarMensaje('No se pudo procesar el pago. Revisa tu conexión.', 'error');
  }
  boton.disabled = false;
  boton.innerHTML = textoOriginal;
}

formTarjeta.addEventListener('submit', async (e) => {
  e.preventDefault();
  const datos = Object.fromEntries(new FormData(formTarjeta));
  const { valido, errores, marca, venc } = validarFormularioTarjeta(datos);
  ['numero', 'vencimiento', 'cvv', 'titular'].forEach(campo => mostrarError(campo, errores[campo]));
  if (!valido) return;
  await procesar(formTarjeta, () => pagarConTarjeta({
    registro: registroActual, usuario, numero: datos.numero,
    mes: venc.mes, anio: venc.anio, cvv: datos.cvv, marca
  }));
});

formBilletera.addEventListener('submit', async (e) => {
  e.preventDefault();
  const datos = Object.fromEntries(new FormData(formBilletera));
  const celularOk = validarCelular(datos.celular);
  const codigoOk = validarCodigoAprobacion(datos.codigo);
  mostrarError('celular', celularOk ? '' : 'Celular de 9 dígitos que empiece con 9.');
  mostrarError('codigo', codigoOk ? '' : 'El código tiene 6 dígitos.');
  if (!celularOk || !codigoOk) return;
  await procesar(formBilletera, () => pagarConBilletera({
    registro: registroActual, usuario, proveedor: datos.proveedor,
    celular: datos.celular, codigoAprobacion: datos.codigo
  }));
});

document.querySelectorAll('input[name="metodo"]').forEach(r => r.addEventListener('change', mostrarMetodo));
selectRegistro.addEventListener('change', seleccionarRegistro);
mostrarMetodo();
cargarPendientes();
