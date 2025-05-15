/**
 * technical_service.js - Gestión de tickets de servicio técnico
 * 
 * NOTA IMPORTANTE SOBRE COMPATIBILIDAD:
 * -------------------------------------
 * Este archivo ha sido modificado para ser compatible con todos los módulos del sistema:
 * 
 * 1. Las peticiones AJAX para actualizar estados SIEMPRE usan el parámetro 'state'
 * 2. El backend acepta tanto 'state' como 'status' para mantener compatibilidad
 * 3. El filtrado usa el atributo 'data-status' de las filas (<tr>) en lugar de los selectores
 * 4. Se mantiene compatibilidad con el módulo state.js usado en reparación interna
 * 
 * NO MODIFICAR ESTOS PARÁMETROS para mantener la consistencia entre módulos.
 */

/***************************************************
 * technical_service.js
 * Funciones para la vista de Technical Service (lista de tickets)
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
 * @param {Function} [callback] - Función opcional a ejecutar después de cerrar la alerta
 */
function showSuccessTicketAlert(callback) {
    Swal.fire({
        icon: 'success',
        title: '¡Operación exitosa!',
        text: 'El ticket ha sido procesado correctamente.',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        iconColor: '#28a745',
        customClass: {
            popup: 'colored-toast'
        },
        didClose: () => {
            if (typeof callback === 'function') {
                callback();
            }
        }
    });
}

/**
 * Función para actualizar el contador de tickets visibles.
 * @returns {number} El número de filas visibles
 */
function updateTicketCounter() {
    // Contar visibles
    const visibleRows = $('#ticketsTable tbody tr:visible').not('#noResultsRow').length;
    
    // Si hay filas, asegurarnos que el mensaje "no hay tickets" no esté visible
    if (visibleRows > 0) {
        // Verificar si existe una fila con el mensaje de no hay resultados
        const $noResultsRow = $('#ticketsTable tbody tr#noResultsRow');
        if ($noResultsRow.length) {
            $noResultsRow.remove();
        }
    }
    
    // Actualizar contador en el badge
    $('.badge.bg-secondary strong').text(visibleRows);
    
    // YA NO actualizamos el contador en el footer - eso lo hace la paginación
    // $('#currentRowsCount').text(visibleRows);
    
    return visibleRows;
}

/**
 * Mostrar u ocultar el mensaje de "No hay resultados"
 */
function showNoResultsMessage(show) {
    // Remover cualquier mensaje existente
    $('#noResultsRow').remove();
    
    if (show) {
        // Crear y añadir la fila de "No hay resultados"
        const colspan = $('#ticketsTable thead th').length; // Contar dinámicamente el número de columnas
        const statusText = $('input[name="filterStatus"]:checked').next('label').text().trim();
        const cityText = $('input[name="filterCity"]:checked').next('label').text().trim();
        
        let message = 'No hay tickets';
        if (cityText !== 'Todas') {
            message += ` en ${cityText}`;
        }
        if (statusText !== 'Todos') {
            message += ` con estado "${statusText}"`;
        }
        
        const $noResults = $(`
            <tr id="noResultsRow">
                <td colspan="${colspan}" class="text-center py-5">
                    <i class="fas fa-filter fa-3x mb-3 text-muted"></i>
                    <p class="text-muted">${message}</p>
                    <button class="btn btn-outline-secondary btn-sm reset-filter mt-2">
                        <i class="fas fa-times me-1"></i>Limpiar filtros
                    </button>
                </td>
            </tr>
        `);
        
        $('#ticketsTable tbody').append($noResults);
        
        // Agregar evento al botón de reseteo
        $('.reset-filter').on('click', function() {
            // Seleccionar el filtro "Todos" para estado
            $('#btnTodos').prop('checked', true);
            // Seleccionar el filtro "Todas" para ciudad
            $('#btnTodas').prop('checked', true);
            // Aplicar filtros
            filterTickets();
        });
    }
}

// Función para filtrar tickets (disponible globalmente)
window.filterTickets = function() {
    // Obtener filtros activos
    const selectedStatus = $('input[name="filterStatus"]:checked').next('label').text().trim();
    const selectedCity = $('input[name="filterCity"]:checked').next('label').text().trim();
    
    console.log(`Filtrando por: Estado=${selectedStatus}, Ciudad=${selectedCity}`);
    
    // Primero mostrar todas las filas para aplicar los filtros desde cero
    $('#ticketsTable tbody tr').show();
    
    // Aplicar filtros a todas las filas
    $('#ticketsTable tbody tr').not('#noResultsRow').each(function() {
        const $row = $(this);
        let statusMatch = true;
        let cityMatch = true;
        
        // Verificar filtro de estado
        const rowStatus = $row.attr('data-status');
        if (selectedStatus === 'Todos') {
            statusMatch = true;
        } else if (selectedStatus === 'Activos') {
            statusMatch = (rowStatus !== 'Terminado');
        } else {
            statusMatch = (rowStatus === selectedStatus);
        }
        
        // Verificar filtro de ciudad
        const rowCity = $row.attr('data-city');
        if (selectedCity === 'Todas') {
            cityMatch = true;
        } else {
            // Comparación exacta - asegurarnos de que coincida exactamente con el valor del atributo
            cityMatch = (rowCity === selectedCity);
        }
        
        // Para depuración - imprimimos en consola las filas que no coinciden por ciudad
        if (!cityMatch && selectedCity !== 'Todas') {
            console.log(`Fila no coincide por ciudad: El botón es '${selectedCity}' y la fila tiene '${rowCity}'`);
        }
        
        // Mostrar u ocultar la fila basado en ambos filtros
        const shouldShow = statusMatch && cityMatch;
        $row.toggle(shouldShow);
    });
    
    // Actualizar contador de tickets visibles
    const visibleCount = updateTicketCounter();
    
    // Mostrar mensaje si no hay resultados visibles
    showNoResultsMessage(visibleCount === 0);
    
    // Actualizar paginación - usamos el método explícito en lugar de setTimeout
    if (typeof window.initPagination === 'function') {
        window.initPagination();
    }
};

/***** Funcionalidad Principal *****/
document.addEventListener("DOMContentLoaded", function () {
    // Verificar si venimos de una actualización exitosa
    const urlParams = new URLSearchParams(window.location.search);
    
    if (urlParams.get('ticket_updated') === 'success' || urlParams.get('ticket_created') === 'success') {
        showSuccessTicketAlert();
        // Limpiar la URL para evitar que se muestre la alerta al refrescar
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    // --- Búsqueda en la tabla de tickets ---
    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
        searchInput.addEventListener("input", function () {
            const searchValue = this.value.toLowerCase();
            
            // Guardar estado de visibilidad antes de la búsqueda
            $('#ticketsTable tbody tr').not('#noResultsRow').each(function() {
                const $row = $(this);
                // Solo buscar en filas que ya son visibles según los filtros actuales
                if ($row.is(':visible')) {
                    const rowText = $row.text().toLowerCase();
                    $row.toggle(rowText.includes(searchValue));
                }
            });
            
            // Actualizar contador y paginación
            const visibleCount = updateTicketCounter();
            showNoResultsMessage(visibleCount === 0);
            
            // Actualizar paginación
            if (typeof window.initPagination === 'function') {
                window.initPagination();
            }
        });
    }

    // --- Actualización del estado del ticket vía AJAX ---
    $(document).ready(function () {
        // Definir el orden de los estados (de menor a mayor progreso)
        const stateOrder = {
            "Sin asignar": 1,
            "Asignado": 2,
            "Reingreso": 3,
            "En proceso": 4,
            "En Revision": 5,
            "Terminado": 6
        };

        // Mapeo de estados para timestamps
        const stateTimestampMap = {
            "Asignado": "assigned",
            "Reingreso": "re_entry",
            "En proceso": "in_progress",
            "En Revision": "in_revision",
            "Terminado": "finished",
            "Recibido": "received"
        };

        // Al cargar la página, guardar el estado original como atributo data-*
        $('.status-select').each(function() {
            const $select = $(this);
            // Usar el atributo data-original-state si existe, o el valor actual
            if (!$select.attr('data-original-state')) {
                $select.attr('data-original-state', $select.val());
            }
            
            // Asegurar que la fila tenga el atributo data-status correcto
            const currentState = $select.val();
            $select.closest('tr').attr('data-status', currentState);
        });

        $('.status-select').on('change', function () {
            const $select = $(this);
            const ticketId = $select.data('ticket-id');
            const newStatus = $select.val();
            const originalValue = $select.attr('data-original-state');
            
            // Validar si es un retroceso de estado (con excepciones específicas)
            const isBackward = stateOrder[newStatus] < stateOrder[originalValue];
            const isExceptionCase = (originalValue === "Asignado" && newStatus === "Reingreso");
            
            if (isBackward && !isExceptionCase) {
                // Es un retroceso no permitido, mostrar error y revertir
                Swal.fire({
                    icon: 'error',
                    title: 'Operación no permitida',
                    text: `No se puede cambiar el estado de "${originalValue}" a "${newStatus}". No se permite retroceder en el flujo de estados.`,
                    confirmButtonColor: '#3085d6',
                    confirmButtonText: 'Entendido'
                });
                
                // Restaurar el valor original
                $select.val(originalValue);
                return false;
            }

            // Texto de confirmación
            let confirmText = `¿Estás seguro de cambiar el estado del ticket #${ticketId} a "${newStatus}"?`;
            
            // Si el estado es "Terminado", agregar advertencia
            if (newStatus === "Terminado") {
                confirmText += `\n\nIMPORTANTE: Una vez que el ticket esté en estado "Terminado", ya no podrá ser editado.`;
            }

            // Si no es retroceso, continuar con el flujo normal
            // Preguntar al usuario
            Swal.fire({
                title: '¿Cambiar estado?',
                text: confirmText,
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Sí, cambiar',
                cancelButtonText: 'Cancelar'
            }).then((result) => {
                if (result.isConfirmed) {
                    // Mostrar indicador de carga
                    $select.addClass('opacity-50');
                    $select.prop('disabled', true);

                    // Mostrar toast de carga
                    showToast('info', 'Actualizando estado...', 'top-end');

                    // Datos a enviar
                    const postData = {
                        ticket_id: ticketId,
                        state: newStatus    // Nombre del parámetro unificado con otros módulos
                    };
                    
                    // Enviar solicitud AJAX
                    $.ajax({
                        url: '/update_ticket_status_ajax',
                        method: 'POST',
                        data: postData,
                        success: function (response) {
                            // Quitar indicador de carga
                            $select.removeClass('opacity-50');
                            $select.prop('disabled', false);

                            if (response.success) {
                                // Actualizar el estado original
                                $select.attr('data-original-state', newStatus);
                                
                                // Actualizar el atributo data-status de la fila para los filtros
                                const $row = $select.closest('tr');
                                $row.attr('data-status', newStatus);

                                // Si el estado cambia a Terminado, deshabilitar el botón de edición
                                if (newStatus === "Terminado") {
                                    const editButton = $row.find('button.btn-outline-secondary');
                                    editButton.addClass('disabled');
                                    editButton.attr('title', 'No se puede editar un ticket en estado Terminado');
                                    editButton.attr('disabled', true);
                                }

                                // Mover la fila al principio de la tabla
                                $row.css('background-color', '#fffde7');
                                const $table = $('#ticketsTable tbody');
                                setTimeout(function() {
                                    $row.fadeOut(300, function() {
                                        $table.prepend($row);
                                        $row.fadeIn(300);
                                        setTimeout(function() {
                                            $row.css('background-color', '');
                                            // Actualizar filtros y paginación
                                            filterTickets();
                                        }, 1500);
                                    });
                                }, 300);
                                
                                // Mostrar notificación de éxito
                                showToast('success', 'Estado actualizado correctamente', 'top-end');
                            } else {
                                // Mostrar error y restaurar valor original
                                showToast('error', response.message || 'Error al actualizar el estado', 'top-end');
                                $select.val(originalValue);
                            }
                        },
                        error: function (xhr) {
                            // Quitar indicador de carga
                            $select.removeClass('opacity-50');
                            $select.prop('disabled', false);
                            
                            // Restaurar valor original
                            $select.val(originalValue);
                            
                            // Mostrar mensaje de error
                            let errorMsg = 'Error al actualizar el estado';
                            if (xhr.responseJSON && xhr.responseJSON.message) {
                                errorMsg = xhr.responseJSON.message;
                            }
                            showToast('error', errorMsg, 'top-end');
                        }
                    });
                } else {
                    // Si el usuario cancela, restaurar el valor original
                    $select.val(originalValue);
                }
            });
        });
    });

    // --- Filtros Rápidos por Estado y Ciudad ---
    $(document).ready(function () {
        // Manejo del evento de cambio en los botones de filtro de estado
        $('input[name="filterStatus"]').on('change', function () {
            // Actualizar clase visual activa
            $('input[name="filterStatus"]').next('label').removeClass('filter-active');
            $(this).next('label').addClass('filter-active');
            
            // Aplicar filtros
            filterTickets();
        });
        
        // Manejo del evento de cambio en los botones de filtro de ciudad
        $('input[name="filterCity"]').on('change', function () {
            // Actualizar clase visual activa
            $('input[name="filterCity"]').next('label').removeClass('filter-active');
            $(this).next('label').addClass('filter-active');
            
            // Aplicar filtros
            filterTickets();
        });

        // Inicializar filtros al cargar la página
        setTimeout(function() {
            // Activar clase visual en los filtros seleccionados
            $('input[name="filterStatus"]:checked').next('label').addClass('filter-active');
            $('input[name="filterCity"]:checked').next('label').addClass('filter-active');
            
            // Aplicar filtros iniciales
            filterTickets();
        }, 100);
    });

    /***** Paginación de Tickets *****/
    $(document).ready(function () {
        let currentPage = 1;
        let rowsPerPage = 10;
        let totalPages = 1;

        // Función para inicializar la paginación
        window.initPagination = function() {
            // Considerar solo las filas visibles (ya filtradas)
            const visibleRows = $('#ticketsTable tbody tr:visible').not('#noResultsRow');
            rowsPerPage = parseInt($('#rowsPerPage').val() || 10);
            totalPages = Math.ceil(visibleRows.length / rowsPerPage);
            
            // Ajustar a página 1 con los nuevos datos filtrados
            currentPage = 1;
            generatePaginationButtons();
            showPage(currentPage);
        };

        // Función para generar botones de paginación
        function generatePaginationButtons() {
            $('#pagination li').not('#prevPage, #nextPage').remove();
            
            // Si no hay páginas, mostrar solo página 1 inactiva
            if (totalPages === 0) {
                $('#nextPage').before(`<li class="page-item active" data-page="1"><a class="page-link" href="#">1</a></li>`);
                $('#prevPage, #nextPage').addClass('disabled');
                return;
            }
            
            if (totalPages <= 7) {
                for (let i = 1; i <= totalPages; i++) {
                    const isActive = i === currentPage ? 'active' : '';
                    $('#nextPage').before(`<li class="page-item ${isActive}" data-page="${i}"><a class="page-link" href="#">${i}</a></li>`);
                }
            } else {
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

        // Función para mostrar una página específica
        window.showPage = function(pageNum) {
            if (pageNum < 1 || pageNum > totalPages) return;
            
            // Actualizar la página actual
            currentPage = pageNum;
            
            // Seleccionar solo las filas visibles (ya filtradas)
            const visibleRows = $('#ticketsTable tbody tr:visible').not('#noResultsRow');
            
            // Ocultar todas las filas visibles primero
            visibleRows.hide();
            
            // Calcular qué filas mostrar en la página actual
            const startIndex = (pageNum - 1) * rowsPerPage;
            const endIndex = Math.min(startIndex + rowsPerPage, visibleRows.length);
            
            // Mostrar solo las filas correspondientes a la página actual
            visibleRows.slice(startIndex, endIndex).show();
            
            // Calcular información para el contador
            const currentPageCount = Math.min(rowsPerPage, endIndex - startIndex);
            const totalVisible = visibleRows.length;
            
            // Actualizar contadores y UI
            $('#currentRowsCount').text(`${currentPageCount} de ${totalVisible}`);
            $('#pagination li').removeClass('active');
            $(`#pagination li[data-page="${pageNum}"]`).addClass('active');
            updatePrevNextButtons();
        };

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

        // Evento de cambio en la cantidad de filas por página
        $('#rowsPerPage').on('change', function () {
            rowsPerPage = parseInt($(this).val());
            initPagination(); // Reinicializar con la nueva cantidad
        });

        // Eventos de navegación por paginación
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

        // Inicializar la paginación
        initPagination();
    });

    // Deshabilitar botones de edición para tickets terminados
    $('#ticketsTable tbody tr').each(function() {
        const ticketState = $(this).attr('data-status');
        if (ticketState === 'Terminado') {
            // Buscar y desactivar el botón de edición
            const editButton = $(this).find('button.btn-outline-secondary');
            editButton.addClass('disabled');
            editButton.attr('title', 'No se puede editar un ticket en estado Terminado');
            editButton.attr('disabled', true);
        }
    });
});

