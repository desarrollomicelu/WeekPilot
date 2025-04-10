/**
 * view_detail_ticket.js
 * Script específico para la página de detalle de ticket (view_detail_ticket.html)
 */

// Inicializar componentes cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar el modal para enviar correo
    initEmailModal();
    
    // Procesar mensajes flash para mostrarlos como toasts o alertas
    processFlashMessages();
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
 * Procesa los mensajes flash y los muestra como toasts o alertas según su tipo
 */
function processFlashMessages() {
    // Esta función será llamada desde el HTML con Jinja2
    // La implementación real estará en el template
    
    // Buscar elementos con la clase flash-message
    const flashElements = document.querySelectorAll('.flash-message');
    
    flashElements.forEach(element => {
        const message = element.getAttribute('data-message');
        const category = element.getAttribute('data-category');
        
        if (message && category) {
            // Si es un mensaje de éxito, mostrar como toast
            if (category === 'success') {
                showNotificationToast(message, category);
            } 
            // Si es un mensaje de error o advertencia, mostrar como alerta normal
            else {
                showNormalAlert(message, category);
            }
        }
    });
}
/**
 * Muestra un toast de notificación personalizado (solo para mensajes de éxito)
 * @param {string} message - El mensaje a mostrar
 * @param {string} type - El tipo de notificación ('success')
 */
function showNotificationToast(message, type) {
    const toast = document.getElementById('emailToast');
    const toastHeader = document.getElementById('emailToastHeader');
    const toastTitle = document.getElementById('emailToastTitle');
    const toastMessage = document.getElementById('emailToastMessage');
    
    if (!toast || !toastHeader || !toastTitle || !toastMessage) {
        console.error('Elementos de toast no encontrados');
        return;
    }
    
    // Limpiar clases anteriores
    toastHeader.className = 'toast-header';
    
    // Establecer color según tipo
    toastHeader.classList.add('bg-success', 'text-white');
    toastTitle.textContent = '¡Éxito!';
    
    // Establecer mensaje
    toastMessage.textContent = message;
    
    // Configurar opciones del toast (autohide después de 3 segundos)
    const toastOptions = {
        autohide: true,
        delay: 3000
    };
    
    // Mostrar toast
    const bsToast = new bootstrap.Toast(toast, toastOptions);
    bsToast.show();
}

/**
 * Muestra una alerta normal en la página (para mensajes de error y advertencia)
 * @param {string} message - El mensaje a mostrar
 * @param {string} type - El tipo de alerta ('danger', 'warning', 'info')
 */
function showNormalAlert(message, type) {
    // Crear el contenedor de alertas si no existe
    let alertsContainer = document.getElementById('alertsContainer');
    if (!alertsContainer) {
        alertsContainer = document.createElement('div');
        alertsContainer.id = 'alertsContainer';
        alertsContainer.className = 'mt-3';
        
        // Insertar el contenedor al principio del contenido principal
        const mainContent = document.querySelector('.container-fluid');
        if (mainContent) {
            mainContent.insertBefore(alertsContainer, mainContent.firstChild);
        } else {
            document.body.insertBefore(alertsContainer, document.body.firstChild);
        }
    }
    
    // Crear la alerta
    const alertElement = document.createElement('div');
    alertElement.className = `alert alert-${type} alert-dismissible fade show`;
    alertElement.role = 'alert';
    
    // Icono según el tipo
    let icon = 'info-circle';
    if (type === 'danger') icon = 'exclamation-triangle';
    if (type === 'warning') icon = 'exclamation-circle';
    
    // Contenido de la alerta
    alertElement.innerHTML = `
        <i class="fas fa-${icon} me-2"></i>
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    // Añadir la alerta al contenedor
    alertsContainer.appendChild(alertElement);
    
    // Configurar auto-cierre después de 10 segundos para no acumular alertas
    setTimeout(() => {
        if (alertElement.parentNode) {
            const bsAlert = new bootstrap.Alert(alertElement);
            bsAlert.close();
        }
    }, 10000);
}
