/**
 * warranty.js - Gestión de garantías
 * 
 * NOTA IMPORTANTE SOBRE COMPATIBILIDAD:
 * -------------------------------------
 * Este archivo ha sido adaptado del módulo de servicio técnico para mantener la compatibilidad:
 * 
 * 1. Las peticiones AJAX para actualizar estados SIEMPRE usan el parámetro 'state'
 * 2. El backend acepta tanto 'state' como 'status' para mantener compatibilidad
 * 3. El filtrado usa el atributo 'data-status' de las filas (<tr>) en lugar de los selectores
 * 
 * NO MODIFICAR ESTOS PARÁMETROS para mantener la consistencia entre módulos.
 */

/***************************************************
 * warranty.js
 * Funciones para la vista de Gestión de Garantías
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
 * Muestra una alerta de éxito (usada tras actualizar una garantía).
 * @param {Function} [callback] - Función opcional a ejecutar después de cerrar la alerta
 */
function showSuccessTicketAlert(callback) {
    Swal.fire({
        icon: 'success',
        title: '¡Operación exitosa!',
        text: 'La garantía ha sido procesada correctamente.',
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


/***** Funcionalidad de Búsqueda y Filtrado *****/
document.addEventListener("DOMContentLoaded", function () {
    // Verificar si venimos de una actualización exitosa
    const urlParams = new URLSearchParams(window.location.search);
    console.log("URL Params:", Object.fromEntries(urlParams.entries()));
    
    if (urlParams.get('ticket_updated') === 'success') {
        console.log("Garantía actualizada con éxito - Mostrando alerta");
        showSuccessTicketAlert();
        // Limpiar la URL para evitar que se muestre la alerta al refrescar
        window.history.replaceState({}, document.title, window.location.pathname);
    } else if (urlParams.get('ticket_created') === 'success') {
        console.log("Garantía creada con éxito - Mostrando alerta");
        showSuccessTicketAlert();
        // Limpiar la URL para evitar que se muestre la alerta al refrescar
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    // --- Búsqueda en la tabla de garantías ---
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

    // --- Actualización del estado de la garantía vía AJAX ---
    $(document).ready(function () {
        // Definir el orden de los estados (de menor a mayor progreso)
        const stateOrder = {
            "Sin asignar": 1,
            "Asignado": 2,
            "Reingreso": 3,
            "En proceso": 4,
            "En Revision": 5,
            "Aprobada": 6,
            "Rechazada": 6
        };

        // Variables para seguimiento de filtros activos
        let filteredStatus = 'Todos';

        // Filtrado por estado
        $('input[name="filterStatus"]').on('change', function() {
            filteredStatus = $(this).next('label').text().trim();
            // Si hay una búsqueda activa, limpiarla para aplicar el filtro correctamente
            if ($('#searchInput').val()) {
                $('#searchInput').val('').trigger('input');
            }
        });
        
        // Filtrado por ciudad usando el dropdown
        $('.city-filter').on('click', function(e) {
            e.preventDefault();
            
            // Obtener la ciudad seleccionada
            const city = $(this).data('city');
            
            // Actualizar el texto del botón dropdown
            if (city === 'todas') {
                $('#selectedCityText').text('Todas las ciudades');
            } else {
                const cityText = $(this).text();
                $('#selectedCityText').text(cityText);
            }
            
            // Mostrar indicador de carga
            const $table = $('#ticketsTable');
            const $tbody = $table.find('tbody');
            $tbody.html('<tr><td colspan="8" class="text-center py-4"><i class="fas fa-spinner fa-spin me-2"></i>Cargando tickets...</td></tr>');
            
            // Hacer petición AJAX al backend
            $.ajax({
                url: '/filter_by_city',
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({ city: city }),
                success: function(response) {
                    if (response.success) {
                        // Reconstruir la tabla con los datos recibidos
                        displayTickets(response.tickets);
                        
                        // Luego aplicar el filtro de estado actual si no es "Todos"
                        if (filteredStatus !== 'Todos') {
                            applyStatusFilter();
                        }
                        
                        // Actualizar paginación
                        setTimeout(updatePaginationAfterFilter, 100);
                    } else {
                        // Mostrar error
                        showToast('error', response.message || 'Error al filtrar por ciudad');
                        
                        // Restablecer tabla vacía con mensaje
                        $tbody.html('<tr><td colspan="8" class="text-center py-4">Error al cargar los tickets. Intente de nuevo.</td></tr>');
                    }
                },
                error: function(xhr, status, error) {
                    console.error('Error en filtro por ciudad:', error);
                    showToast('error', 'Error al comunicarse con el servidor');
                    
                    // Restablecer tabla vacía con mensaje
                    $tbody.html('<tr><td colspan="8" class="text-center py-4">Error al cargar los tickets. Intente de nuevo.</td></tr>');
                }
            });
        });
        
        // Función para aplicar todos los filtros activos
        function applyFilters() {
            console.log(`Aplicando filtros: Estado=${filteredStatus}`);
            
            // Actualizar contadores y paginación
            updateTicketCounter();
            setTimeout(updatePaginationAfterFilter, 100);
        }
        
        // Función para aplicar solo el filtro por estado
        function applyStatusFilter() {
            if (filteredStatus === 'Todos') {
                // Mostrar todos los tickets
                $('#ticketsTable tbody tr').not('#noResultsRow').show();
            } else if (filteredStatus === 'Activos') {
                // Mostrar tickets con estado diferente a "Terminado", "Aprobada" y "Rechazada"
                $('#ticketsTable tbody tr').each(function () {
                    const ticketState = $(this).attr('data-status');
                    $(this).toggle(ticketState !== 'Terminado' && ticketState !== 'Aprobada' && ticketState !== 'Rechazada');
                });
            } else {
                // Filtrar por el estado específico seleccionado
                $('#ticketsTable tbody tr').each(function () {
                    const ticketState = $(this).attr('data-status');
                    $(this).toggle(ticketState === filteredStatus);
                });
            }
            
            // Actualizar contador de tickets visibles
            updateTicketCounter();
        }
        
        // Función para mostrar los tickets recibidos del servidor
        function displayTickets(tickets) {
            const $tbody = $('#ticketsTable tbody');
            $tbody.empty();
            
            if (tickets.length === 0) {
                // Mejorar el mensaje cuando no hay tickets
                const cityText = $('#selectedCityText').text();
                const statusText = $('input[name="filterStatus"]:checked').next('label').text().trim();
                
                let message = 'No hay tickets';
                if (cityText !== 'Todas las ciudades') {
                    message += ` en ${cityText}`;
                }
                if (filteredStatus !== 'Todos') {
                    message += ` con estado "${statusText}"`;
                }
                
                $tbody.html(`
                    <tr>
                        <td colspan="8" class="text-center py-4">
                            <i class="fas fa-filter fa-2x mb-3 text-muted"></i>
                            <p class="text-muted">${message}</p>
                            <a href="/warranty/create_warranty" class="btn btn-secondary">
                                <i class="fas fa-plus me-1 text-white"></i> Crear nueva garantía
                            </a>
                        </td>
                    </tr>
                `);
                return;
            }
            
            // Generar HTML para cada ticket
            tickets.forEach(ticket => {
                let problemsHtml = '';
                if (ticket.problems && ticket.problems.length > 0) {
                    problemsHtml = '<div class="d-flex flex-wrap gap-1">';
                    ticket.problems.forEach(problem => {
                        problemsHtml += `<span class="badge bg-secondary">${problem}</span>`;
                    });
                    problemsHtml += '</div>';
                } else {
                    problemsHtml = '<span class="text-muted">N/A</span>';
                }
                
                // Formatear referencia
                let reference = ticket.reference ? ticket.reference.replace(/seminuevo|Seminuevo|SEMINUEVO/g, '').trim() : 'N/A';
                
                // Generar fila HTML
                const row = `
                    <tr class="align-middle" data-status="${ticket.state}" data-city="${ticket.city}">
                        <td class="ps-2 fw-bold" style="width: 5%">#${ticket.id_ticket}</td>
                        <td class="text-nowrap">${reference}</td>
                        <td class="text-nowrap">${ticket.city || 'N/A'}</td>
                        <td class="text-nowrap">${ticket.client_name || 'N/A'}</td>
                        <td>
                            <select class="form-select form-select-sm status-select" data-ticket-id="${ticket.id_ticket}" data-original-state="${ticket.state}">
                                <option value="Sin asignar" ${ticket.state === 'Sin asignar' ? 'selected' : ''}>Sin asignar</option>
                                <option value="Asignado" ${ticket.state === 'Asignado' ? 'selected' : ''}>Asignado</option>
                                <option value="Reingreso" ${ticket.state === 'Reingreso' ? 'selected' : ''}>Reingreso</option>
                                <option value="En proceso" ${ticket.state === 'En proceso' ? 'selected' : ''}>En proceso</option>
                                <option value="En Revision" ${ticket.state === 'En Revision' ? 'selected' : ''}>En Revision</option>
                                <option value="Terminado" ${ticket.state === 'Terminado' ? 'selected' : ''}>Terminado</option>
                            </select>
                        </td>
                        <td>
                            <span class="badge ${ticket.priority === 'Alta' ? 'bg-danger' : ticket.priority === 'Media' ? 'bg-warning text-dark' : 'bg-success'}">
                                ${ticket.priority}
                            </span>
                        </td>
                        <td>${problemsHtml}</td>
                        <td class="text-center">
                            <div class="btn-group btn-group-sm">
                                <form action="/warranty/edit_warranty/${ticket.id_ticket}" method="get" style="display:inline-block;">
                                    <button type="submit" class="btn btn-sm btn-outline-secondary edit-ticket-btn" ${ticket.state === 'Terminado' ? 'disabled title="No se puede editar un ticket en estado Terminado"' : ''}>
                                        <i class="fas fa-edit"></i>
                                    </button>
                                </form>
                                <form action="/warranty/view_detail_warranty/${ticket.id_ticket}" method="get" style="display:inline-block;">
                                    <button type="submit" class="btn btn-sm btn-outline-info">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                </form>
                            </div>
                        </td>
                    </tr>
                `;
                
                $tbody.append(row);
            });
            
            // Reinicializar eventos en elementos de la tabla
            initializeWarrantyEvents();
        }
        
        // Reinstalar event handlers para los selectores de estado
        function initializeWarrantyEvents() {
            $('.status-select').off('change').on('change', function() {
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
                let confirmText = `¿Estás seguro de cambiar el estado de la garantía #${ticketId} a "${newStatus}"?`;
                
                // Confirmar cambio de estado
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
                        updateWarrantyStatus($select, ticketId, newStatus, originalValue, '');
                    } else {
                        // Si el usuario cancela, restaurar el valor original
                        $select.val(originalValue);
                    }
                });
            });
        }

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

        // Mapeo de estados para timestamps
        const stateTimestampMap = {
            "Asignado": "assigned",
            "Reingreso": "re_entry",
            "En proceso": "in_progress",
            "En Revision": "in_revision",
            "Aprobada": "approved",
            "Rechazada": "rejected"
        };

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
            let confirmText = `¿Estás seguro de cambiar el estado de la garantía #${ticketId} a "${newStatus}"?`;
            
            // Si el estado es "Rechazada", solicitar motivo
            let rejectReason = '';
            if (newStatus === "Rechazada") {
                // Mostrar modal para pedir motivo del rechazo
                Swal.fire({
                    title: 'Motivo del rechazo',
                    text: 'Por favor, indique el motivo por el cual se rechaza esta garantía:',
                    input: 'textarea',
                    inputPlaceholder: 'Escriba el motivo aquí...',
                    showCancelButton: true,
                    confirmButtonText: 'Confirmar',
                    cancelButtonText: 'Cancelar',
                    showLoaderOnConfirm: true,
                    inputValidator: (value) => {
                        if (!value || value.trim() === '') {
                            return 'Debe ingresar un motivo para el rechazo';
                        }
                    },
                    preConfirm: (reason) => {
                        rejectReason = reason;
                        return true;
                    }
                }).then((result) => {
                    if (result.isConfirmed) {
                        // Continuar con la actualización de estado
                        updateWarrantyStatus($select, ticketId, newStatus, originalValue, rejectReason);
                    } else {
                        // Restaurar el valor original si cancela
                        $select.val(originalValue);
                    }
                });
                return; // Salir para que el flujo continúe en el modal
            }

            // Si no es rechazada, seguir el flujo normal
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
                    updateWarrantyStatus($select, ticketId, newStatus, originalValue, '');
                } else {
                    // Si el usuario cancela, restaurar el valor original
                    $select.val(originalValue);
                }
            });
        });

        // Función para actualizar el estado de la garantía
        function updateWarrantyStatus($select, ticketId, newStatus, originalValue, rejectReason) {
            // Mostrar indicador de carga
            $select.addClass('opacity-50');
            $select.prop('disabled', true);

            // Mostrar toast de carga
            showToast('info', 'Actualizando estado...', 'top-end');

            // Preparar datos para enviar
            const requestData = {
                ticket_id: ticketId,
                state: newStatus // Nombre del parámetro unificado con otros módulos
            };

            // Agregar el motivo del rechazo si existe
            if (rejectReason) {
                requestData.reject_reason = rejectReason;
            }

            // Enviar solicitud AJAX con el parámetro state (compatible con todos los módulos)
            $.ajax({
                url: '/update_ticket_status_ajax',
                method: 'POST',
                data: requestData,
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
                        
                        console.log("Estado actualizado a:", newStatus);
                        console.log("Atributo data-status:", $row.attr('data-status'));

                        // Si el estado cambia a uno final, deshabilitar el botón de edición
                        if (newStatus === "Aprobada" || newStatus === "Rechazada") {
                            const editButton = $row.find('button.btn-outline-secondary');
                            editButton.addClass('disabled');
                            editButton.attr('title', 'No se puede editar una garantía en estado ' + newStatus);
                            editButton.attr('disabled', true);
                        }
                        
                        // Actualizar el timestamp si está disponible
                        if (response.timestamp) {
                            const timestampField = stateTimestampMap[newStatus];
                            if (timestampField) {
                                console.log(`Estado actualizado a: ${newStatus}, campo timestamp: ${timestampField}`);
                                const $timestamp = $row.find(`.${timestampField}-timestamp`);
                                
                                if ($timestamp.length) {
                                    console.log(`Actualizando timestamp con valor: ${response.timestamp}`);
                                    $timestamp.text(response.timestamp);
                                    $timestamp.addClass('active-timestamp');
                                } else {
                                    console.log(`No se encontró elemento para mostrar el timestamp de ${newStatus}`);
                                }
                            } else {
                                console.log(`No se encontró mapeo de timestamp para el estado ${newStatus}`);
                            }
                        } else {
                            console.log('No se recibió información de timestamp en la respuesta');
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
                                    // Actualizar contador y paginación
                                    updateTicketCounter();
                                    updatePaginationAfterFilter();
                                    
                                    // Reaplica el filtro activo para que se muestre correctamente
                                    const activeFilter = $('input[name="filterStatus"]:checked').next('label').text().trim();
                                    if (activeFilter === newStatus || activeFilter === 'Todos') {
                                        $row.show();
                                    } else {
                                        $row.hide();
                                        // Mostrar notificación informativa de que la garantía ya no es visible
                                        showToast('info', `La garantía #${ticketId} se ha movido al filtro "${newStatus}"`, 'top-end', 5000);
                                    }
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
        }
    });


    // --- Filtros Rápidos por Estado y Ciudad ---
    $(document).ready(function () {
        function filterTickets() {
            // Obtener filtros activos
            const selectedStatus = $('input[name="filterStatus"]:checked').next('label').text().trim();
            const selectedCity = $('input[name="filterCity"]:checked').next('label').text().trim();
            
            console.log(`Filtrando por: Estado=${selectedStatus}, Ciudad=${selectedCity}`);
            
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
                    statusMatch = (rowStatus !== 'Terminado' && rowStatus !== 'Aprobada' && rowStatus !== 'Rechazada');
                } else {
                    statusMatch = (rowStatus === selectedStatus);
                }
                
                // Verificar filtro de ciudad
                const rowCity = $row.attr('data-city');
                if (selectedCity === 'Todas') {
                    cityMatch = true;
                } else {
                    cityMatch = (rowCity === selectedCity);
                }
                
                // Mostrar u ocultar la fila basado en ambos filtros
                $row.toggle(statusMatch && cityMatch);
            });
            
            // Actualizar contador de garantías visibles
            const visibleCount = updateTicketCounter();
            
            // Mostrar mensaje si no hay resultados visibles
            showNoResultsMessage(visibleCount === 0);
            
            // Actualizar paginación
            setTimeout(updatePaginationAfterFilter, 100);
        }
        
        // Función para mostrar u ocultar el mensaje de "No hay resultados"
        function showNoResultsMessage(show) {
            // Remover cualquier mensaje existente
            $('#noResultsRow').remove();
            
            if (show) {
                // Crear y añadir la fila de "No hay resultados"
                const colspan = $('#ticketsTable thead th').length; // Contar dinámicamente el número de columnas
                const message = `
                    <tr id="noResultsRow">
                        <td colspan="${colspan}" class="text-center py-5">
                            <i class="fas fa-filter fa-3x mb-3 text-muted"></i>
                            <p class="text-muted">No hay tickets que coincidan con los filtros seleccionados.</p>
                            <button class="btn btn-outline-secondary btn-sm reset-filter mt-2">
                                <i class="fas fa-times me-1"></i>Limpiar filtros
                            </button>
                        </td>
                    </tr>
                `;
                $('#ticketsTable tbody').append(message);
                
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
        
        // Búsqueda en la tabla
        $('#searchInput').on('input', function() {
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
            setTimeout(updatePaginationAfterFilter, 100);
        });
    });


    /***** Paginación de Garantías *****/
    $(document).ready(function () {
        let currentPage = 1;
        let rowsPerPage = 10;
        let totalPages = 1;
        let filteredRows = [];

        function initPagination() {
            const allRows = $('#ticketsTable tbody tr').not('.no-results');
            filteredRows = allRows;
            rowsPerPage = parseInt($('#rowsPerPage').val() || 10);
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
        
        // Exponer la función initPagination globalmente
        window.initPagination = initPagination;
    });


    // Función para ordenar garantías
    function sortTickets(sortBy) {
        const rows = $('#ticketsTable tbody tr').get();
        
        rows.sort(function(a, b) {
            // Por defecto, ordenar por ID descendente (más reciente primero)
            const idA = parseInt($(a).find('td:first').text().replace('#', ''));
            const idB = parseInt($(b).find('td:first').text().replace('#', ''));
            return idB - idA;
        });
        
        $.each(rows, function(index, row) {
            $('#ticketsTable tbody').append(row);
        });
        
        // Reinicializar la paginación después de ordenar
        if (typeof window.initPagination === 'function') {
            window.initPagination();
        }
    }

    // Ordenar por ID descendente al cargar la página
    $(document).ready(function() {
        sortTickets('id-desc');
    });

    // Deshabilitar botones de edición para garantías en estados finales
    $('#ticketsTable tbody tr').each(function() {
        const ticketState = $(this).attr('data-status');
        if (ticketState === "Aprobada" || ticketState === "Rechazada") {
            // Buscar y desactivar el botón de edición
            const editButton = $(this).find('button.btn-outline-secondary');
            editButton.addClass('disabled');
            editButton.attr('title', 'No se puede editar una garantía en estado ' + ticketState);
            editButton.attr('disabled', true);
        }
    });
}); // Fin del $(document).ready()

/**
 * Función para actualizar el contador de garantías visibles.
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
    
    // Actualizar contador
    $('#currentRowsCount').text(visibleRows);
    
    return visibleRows;
}

/**
 * Actualiza la paginación después de filtrar o modificar la tabla.
 * Esta función es global para que pueda usarse desde otros scripts.
 */
window.updatePaginationAfterFilter = function() {
    // Seleccionar filas visibles excluyendo la fila de "no hay resultados"
    const filteredRows = $('#ticketsTable tbody tr:visible').not('#noResultsRow');
    const totalRows = filteredRows.length;
    
    const rowsPerPage = parseInt($('#rowsPerPage').val() || 10);
    const totalPages = Math.ceil(totalRows / rowsPerPage);
    
    // Actualizar contador de garantías visibles
    $('#currentRowsCount').text(Math.min(rowsPerPage, totalRows));
    
    // Regenerar botones de paginación
    if ($('#pagination').length) {
        $('#pagination li').not('#prevPage, #nextPage').remove();
        
        // Si no hay páginas, mostrar sólo una inactiva
        if (totalPages === 0) {
            $('#nextPage').before(`<li class="page-item active" data-page="1"><a class="page-link" href="#">1</a></li>`);
            $('#prevPage, #nextPage').addClass('disabled');
            return;
        }
        
        // Generar botones para cada página
        for (let i = 1; i <= totalPages; i++) {
            const isActive = i === 1 ? 'active' : '';
            $('#nextPage').before(`<li class="page-item ${isActive}" data-page="${i}"><a class="page-link" href="#">${i}</a></li>`);
        }
        
        // Actualizar los botones de navegación
        $('#prevPage').addClass('disabled');
        if (totalPages <= 1) {
            $('#nextPage').addClass('disabled');
        } else {
            $('#nextPage').removeClass('disabled');
        }
        
        // Reiniciar la vista a la primera página
        if (typeof window.showPage === 'function') {
            window.showPage(1);
        } else if (typeof showPage === 'function') {
            showPage(1);
        }
    }
    
    return totalRows;
};

/**
 * Muestra u oculta el mensaje de "No hay resultados" dependiendo del filtro aplicado
 */
function showNoResultsMessage(show) {
    // Remover cualquier mensaje existente
    $('#ticketsTable tbody tr.no-results-row').remove();
    
    if (show) {
        // Crear nueva fila con mensaje
        const colspan = $('#ticketsTable thead th').length; // Contar dinámicamente el número de columnas
        const message = `
            <tr class="no-results-row">
                <td colspan="${colspan}" class="text-center py-5">
                    <i class="fas fa-filter fa-3x mb-3 text-muted"></i>
                    <p class="text-muted">No hay tickets que coincidan con el filtro actual.</p>
                    <button class="btn btn-outline-secondary btn-sm reset-filter">
                        <i class="fas fa-times me-1"></i>Limpiar filtro
                    </button>
                </td>
            </tr>
        `;
        $('#ticketsTable tbody').append(message);
        
        // Agregar controlador de evento al botón de reset
        $('.reset-filter').on('click', function() {
            // Restablecer filtro a "Todos"
            $('input[name="filterStatus"]').prop('checked', false);
            $('#btnTodos').prop('checked', true);
            filterTickets('Todos');
        });
    }
}
