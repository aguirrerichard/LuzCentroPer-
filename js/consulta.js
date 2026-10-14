/* ==========================================================
   LUZCENTRO PERÚ - CONSULTA.JS (Recibos y Pasarela de Pago)
   ========================================================== */

document.addEventListener('DOMContentLoaded', () => {
    const formPago = document.getElementById('form-pago') || document.querySelector('.tarjeta-pago form');
    const cajaBusqueda = document.querySelector('.caja-busqueda') || document.getElementById('seccion-busqueda');

    if (formPago) inicializarPasarelaPago(formPago);
    if (cajaBusqueda) inicializarBusquedaRecibos(cajaBusqueda);
});

// Algoritmo Luhn Oficial para Tarjetas de Crédito/Débito
function validarAlgoritmoLuhn(numeroTarjeta) {
    const limpia = numeroTarjeta.replace(/\s+/g, '');
    if (!/^\d{13,19}$/.test(limpia)) return false;

    let suma = 0;
    let alternar = false;

    for (let i = limpia.length - 1; i >= 0; i--) {
        let digito = parseInt(limpia.charAt(i), 10);
        if (alternar) {
            digito *= 2;
            if (digito > 9) digito -= 9;
        }
        suma += digito;
        alternar = !alternar;
    }
    return (suma % 10 === 0);
}

function aplicarFeedback(input, esValido, mensajeError = "") {
    const contenedor = input.parentElement;
    let errorSpan = contenedor.querySelector('.msg-error');

    if (!errorSpan) {
        errorSpan = document.createElement('span');
        errorSpan.className = 'msg-error';
        errorSpan.style.cssText = 'color: #ef4444; font-size: 0.78rem; font-weight: 600; display: block; margin-top: 4px; transition: all 0.2s ease;';
        contenedor.appendChild(errorSpan);
    }

    if (esValido) {
        input.classList.remove('invalido');
        input.classList.add('valido');
        errorSpan.textContent = '';
    } else {
        input.classList.remove('valido');
        input.classList.add('invalido');
        errorSpan.textContent = mensajeError;
    }
    return esValido;
}

function inicializarPasarelaPago(form) {
    const inputNombre = form.querySelector('input[placeholder*="JUAN"]') || document.getElementById('card-name');
    const inputTarjeta = form.querySelector('input[placeholder*="0000"]') || document.getElementById('card-number');
    const inputExpira = form.querySelector('input[placeholder*="12/28"]') || document.getElementById('card-exp');
    const inputCvv = form.querySelector('input[type="password"]') || document.getElementById('card-cvv');
    const logosTarjetas = document.querySelectorAll('.logos-tarjetas i');

    if (inputNombre) {
        inputNombre.addEventListener('input', () => {
            aplicarFeedback(inputNombre, inputNombre.value.trim().length >= 4, "Ingresa el nombre del titular.");
        });
    }

    if (inputTarjeta) {
        inputTarjeta.addEventListener('input', (e) => {
            // Formatear en bloques de 4 dígitos
            let val = e.target.value.replace(/\D/g, '').substring(0, 16);
            e.target.value = val.replace(/(\d{4})(?=\d)/g, '$1 ').trim();

            // Resaltado de franquicia (Visa/Mastercard/Amex)
            const numLimpio = val;
            logosTarjetas.forEach(icon => icon.style.opacity = '0.3');

            if (/^4/.test(numLimpio)) {
                const visa = document.querySelector('.fa-cc-visa');
                if (visa) visa.style.opacity = '1';
            } else if (/^(5[1-5]|22[2-7])/.test(numLimpio)) {
                const mc = document.querySelector('.fa-cc-mastercard');
                if (mc) mc.style.opacity = '1';
            } else if (/^3[47]/.test(numLimpio)) {
                const amex = document.querySelector('.fa-cc-amex');
                if (amex) amex.style.opacity = '1';
            }

            const esValida = validarAlgoritmoLuhn(numLimpio);
            aplicarFeedback(inputTarjeta, esValida, "Número de tarjeta no válido (Algoritmo de Luhn).");
        });
    }

    if (inputExpira) {
        inputExpira.addEventListener('input', (e) => {
            let val = e.target.value.replace(/\D/g, '').substring(0, 4);
            if (val.length >= 2) {
                e.target.value = val.substring(0, 2) + '/' + val.substring(2, 4);
            } else {
                e.target.value = val;
            }
            const regExp = /^(0[1-9]|1[0-2])\/([2-9][0-9])$/;
            aplicarFeedback(inputExpira, regExp.test(e.target.value), "Formato MM/AA no válido.");
        });
    }

    if (inputCvv) {
        inputCvv.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/\D/g, '').substring(0, 4);
            aplicarFeedback(inputCvv, /^\d{3,4}$/.test(e.target.value.trim()), "CVV debe tener 3 o 4 dígitos.");
        });
    }

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const vNombre = inputNombre ? inputNombre.value.trim().length >= 4 : true;
        const vTarjeta = inputTarjeta ? validarAlgoritmoLuhn(inputTarjeta.value.replace(/\s+/g, '')) : true;
        const vExpira = inputExpira ? /^(0[1-9]|1[0-2])\/([2-9][0-9])$/.test(inputExpira.value) : true;
        const vCvv = inputCvv ? /^\d{3,4}$/.test(inputCvv.value.trim()) : true;

        if (!vNombre || !vTarjeta || !vExpira || !vCvv) {
            notificarToast('Revisa los datos de la tarjeta de crédito o débito.', 'error');
            return;
        }

        const btnPagar = form.querySelector('button[type="submit"]');
        if (btnPagar) {
            btnPagar.disabled = true;
            btnPagar.innerHTML = 'Procesando Pago... <i class="fa-solid fa-spinner fa-spin"></i>';
        }

        setTimeout(() => {
            notificarToast('¡Pago procesado con éxito! Se envió el comprobante a tu correo.', 'exito');
            setTimeout(() => {
                window.location.href = 'servicios.html';
            }, 1800);
        }, 2000);
    });
}

function inicializarBusquedaRecibos(contenedor) {
    const inputSum = contenedor.querySelector('input');
    const btnBuscar = contenedor.querySelector('.btn-buscar') || contenedor.querySelector('button');

    if (!inputSum || !btnBuscar) return;

    inputSum.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/\D/g, '');
    });

    btnBuscar.addEventListener('click', (e) => {
        e.preventDefault();
        const val = inputSum.value.trim();

        if (!/^\d{7,8}$/.test(val)) {
            notificarToast('Ingresa un número de suministro de 7 u 8 dígitos.', 'error');
            return;
        }

        btnBuscar.disabled = true;
        btnBuscar.innerHTML = 'Buscando... <i class="fa-solid fa-spinner fa-spin"></i>';

        setTimeout(() => {
            btnBuscar.disabled = false;
            btnBuscar.innerHTML = 'Buscar <i class="fa-solid fa-magnifying-glass"></i>';

            const resultado = document.querySelector('.resultado-simulado');
            if (resultado) {
                resultado.style.display = 'block';
                const titulo = resultado.querySelector('h3');
                if (titulo) titulo.textContent = `Estado de Cuenta - Suministro N° ${val}`;
            }

            notificarToast('Información de recibos actualizada.', 'exito');
        }, 1000);
    });
}

function notificarToast(mensaje, tipo = 'exito') {
    let toast = document.getElementById('toast-notificacion');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast-notificacion';
        toast.style.cssText = 'position:fixed; bottom:25px; right:25px; padding:14px 22px; border-radius:10px; color:#fff; font-weight:600; font-size:0.9rem; z-index:10000; transition:all 0.3s ease; opacity:0; transform:translateY(30px); pointer-events:none; box-shadow:0 10px 25px rgba(0,0,0,0.25); display:flex; align-items:center; gap:10px;';
        document.body.appendChild(toast);
    }

    const colores = { exito: '#10b981', error: '#ef4444' };
    toast.style.backgroundColor = colores[tipo] || colores.exito;
    toast.innerHTML = `<i class="fa-solid ${tipo === 'exito' ? 'fa-circle-check' : 'fa-circle-xmark'}"></i> <span>${mensaje}</span>`;
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(30px)';
    }, 3800);
}