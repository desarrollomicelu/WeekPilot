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


/***** Funcionalidad de Búsqueda y Filtrado *****/
document.addEventListener("DOMContentLoaded", function () {
    // Verificar si venimos de una actualización exitosa
    const urlParams = new URLSearchParams(window.location.search);
    console.log("URL Params:", Object.fromEntries(urlParams.entries()));
    
    if (urlParams.get('ticket_updated') === 'success') {
        console.log("Ticket actualizado con éxito - Mostrando alerta");
        showSuccessTicketAlert();
        // Limpiar la URL para evitar que se muestre la alerta al refrescar
        window.history.replaceState({}, document.title, window.location.pathname);
    } else if (urlParams.get('ticket_created') === 'success') {
        console.log("Ticket creado con éxito - Mostrando alerta");
        showSuccessTicketAlert();
        // Limpiar la URL para evitar que se muestre la alerta al refrescar
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    // --- Búsqueda en la tabla de tickets ---
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
            
            // Asegurar que los timestamps tengan las clases correctas
            if (currentState in stateTimestampMap) {
                const timestampClass = stateTimestampMap[currentState];
                $select.closest('tr').find(`.${timestampClass}-timestamp`).addClass('active-timestamp');
            }
        });

        $('.status-select').on('change', function () {
            const $select = $(this);
            const ticketId = $select.data('ticket-id');
            const newStatus = $select.val();
            const originalValue = $select.attr('data-original-state');
            
            console.log(`Intento de cambio de estado: ${originalValue} -> ${newStatus}`);
            console.log(`Orden de estados: ${stateOrder[originalValue]} -> ${stateOrder[newStatus]}`);
            
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
                    
                    // Intentar obtener el token CSRF si existe
                    const csrfToken = $('meta[name="csrf-token"]').attr('content') || '';
                    if (csrfToken) {
                        postData['csrf_token'] = csrfToken;
                    }
                    
                    console.log("Enviando datos AJAX:", JSON.stringify(postData));

                    // Enviar solicitud AJAX con el parámetro state (compatible con todos los módulos)
                    $.ajax({
                        url: '/update_ticket_status_ajax',
                        method: 'POST',
                        data: postData,
                        // Intenta con contentType explícito
                        // contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
                        beforeSend: function(xhr) {
                            console.log("Iniciando petición AJAX...");
                            // Si hay X-CSRFToken header disponible
                            if (csrfToken) {
                                xhr.setRequestHeader('X-CSRFToken', csrfToken);
                            }
                        },
                        success: function (response) {
                            // Quitar indicador de carga
                            $select.removeClass('opacity-50');
                            $select.prop('disabled', false);
                            console.log("Respuesta AJAX recibida:", response);

                            if (response.success) {
                                // Actualizar el estado original
                                $select.attr('data-original-state', newStatus);
                                
                                // Actualizar el atributo data-status de la fila para los filtros
                                const $row = $select.closest('tr');
                                $row.attr('data-status', newStatus);
                                
                                console.log("Estado actualizado a:", newStatus);
                                console.log("Atributo data-status:", $row.attr('data-status'));

                                // Si el estado cambia a Terminado, deshabilitar el botón de edición
                                if (newStatus === "Terminado") {
                                    const editButton = $row.find('button.btn-outline-secondary');
                                    editButton.addClass('disabled');
                                    editButton.attr('title', 'No se puede editar un ticket en estado Terminado');
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
                                            if (activeFilter === newStatus || activeFilter === 'Todos' || 
                                                (activeFilter === 'Activos' && newStatus !== 'Terminado')) {
                                                $row.show();
                                            } else {
                                                $row.hide();
                                                // Mostrar notificación informativa de que el ticket ya no es visible
                                                showToast('info', `El ticket #${ticketId} se ha movido al filtro "${newStatus}"`, 'top-end', 5000);
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
                        error: function (xhr, status, error) {
                            // Quitar indicador de carga
                            $select.removeClass('opacity-50');
                            $select.prop('disabled', false);
                            
                            // Restaurar valor original
                            $select.val(originalValue);
                            
                            // Información detallada en la consola
                            console.error("Error AJAX:", {
                                status: xhr.status,
                                statusText: xhr.statusText,
                                responseText: xhr.responseText,
                                error: error
                            });
                            
                            // Mostrar mensaje de error
                            let errorMsg = 'Error al actualizar el estado';
                            if (xhr.responseJSON && xhr.responseJSON.message) {
                                errorMsg = xhr.responseJSON.message;
                            } else if (xhr.status === 400) {
                                errorMsg = 'Error 400: Datos enviados incorrectos';
                            } else if (xhr.status === 403) {
                                errorMsg = 'Error 403: No tienes permiso para realizar esta acción';
                            } else if (xhr.status === 404) {
                                errorMsg = 'Error 404: No se encontró el recurso solicitado';
                            } else if (xhr.status === 500) {
                                errorMsg = 'Error 500: Error interno del servidor';
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


    // --- Filtros Rápidos por Estado ---
    $(document).ready(function () {
        function filterTickets(status) {
            if (status === 'Todos') {
                // Mostrar todos los tickets
                $('#ticketsTable tbody tr').show();
            } else if (status === 'Activos') {
                // Mostrar todos los tickets que NO están en estado "Terminado"
                $('#ticketsTable tbody tr').each(function () {
                    const ticketState = $(this).attr('data-status');
                    $(this).toggle(ticketState !== 'Terminado');
                });
            } else {
                // Filtrar por el estado específico seleccionado
                $('#ticketsTable tbody tr').each(function () {
                    const ticketState = $(this).attr('data-status');
                    // Comparación exacta de cadenas para evitar problemas con mayúsculas/minúsculas o espacios
                    $(this).toggle(ticketState === status);
                });
            }
            // Actualizar contador de tickets visibles
            updateTicketCounter();
            
            // Mostrar mensaje si no hay resultados visibles
            showNoResultsMessage($('#ticketsTable tbody tr:visible').length === 0);
        }
        
        // Función para mostrar u ocultar el mensaje de "No hay resultados"
        function showNoResultsMessage(show) {
            const noResultsRow = $('#noResultsRow');
            
            if (show) {
                if (noResultsRow.length === 0) {
                    // Crear y añadir la fila de "No hay resultados"
                    const newRow = `
                        <tr id="noResultsRow">
                            <td colspan="10" class="text-center py-4">
                                <i class="fas fa-filter fa-2x mb-3 text-muted"></i>
                                <p class="text-muted">No hay tickets que coincidan con el filtro seleccionado.</p>
                            </td>
                        </tr>
                    `;
                    $('#ticketsTable tbody').append(newRow);
                }
            } else {
                // Eliminar la fila de "No hay resultados" si existe
                noResultsRow.remove();
            }
        }

        // Manejo del evento de cambio en los botones de filtro
        $('input[name="filterStatus"]').on('change', function () {
            const selectedStatus = $(this).next('label').text().trim();
            filterTickets(selectedStatus);
            // Actualizar clase visual activa
            $('.btn-outline-secondary').removeClass('filter-active');
            $(this).next('label').addClass('filter-active');
            // Actualizar paginación después de filtrar
            setTimeout(updatePaginationAfterFilter, 100);
        });

        // Inicializar con "Todos" seleccionado
        filterTickets('Todos');
        $('input[name="filterStatus"]:checked').next('label').addClass('filter-active');
        
        // Búsqueda en la tabla
        $('#searchInput').on('input', function() {
            const searchValue = this.value.toLowerCase();
            let visibleCount = 0;
            
            // Filtrar filas según el texto de búsqueda
            $('#ticketsTable tbody tr').each(function() {
                if ($(this).attr('id') === 'noResultsRow') return; // Ignorar la fila de "No hay resultados"
                
                const rowText = $(this).text().toLowerCase();
                const visible = rowText.includes(searchValue);
                $(this).toggle(visible);
                
                if (visible) visibleCount++;
            });
            
            // Mostrar mensaje si no hay resultados
            showNoResultsMessage(visibleCount === 0);
            
            // Actualizar contador y paginación
            updateTicketCounter();
            setTimeout(updatePaginationAfterFilter, 100);
        });
    });


    /***** Paginación de Tickets *****/
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


    // Función para ordenar tickets
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

    // --- Filtrado por estado y otros criterios ---
    $(document).ready(function () {
        let filteredStatus = 'Todos';
        let currentCityFilter = 'todas';

        // Filtrado por estado
        $('input[name="filterStatus"]').on('change', function() {
            filteredStatus = $(this).attr('id').replace('btn', '');
            applyFilters();
        });

        // Filtrado por ciudad usando el dropdown
        $('.city-filter').on('click', function(e) {
            e.preventDefault();
            
            // Obtener la ciudad seleccionada
            const city = $(this).data('city');
            currentCityFilter = city;
            
            // Actualizar el texto del botón dropdown
            if (city === 'todas') {
                $('#selectedCityText').text('Ciudades');
            } else {
                const cityText = $(this).text();
                $('#selectedCityText').text(cityText);
            }
            
            // Mostrar indicador de carga
            const $table = $('#ticketsTable');
            const $tbody = $table.find('tbody');
            $tbody.html('<tr><td colspan="10" class="text-center py-4"><i class="fas fa-spinner fa-spin me-2"></i>Cargando tickets...</td></tr>');
            
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
                        $tbody.html('<tr><td colspan="10" class="text-center py-4">Error al cargar los tickets. Intente de nuevo.</td></tr>');
                    }
                },
                error: function(xhr, status, error) {
                    console.error('Error en filtro por ciudad:', error);
                    showToast('error', 'Error al comunicarse con el servidor');
                    
                    // Restablecer tabla vacía con mensaje
                    $tbody.html('<tr><td colspan="10" class="text-center py-4">Error al cargar los tickets. Intente de nuevo.</td></tr>');
                }
            });
        });
        
        // Función para aplicar ambos filtros (estado y ciudad)
        function applyFilters() {
            // Si el filtro de ciudad no es "todas", necesitamos hacer una solicitud AJAX
            if (currentCityFilter !== 'todas') {
                // Simular clic en el elemento que tiene el data-city actual
                $(`.city-filter[data-city="${currentCityFilter}"]`).trigger('click');
            } else {
                // Si estamos mostrando todas las ciudades, solo aplicamos el filtro de estado
                applyStatusFilter();
            }
            
            // Actualizar contadores y paginación
            updateTicketCounter();
            setTimeout(updatePaginationAfterFilter, 100);
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
                if (currentCityFilter !== 'todas') {
                    message += ` en ${cityText}`;
                }
                if (filteredStatus !== 'Todos') {
                    message += ` con estado "${statusText}"`;
                }
                
                $tbody.html(`
                    <tr>
                        <td colspan="10" class="text-center py-4">
                            <i class="fas fa-filter fa-2x mb-3 text-muted"></i>
                            <p class="text-muted">${message}</p>
                            <a href="/technical_service/create_ticket" class="btn btn-secondary">
                                <i class="fas fa-plus me-1 text-white"></i> Crear nuevo ticket
                            </a>
                        </td>
                    </tr>
                `);
                return;
            }
            
            // Formatear valores numéricos
            function formatCurrency(value) {
                return new Intl.NumberFormat('es-CO', {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                }).format(value);
            }
            
            tickets.forEach(ticket => {
                const row = `
                <tr class="align-middle" data-status="${ticket.state}" data-city="${ticket.city}">
                    <td class="ps-2 fw-bold">#${ticket.id_ticket}</td>
                    <td>${ticket.document || 'N/A'}</td>
                    <td>${ticket.technical_name ? ticket.technical_name.replace('.', ' ') : '<span class="badge bg-secondary">Sin asignar</span>'}</td>
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
                    <td class="text-end">$${formatCurrency(ticket.service_value)}</td>
                    <td class="text-end">$${formatCurrency(ticket.spare_value)}</td>
                    <td class="text-end"><span class="badge bg-primary fs-6">$${formatCurrency(ticket.total)}</span></td>
                    <td class="text-center">
                        <div class="btn-group btn-group-sm">
                            <form action="/technical_service/edit_ticket/${ticket.id_ticket}" method="get" style="display:inline-block;">
                                <button type="submit" class="btn btn-sm btn-outline-secondary edit-ticket-btn" 
                                        ${ticket.state === 'Terminado' ? 'disabled title="No se puede editar un ticket en estado Terminado"' : ''}>
                                    <i class="fas fa-edit"></i>
                                </button>
                            </form>
                            <form action="/technical_service/view_detail_ticket/${ticket.id_ticket}" method="get" style="display:inline-block;">
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
            
            // Reinicializar listeners de eventos en los nuevos elementos
            initializeTicketEvents();
        }
        
        // Reinicializar eventos en elementos de la tabla
        function initializeTicketEvents() {
            // Reinstalar event handlers para los selectores de estado
            $('.status-select').off('change').on('change', function() {
                const $select = $(this);
                const ticketId = $select.data('ticket-id');
                const newStatus = $select.val();
                const originalValue = $select.attr('data-original-state');
                
                // Aquí reutilizamos la lógica existente para el cambio de estado
                handleStatusChange($select, ticketId, newStatus, originalValue);
            });
        }
        
        // Función para manejar cambio de estado (extraída del código existente)
        function handleStatusChange($select, ticketId, newStatus, originalValue) {
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
                    
                    // Intentar obtener el token CSRF si existe
                    const csrfToken = $('meta[name="csrf-token"]').attr('content') || '';
                    if (csrfToken) {
                        postData['csrf_token'] = csrfToken;
                    }

                    // Enviar solicitud AJAX
                    $.ajax({
                        url: '/update_ticket_status_ajax',
                        method: 'POST',
                        data: postData,
                        beforeSend: function(xhr) {
                            if (csrfToken) {
                                xhr.setRequestHeader('X-CSRFToken', csrfToken);
                            }
                        },
                        success: function (response) {
                            // Procesar respuesta de éxito...
                            if (response.success) {
                                // Actualizar UI con respuesta exitosa
                                updateUIAfterStatusChange($select, newStatus, ticketId, response);
                            } else {
                                // Mostrar error y restaurar valor original
                                showToast('error', response.message || 'Error al actualizar el estado', 'top-end');
                                $select.val(originalValue);
                            }
                            // Quitar indicador de carga
                            $select.removeClass('opacity-50');
                            $select.prop('disabled', false);
                        },
                        error: function (xhr, status, error) {
                            // Manejar error AJAX...
                            console.error("Error AJAX:", { xhr, status, error });
                            showToast('error', 'Error al actualizar el estado', 'top-end');
                            $select.removeClass('opacity-50');
                            $select.prop('disabled', false);
                            $select.val(originalValue);
                        }
                    });
                } else {
                    // Si el usuario cancela, restaurar el valor original
                    $select.val(originalValue);
                }
            });
        }
        
        // Función para actualizar la UI después de un cambio de estado exitoso
        function updateUIAfterStatusChange($select, newStatus, ticketId, response) {
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
                        // Actualizar contador y paginación
                        updateTicketCounter();
                        updatePaginationAfterFilter();
                        
                        // Reaplica el filtro activo para que se muestre correctamente
                        applyStatusFilter();
                    }, 1500);
                });
            }, 300);
            
            // Mostrar notificación de éxito
            showToast('success', 'Estado actualizado correctamente', 'top-end');
        }
        
        // Aplicar filtro de estado
        function applyStatusFilter() {
            if (filteredStatus === 'Todos') {
                // Mostrar todos los tickets
                $('#ticketsTable tbody tr').show();
            } else if (filteredStatus === 'Activos') {
                // Mostrar todos los tickets que NO están en estado "Terminado"
                $('#ticketsTable tbody tr').each(function () {
                    const ticketState = $(this).attr('data-status');
                    $(this).toggle(ticketState !== 'Terminado');
                });
            } else {
                // Filtrar por el estado específico seleccionado
                $('#ticketsTable tbody tr').each(function () {
                    const ticketState = $(this).attr('data-status');
                    $(this).toggle(ticketState === filteredStatus);
                });
            }
            // Actualizar contador
            updateTicketCounter();
        }

        // Inicializar filtros
        applyFilters();
    });
}); // Fin del $(document).ready()

/**
 * Función para actualizar el contador de tickets visibles.
 */
function updateTicketCounter() {
    const visibleTickets = $('#ticketsTable tbody tr:visible').length;
    $('.badge.bg-secondary strong').text(visibleTickets);
}

/**
 * Actualiza la paginación después de filtrar o modificar la tabla.
 * Esta función es global para que pueda usarse desde otros scripts.
 */
window.updatePaginationAfterFilter = function() {
    const filteredRows = $('#ticketsTable tbody tr:visible').not('.no-results');
    const rowsPerPage = parseInt($('#rowsPerPage').val() || 10);
    const totalPages = Math.ceil(filteredRows.length / rowsPerPage);
    
    // Actualizar contador de tickets visibles
    $('#currentRowsCount').text(Math.min(rowsPerPage, filteredRows.length));
    
    // Regenerar botones de paginación si es necesario
    if ($('#pagination').length) {
        $('#pagination li').not('#prevPage, #nextPage').remove();
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
    }
};

