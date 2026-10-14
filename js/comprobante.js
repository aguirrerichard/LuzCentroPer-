// js/comprobante.js — constancia de pago imprimible
import { sql } from './neon-config.js';
import { exigirSesion, rutaInicioSegunRol } from './auth.js';
import { formatearSoles } from './tarifario.js';

const usuario = exigirSesion();
if (!usuario) throw new Error('Sin sesión');

const NOMBRES_METODO = {
  tarjeta_debito: 'Tarjeta de débito', tarjeta_credito: 'Tarjeta de crédito',
  billetera: 'Billetera electrónica', efectivo: 'Efectivo', pos: 'Tarjeta en POS'
};

const contenedor = document.querySelector('#comprobante');
const op = new URLSearchParams(location.search).get('op');

// "Volver" depende del perfil: el cliente a sus registros; el personal a su módulo
document.querySelector('#volver').href = usuario.rol === 'cliente' ? 'actualizar.html' : rutaInicioSegunRol(usuario.rol);

function agregarDato(lista, etiqueta, valor) {
  const dt = document.createElement('dt');
  const dd = document.createElement('dd');
  dt.textContent = etiqueta;
  dd.textContent = valor ?? '—';
  lista.append(dt, dd);
}

async function cargar() {
  const filas = op ? await sql`
    SELECT p.codigo_operacion, p.canal, p.metodo, p.proveedor_billetera, p.marca_tarjeta, p.referencia,
           p.monto, p.monto_recibido, p.vuelto, p.fecha_pago, p.id_usuario,
           r.codigo_seguimiento, r.tipo_medidor, r.km_fuera_zona,
           COALESCE(r.nombre_cliente, u.nombre) AS cliente, c.nombre AS cajero
    FROM pagos p
    JOIN reclamos_luz r ON r.id = p.id_registro
    LEFT JOIN usuarios u ON u.id = p.id_usuario
    LEFT JOIN usuarios c ON c.id = p.id_cajero
    WHERE p.codigo_operacion = ${op} AND p.estado = 'aprobado';
  ` : [];
  const pago = filas[0];

  // Un cliente solo puede ver sus propios comprobantes
  if (!pago || (usuario.rol === 'cliente' && Number(pago.id_usuario) !== Number(usuario.id))) {
    contenedor.textContent = 'Comprobante no encontrado.';
    return;
  }

  const dl = document.createElement('dl');
  agregarDato(dl, 'N.° de operación', pago.codigo_operacion);
  agregarDato(dl, 'Solicitud', pago.codigo_seguimiento);
  agregarDato(dl, 'Cliente', pago.cliente ?? 'Atención presencial');
  agregarDato(dl, 'Concepto', 'Derecho de prueba de contraste de medidor');
  agregarDato(dl, 'Tipo de medidor', pago.tipo_medidor === 'trifasico' ? 'Trifásico' : 'Monofásico');
  agregarDato(dl, 'Km fuera de zona urbana', String(Number(pago.km_fuera_zona ?? 0)));
  agregarDato(dl, 'Canal', pago.canal === 'pasarela' ? 'Pago en línea' : 'Ventanilla');
  agregarDato(dl, 'Medio', `${NOMBRES_METODO[pago.metodo]} ${pago.marca_tarjeta ?? pago.proveedor_billetera ?? ''} ${pago.referencia ?? ''}`.trim());
  agregarDato(dl, 'Importe', formatearSoles(Number(pago.monto)));
  if (pago.metodo === 'efectivo') {
    agregarDato(dl, 'Recibido', formatearSoles(Number(pago.monto_recibido)));
    agregarDato(dl, 'Vuelto', formatearSoles(Number(pago.vuelto)));
  }
  if (pago.cajero) agregarDato(dl, 'Atendido por', pago.cajero);
  agregarDato(dl, 'Fecha y hora', new Date(pago.fecha_pago).toLocaleString('es-PE', { timeZone: 'America/Lima' }));

  const sello = document.createElement('p');
  sello.className = 'sello';
  sello.textContent = 'PAGO APROBADO';

  contenedor.replaceChildren(sello, dl);
}

try {
  await cargar();
} catch (error) {
  console.error(error);
  contenedor.textContent = 'No se pudo cargar el comprobante. Intenta nuevamente.';
}

document.querySelector('#imprimir').addEventListener('click', () => window.print());
