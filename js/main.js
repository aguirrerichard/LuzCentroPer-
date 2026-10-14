import { sql } from './neon-config.js';

// ==========================================
// 1. INYECCIÓN DE ESTILOS DE LA MODAL Y ALERTAS
// ==========================================
const injectModalStyles = () => {
    if (document.getElementById('custom-modal-styles')) return;
    const style = document.createElement('style');
    style.id = 'custom-modal-styles';
    style.innerHTML = `
        /* Overlay oscuro y borroso */
        .modal-overlay-custom {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(15, 23, 42, 0.65);
            backdrop-filter: blur(5px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 99999;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.3s ease;
        }
        .modal-overlay-custom.active {
            opacity: 1;
            pointer-events: auto;
        }

        /* Tarjeta Blanca Central */
        .modal-card-custom {
            background: #ffffff;
            width: 90%;
            max-width: 420px;
            padding: 35px 28px 28px 28px;
            border-radius: 20px;
            text-align: center;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            transform: translateY(20px);
            transition: transform 0.3s ease;
        }
        .modal-overlay-custom.active .modal-card-custom {
            transform: translateY(0);
        }

        /* Icono de Escudo Naranja Corporativo */
        .modal-icon-custom {
            width: 60px;
            height: 60px;
            background: #fff3e6;
            color: #ff7a00;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.8rem;
            margin: 0 auto 18px auto;
        }

        .modal-card-custom h3 {
            color: #0f172a;
            font-size: 1.35rem;
            font-weight: 700;
            margin-bottom: 12px;
            font-family: inherit;
        }

        .modal-card-custom p {
            color: #64748b;
            font-size: 0.95rem;
            line-height: 1.5;
            margin-bottom: 25px;
            font-family: inherit;
        }

        /* Botones estilo corporativo */
        .modal-buttons-custom {
            display: flex;
            gap: 12px;
            justify-content: center;
        }

        .btn-modal-cancelar {
            flex: 1;
            padding: 10px 18px;
            border: 1px solid #cbd5e1;
            background: #ffffff;
            color: #475569;
            border-radius: 10px;
            font-weight: 600;
            font-size: 0.95rem;
            cursor: pointer;
            transition: all 0.2s ease;
        }
        .btn-modal-cancelar:hover {
            background: #f8fafc;
            border-color: #94a3b8;
        }

        .btn-modal-login {
            flex: 1;
            padding: 10px 18px;
            border: none;
            background: #0066ff;
            color: #ffffff;
            border-radius: 10px;
            font-weight: 600;
            font-size: 0.95rem;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(0, 102, 255, 0.3);
            transition: all 0.2s ease;
        }
        .btn-modal-login:hover {
            background: #0052cc;
            transform: translateY(-1px);
            box-shadow: 0 6px 16px rgba(0, 102, 255, 0.4);
        }

        /* Alerta flotante corporativa para éxito/error */
        .toast-corporativo {
            position: fixed;
            bottom: 30px;
            right: 30px;
            background: #0f172a;
            color: #ffffff;
            padding: 16px 22px;
            border-radius: 12px;
            border-left: 5px solid #ff7a00;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
            display: flex;
            align-items: center;
            gap: 12px;
            z-index: 999999;
            opacity: 0;
            transform: translateY(20px);
            transition: all 0.3s ease;
            font-size: 0.95rem;
            font-family: inherit;
        }
        .toast-corporativo.show {
            opacity: 1;
            transform: translateY(0);
        }
        .toast-corporativo i {
            color: #ff7a00;
            font-size: 1.3rem;
        }
    `;
    document.head.appendChild(style);
};

// ==========================================
// 2. CREACIÓN DINÁMICA DE LA MODAL DE SESIÓN
// ==========================================
const crearModalAuthHTML = () => {
    if (document.getElementById('modal-auth-custom')) return;

    const modalHTML = `
        <div id="modal-auth-custom" class="modal-overlay-custom">
            <div class="modal-card-custom">
                <div class="modal-icon-custom">
                    <i class="fa-solid fa-shield-halved"></i>
                </div>
                <h3>Inicio de Sesión Requerido</h3>
                <p>Para proteger tus datos y realizar este trámite, necesitas acceder a tu cuenta.</p>
                <div class="modal-buttons-custom">
                    <button type="button" id="btn-cancelar-modal" class="btn-modal-cancelar">Cancelar</button>
                    <button type="button" id="btn-login-modal" class="btn-modal-login">Iniciar Sesión</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Eventos de la modal
    document.getElementById('btn-cancelar-modal').addEventListener('click', cerrarModalAuth);
    document.getElementById('btn-login-modal').addEventListener('click', () => {
        window.location.href = "login.html";
    });
};

const mostrarModalAuth = () => {
    const modal = document.getElementById('modal-auth-custom');
    if (modal) modal.classList.add('active');
};

const cerrarModalAuth = () => {
    const modal = document.getElementById('modal-auth-custom');
    if (modal) modal.classList.remove('active');
};

// Toast flotante estilo LuzCentro
const mostrarToast = (mensaje, icono = 'fa-circle-check') => {
    const toastExistente = document.querySelector('.toast-corporativo');
    if (toastExistente) toastExistente.remove();

    const toast = document.createElement('div');
    toast.className = 'toast-corporativo';
    toast.innerHTML = `<i class="fa-solid ${icono}"></i> <span>${mensaje}</span>`;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 50);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
};

// Helper para validar si el usuario está logueado
const obtenerUsuarioLogueado = () => {
    const usuarioStorage = localStorage.getItem('usuario') || sessionStorage.getItem('usuario');
    return usuarioStorage ? JSON.parse(usuarioStorage) : null;
};

// ==========================================
// 3. INICIALIZACIÓN PRINCIPAL
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    injectModalStyles();
    crearModalAuthHTML();

    // --------------------------------------------------------
    // A) BUSCADOR DE RECLAMO (PROTEGIDO POR SESIÓN)
    // --------------------------------------------------------
    const formConsulta = document.getElementById('form-consulta-publico');
    const inputBuscar = document.getElementById('input-buscar-pub');
    const resultadoBox = document.getElementById('resultado-busqueda-pub');

    if (formConsulta) {
        formConsulta.addEventListener('submit', async (e) => {
            e.preventDefault();

            // 1. Validar sesión antes de permitir la búsqueda
            const usuarioLogueado = obtenerUsuarioLogueado();
            if (!usuarioLogueado || !usuarioLogueado.id) {
                mostrarModalAuth();
                return;
            }

            const valorBusqueda = inputBuscar.value.trim();
            if (!valorBusqueda) return;

            resultadoBox.classList.remove('hidden');
            resultadoBox.innerHTML = '<p style="color:#64748b; padding:10px;"><i class="fa-solid fa-spinner fa-spin"></i> Buscando en la base de datos...</p>';

            try {
                // Consulta a la base de datos de Neon
                const resultado = await sql`
                    SELECT codigo_seguimiento, estado, motivo, nombre_cliente
                    FROM reclamos_luz 
                    WHERE (codigo_seguimiento = ${valorBusqueda} OR dni = ${valorBusqueda})
                    ORDER BY id DESC LIMIT 1
                `;

                if (resultado && resultado.length > 0) {
                    const reclamo = resultado[0];
                    const estadoTexto = reclamo.estado ? reclamo.estado.replace('_', ' ').toUpperCase() : 'REGISTRADO';
                    
                    let colorEstado = '#0284c7';
                    if (reclamo.estado === 'resuelto' || reclamo.estado === 'atendido') colorEstado = '#059669';
                    if (reclamo.estado === 'rechazado') colorEstado = '#dc2626';

                    resultadoBox.innerHTML = `
                        <div style="padding: 16px; border: 1px solid #e2e8f0; border-left: 4px solid #ff7a00; border-radius: 10px; background: #f8fafc; margin-top: 15px; text-align: left;">
                            <h4 style="margin-bottom: 10px; color: #0f172a; font-size: 1rem;"><i class="fa-solid fa-circle-check" style="color: #ff7a00;"></i> Reclamo Encontrado</h4>
                            <p style="font-size: 0.9rem; margin-bottom: 5px; color: #334155;"><strong>Cliente:</strong> ${reclamo.nombre_cliente || 'No especificado'}</p>
                            <p style="font-size: 0.9rem; margin-bottom: 5px; color: #334155;"><strong>Código:</strong> ${reclamo.codigo_seguimiento}</p>
                            <p style="font-size: 0.9rem; margin-bottom: 5px; color: #334155;"><strong>Motivo:</strong> ${reclamo.motivo}</p>
                            <p style="font-size: 0.9rem; margin-bottom: 0; color: #334155;"><strong>Estado Actual:</strong> <span style="font-weight: bold; color: ${colorEstado};">${estadoTexto}</span></p>
                        </div>
                    `;
                } else {
                    resultadoBox.innerHTML = `
                        <div style="padding: 15px; border: 1px solid #fee2e2; border-radius: 10px; background: #fef2f2; margin-top: 15px; color: #dc2626; text-align: left;">
                            <p style="font-size: 0.9rem; margin: 0;"><i class="fa-solid fa-triangle-exclamation"></i> No se encontró ningún trámite con ese Código o DNI.</p>
                        </div>
                    `;
                }
            } catch (error) {
                console.error('Error al buscar:', error);
                resultadoBox.innerHTML = '<p style="color:#dc2626; font-size: 0.9rem; padding: 10px;">Error al conectar con la base de datos.</p>';
            }
        });
    }

    // --------------------------------------------------------
    // B) REGISTRO DE RECLAMO (PROTEGIDO POR SESIÓN)
    // --------------------------------------------------------
    const formRegistro = document.getElementById('form-nuevo-reclamo-pub');
    
    if (formRegistro) {
        formRegistro.addEventListener('submit', async (e) => {
            e.preventDefault();

            // 1. Validar sesión antes de procesar el registro
            const usuarioLogueado = obtenerUsuarioLogueado();
            if (!usuarioLogueado || !usuarioLogueado.id) {
                mostrarModalAuth();
                return;
            }

            const dni = document.getElementById('pub-dni').value.trim();
            const nombre = document.getElementById('pub-nombre').value.trim();
            const suministro = document.getElementById('pub-suministro').value.trim();
            const comentario = document.getElementById('pub-comentario').value.trim();
            const motivo = "Reclamo por Cobro Excesivo";
            const codigoSeguimiento = 'COD-' + Date.now().toString().slice(-8);

            const btnSubmit = formRegistro.querySelector('.btn-enviar-pub');
            const textoOriginal = btnSubmit.innerHTML;
            btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Registrando...';
            btnSubmit.disabled = true;

            try {
                // Inserción directa en la base de datos de Neon
                await sql`
                    INSERT INTO reclamos_luz (
                        id_usuario, 
                        codigo_seguimiento, 
                        dni, 
                        nombre_cliente, 
                        numero_suministro, 
                        motivo, 
                        comentario, 
                        estado
                    ) VALUES (
                        ${usuarioLogueado.id}, 
                        ${codigoSeguimiento}, 
                        ${dni}, 
                        ${nombre}, 
                        ${suministro}, 
                        ${motivo}, 
                        ${comentario}, 
                        'registrado'
                    )
                `;

                mostrarToast(`¡Reclamo guardado! Código: ${codigoSeguimiento}`, 'fa-circle-check');
                formRegistro.reset();
                
            } catch (error) {
                console.error("Error al registrar:", error);
                mostrarToast("Ocurrió un error al intentar registrar tu solicitud.", "fa-triangle-exclamation");
            } finally {
                btnSubmit.innerHTML = textoOriginal;
                btnSubmit.disabled = false;
            }
        });
    }
});