/**
 * view_detail_ticket.js
 * Script específico para la página de detalle de ticket (view_detail_ticket.html)
 */

// Inicializar componentes cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar el modal para enviar correo
    initEmailModal();
    
    // Verificar si el correo se envió con éxito (parámetro en la URL)
    checkEmailSent();
});

/**
 * Inicializa el modal para enviar correo y configura sus eventos
 */
function initEmailModal() {
    const sendEmailBtn = document.getElementById('sendEmailBtn');
    if (sendEmailBtn) {
        sendEmailBtn.addEventListener('click', function() {
            const sendEmailModal = new bootstrap.Modal(document.getElementById('sendEmailModal'));
            sendEmailModal.show();
        });
    }
    
    // Configurar el formulario de envío de correo
    const sendEmailForm = document.getElementById('sendEmailForm');
    const sendEmailButton = document.getElementById('sendEmailButton');
    const emailLoadingIndicator = document.getElementById('emailLoadingIndicator');
    
    if (sendEmailForm) {
        sendEmailForm.addEventListener('submit', function() {
            // Mostrar indicador de carga
            if (emailLoadingIndicator) {
                emailLoadingIndicator.classList.remove('d-none');
            }
            
            // Deshabilitar botón para evitar múltiples envíos
            if (sendEmailButton) {
                sendEmailButton.disabled = true;
                sendEmailButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Enviando...';
            }
        });
    }
}

/**
 * Verifica si el correo fue enviado con éxito según parámetros en la URL
 */
function checkEmailSent() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('email_sent') === 'success') {
        showSuccessToast('¡Correo enviado con éxito!', 'El cliente ha sido notificado correctamente.');
        // Limpiar el parámetro de la URL para evitar mostrar el mensaje al recargar
        window.history.replaceState({}, document.title, window.location.pathname);
    } else if (urlParams.get('email_sent') === 'error') {
        showErrorToast('Error al enviar correo', 'No se pudo enviar la notificación. Intente nuevamente.');
        window.history.replaceState({}, document.title, window.location.pathname);
    }
}

/**
 * Muestra un toast de éxito
 * @param {string} title - Título del toast
 * @param {string} message - Mensaje a mostrar
 */
function showSuccessToast(title, message) {
    Swal.fire({
        icon: 'success',
        title: title,
        text: message,
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        iconColor: '#28a745',
        customClass: {
            popup: 'colored-toast'
        }
    });
}

/**
 * Muestra un toast de error
 * @param {string} title - Título del toast
 * @param {string} message - Mensaje a mostrar
 */
function showErrorToast(title, message) {
    Swal.fire({
        icon: 'error',
        title: title,
        text: message,
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 4000,
        timerProgressBar: true,
        iconColor: '#dc3545',
        customClass: {
            popup: 'colored-toast'
        }
    });
}
