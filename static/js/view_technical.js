/***************************************************
 * view_technical.js (Unificado con lógica de imágenes)
 * Funciones para la vista de Técnicos (tickets asignados)
 * + Subida / previsualización de imágenes y comentarios
 ***************************************************/

/***** Funciones de Notificación *****/

/**
 * Muestra un toast (notificación pequeña) usando SweetAlert2.
 * @param {string} icon - Tipo de ícono ('success', 'error', 'info', etc.).
 * @param {string} title - Texto a mostrar.
 * @param {string} [position='top-end'] - Posición del toast.
 * @param {number} [timer=3000] - Tiempo en milisegundos.
 */
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
    Toast.fire({ icon: icon, title: title });
}

/**
 * Muestra una alerta de éxito (usada tras actualizar un ticket).
 */
function showSuccessTicketAlert() {
    Swal.fire({
        icon: 'success',
        title: '¡Actualizado con éxito!',
        text: 'Los cambios en el ticket han sido guardados correctamente.',
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
 * Formatea texto reemplazando saltos de línea por <br>.
 * @param {string} text
 * @returns {string}
 */
function formatTextWithLineBreaks(text) {
    if (!text) return '';
    return text.replace(/\n/g, '<br>');
}

/***** Funciones para Filtrar y Paginar Tickets *****/
window.updatePaginationAfterFilter = function () {
    const filteredRows = $('#ticketsTable tbody tr:visible').not('.no-results');
    const rowsPerPage = parseInt($('#rowsPerPage').val() || 10);
    const totalPages = Math.ceil(filteredRows.length / rowsPerPage);

    // Actualizar contador de tickets visibles
    $('#currentRowsCount').text(Math.min(rowsPerPage, filteredRows.length));

    // Regenerar botones de paginación si es necesario
    if ($('#pagination').length) {
        $('#pagination li').not('#prevPage, #nextPage').remove();
        for (let i = 1; i <= totalPages; i++) {
            $('#nextPage').before(`<li class="page-item ${i === 1 ? 'active' : ''}" data-page="${i}"><a class="page-link" href="#">${i}</a></li>`);
        }
    }
};

function filterTickets(status) {
    if (status === 'Todos') {
        $('tbody tr').show();
    } else {
        $('tbody tr').each(function () {
            var $select = $(this).find('select.status-select');
            var ticketStatus = $select.val();
            $(this).toggle(ticketStatus === status);
        });
    }
    updateTicketCounter();
    setTimeout(updatePaginationAfterFilter, 100);
}

/**
 * Función global para actualizar el contador de tickets visibles.
 */
window.updateTicketCounter = function() {
    const visibleTickets = $('tbody tr:visible').length;
    const counterElement = $('.badge.bg-primary strong');
    if (counterElement.length) {
        counterElement.text(visibleTickets);
    }
    console.log("Contador actualizado: " + visibleTickets);
};

/***** Document Ready Principal *****/
document.addEventListener("DOMContentLoaded", function () {
    // 1) Búsqueda en tabla
    const searchInput = document.getElementById("searchInput");
    const ticketsTable = document.getElementById("ticketsTable");
    if (searchInput && ticketsTable) {
        searchInput.addEventListener("input", function () {
            const searchValue = this.value.toLowerCase();
            const rows = ticketsTable.getElementsByTagName("tr");
            // Se omite la cabecera (índice 0)
            for (let i = 1; i < rows.length; i++) {
                let rowText = rows[i].textContent.toLowerCase();
                rows[i].style.display = rowText.includes(searchValue) ? "" : "none";
            }
            // Actualizar paginación tras la búsqueda
            setTimeout(updatePaginationAfterFilter, 100);
        });
    }

    // 2) Cambio de estado (AJAX)
    $(document).ready(function () {
        // Orden de los estados
        const stateOrder = {
            "Asignado": 1,
            "En proceso": 2,
            "En revision": 3
        };

        // Guardar valor original al inicio
        $('.status-select').each(function () {
            const $select = $(this);
            if (!$select.attr('data-original-state')) {
                $select.attr('data-original-state', $select.val());
            }
        });

        $('.status-select').on('change', function () {
            const $select = $(this);
            const ticketId = $select.data('ticket-id');
            const newStatus = $select.val();
            const originalValue = $select.attr('data-original-state');

            // Validar retroceso de estado
            if (stateOrder[newStatus] < stateOrder[originalValue]) {
                Swal.fire({
                    icon: 'error',
                    title: 'Operación no permitida',
                    text: `No se puede cambiar el estado de "${originalValue}" a "${newStatus}". No se permite retroceder en el flujo de estados.`,
                    confirmButtonColor: '#3085d6',
                    confirmButtonText: 'Entendido'
                });
                $select.val(originalValue);
                return false;
            }

            // Confirmar cambio
            Swal.fire({
                title: '¿Cambiar estado?',
                text: `¿Estás seguro de cambiar el estado del ticket #${ticketId} a "${newStatus}"?`,
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Sí, cambiar',
                cancelButtonText: 'Cancelar'
            }).then((result) => {
                if (result.isConfirmed) {
                    // Mostrar carga
                    $select.addClass('opacity-50').prop('disabled', true);
                    showToast('info', 'Actualizando estado...', 'top-end');
                    // Petición AJAX
                    $.ajax({
                        url: '/update_ticket_status_ajax',
                        method: 'POST',
                        data: {
                            ticket_id: ticketId,
                            status: newStatus
                        },
                        beforeSend: function() {
                            console.log("Enviando solicitud AJAX:", {
                                ticket_id: ticketId,
                                status: newStatus
                            });
                        },
                        success: function(response) {
                            console.log("Respuesta recibida:", response);
                            $select.removeClass('opacity-50').prop('disabled', false);
                            if (response.success) {
                                showToast('success', 'Actualizado con éxito', 'top-end');
                                updateRowStyles($select.closest('tr'), response.status);
                                $select.attr('data-original-state', newStatus);
                                
                                // Mover la fila al principio de la tabla
                                const $row = $select.closest('tr');
                                if (typeof window.moveTicketToTop === 'function') {
                                    window.moveTicketToTop($row);
                                }
                            } else {
                                showToast('error', response.message || 'Error al actualizar el estado', 'top-end');
                                $select.val(originalValue);
                            }
                        },
                        error: function(xhr, status, error) {
                            console.error("Error en la solicitud AJAX:", status, error);
                            console.error("Respuesta del servidor:", xhr.responseText);
                            $select.removeClass('opacity-50').prop('disabled', false);
                            $select.val(originalValue);
                            let errorMsg = 'Error al actualizar el estado';
                            if (xhr.responseJSON && xhr.responseJSON.message) {
                                errorMsg = xhr.responseJSON.message;
                            }
                            showToast('error', errorMsg, 'top-end');
                        }
                    });
                } else {
                    $select.val(originalValue);
                }
            });
        });

        function updateRowStyles($row, status) {
            $row.removeClass('table-success table-light table-secondary');
            if (status === 'Terminado') {
                $row.addClass('table-secondary');
            } else {
                $row.find('td').css('font-style', 'normal');
            }
        }

        // Inicializar estilos de filas
        $('.status-select').each(function () {
            const $select = $(this);
            const status = $select.val();
            updateRowStyles($select.closest('tr'), status);
        });

        // --- Filtro por estado (radios) ---
        $('input[name="filterStatus"]').on('change', function () {
            const selectedStatus = $(this).next('label').text().trim();
            filterTickets(selectedStatus);
            $('.filter-active').removeClass('filter-active');
            $(this).next('label').addClass('filter-active');
        });

        $('select[name="status"]').on('change', function () {
            const activeFilter = $('input[name="filterStatus"]:checked').next('label').text().trim();
            filterTickets(activeFilter);
        });

        // Inicializar filtro
        filterTickets('Todos');
        $('input[name="filterStatus"]:checked').next('label').addClass('filter-active');
    });

    // 3) Paginación
    $(document).ready(function () {
        let currentPage = 1;
        let rowsPerPage = 10;
        let totalPages = 1;
        let filteredRows = [];

        function initPagination() {
            const allRows = $('#ticketsTable tbody tr').not('.no-results');
            filteredRows = allRows;
            rowsPerPage = parseInt($('#rowsPerPage').val());
            totalPages = Math.ceil(filteredRows.length / rowsPerPage);
            generatePaginationButtons();
            showPage(1);
        }

        function generatePaginationButtons() {
            $('#pagination li').not('#prevPage, #nextPage').remove();
            if (totalPages <= 7) {
                for (let i = 1; i <= totalPages; i++) {
                    const isActive = i === currentPage ? 'active' : '';
                    $('#nextPage').before(`<li class="page-item ${isActive}" data-page="${i}"><a class="page-link" href="#">${i}</a></li>`);
                }
            } else {
                // Lógica de truncamiento (...)
                $('#nextPage').before(`<li class="page-item ${currentPage === 1 ? 'active' : ''}" data-page="1"><a class="page-link" href="#">1</a></li>`);
                let startPage = Math.max(2, currentPage - 2);
                let endPage = Math.min(totalPages - 1, currentPage + 2);
                if (startPage > 2) {
                    $('#nextPage').before('<li class="page-item disabled"><a class="page-link" href="#">...</a></li>');
                }
                for (let i = startPage; i <= endPage; i++) {
                    const isActive = i === currentPage ? 'active' : '';
                    $('#nextPage').before(`<li class="page-item ${isActive}" data-page="${i}"><a class="page-link" href="#">${i}</a></li>`);
                }
                if (endPage < totalPages - 1) {
                    $('#nextPage').before('<li class="page-item disabled"><a class="page-link" href="#">...</a></li>');
                }
                $('#nextPage').before(`<li class="page-item ${currentPage === totalPages ? 'active' : ''}" data-page="${totalPages}"><a class="page-link" href="#">${totalPages}</a></li>`);
            }
            updatePrevNextButtons();
        }

        function showPage(pageNum) {
            if (pageNum < 1 || pageNum > totalPages) return;
            currentPage = pageNum;
            filteredRows.hide();
            const startIndex = (pageNum - 1) * rowsPerPage;
            const endIndex = Math.min(startIndex + rowsPerPage, filteredRows.length);
            filteredRows.slice(startIndex, endIndex).show();
            $('#currentRowsCount').text(Math.min(rowsPerPage, filteredRows.length - startIndex));
            $('#pagination li').removeClass('active');
            $(`#pagination li[data-page="${pageNum}"]`).addClass('active');
            updatePrevNextButtons();
        }

        function updatePrevNextButtons() {
            if (currentPage === 1) {
                $('#prevPage').addClass('disabled');
            } else {
                $('#prevPage').removeClass('disabled');
            }
            if (currentPage === totalPages || totalPages === 0) {
                $('#nextPage').addClass('disabled');
            } else {
                $('#nextPage').removeClass('disabled');
            }
        }

        $('#rowsPerPage').on('change', function () {
            rowsPerPage = parseInt($(this).val());
            totalPages = Math.ceil(filteredRows.length / rowsPerPage);
            currentPage = 1;
            generatePaginationButtons();
            showPage(1);
        });

        $('#pagination').on('click', 'li:not(.disabled)', function (e) {
            e.preventDefault();
            const $this = $(this);
            if ($this.attr('id') === 'prevPage') {
                showPage(currentPage - 1);
            } else if ($this.attr('id') === 'nextPage') {
                showPage(currentPage + 1);
            } else {
                const pageNum = parseInt($this.data('page'));
                if (!isNaN(pageNum)) {
                    showPage(pageNum);
                }
            }
        });

        $('#searchInput').on('input', function () {
            setTimeout(updatePaginationAfterFilter, 100);
        });
        $('input[name="filterStatus"]').on('change', function () {
            setTimeout(updatePaginationAfterFilter, 100);
        });

        initPagination();
    });

    // 4) Ordenar tickets
    function sortTickets(sortBy) {
        const rows = $('#ticketsTable tbody tr').get();

        rows.sort(function (a, b) {
            if (sortBy === 'id-desc') {
                const idA = parseInt($(a).find('td:first').text().replace('#', ''));
                const idB = parseInt($(b).find('td:first').text().replace('#', ''));
                return idB - idA;
            } else if (sortBy === 'id-asc') {
                const idA = parseInt($(a).find('td:first').text().replace('#', ''));
                const idB = parseInt($(b).find('td:first').text().replace('#', ''));
                return idA - idB;
            } else if (sortBy === 'status') {
                const statusA = $(a).find('td:nth-child(5) select').val();
                const statusB = $(b).find('td:nth-child(5) select').val();
                return statusA.localeCompare(statusB);
            } else if (sortBy === 'priority') {
                const priorityA = $(a).find('td:nth-child(6) span').text().trim();
                const priorityB = $(b).find('td:nth-child(6) span').text().trim();
                return priorityA.localeCompare(priorityB);
            }
        });

        $.each(rows, function (index, row) {
            $('#ticketsTable tbody').append(row);
        });

        setTimeout(updatePaginationAfterFilter, 100);
    }

    $(document).on('click', '.sort-option', function (e) {
        e.preventDefault();
        const sortBy = $(this).data('sort');
        sortTickets(sortBy);
    });

    $(document).ready(function () {
        sortTickets('id-desc');
    });

    // 5) Manejo de la cámara y formulario de comentarios (PÁGINA DETALLE)
    if (document.getElementById('commentForm')) {
        // Botones y elementos de cámara
        const startCameraBtn = document.getElementById('startCamera');
        const takePhotoBtn = document.getElementById('takePhoto');
        const retakePhotoBtn = document.getElementById('retakePhoto');
        const cameraPreview = document.getElementById('cameraPreview');
        const photoCanvas = document.getElementById('photoCanvas');
        const photoPreview = document.getElementById('photoPreview');
        const capturedPhoto = document.getElementById('capturedPhoto');
        const photoData = document.getElementById('photoData');

        let stream = null;

        // Iniciar cámara
        if (startCameraBtn) {
            startCameraBtn.addEventListener('click', async () => {
                try {
                    stream = await navigator.mediaDevices.getUserMedia({
                        video: { facingMode: 'environment' },
                        audio: false
                    });
                    cameraPreview.srcObject = stream;
                    cameraPreview.classList.remove('d-none');
                    startCameraBtn.classList.add('d-none');
                    takePhotoBtn.classList.remove('d-none');
                } catch (err) {
                    console.error('Error al acceder a la cámara:', err);
                    showToast('error', 'No se pudo acceder a la cámara. Verifica los permisos.');
                }
            });
        }

        // Tomar foto
        if (takePhotoBtn) {
            takePhotoBtn.addEventListener('click', () => {
                const context = photoCanvas.getContext('2d');
                photoCanvas.width = cameraPreview.videoWidth;
                photoCanvas.height = cameraPreview.videoHeight;
                context.drawImage(cameraPreview, 0, 0, photoCanvas.width, photoCanvas.height);

                // Convertir a imagen
                const imageData = photoCanvas.toDataURL('image/jpeg');
                capturedPhoto.src = imageData;
                photoData.value = imageData;

                // Mostrar la foto capturada
                photoPreview.classList.remove('d-none');
                cameraPreview.classList.add('d-none');
                takePhotoBtn.classList.add('d-none');

                // Detener la cámara
                if (stream) {
                    stream.getTracks().forEach(track => track.stop());
                }
            });
        }

        // Volver a tomar foto
        if (retakePhotoBtn) {
            retakePhotoBtn.addEventListener('click', async () => {
                photoPreview.classList.add('d-none');
                try {
                    stream = await navigator.mediaDevices.getUserMedia({
                        video: { facingMode: 'environment' },
                        audio: false
                    });
                    cameraPreview.srcObject = stream;
                    cameraPreview.classList.remove('d-none');
                    takePhotoBtn.classList.remove('d-none');
                } catch (err) {
                    console.error('Error al acceder a la cámara:', err);
                    showToast('error', 'No se pudo acceder a la cámara. Verifica los permisos.');
                    startCameraBtn.classList.remove('d-none');
                }
            });
        }

        // Manejo del envío del formulario de comentario
        const commentForm = document.getElementById('commentForm');
        if (commentForm) {
            commentForm.addEventListener('submit', function(e) {
                e.preventDefault();
                const formData = new FormData(this);
                const submitBtn = this.querySelector('button[type="submit"]');
                const ticketId = submitBtn.getAttribute('data-ticket-id');

                // Deshabilitar el botón y mostrar indicador de carga
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Guardando...';

                // Agregar encabezado para identificar solicitud AJAX
                const headers = new Headers();
                headers.append('X-Requested-With', 'XMLHttpRequest');

                fetch(window.location.href, {
                    method: 'POST',
                    body: formData,
                    headers: headers
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Error en la respuesta del servidor');
                    }
                    return response.json();
                })
                .then(data => {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<i class="fas fa-save me-2"></i>Guardar Cambios';

                    if (data.success) {
                        // Mostrar el toast de éxito
                        Swal.fire({
                            icon: 'success',
                            title: data.message || 'Comentario actualizado correctamente',
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

                        // Mostrar mensajes adicionales si hay imágenes
                        if (data.images_success) {
                            showToast('success', `${data.images_success} imagen(es) subida(s) correctamente`);
                        }
                        if (data.images_errors) {
                            showToast('error', `${data.images_errors} imagen(es) no pudieron procesarse`);
                        }

                        // Redirigir a la lista de tickets después de un breve retraso
                        setTimeout(() => {
                            window.location.href = '/view_technical';
                        }, 1500);
                    } else {
                        // Mostrar mensaje de error
                        Swal.fire({
                            icon: 'error',
                            title: data.message || 'Error al guardar los cambios',
                            toast: true,
                            position: 'top-end',
                            showConfirmButton: false,
                            timer: 4000,
                            timerProgressBar: true
                        });
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<i class="fas fa-save me-2"></i>Guardar Cambios';
                    
                    // Mostrar toast de error
                    Swal.fire({
                        icon: 'error',
                        title: 'Error al procesar la solicitud',
                        text: 'Intenta de nuevo o contacta a soporte',
                        toast: true,
                        position: 'top-end',
                        showConfirmButton: false,
                        timer: 4000,
                        timerProgressBar: true
                    });
                });
            });
        }

        // Actualizar estado del ticket en la página de detalle
        const updateStatusBtn = document.getElementById('updateStatusBtn');
        const ticketStatus = document.getElementById('ticketStatus');
        if (updateStatusBtn && ticketStatus) {
            const originalStatus = ticketStatus.value;
            ticketStatus.setAttribute('data-original-state', originalStatus);

            updateStatusBtn.addEventListener('click', function() {
                const ticketId = ticketStatus.getAttribute('data-ticket-id');
                const newStatus = ticketStatus.value;
                const originalValue = ticketStatus.getAttribute('data-original-state');

                const stateOrder = {
                    "Asignado": 1,
                    "En proceso": 2,
                    "En revisión": 3
                };

                if (stateOrder[newStatus] < stateOrder[originalValue]) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Operación no permitida',
                        text: `No se puede cambiar el estado de "${originalValue}" a "${newStatus}". No se permite retroceder en el flujo de estados.`,
                        confirmButtonColor: '#3085d6',
                        confirmButtonText: 'Entendido'
                    });
                    ticketStatus.value = originalValue;
                    return false;
                }

                Swal.fire({
                    title: '¿Cambiar estado?',
                    text: `¿Estás seguro de cambiar el estado del ticket #${ticketId} a "${newStatus}"?`,
                    icon: 'question',
                    showCancelButton: true,
                    confirmButtonColor: '#3085d6',
                    cancelButtonColor: '#d33',
                    confirmButtonText: 'Sí, cambiar',
                    cancelButtonText: 'Cancelar'
                }).then((result) => {
                    if (result.isConfirmed) {
                        updateStatusBtn.disabled = true;
                        updateStatusBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Actualizando...';

                        $.ajax({
                            url: '/update_ticket_status_ajax',
                            method: 'POST',
                            data: {
                                ticket_id: ticketId,
                                status: newStatus
                            },
                            success: function(response) {
                                updateStatusBtn.disabled = false;
                                updateStatusBtn.innerHTML = '<i class="fas fa-save me-2"></i> Actualizar Estado';

                                if (response.success) {
                                    showToast('success', 'Actualizado con éxito', 'top-end');
                                    ticketStatus.setAttribute('data-original-state', newStatus);

                                    // Animar brevemente el botón para indicar éxito
                                    updateStatusBtn.classList.add('btn-success');
                                    updateStatusBtn.classList.remove('btn-primary');
                                    setTimeout(() => {
                                        updateStatusBtn.classList.remove('btn-success');
                                        updateStatusBtn.classList.add('btn-primary');
                                    }, 1500);

                                    if (newStatus === 'Terminado') {
                                        Swal.fire({
                                            icon: 'success',
                                            title: '¡Ticket Terminado!',
                                            html: 'El ticket ha sido marcado como terminado.<br><br>Ahora puedes notificar al cliente enviando un correo electrónico.',
                                            showCancelButton: true,
                                            confirmButtonColor: '#3085d6',
                                            cancelButtonColor: '#6c757d',
                                            confirmButtonText: 'Enviar correo al cliente',
                                            cancelButtonText: 'Cerrar'
                                        }).then((result) => {
                                            if (result.isConfirmed && document.getElementById('sendEmailBtn')) {
                                                // Mostrar modal de envío de correo
                                                const sendEmailModal = new bootstrap.Modal(document.getElementById('sendEmailModal'));
                                                sendEmailModal.show();
                                            }
                                        });
                                    }
                                } else {
                                    showToast('error', response.message || 'Error al actualizar el estado', 'top-end');
                                    ticketStatus.value = originalValue;
                                }
                            },
                            error: function(xhr, status, error) {
                                console.error("Error en la solicitud AJAX:", status, error);
                                updateStatusBtn.disabled = false;
                                updateStatusBtn.innerHTML = '<i class="fas fa-save me-2"></i> Actualizar Estado';
                                ticketStatus.value = originalValue;

                                let errorMsg = 'Error al actualizar el estado';
                                if (xhr.responseJSON && xhr.responseJSON.message) {
                                    errorMsg = xhr.responseJSON.message;
                                }
                                showToast('error', errorMsg, 'top-end');
                            }
                        });
                    } else {
                        ticketStatus.value = originalValue;
                    }
                });
            });
        }
    }

    // 6) Validar archivos al seleccionarlos (subida de imágenes)
    const imagesInput = document.getElementById('images');
    if (imagesInput) {
        imagesInput.addEventListener('change', function() {
            validateFiles(this, 5, 5);
        });
    }
});

/**
 * Valida los archivos seleccionados (tipo, tamaño, cantidad).
 * @param {HTMLInputElement} fileInput - elemento <input type="file">
 * @param {number} [maxFiles=5] - límite de archivos
 * @param {number} [maxSize=5] - tamaño máximo en MB
 * @returns {boolean}
 */
function validateFiles(fileInput, maxFiles = 5, maxSize = 5) {
    const files = fileInput.files;
    if (files.length > maxFiles) {
        showToast('error', `Máximo ${maxFiles} archivos permitidos`);
        fileInput.value = '';
        return false;
    }
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.match('image.*')) {
            showToast('error', `El archivo "${file.name}" no es una imagen válida`);
            fileInput.value = '';
            return false;
        }
        const fileSizeMB = file.size / (1024 * 1024);
        if (fileSizeMB > maxSize) {
            showToast('error', `El archivo "${file.name}" excede el tamaño máximo de ${maxSize}MB`);
            fileInput.value = '';
            return false;
        }
    }
    return true;
}

/**
 * Reordena un ticket para colocarlo al principio de la tabla.
 * @param {jQuery} $row - Fila del ticket a reordenar
 */
window.moveTicketToTop = function($row) {
    if (!$row || !$row.length) return;
    
    const $table = $('#ticketsTable tbody');
    if (!$table.length) return;
    
    // Animar y mover la fila al principio de la tabla
    $row.css('background-color', '#fffde7');
    setTimeout(function() {
        $row.fadeOut(300, function() {
            $table.prepend($row);
            $row.fadeIn(300);
            
            // Restaurar el color original después de un tiempo
            setTimeout(function() {
                $row.css('background-color', '');
                
                // Actualizar el contador y la paginación
                if (typeof window.updateTicketCounter === 'function') {
                    window.updateTicketCounter();
                }
                if (typeof window.updatePaginationAfterFilter === 'function') {
                    window.updatePaginationAfterFilter();
                }
            }, 1500);
        });
    }, 300);
};
