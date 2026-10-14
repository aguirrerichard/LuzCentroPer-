import { sql } from './neon-config.js';
import { exigirRol, mostrarNotificacion } from './auth.js';
import { calcularMontoServicio, formatearSoles, requiereContraste } from './tarifario.js';

// Solo el perfil Cliente ve y edita sus registros (mapa de acceso por rol)
const usuarioSesion = exigirRol('cliente');
if (!usuarioSesion) throw new Error('Acceso denegado');

/* =========================================================
   A. DATOS
   ========================================================= */

// Reclamos del usuario + el código de operación de su pago aprobado (si existe)
async function listarMisReclamos() {
    return await sql`
        SELECT r.id, r.codigo_seguimiento, r.numero_suministro, r.motivo, r.comentario, r.estado,
               r.tipo_medidor, r.km_fuera_zona, r.monto_calculado, r.estado_pago, r.canal_pago,
               p.codigo_operacion
        FROM reclamos_luz r
        LEFT JOIN pagos p ON p.id_registro = r.id AND p.estado = 'aprobado'
        WHERE r.id_usuario = ${usuarioSesion.id}
        ORDER BY r.id DESC
    `;
}

// Una solicitud ya pagada no se edita. Si cambian los datos de la tarifa, se recalcula el monto.
async function actualizarRegistro(reclamo, { comentario, tipo_medidor, km_fuera_zona }) {
    let filas;
    if (requiereContraste(reclamo.motivo)) {
        const monto = calcularMontoServicio({ tipo_medidor, km_fuera_zona });
        filas = await sql`
            UPDATE reclamos_luz
            SET comentario = ${comentario},
                tipo_medidor = ${tipo_medidor}, km_fuera_zona = ${km_fuera_zona},
                monto_calculado = ${monto},
                estado_pago = ${monto === 0 ? 'exonerado' : 'pendiente'}
            WHERE id = ${reclamo.id} AND id_usuario = ${usuarioSesion.id}
              AND estado = 'registrado' AND estado_pago <> 'pagado'
            RETURNING id
        `;
    } else {
        filas = await sql`
            UPDATE reclamos_luz
            SET comentario = ${comentario}
            WHERE id = ${reclamo.id} AND id_usuario = ${usuarioSesion.id}
              AND estado = 'registrado' AND estado_pago <> 'pagado'
            RETURNING id
        `;
    }
    return filas.length === 1;   // false: no existe, no es tuyo, ya fue atendido o ya fue pagado
}

/* =========================================================
   B. INTERFAZ
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    // Nota: El cierre de sesión y el nombre en el header los maneja automáticamente js/auth.js

    const tbody = document.getElementById('tbody-mis-reclamos');
    const modal = document.getElementById('modal-editar-cliente');
    const inputEditId = document.getElementById('edit-id');
    const inputEditComentario = document.getElementById('edit-comentario');
    const bloqueContraste = document.getElementById('edit-contraste');
    const selectMedidor = document.getElementById('edit-tipo-medidor');
    const inputKm = document.getElementById('edit-km');
    const salidaMonto = document.getElementById('edit-monto');
    const mensajeModal = document.getElementById('edit-mensaje');
    const btnGuardar = document.getElementById('btn-guardar-cliente');
    const btnCancelar = document.getElementById('btn-cancelar-cliente');

    let reclamosCache = [];

    // ---- helpers de DOM (textContent: nunca interpretar datos como HTML) ----
    const celda = (tr, texto = '') => {
        const td = document.createElement('td');
        td.textContent = texto;
        tr.append(td);
        return td;
    };

    const filaMensaje = (texto, color = '#64748b') => {
        tbody.replaceChildren();
        const tr = document.createElement('tr');
        const td = celda(tr, texto);
        td.colSpan = 7;
        td.style.cssText = `text-align:center; padding:30px; color:${color};`;
        tbody.append(tr);
    };

    const capitalizar = (texto) => texto.charAt(0).toUpperCase() + texto.slice(1);

    const NOMBRES_PAGO = { pendiente: 'Pendiente', pagado: 'Pagado', exonerado: 'Exonerado' };

    function pintarCeldaPago(tr, r) {
        const td = celda(tr);
        const contenedor = document.createElement('div');
        contenedor.className = 'celda-pago';
        if (requiereContraste(r.motivo)) {
            const monto = document.createElement('span');
            monto.className = 'monto';
            monto.textContent = formatearSoles(Number(r.monto_calculado));
            contenedor.append(monto);
        }
        const badge = document.createElement('span');
        badge.className = `badge-pago ${r.estado_pago}`;
        badge.textContent = NOMBRES_PAGO[r.estado_pago] ?? r.estado_pago;
        contenedor.append(badge);
        td.append(contenedor);
    }

    // Acciones según estado operativo y estado de pago
    function pintarAcciones(tr, r) {
        const td = celda(tr);
        const grupo = document.createElement('div');
        grupo.className = 'acciones-fila';

        if (r.estado_pago === 'pendiente') {
            const pagar = document.createElement('a');
            pagar.className = 'btn-accion btn-pagar';
            pagar.href = `pago.html?id=${encodeURIComponent(r.id)}`;
            pagar.textContent = 'Pagar';
            grupo.append(pagar);
        } else if (r.estado_pago === 'pagado' && r.codigo_operacion) {
            const ver = document.createElement('a');
            ver.className = 'btn-accion';
            ver.href = `comprobante.html?op=${encodeURIComponent(r.codigo_operacion)}`;
            ver.textContent = 'Ver comprobante';
            grupo.append(ver);
        }

        // Editable: solo si sigue "registrado" y NO está pagado
        if (r.estado === 'registrado' && r.estado_pago !== 'pagado') {
            const editar = document.createElement('button');
            editar.type = 'button';
            editar.className = 'btn-accion btn-editar';
            editar.dataset.id = r.id;
            editar.textContent = 'Editar';
            grupo.append(editar);
        } else if (r.estado !== 'registrado') {
            const bloqueado = document.createElement('span');
            bloqueado.className = 'estado-bloqueado';
            bloqueado.textContent = `Trámite ${capitalizar((r.estado || '').replace('_', ' '))}`;
            grupo.append(bloqueado);
        }
        td.append(grupo);
    }

    const cargarMisReclamos = async () => {
        if (!tbody) return;
        try {
            filaMensaje('Cargando tus registros...');
            reclamosCache = await listarMisReclamos();

            if (reclamosCache.length === 0) {
                filaMensaje('No tienes registros de reclamos almacenados actualmente.');
                return;
            }

            tbody.replaceChildren();
            for (const item of reclamosCache) {
                const tr = document.createElement('tr');
                const estadoTexto = capitalizar((item.estado || 'registrado').replace('_', ' '));

                celda(tr).append(Object.assign(document.createElement('strong'), { textContent: item.codigo_seguimiento || 'N/A' }));
                celda(tr, item.numero_suministro || 'N/A');
                celda(tr, item.motivo || 'Reclamo por Monto Excesivo');
                celda(tr, item.comentario || '');
                const tdEstado = celda(tr);
                const badge = document.createElement('span');
                badge.className = `badge badge-${item.estado}`;
                badge.textContent = estadoTexto;
                tdEstado.append(badge);
                pintarCeldaPago(tr, item);
                pintarAcciones(tr, item);
                tbody.append(tr);
            }
        } catch (error) {
            console.error("Error al obtener reclamos propios:", error);
            filaMensaje('Error al conectar con la base de datos.', 'red');
        }
    };

    // ---- Modal de edición ----
    const actualizarMontoEdicion = () => {
        salidaMonto.textContent = formatearSoles(calcularMontoServicio({
            tipo_medidor: selectMedidor.value,
            km_fuera_zona: inputKm.value
        }));
    };
    bloqueContraste.addEventListener('input', actualizarMontoEdicion);
    bloqueContraste.addEventListener('change', actualizarMontoEdicion);

    // Delegación de eventos: un solo listener para todos los botones "Editar"
    tbody.addEventListener('click', (e) => {
        const btn = e.target.closest('button.btn-editar');
        if (!btn) return;
        const reclamo = reclamosCache.find(r => r.id === Number(btn.dataset.id));
        if (!reclamo) return;

        inputEditId.value = reclamo.id;
        inputEditComentario.value = reclamo.comentario || '';
        mensajeModal.textContent = '';

        const conContraste = requiereContraste(reclamo.motivo);
        bloqueContraste.hidden = !conContraste;
        if (conContraste) {
            selectMedidor.value = reclamo.tipo_medidor || 'monofasico';
            inputKm.value = Number(reclamo.km_fuera_zona ?? 0);
            actualizarMontoEdicion();
        }
        modal.classList.add('activo');
    });

    // Guardar actualización de registro propio
    btnGuardar.addEventListener('click', async () => {
        const id = Number(inputEditId.value);
        const comentario = inputEditComentario.value.trim();
        const reclamo = reclamosCache.find(r => r.id === id);

        if (!reclamo) {
            mensajeModal.textContent = 'Identificador inválido.';
            return;
        }
        if (!comentario) {
            mensajeModal.textContent = 'La descripción / fundamento es obligatoria.';
            return;
        }
        const km = Math.max(0, Number(inputKm.value) || 0);
        if (!bloqueContraste.hidden && inputKm.value !== '' && !(Number(inputKm.value) >= 0)) {
            mensajeModal.textContent = 'Los km fuera de la zona urbana deben ser 0 o más.';
            return;
        }

        btnGuardar.disabled = true;
        try {
            const exito = await actualizarRegistro(reclamo, {
                comentario,
                tipo_medidor: selectMedidor.value,
                km_fuera_zona: km
            });
            if (!exito) {
                mensajeModal.textContent = 'No se pudo actualizar: el trámite ya fue pagado o está en atención.';
            } else {
                modal.classList.remove('activo');
                mostrarNotificacion('Registro actualizado correctamente.', 'exito');
            }
            await cargarMisReclamos();   // recargar la tabla sin refrescar la web
        } catch (error) {
            console.error("Error al actualizar reclamo:", error);
            mensajeModal.textContent = 'No se pudo actualizar el registro.';
        } finally {
            btnGuardar.disabled = false;
        }
    });

    btnCancelar.addEventListener('click', () => modal.classList.remove('activo'));

    cargarMisReclamos();
});
