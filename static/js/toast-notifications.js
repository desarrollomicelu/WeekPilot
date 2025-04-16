/**
 * toast-notifications.js
 * Sistema centralizado de notificaciones tipo toast para WeekPilot
 */

// Función para mostrar un toast utilizando SweetAlert2
function showToast(icon, title, position = 'top-end', timer = 3000) {
    const Toast = Swal.mixin({
        toast: true,
        position: position,
        showConfirmButton: false,
        timer: timer,
        timerProgressBar: true,
        didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer);
            toast.addEventListener('mouseleave', Swal.resumeTimer);
        }
    });

    Toast.fire({
        icon: icon,  // 'success', 'error', 'warning', 'info', 'question'
        title: title
    });
}

// Función para mostrar un toast de éxito
function showSuccessToast(message, position = 'top-end') {
    showToast('success', message, position);
}

// Función para mostrar un toast de error
function showErrorToast(message, position = 'top-end') {
    showToast('error', message, position);
}

// Función para mostrar un toast de información
function showInfoToast(message, position = 'top-end') {
    showToast('info', message, position);
}

// Función para mostrar un toast de advertencia
function showWarningToast(message, position = 'top-end') {
    showToast('warning', message, position);
}

// Función para manejar los mensajes flash del servidor y mostrarlos como toast
function handleFlashMessages() {
    const flashMessages = document.querySelectorAll('.alert');
    
    flashMessages.forEach(message => {
        const isSuccess = message.classList.contains('alert-success');
        const isError = message.classList.contains('alert-danger');
        const isWarning = message.classList.contains('alert-warning');
        const isInfo = message.classList.contains('alert-info');
        const messageText = message.textContent.trim();
        
        if (isSuccess) {
            showSuccessToast(messageText);
        } else if (isError) {
            showErrorToast(messageText);
        } else if (isWarning) {
            showWarningToast(messageText);
        } else if (isInfo) {
            showInfoToast(messageText);
        }
        
        // Ocultar el mensaje flash original
        message.remove();
    });
}

// Inicializar los mensajes flash cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', handleFlashMessages);

// Función para confirmar una acción con SweetAlert2 y ejecutar un callback si se confirma
function confirmAction(title, text, confirmButtonText, cancelButtonText, callback) {
    Swal.fire({
        title: title,
        text: text,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: confirmButtonText,
        cancelButtonText: cancelButtonText
    }).then((result) => {
        if (result.isConfirmed && typeof callback === 'function') {
            callback();
        }
    });
}

// Función para mostrar un mensaje de carga
function showLoading(message = 'Procesando...') {
    Swal.fire({
        title: message,
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });
}

// Función para cerrar el mensaje de carga
function closeLoading() {
    Swal.close();
} 