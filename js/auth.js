import { sql } from './neon-config.js';

// Auto-inyección de estilos CSS para notificaciones Toast y Modales integrados
(function inyectarEstilosNotificaciones() {
    if (document.getElementById('lz-notificaciones-styles')) return;
    const style = document.createElement('style');
    style.id = 'lz-notificaciones-styles';
    style.textContent = `
        /* Contenedor de Notificaciones Toast */
        #lz-toast-container {
            position: fixed;
            top: 25px;
            right: 25px;
            z-index: 99999;
            display: flex;
            flex-direction: column;
            gap: 12px;
            max-width: 380px;
            width: calc(100% - 50px);
            pointer-events: none;
        }

        .lz-toast {
            pointer-events: auto;
            display: flex;
            align-items: center;
            gap: 14px;
            padding: 16px 20px;
            background: #ffffff;
            color: #0A2540;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(10, 37, 64, 0.18);
            border-left: 5px solid #0077FF;
            font-family: 'Poppins', sans-serif;
            font-size: 0.92rem;
            font-weight: 500;
            animation: lzSlideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            transition: all 0.3s ease;
        }

        .lz-toast.lz-exito { border-left-color: #10B981; }
        .lz-toast.lz-exito i { color: #10B981; }

        .lz-toast.lz-error { border-left-color: #EF4444; }
        .lz-toast.lz-error i { color: #EF4444; }

        .lz-toast.lz-advertencia { border-left-color: #FF7A00; }
        .lz-toast.lz-advertencia i { color: #FF7A00; }

        .lz-toast.lz-info { border-left-color: #0077FF; }
        .lz-toast.lz-info i { color: #0077FF; }

        .lz-toast i {
            font-size: 1.3rem;
            flex-shrink: 0;
        }

        .lz-toast-content {
            flex: 1;
            line-height: 1.4;
        }

        @keyframes lzSlideIn {
            from { opacity: 0; transform: translateX(50px) scale(0.95); }
            to { opacity: 1; transform: translateX(0) scale(1); }
        }

        @keyframes lzFadeOut {
            from { opacity: 1; transform: translateX(30px) scale(0.9); }
            to { opacity: 0; transform: translateX(50px) scale(0.9); }
        }

        /* Modal Personalizado de Confirmación */
        .lz-modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(10, 37, 64, 0.65);
            backdrop-filter: blur(6px);
            z-index: 99998;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            animation: lzFadeIn 0.25s ease forwards;
        }

        .lz-modal-box {
            background: #ffffff;
            border-radius: 18px;
            max-width: 440px;
            width: 100%;
            padding: 30px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.22);
            text-align: center;
            font-family: 'Poppins', sans-serif;
            animation: lzPopIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .lz-modal-icon {
            width: 60px;
            height: 60px;
            background: rgba(255, 122, 0, 0.12);
            color: #FF7A00;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.8rem;
            margin: 0 auto 18px;
        }

        .lz-modal-box h3 {
            color: #0A2540;
            font-size: 1.35rem;
            margin-bottom: 10px;
            font-weight: 700;
        }

        .lz-modal-box p {
            color: #425466;
            font-size: 0.95rem;
            line-height: 1.55;
            margin-bottom: 25px;
        }

        .lz-modal-actions {
            display: flex;
            gap: 12px;
            justify-content: center;
        }

        .lz-btn-cancelar {
            background: #F4F7F9;
            color: #425466;
            border: none;
            padding: 12px 22px;
            border-radius: 10px;
            font-weight: 600;
            font-size: 0.9rem;
            cursor: pointer;
            transition: all 0.2s ease;
        }

        .lz-btn-cancelar:hover {
            background: #E2E8F0;
        }

        .lz-btn-confirmar {
            background: #FF7A00;
            color: #ffffff;
            border: none;
            padding: 12px 22px;
            border-radius: 10px;
            font-weight: 600;
            font-size: 0.9rem;
            cursor: pointer;
            transition: all 0.2s ease;
            box-shadow: 0 4px 12px rgba(255, 122, 0, 0.3);
        }

        .lz-btn-confirmar:hover {
            background: #E66E00;
            transform: translateY(-2px);
        }

        @keyframes lzFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes lzPopIn { from { opacity: 0; transform: scale(0.85); } to { opacity: 1; transform: scale(1); } }
    `;
    document.head.appendChild(style);
})();

// Función Toast Notificación
export function mostrarNotificacion(mensaje, tipo = 'info', duracion = 4000) {
    let container = document.getElementById('lz-toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'lz-toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `lz-toast lz-${tipo}`;

    const iconos = {
        exito: 'fa-circle-check',
        error: 'fa-circle-xmark',
        advertencia: 'fa-triangle-exclamation',
        info: 'fa-circle-info'
    };

    toast.innerHTML = `
        <i class="fa-solid ${iconos[tipo] || iconos.info}"></i>
        <div class="lz-toast-content">${mensaje}</div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'lzFadeOut 0.3s forwards';
        setTimeout(() => toast.remove(), 300);
    }, duracion);
}

// Función Modal Confirmación
export function mostrarConfirmacion(titulo, mensaje, alConfirmar, textoConfirmar = "Aceptar", textoCancelar = "Cancelar") {
    const overlay = document.createElement('div');
    overlay.className = 'lz-modal-overlay';

    overlay.innerHTML = `
        <div class="lz-modal-box">
            <div class="lz-modal-icon">
                <i class="fa-solid fa-circle-question"></i>
            </div>
            <h3>${titulo}</h3>
            <p>${mensaje}</p>
            <div class="lz-modal-actions">
                <button class="lz-btn-cancelar">${textoCancelar}</button>
                <button class="lz-btn-confirmar">${textoConfirmar}</button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    const btnCancelar = overlay.querySelector('.lz-btn-cancelar');
    const btnConfirmar = overlay.querySelector('.lz-btn-confirmar');

    btnCancelar.addEventListener('click', () => overlay.remove());
    btnConfirmar.addEventListener('click', () => {
        overlay.remove();
        if (typeof alConfirmar === 'function') alConfirmar();
    });
}

document.addEventListener('DOMContentLoaded', () => {
    actualizarHeaderSesion();
    protegerBotonesSesion();
    prepararEnlacesLogin();

    const formRegistro = document.getElementById('form-registro');
    const formLogin = document.getElementById('form-login');

    // 1. REGISTRO DE USUARIO
    if (formRegistro) {
        formRegistro.addEventListener('submit', async (e) => {
            e.preventDefault();

            const nombre = document.getElementById('reg-nombre').value.trim();
            const correo = document.getElementById('reg-correo').value.trim();
            const pass = document.getElementById('reg-pass').value.trim();
            const btn = formRegistro.querySelector('button[type="submit"]');

            if (!nombre || !correo || !pass) {
                mostrarNotificacion("Por favor, completa todos los campos del formulario.", "advertencia");
                return;
            }

            try {
                if (btn) btn.disabled = true;

                const [nuevoUsuario] = await sql`
                    INSERT INTO usuarios (nombre, correo, contrasena, rol) 
                    VALUES (${nombre}, ${correo}, ${pass}, 'cliente')
                    RETURNING id, nombre, correo, rol
                `;

                sessionStorage.setItem('usuario', JSON.stringify(nuevoUsuario));
                mostrarNotificacion("¡Cuenta creada exitosamente! Redirigiendo...", "exito");
                
                setTimeout(() => {
                    const params = new URLSearchParams(window.location.search);
                    const redirect = params.get('redirect');
                    if (redirect) {
                        window.location.href = redirect;
                    } else if (document.referrer && !document.referrer.includes('login.html')) {
                        window.location.href = document.referrer;
                    } else {
                        window.location.href = "index.html";
                    }
                }, 1200);

            } catch (error) {
                console.error("Error al registrar usuario:", error);
                mostrarNotificacion("Error al crear la cuenta. Es posible que el correo ya esté registrado.", "error");
            } finally {
                if (btn) btn.disabled = false;
            }
        });
    }

    // 2. INICIO DE SESIÓN
    if (formLogin) {
        formLogin.addEventListener('submit', async (e) => {
            e.preventDefault();

            const correo = document.getElementById('log-correo').value.trim();
            const pass = document.getElementById('log-pass').value.trim();
            const btn = formLogin.querySelector('button[type="submit"]');

            if (!correo || !pass) {
                mostrarNotificacion("Por favor, ingresa tu correo y contraseña.", "advertencia");
                return;
            }

            try {
                if (btn) btn.disabled = true;

                const resultado = await sql`
                    SELECT id, nombre, correo, rol 
                    FROM usuarios 
                    WHERE correo = ${correo} AND contrasena = ${pass}
                `;

                if (resultado.length > 0) {
                    const usuarioLogueado = resultado[0];
                    sessionStorage.setItem('usuario', JSON.stringify(usuarioLogueado));
                    mostrarNotificacion(`¡Bienvenido/a, ${usuarioLogueado.nombre}!`, "exito");
                    
                    setTimeout(() => {
                        if (usuarioLogueado.rol !== 'cliente') {
                            // administrador / empleado -> panel.html, cajero -> caja.html
                            window.location.href = rutaInicioSegunRol(usuarioLogueado.rol);
                        } else {
                            const params = new URLSearchParams(window.location.search);
                            const redirect = params.get('redirect');
                            if (redirect) {
                                window.location.href = redirect;
                            } else if (document.referrer && !document.referrer.includes('login.html')) {
                                window.location.href = document.referrer;
                            } else {
                                window.location.href = "index.html";
                            }
                        }
                    }, 1000);
                } else {
                    mostrarNotificacion("Correo electrónico o contraseña incorrectos.", "error");
                }
            } catch (error) {
                console.error("Error al iniciar sesión:", error);
                mostrarNotificacion("Error de conexión con la base de datos.", "error");
            } finally {
                if (btn) btn.disabled = false;
            }
        });
    }
});

/* ==========================================================
   CONTROL POR ROL (Semana 9)
   ========================================================== */

// Devuelve el usuario guardado en la sesión o null
export function obtenerUsuarioSesion() {
    try {
        const raw = sessionStorage.getItem('usuario') || localStorage.getItem('usuario');
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

// Devuelve el usuario o redirige a login.html (con redirect para volver a la misma página)
export function exigirSesion() {
    const usuario = obtenerUsuarioSesion();
    if (!usuario || !usuario.id) {
        const pagina = (window.location.pathname.split('/').pop() || 'index.html') + window.location.search;
        window.location.href = `login.html?redirect=${encodeURIComponent(pagina)}`;
        return null;
    }
    return usuario;
}

// 'admin' se trata como 'administrador' (el panel ya aceptaba ambos valores)
const normalizarRol = (rol) => (rol === 'admin' ? 'administrador' : rol);

// Exige que el usuario tenga uno de los roles permitidos; si no, avisa y envía a index.html
export function exigirRol(...rolesPermitidos) {
    const usuario = exigirSesion();
    if (!usuario) return null;
    if (!rolesPermitidos.includes(normalizarRol(usuario.rol))) {
        mostrarNotificacion('Tu perfil no tiene acceso a esta página.', 'error', 2500);
        setTimeout(() => { window.location.href = 'index.html'; }, 1800);
        return null;
    }
    return usuario;
}

export function rutaInicioSegunRol(rol) {
    const rutas = {
        cliente: 'formulario.html',
        administrador: 'panel.html',
        admin: 'panel.html',
        empleado: 'panel.html',
        cajero: 'caja.html'
    };
    return rutas[rol] ?? 'index.html';
}

export function cerrarSesion() {
    sessionStorage.removeItem('usuario');
    localStorage.removeItem('usuario');
    window.location.href = 'login.html';
}

// Adjunta a los enlaces de login la página de origen
function prepararEnlacesLogin() {
    const paginaActual = window.location.pathname.split('/').pop() || 'index.html';
    if (paginaActual.includes('login.html')) return;

    const enlacesLogin = document.querySelectorAll('a[href*="login.html"]');
    enlacesLogin.forEach(link => {
        const urlOriginal = link.getAttribute('href');
        if (!urlOriginal.includes('redirect=')) {
            const separador = urlOriginal.includes('?') ? '&' : '?';
            link.setAttribute('href', `${urlOriginal}${separador}redirect=${encodeURIComponent(paginaActual)}`);
        }
    });
}

// Reemplaza el menú por el estado de usuario autenticado
function actualizarHeaderSesion() {
    const usuarioSesionRaw = sessionStorage.getItem('usuario');
    if (!usuarioSesionRaw) return;

    try {
        const usuario = JSON.parse(usuarioSesionRaw);
        const headerNav = document.querySelector('header nav') || document.querySelector('nav') || document.querySelector('header');
        if (!headerNav) return;

        const enlaces = Array.from(headerNav.querySelectorAll('a, button'));
        const btnLogin = enlaces.find(el => 
            el.getAttribute('href')?.includes('login.html') || 
            el.textContent.toLowerCase().includes('iniciar sesión') ||
            el.textContent.toLowerCase().includes('iniciar sesion')
        );

        if (btnLogin) {
            const urlDestino = usuario.rol?.toLowerCase() === 'cliente'
                ? 'actualizar.html'
                : rutaInicioSegunRol(usuario.rol);
            const nombreMostrar = usuario.nombre || 'Mi Cuenta';

            const btnCrear = enlaces.find(el => 
                el !== btnLogin && (
                    el.getAttribute('href')?.includes('registro.html') || 
                    el.textContent.toLowerCase().includes('crear cuenta') ||
                    el.classList.contains('btn-crear-cuenta') ||
                    el.classList.contains('btn-nav')
                )
            );
            if (btnCrear) {
                const liCrear = btnCrear.closest('li');
                if (liCrear) liCrear.style.display = 'none';
                else btnCrear.style.display = 'none';
            }

            const boxUsuario = document.createElement('div');
            boxUsuario.className = 'usuario-header-box';
            boxUsuario.innerHTML = `
                <a href="${urlDestino}" class="usuario-header-link">
                    <i class="fa-solid fa-user-circle"></i>
                    <span>${nombreMostrar}</span>
                </a>
                <button id="btn-cerrar-header" class="btn-cerrar-header">
                    <i class="fa-solid fa-right-from-bracket"></i> Cerrar sesión
                </button>
            `;

            btnLogin.replaceWith(boxUsuario);

            const btnCerrar = document.getElementById('btn-cerrar-header');
            if (btnCerrar) {
                btnCerrar.addEventListener('click', () => {
                    mostrarConfirmacion(
                        "Cerrar Sesión",
                        "¿Deseas salir de tu cuenta actual?",
                        () => {
                            sessionStorage.removeItem('usuario');
                            window.location.reload();
                        },
                        "Sí, cerrar sesión",
                        "Cancelar"
                    );
                });
            }
        }
    } catch (err) {
        console.error("Error al actualizar UI del header:", err);
    }
}

// Intercepta botones protegidos
function protegerBotonesSesion() {
    const botonesProtegidos = document.querySelectorAll('.requiere-sesion, [data-requiere-sesion]');
    
    botonesProtegidos.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const usuarioSesion = sessionStorage.getItem('usuario');
            if (!usuarioSesion) {
                e.preventDefault();
                const destino = btn.getAttribute('href') || btn.getAttribute('data-destino') || 'login.html';
                
                mostrarConfirmacion(
                    "Inicio de Sesión Requerido",
                    "Para realizar esta operación o trámite debes iniciar sesión previamente.",
                    () => {
                        window.location.href = `login.html?redirect=${encodeURIComponent(destino)}`;
                    },
                    "Iniciar Sesión",
                    "Volver"
                );
            }
        });
    });
}