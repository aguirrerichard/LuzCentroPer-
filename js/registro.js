import { sql } from './neon-config.js';
import { exigirRol } from './auth.js';
import { calcularMontoServicio, formatearSoles, requiereContraste } from './tarifario.js';

// Solo el perfil Cliente registra solicitudes (mapa de acceso por rol)
const usuarioSesion = exigirRol('cliente');
if (!usuarioSesion) throw new Error('Acceso denegado');

document.addEventListener("DOMContentLoaded", () => {
    const formReclamo = document.getElementById("form-reclamo");
    const inputNombres = document.getElementById("nombres");
    const selectTramite = document.getElementById("tipo_tramite");
    const bloqueContraste = document.getElementById("div-contraste");
    const selectMedidor = document.getElementById("tipo_medidor");
    const inputKm = document.getElementById("km_fuera_zona");
    const salidaMonto = document.getElementById("monto-estimado");

    if (inputNombres && !inputNombres.value) {
        inputNombres.value = usuarioSesion.nombre;
    }

    // ---------- COTIZADOR EN VIVO ----------
    const leerDatosContraste = () => ({
        tipo_medidor: selectMedidor.value,
        km_fuera_zona: inputKm.value
    });

    function actualizarCotizacion() {
        salidaMonto.textContent = formatearSoles(calcularMontoServicio(leerDatosContraste()));
    }

    // El bloque del cotizador solo aparece para el reclamo por monto excesivo
    function mostrarBloqueSegunTramite() {
        const aplica = requiereContraste(selectTramite.value);
        bloqueContraste.style.display = aplica ? 'block' : 'none';
        inputKm.required = aplica;
        if (aplica) actualizarCotizacion();
    }

    if (formReclamo) {
        formReclamo.addEventListener('input', actualizarCotizacion);   // en cada tecla (km)
        formReclamo.addEventListener('change', actualizarCotizacion);  // select
        selectTramite.addEventListener('change', mostrarBloqueSegunTramite);
        actualizarCotizacion();
    }

    // ---------- ENVÍO ----------
    if (formReclamo) {
        formReclamo.addEventListener("submit", async (e) => {
            e.preventDefault();

            const id_usuario = usuarioSesion.id;
            const dni = document.getElementById("dni").value.trim() || null;
            const nombre_cliente = document.getElementById("nombres").value.trim();
            const motivo = selectTramite.value;
            const suministro = document.getElementById("suministro").value.trim() || null;
            const direccion = document.getElementById("direccion").value.trim() || null;
            const mes_reclamo = document.getElementById("mes_reclamo").value || null;
            const monto_reclamo = document.getElementById("monto_reclamo").value ? parseFloat(document.getElementById("monto_reclamo").value) : null;
            const comentario = document.getElementById("descripcion").value.trim();
            const btnEnviar = document.getElementById("btn-enviar-reclamo");

            if (!dni || !nombre_cliente || !motivo || !comentario) {
                alert("Por favor, completa los campos obligatorios.");
                return;
            }

            // La tarifa solo aplica al reclamo por monto excesivo; los demás trámites no pagan contraste
            const aplicaCobro = requiereContraste(motivo);
            const tipo_medidor = aplicaCobro ? selectMedidor.value : 'monofasico';
            const km_fuera_zona = aplicaCobro ? Math.max(0, Number(inputKm.value) || 0) : 0;

            if (aplicaCobro && inputKm.value !== '' && !(Number(inputKm.value) >= 0)) {
                alert("Los kilómetros fuera de la zona urbana deben ser un número mayor o igual a 0.");
                return;
            }

            // Se recalcula aquí: no se confía en lo que muestra la pantalla
            const monto = aplicaCobro ? calcularMontoServicio({ tipo_medidor, km_fuera_zona }) : 0;
            const estadoPago = monto === 0 ? 'exonerado' : 'pendiente';
            const codigo = 'COD-' + Date.now().toString().slice(-8);

            try {
                if (btnEnviar) {
                    btnEnviar.disabled = true;
                    btnEnviar.textContent = "Guardando...";
                }

                const filas = await sql`
                    INSERT INTO reclamos_luz (
                        id_usuario, codigo_seguimiento, dni, nombre_cliente, motivo,
                        numero_suministro, direccion, mes_reclamo, monto_reclamo,
                        comentario, estado,
                        tipo_medidor, km_fuera_zona, monto_calculado, estado_pago
                    )
                    VALUES (
                        ${id_usuario}, ${codigo}, ${dni}, ${nombre_cliente}, ${motivo},
                        ${suministro}, ${direccion}, ${mes_reclamo}, ${monto_reclamo},
                        ${comentario}, 'registrado',
                        ${tipo_medidor}, ${km_fuera_zona}, ${monto}, ${estadoPago}
                    )
                    RETURNING id
                `;

                if (estadoPago === 'pendiente') {
                    alert(`¡Trámite registrado!\nCódigo: ${codigo}\nDerecho de contraste: ${formatearSoles(monto)}. Te llevamos a la pasarela de pago.`);
                    setTimeout(() => { window.location.href = `pago.html?id=${filas[0].id}`; }, 1500);
                } else {
                    alert(`¡Trámite registrado con éxito!\nCódigo de seguimiento: ${codigo}\nEste trámite no requiere pago de contraste.`);
                    setTimeout(() => { window.location.href = "actualizar.html"; }, 1500);
                }

            } catch (error) {
                console.error("Error al guardar:", error);
                alert("Hubo un error al registrar la información.");
                if (btnEnviar) {
                    btnEnviar.disabled = false;
                    btnEnviar.innerHTML = 'Registrar Solicitud <i class="fa-solid fa-file-export"></i>';
                }
            }
        });
    }
});
