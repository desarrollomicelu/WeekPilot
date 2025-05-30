// El archivo toast-notifications.js ahora maneja todas las notificaciones

$(document).ready(function () {
    // Inicializar tooltips
    $('[data-toggle="tooltip"]').tooltip();

    // Variables para seguimiento de filtros activos
    let filteredStatus = 'Todos';
    
    // Hacer la variable de filtro accesible globalmente
    window.filteredStatus = filteredStatus;

    console.log('Documento listo. Inicializando eventos...');
    
    // Filtrado por estado
    $('input[name="filterStatus"]').on('change', function() {
        filteredStatus = $(this).attr('id').replace('btn', '');
        // Actualizar también la variable global
        window.filteredStatus = filteredStatus;
        applyFilters();
    });
    
    // Filtrado por ciudad usando los botones de radio
    $('input[name="filterCity"]').on('change', function() {
        // Aplicar filtros cuando cambia la selección de ciudad
        applyFilters();
        
        // Actualizar clase visual activa
        $('input[name="filterCity"]').next('label').removeClass('filter-active');
        $(this).next('label').addClass('filter-active');
    });

    // Filtro de búsqueda para referencias
    $('#searchReference').on('input', function () {
        const searchText = $(this).val().toLowerCase();
        $('#reference option').each(function () {
            const text = $(this).text().toLowerCase();
            const found = text.indexOf(searchText) > -1;
            $(this).toggle(found);
        });
    });

    // Inicializar state_display
    $('#state_display').val($('#state').val() || 'Sin asignar');

    // Actualiza referencias y código de producto
    $('#reference').on('change', function () {
        const selected = $(this).find('option:selected');
        const code = selected.data('code') || '';
        $('#product_code').val(code);
    });

    // Actualiza documento técnico
    $('#technical_name').on('change', function () {
        const selected = $(this).find('option:selected');
        const document = selected.data('document') || '';
        if (document) {
            $('#documento').val(document);
            $('#state').val('Asignado');
            $('#state_display').val('Asignado');
        } else {
            $('#documento').val('Sin asignar');
            $('#state').val('Sin asignar');
            $('#state_display').val('Sin asignar');
        }
    });

    // Manejo de problemas
    setupProblemsField();

    // Configuración de la tabla de repuestos
    setupPartsTable();

    // Formato de moneda para campos
    setupFormattedNumbers();

    // Validación de IMEI
    $('#IMEI').on('input', function () {
        const value = $(this).val();
        const isValid = /^\d{15}$/.test(value);

        if (value === '') {
            $(this).removeClass('is-invalid is-valid');
        } else if (isValid) {
            $(this).removeClass('is-invalid').addClass('is-valid');
        } else {
            $(this).removeClass('is-valid').addClass('is-invalid');
        }
    });

    $(document).on('input', '.part-quantity', function() {
        updateRowTotal($(this).closest('tr'));
    });

    $(document).on('input', '.part-unit-value', function() {
        // Formatear el valor
        formatCurrency($(this));
        // Actualizar el total de la fila
        updateRowTotal($(this).closest('tr'));
    });

    $(document).on('click', '.remove-part', function() {
        const $tr = $(this).closest('tr');
        
        // Preguntar antes de eliminar
        Swal.fire({
            title: '¿Eliminar repuesto?',
            text: '¿Estás seguro de eliminar este repuesto?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                $tr.remove();
                
                // Si no quedan filas, mostrar la fila de "no hay repuestos"
                if ($('#partsTable tbody tr.part-row').length === 0) {
                    $('#noPartsRow').show();
                }
                
                // Actualizar el total
                updatePartsTotals();
            }
        });
    });

    // Manejo de envío de formulario
    $('#ticketForm').on('submit', function (e) {
        e.preventDefault();

        // Validar campos obligatorios
        if (!validateForm()) {
            return false;
        }

        // Mostrar modal de confirmación
        Swal.fire({
            title: '¿Crear ticket de reparación interna?',
            text: "Se generará un nuevo ticket con la información proporcionada.",
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, crear ticket',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                this.submit();
            }
        });
    });

    // Procesar los mensajes flash
    processFlashMessages();

    // Inicializar total
    updateTotal();

    // Configurar búsqueda en el modal de repuestos
    setupSearchPartsModal();

    $('#searchProductBtn').on('click', function () {
        // Mostrar el modal de búsqueda de productos
        $('#searchProductsModal').modal('show');
    });

    // Configurar el modal de búsqueda de productos
    $('#searchProductsModal').on('shown.bs.modal', function () {
        $('#modalProductSearch').val('').focus();
        $('#initialProductSearchMessage').show();
        $('#productSearchResultsLoader, #noProductResultsMessage, #productSearchResultsList').hide();
    });

    // Configurar la búsqueda de productos
    $('#modalProductSearch').on('input', function () {
        const searchTerm = $(this).val().trim();
        if (searchTerm.length >= 3) {
            searchProducts(searchTerm);
        } else {
            $('#initialProductSearchMessage').show();
            $('#productSearchResultsLoader, #noProductResultsMessage, #productSearchResultsList').hide();
        }
    });

    // Limpiar búsqueda de productos
    $('#clearProductSearch').on('click', function () {
        $('#modalProductSearch').val('');
        $('#initialProductSearchMessage').show();
        $('#productSearchResultsLoader, #noProductResultsMessage, #productSearchResultsList').hide();
    });

    // Evento delegado para los botones de búsqueda de repuestos
    $(document).on('click', '.select-part', function () {
        // Guardar la fila actual para actualización posterior
        currentEditingRow = $(this).closest('tr');
        // Mostrar el modal de búsqueda
        $('#searchPartsModal').modal('show');
    });

    // Botón para limpiar búsqueda en el modal
    $('#clearSearch').on('click', function () {
        $('#modalPartSearch').val('');
        $('#initialSearchMessage').show();
        $('#noResultsMessage').hide();
        $('#searchResultsLoader').hide();
        $('#searchResultsList').hide().empty();
    });

    // Funciones de paginación y filtrado de tabla
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

    $('#searchRepairs').on('input', function() {
        const searchText = $(this).val().toLowerCase();
        
        // Guardar estado de visibilidad antes de la búsqueda
        $('#ticketsTable tbody tr').not('.no-results-row').each(function() {
            const $row = $(this);
            // Solo buscar en filas que ya son visibles según los filtros actuales
            if ($row.is(':visible')) {
                const rowText = $row.text().toLowerCase();
                $row.toggle(rowText.includes(searchText));
            }
        });
        
        // Verificar si hay resultados visibles
        const visibleRows = $('#ticketsTable tbody tr:visible').not('.no-results-row').length;
        showNoResultsMessage(visibleRows === 0);
        
        // Actualizar contador y paginación
        updateRowCounter();
        if (typeof updatePaginationAfterFilter === 'function') {
            setTimeout(updatePaginationAfterFilter, 100);
        }
    });

    // Función para aplicar todos los filtros activos
    function applyFilters() {
        // Verificar que los elementos existen antes de intentar acceder a sus propiedades
        const statusElement = $('input[name="filterStatus"]:checked');
        const cityElement = $('input[name="filterCity"]:checked');
        
        // Valores por defecto en caso de que los elementos no existan
        const selectedStatus = statusElement.length ? statusElement.attr('id').replace('btn', '') : 'Todos';
        const selectedCity = cityElement.length ? cityElement.attr('id').replace('btn', '') : 'Todas';
        
        console.log(`Aplicando filtros: Estado=${selectedStatus}, Ciudad=${selectedCity}`);
        
        // Aplicar filtros a todas las filas
        $('#ticketsTable tbody tr').not('.no-results-row').each(function() {
            const $row = $(this);
            let statusMatch = true;
            let cityMatch = true;
            
            // Verificar filtro de estado
            const rowStatus = $row.attr('data-status');
            if (selectedStatus === 'Todos') {
                statusMatch = true;
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
        
        // Verificar si hay resultados visibles
        const visibleRows = $('#ticketsTable tbody tr:visible').not('.no-results-row').length;
        showNoResultsMessage(visibleRows === 0);
        
        // Actualizar contador de filas visibles
        updateRowCounter();
        
        // Actualizar paginación
        if (typeof updatePaginationAfterFilter === 'function') {
            setTimeout(updatePaginationAfterFilter, 100);
        }
    }
    
    // Función para mostrar u ocultar mensaje de "no hay resultados"
    function showNoResultsMessage(show) {
        $('.no-results-row').remove();
        
        if (show) {
            // Verificar que los elementos existen antes de intentar acceder a sus propiedades
            const statusElement = $('input[name="filterStatus"]:checked');
            const cityElement = $('input[name="filterCity"]:checked');
            
            // Obtener textos con verificación de existencia
            const statusText = statusElement.length ? statusElement.next('label').text().trim() : 'Todos';
            const cityText = cityElement.length ? cityElement.next('label').text().trim() : 'Todas';
            
            let message = 'No hay tickets';
            if (cityText !== 'Todas') {
                message += ` en ${cityText}`;
            }
            if (statusText !== 'Todos') {
                message += ` con estado "${statusText}"`;
            }
            
            const colspan = $('#ticketsTable thead th').length || 10; // Valor por defecto de 10 si no se encuentra
            const $noResults = $(`
                <tr class="no-results-row">
                    <td colspan="${colspan}" class="text-center py-5">
                        <i class="fas fa-filter fa-3x mb-3 text-muted"></i>
                        <p class="text-muted">${message}</p>
                        <button class="btn btn-outline-secondary btn-sm reset-filters">
                            <i class="fas fa-times me-1"></i>Limpiar filtros
                        </button>
                    </td>
                </tr>
            `);
            
            $('#ticketsTable tbody').append($noResults);
            
            // Agregar evento para el botón de limpiar filtros
            $('.reset-filters').on('click', function() {
                // Seleccionar "Todos" para estado y "Todas" para ciudad
                $('#btnTodos, #btnTodas').prop('checked', true);
                // Aplicar los filtros
                applyFilters();
            });
        }
    }
    
    // Función para actualizar el contador de filas
    function updateRowCounter() {
        const visibleCount = $('#ticketsTable tbody tr:visible').not('.no-results-row').length;
        const totalCount = $('#totalRowsCount').text();
        $('#currentRowsCount').text(visibleCount);
    }
    
    // Inicializar los filtros al cargar la página
    setTimeout(function() {
        // Aplicar los filtros iniciales
        applyFilters();
        
        // Activar las clases visuales para los filtros seleccionados
        $('input[name="filterStatus"]:checked').next('label').addClass('filter-active');
        $('input[name="filterCity"]:checked').next('label').addClass('filter-active');
    }, 100);

    // Funcion global para mostrar tickets (accesible desde el HTML)
    window.displayTickets = function(tickets) {
        const $tbody = $('#ticketsTable tbody');
        $tbody.empty();
        
        if (tickets.length === 0) {
            // Mejorar el mensaje cuando no hay tickets
            const cityText = $('#selectedCityText').text() || 'Todas';
            const statusElement = $('input[name="filterStatus"]:checked');
            const statusText = statusElement.length ? statusElement.next('label').text().trim() : 'Todos';
            
            let message = 'No hay tickets de reparación interna';
            if (cityText !== 'Ciudades' && cityText !== 'Todas') {
                message += ` en ${cityText}`;
            }
            if (statusText !== 'Todos') {
                message += ` con estado "${statusText}"`;
            }
            
            $tbody.html(`
                <tr>
                    <td colspan="10" class="text-center py-4">
                        <i class="fas fa-filter fa-2x mb-3 text-muted"></i>
                        <p class="text-muted">${message}</p>
                        <a href="/internal_repair/create_ticketsRI" class="btn btn-secondary">
                            <i class="fas fa-plus me-1 text-white"></i> Nueva reparación
                        </a>
                    </td>
                </tr>
            `);
            return;
        }
        
        tickets.forEach(ticket => {
            const priorityClass = ticket.priority === 'Alta' ? 'bg-danger' : 
                                 ticket.priority === 'Media' ? 'bg-warning text-dark' : 
                                 'bg-success';
                                 
            const row = `
            <tr class="align-middle" data-status="${ticket.state}" data-city="${ticket.city || 'desconocida'}">
                <td class="ps-2 fw-bold">#${ticket.id_ticket}</td>
                <td class="multiline-cell" title="${ticket.reference || ''}">
                    ${ticket.reference ? ticket.reference.replace(/seminuevo|Seminuevo|SEMINUEVO/g, "").trim() : 'N/A'}
                </td>
                <td class="multiline-cell">
                    ${ticket.technical_name ? 
                        `<span title="${ticket.technical_name.replace('.', ' ')}">
                            ${ticket.technical_name.replace('.', ' ')}
                        </span>` : 
                        '<span class="badge bg-secondary">Sin asignar</span>'}
                </td>
                <td>
                    <select class="form-select form-select-sm status-select" 
                            data-ticket-id="${ticket.id_ticket}" 
                            data-previous-status="${ticket.state}" 
                            name="status">
                        ${['Sin asignar', 'Asignado', 'En proceso', 'En Revision', 'Terminado', 'Cancelado']
                            .map(status => `<option value="${status}" ${ticket.state === status ? 'selected' : ''}>${status}</option>`)
                            .join('')}
                    </select>
                </td>
                <td>
                    <span class="badge ${priorityClass}">
                        ${ticket.priority}
                    </span>
                </td>
                <td class="text-end">$${formatNumberWithCommas(ticket.service_value)}</td>
                <td class="text-end">$${formatNumberWithCommas(ticket.spare_value)}</td>
                <td class="text-end"><span class="badge bg-primary fs-6">$${formatNumberWithCommas(ticket.total)}</span></td>
                <td>${ticket.city || '<span class="badge bg-secondary">Sin ciudad</span>'}</td>
                <td class="text-center">
                    <div class="btn-group btn-group-sm">
                        <a href="/internal_repair/edit_tickets_RI/${ticket.id_ticket}"
                            class="btn btn-sm btn-outline-secondary ${ticket.state === 'Terminado' || ticket.state === 'Cancelado' ? 'disabled' : ''}" 
                            ${ticket.state === 'Terminado' || ticket.state === 'Cancelado' ? 
                                'aria-disabled="true" data-bs-toggle="tooltip" data-bs-placement="top" title="No se puede editar un ticket en estado ' + ticket.state + '"' : 
                                ''}>
                            <i class="fas fa-edit"></i>
                        </a>
                        <a href="/internal_repair/detail_RI/${ticket.id_ticket}"
                            class="btn btn-sm btn-outline-info">
                            <i class="fas fa-eye"></i>
                        </a>
                    </div>
                </td>
            </tr>
            `;
            $tbody.append(row);
        });
        
        // Reinicializar tooltips y otros elementos interactivos
        $('[data-bs-toggle="tooltip"]').tooltip();
        
        // Reinstalar event handlers para los selectores de estado
        $('.status-select').off('change').on('change', function() {
            const $select = $(this);
            const ticketId = $select.data('ticket-id');
            const newStatus = $select.val();
            const previousStatus = $select.data('previous-status');
            
            // Mostrar modal de confirmación
            Swal.fire({
                title: '¿Cambiar estado?',
                text: `¿Estás seguro de cambiar el estado de la reparación #${ticketId} a "${newStatus}"?`,
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Sí, cambiar',
                cancelButtonText: 'Cancelar'
            }).then((result) => {
                if (result.isConfirmed) {
                    updateRepairStatus($select, ticketId, newStatus, previousStatus);
                } else {
                    // Si el usuario cancela, restaurar el valor original
                    $select.val(previousStatus);
                }
            });
        });
        
        // Actualizar contador de tickets
        updateTicketCounter();
    };

    initPagination();

    // Exponer la función initPagination globalmente
    window.initPagination = initPagination;
});

/**
 * Actualiza la paginación después de filtrar o modificar la tabla.
 * Esta función es global para que pueda usarse desde otros scripts.
 */
window.updatePaginationAfterFilter = function () {
    const filteredRows = $('#ticketsTable tbody tr:visible').not('.no-results');
    const rowsPerPage = parseInt($('#rowsPerPage').val() || 10);
    const totalPages = Math.ceil(filteredRows.length / rowsPerPage);

    // Actualizar contador de tickets visibles
    $('#currentRowsCount').text(Math.min(rowsPerPage, filteredRows.length));
    $('#totalRowsCount').text($('#ticketsTable tbody tr').length);

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

// Mejora la función validateForm
function validateForm() {
    let isValid = true;
    let firstInvalidElement = null;
    let errorMessages = [];

    // Validar campos requeridos
    const requiredFields = [
        { id: 'technical_name', message: 'Seleccione un técnico' },
        { id: 'product_code', message: 'Seleccione un producto' }
    ];

    requiredFields.forEach(field => {
        const element = $(`#${field.id}`);
        const value = element.val();

        if (!value || value.trim() === '') {
            showValidationError(element, field.message);
            errorMessages.push(field.message);
            isValid = false;
            if (!firstInvalidElement) firstInvalidElement = element;
        } else {
            removeValidationError(element);
        }
    });

    // Validación específica para IMEI
    const imei = $('#IMEI').val();
    if (imei && !/^\d{15}$/.test(imei)) {
        showValidationError($('#IMEI'), 'El IMEI debe contener exactamente 15 dígitos numéricos');
        errorMessages.push('El IMEI debe contener exactamente 15 dígitos numéricos');
        isValid = false;
        if (!firstInvalidElement) firstInvalidElement = $('#IMEI');
    }

    // Verificar la tabla de repuestos
    if ($('#partsTable tbody tr').not('#noPartsRow').length > 0) {
        const partsValid = validatePartsTable();
        if (!partsValid) {
            errorMessages.push('Verifique los datos de los repuestos');
            isValid = false;
            if (!firstInvalidElement) firstInvalidElement = $('#partsTable');
        }
    }

    // Si hay errores, mostrar alerta y desplazarse al primer campo con error
    if (!isValid) {
        // Mostrar mensaje de error con SweetAlert
        Swal.fire({
            icon: 'error',
            title: 'Error de validación',
            html: errorMessages.join('<br>'),
            confirmButtonText: 'Entendido'
        });

        // Desplazarse al primer elemento inválido
        if (firstInvalidElement) {
            $('html, body').animate({
                scrollTop: firstInvalidElement.offset().top - 100
            }, 500);
        }
    }

    return isValid;
}


// Función para mostrar error de validación
function showValidationError(element, message) {
    element.addClass('is-invalid');
    if (element.next('.invalid-feedback').length === 0) {
        element.after(`<div class="invalid-feedback">${message}</div>`);
    } else {
        element.next('.invalid-feedback').text(message);
    }
}

// Función para quitar error de validación
function removeValidationError(element) {
    element.removeClass('is-invalid');
}

// Configuración del campo de problemas
function setupProblemsField() {
    const checkboxes = $('.problem-checkbox');
    const selectedProblemsTextarea = $('#selected_problems');

    // Función para actualizar el textarea de problemas seleccionados
    function updateSelectedProblems() {
        const selectedProblems = [];
        checkboxes.each(function () {
            if ($(this).prop('checked')) {
                selectedProblems.push($(this).next('label').text().trim());
            }
        });
        selectedProblemsTextarea.val(selectedProblems.join(', '));
    }

    // Event listener para checkboxes
    checkboxes.on('change', updateSelectedProblems);

    // Botón para seleccionar todos
    $('#selectAllProblems').on('click', function () {
        checkboxes.prop('checked', true);
        updateSelectedProblems();
    });

    // Botón para limpiar selección
    $('#clearProblems').on('click', function () {
        checkboxes.prop('checked', false);
        updateSelectedProblems();
    });

    // Filtrado de problemas
    $('#searchProblems').on('input', function () {
        const searchTerm = $(this).val().toLowerCase();
        $('.problem-option').each(function () {
            const problemText = $(this).text().toLowerCase();
            $(this).toggle(problemText.includes(searchTerm));
        });
    });

    // Inicializar textarea con problemas seleccionados
    updateSelectedProblems();
}

// Funciones para manejar la tabla de repuestos
function setupPartsTable() {
    // Configurar el botón para añadir una nueva fila de repuesto
    $('#addPartBtn').on('click', function () {
        addNewPartRow();
    });

    // Actualizar índices de las filas
    updateRowIndices();
}

function updateRowIndices() {
    $('#partsTable tbody tr').each(function (index) {
        $(this).find('.row-index').text(index + 1);

        // Actualizar los nombres de los campos para mantener el índice correcto
        $(this).find('input[name^="parts["]').each(function () {
            const name = $(this).attr('name');
            const newName = name.replace(/parts\[\d+\]/, `parts[${index}]`);
            $(this).attr('name', newName);
        });
    });
}

// Validar la tabla de repuestos
function validatePartsTable() {
    let isValid = true;

    $('#partsTable tbody tr.part-row').each(function () {
        const $row = $(this);
        const spareCode = $row.find('select[name="spare_part_code[]"]').val();
        const quantity = $row.find('.part-quantity').val();
        const unitValue = unformatValue($row.find('.part-unit-value').val());

        if (!spareCode) {
            isValid = false;
            $row.addClass('table-danger');
        } else if (!quantity || quantity < 1) {
            isValid = false;
            $row.find('.part-quantity').addClass('is-invalid');
        } else if (!unitValue || unitValue <= 0) {
            isValid = false;
            $row.find('.part-unit-value').addClass('is-invalid');
        } else {
            $row.removeClass('table-danger');
            $row.find('.part-quantity, .part-unit-value').removeClass('is-invalid');
        }
    });

    return isValid;
}

function formatCurrency(input) {
    // Asegurar que input es un objeto jQuery
    input = $(input);

    if (!input.length || input.val() === '') {
        input.val(0);
        return;
    }

    // Obtener el valor actual y limpiarlo
    let value = input.val().toString();

    // Si ya tiene formato (contiene puntos), extraer el valor numérico
    if (value.includes('.')) {
        value = value.replace(/\./g, '').replace(',', '.');
    }

    // Convertir a número, usar 0 si no es un número
    const numericValue = parseFloat(value) || 0;

    // Formatear con separador de miles
    const formattedValue = formatNumberWithCommas(numericValue);

    // Actualizar el valor del input
    input.val(formattedValue);

    // Actualizar el campo oculto de valor raw si existe
    const rawInputId = input.attr('id') + '_raw';
    const rawValueField = $('#' + rawInputId);
    if (rawValueField.length) {
        rawValueField.val(numericValue);
    }
}


// Asegúrate de que esta función esté correcta
function formatNumberWithCommas(number) {
    return number.toLocaleString('es-CO', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).replace(/,/g, '.');
}

// Quitar el formato de un valor
function unformatValue(value) {
    if (!value) return 0;
    // Quitar todos los puntos que son separadores de miles
    return parseInt(value.toString().replace(/\./g, '')) || 0;
}

// Función para calcular el total
function updateTotal() {
    const serviceValue = unformatValue($('#service_value').val());
    const spareValue = unformatValue($('#spare_value').val());
    const total = serviceValue + spareValue;

    $('#total').val(formatNumberWithCommas(total));
    $('#total_raw').val(total);
}

// Mejora la función updateRowTotal
function updateRowTotal($row) {
    // Asegurarse de que $row es un objeto jQuery
    $row = $($row);

    const quantity = parseInt($row.find('.part-quantity').val()) || 0;
    const unitPriceElement = $row.find('.part-unit-value');
    const unitPrice = unformatValue(unitPriceElement.val());
    const total = quantity * unitPrice;

    // Formatear el valor unitario correctamente
    unitPriceElement.val(formatNumberWithCommas(unitPrice));

    // Actualizar el campo de total de la fila
    $row.find('.part-total-value').val(formatNumberWithCommas(total));
    $row.find('input[name$="[total_value_raw]"]').val(total);

    // Actualizar el total general
    updatePartsTotals();
}


// Función para actualizar los totales de repuestos y el total general
function updatePartsTotals() {
    let totalParts = 0;

    // Sumar todos los totales de repuestos
    $('#partsTable tbody tr.part-row').each(function () {
        const rowTotal = unformatValue($(this).find('.part-total-value').val());
        totalParts += rowTotal;
    });

    // Actualizar el campo de valor de repuestos
    $('#spare_value').val(formatNumberWithCommas(totalParts));
    $('#spare_value_raw').val(totalParts);

    // Actualizar el total general
    updateTotal();
}

// Configurar eventos para los campos formateados
function setupFormattedNumbers() {
    // Inicializar los inputs con formato de número
    $('.formatted-number').each(function () {
        const input = $(this);

        // Formatear inicialmente
        formatCurrency(input);

        // Evento para formatear al perder el foco
        input.on('blur', function () {
            formatCurrency($(this));
        });

        // Evento para limpiar el formato al obtener el foco
        input.on('focus', function () {
            // No cambiar el valor si ya está formateado, solo seleccionarlo
            $(this).select();
        });

        // Actualizar totales cuando cambie el valor
        input.on('change', function () {
            if ($(this).attr('id') === 'service_value') {
                updateTotal();
            }
        });
    });
}

// Variable global para rastrear qué fila se está editando actualmente
let currentEditingRow = null;

function addNewPartRow() {
    // Ocultar la fila "no hay repuestos"
    $('#noPartsRow').hide();

    // Clonar la plantilla
    const template = document.getElementById('partRowTemplate');
    if (!template) {
        console.error('No se encontró la plantilla de fila de repuesto');
        return;
    }

    // Crear una nueva fila a partir de la plantilla
    const content = template.content.cloneNode(true);
    const newRow = content.querySelector('tr');
    
    // Agregar la fila a la tabla
    const tbody = document.querySelector('#partsTable tbody');
    if (tbody) {
        tbody.appendChild(newRow);
    }
    
    // Configurar la nueva fila con jQuery
    const $newRow = $(newRow);
    
    // Si estamos en la página de edición y existe la función de configuración específica, usarla
    if (typeof window.setupNewSpareRow === 'function') {
        window.setupNewSpareRow(newRow);
    } else {
        // Configuración estándar para la página de creación
        $newRow.find('.part-unit-value').val('0');
        $newRow.find('.part-total-value').val('0');
        
        // Configurar eventos para actualizar el total de la fila
        $newRow.find('.part-quantity, .part-unit-value').on('input change', function() {
            updateRowTotal($newRow);
        });
        
        // Configurar evento para eliminar la fila
        $newRow.find('.remove-part').on('click', function() {
            $newRow.remove();
            updateRowIndices();
            updatePartsTotals();
            
            // Mostrar la fila "no hay repuestos" si no hay más filas
            if ($('#partsTable tbody tr.part-row').length === 0) {
                $('#noPartsRow').show();
            }
        });
        
        // Configurar el select de repuestos si existe
        const $select = $newRow.find('select[name="spare_part_code[]"]');
        if ($select.length) {
            $select.on('change', function() {
                // Actualizar datos del repuesto seleccionado si es necesario
                updateRowTotal($newRow);
            });
        }
    }
    
    // Actualizar índices de las filas
    updateRowIndices();
    
    // Configurar botón de búsqueda de repuestos
    $newRow.find('.select-part').on('click', function() {
        currentEditingRow = $newRow;
        $('#searchPartsModal').modal('show');
    });
    
    return $newRow;
}


function updatePartRow(row, partData) {
    // Asegurarse de que row es un objeto jQuery
    const $row = $(row);

    // Seleccionar el select de repuestos y agregar una nueva opción
    const select = $row.find('select[name="spare_part_code[]"]');

    // Vaciar opciones actuales
    select.empty();

    // Agregar la opción seleccionada
    const option = new Option(`${partData.code} - ${partData.description}`, partData.code, true, true);
    select.append(option);

    // Establecer valores predeterminados para cantidad y precio unitario si no existen
    const quantity = $row.find('.part-quantity').val() || 1;
    const unitPrice = $row.find('.part-unit-value').val() || 0;

    $row.find('.part-quantity').val(quantity);
    $row.find('.part-unit-value').val(unitPrice);

    // Recalcular el total de la fila
    updateRowTotal($row);

    // Recalcular el total general
    updatePartsTotals();

    // Aplicar estilos para indicar que la fila fue actualizada
    $row.addClass('bg-success-subtle');
    setTimeout(() => {
        $row.removeClass('bg-success-subtle');
    }, 500);
}


// Configurar el modal de búsqueda de repuestos
function setupSearchPartsModal() {
    // Verificar que el modal existe
    if ($('#searchPartsModal').length === 0) {
        console.error('Error: No se encontró el modal de búsqueda de repuestos');
        return;
    }

    // Configurar la búsqueda al escribir en el campo
    $('#modalPartSearch').on('input', function () {
        const searchTerm = $(this).val().trim();
        if (searchTerm.length >= 3) {
            searchParts(searchTerm);
        } else {
            $('#initialSearchMessage').show();
            $('#noResultsMessage').hide();
            $('#searchResultsLoader').hide();
            $('#searchResultsList').hide().empty();
        }
    });

    // Limpiar resultados al cerrar el modal
    $('#searchPartsModal').on('hidden.bs.modal', function () {
        $('#modalPartSearch').val('');
        $('#initialSearchMessage').show();
        $('#noResultsMessage').hide();
        $('#searchResultsLoader').hide();
        $('#searchResultsList').hide().empty();
    });

    // Limpiar resultados al abrir el modal
    $('#searchPartsModal').on('shown.bs.modal', function () {
        $('#modalPartSearch').val('');
        $('#initialSearchMessage').show();
        $('#noResultsMessage').hide();
        $('#searchResultsLoader').hide();
        $('#searchResultsList').hide().empty();
        $('#modalPartSearch').focus();
    });
}

// Función para buscar repuestos
function searchParts(searchTerm) {
    // Referencias a elementos del DOM
    const searchResultsLoader = $('#searchResultsLoader');
    const initialSearchMessage = $('#initialSearchMessage');
    const noResultsMessage = $('#noResultsMessage');
    const searchResultsList = $('#searchResultsList');

    // Mostrar loader, ocultar otros mensajes
    searchResultsLoader.show();
    initialSearchMessage.hide();
    noResultsMessage.hide();
    searchResultsList.hide().empty();

    // Crear el objeto FormData para enviar los datos
    const formData = new FormData();
    formData.append('search', searchTerm);

    console.log(`Buscando repuestos con término: "${searchTerm}"`);

    // Realizar petición fetch a la URL
    fetch('/internal_repair/search_spare_parts', {
        method: 'POST',
        body: formData
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            console.log("Respuesta recibida:", data);
            
            // Ocultar loader
            searchResultsLoader.hide();

            // Verificar si hay resultados - Compatibilidad con ambos formatos de respuesta
            const parts = data.parts || [];
            
            if (parts.length === 0) {
                const message = data.message || 'No se encontraron repuestos que coincidan con la búsqueda';
                noResultsMessage.show().html(`
                    <h5 class="text-muted mb-2">No se encontraron resultados</h5>
                    <p class="text-muted mb-0">${message}</p>
                `);
                return;
            }

            // Crear o mostrar el contenedor de resultados
            let resultsContainer = document.querySelector('#searchResultsList');
            resultsContainer.style.display = 'block';
            resultsContainer.innerHTML = '';
            // Crear una fila para los resultados
            const row = document.createElement('div');
            row.className = 'row g-3';
            resultsContainer.appendChild(row);

            // Agregar contador de resultados
            const resultCount = document.createElement('div');
            resultCount.className = 'col-12 mb-2';
            resultCount.innerHTML = `<small class="text-muted">Se encontraron ${parts.length} repuestos</small>`;
            row.appendChild(resultCount);

            // Añadir cada repuesto como una tarjeta
            parts.forEach(part => {
                // Asegurar que code y description son strings
                const code = String(part.code || '');
                const description = String(part.description || '');
                
                const colDiv = document.createElement('div');
                colDiv.className = 'col-md-6';

                colDiv.innerHTML = `
                            <div class="card mb-2 shadow-sm search-result-card" 
                                 data-code="${code}" 
                                 data-description="${description}">
                                <div class="card-body py-2">
                                    <div class="d-flex justify-content-between align-items-center">
                                        <div>
                                            <h6 class="mb-1">${code} - ${description}</h6>
                                        </div>
                                        <button type="button" class="btn btn-sm btn-primary select-result">
                                            <i class="fas fa-check me-1"></i>Seleccionar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        `;

                row.appendChild(colDiv);
            });

            // Agregar evento de clic a las tarjetas
            $('.search-result-card').on('click', function () {
                const code = $(this).data('code');
                const description = $(this).data('description');

                // Actualizar la fila con los datos seleccionados
                updatePartRow(currentEditingRow, {
                    code: code,
                    description: description
                });

                // Cerrar el modal
                $('#searchPartsModal').modal('hide');
            });

            // Evento para los botones de seleccionar
            $('.select-result').on('click', function (e) {
                e.stopPropagation(); // Evitar que se propague al card
                const card = $(this).closest('.search-result-card');
                const code = card.data('code');
                const description = card.data('description');

                // Actualizar la fila con los datos seleccionados
                updatePartRow(currentEditingRow, {
                    code: code,
                    description: description
                });

                // Cerrar el modal
                $('#searchPartsModal').modal('hide');
            });
        })
        .catch(error => {
            searchResultsLoader.hide();
            console.error('Error al buscar repuestos:', error);
            noResultsMessage.show().html(`
                        <i class="fas fa-exclamation-triangle text-danger fa-3x mb-3"></i>
                        <h5 class="text-danger">Error al buscar repuestos</h5>
                        <p class="text-muted mb-0">${error.message || 'Intente nuevamente'}</p>
                    `);
        });
}

// Función para buscar productos
function searchProducts(searchTerm) {
    const searchResultsLoader = $('#productSearchResultsLoader');
    const initialSearchMessage = $('#initialProductSearchMessage');
    const noResultsMessage = $('#noProductResultsMessage');
    const searchResultsList = $('#productSearchResultsList');

    searchResultsLoader.show();
    initialSearchMessage.hide();
    noResultsMessage.hide();
    searchResultsList.hide().empty();

    const formData = new FormData();
    formData.append('search', searchTerm);

    fetch('/search_products', {
        method: 'POST',
        body: formData
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            searchResultsLoader.hide();

            if (!data.products || data.products.length === 0) {
                noResultsMessage.show();
                return;
            }

            searchResultsList.show().empty();

            const row = document.createElement('div');
            row.className = 'row g-3';
            searchResultsList.append(row);

            const resultCount = document.createElement('div');
            resultCount.className = 'col-12 mb-2';
            resultCount.innerHTML = `<small class="text-muted">Se encontraron ${data.products.length} productos</small>`;
            row.appendChild(resultCount);

            data.products.forEach(product => {
                const colDiv = document.createElement('div');
                colDiv.className = 'col-md-6';

                colDiv.innerHTML = `
                            <div class="card mb-2 shadow-sm product-result-card" 
                                 data-code="${product.CODIGO}" 
                                 data-description="${product.DESCRIPCIO}">
                                <div class="card-body py-2">
                                    <div class="d-flex justify-content-between align-items-center">
                                        <div>
                                            <h6 class="mb-1">${product.CODIGO} - ${product.DESCRIPCIO}</h6>
                                        </div>
                                        <button class="btn btn-sm btn-primary select-product">
                                            <i class="fas fa-check me-1"></i>Seleccionar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        `;

                row.appendChild(colDiv);
            });

            // Evento para seleccionar un producto
            $('.product-result-card').on('click', function () {
                selectProduct($(this).data('code'), $(this).data('description'));
            });

            $('.select-product').on('click', function (e) {
                e.stopPropagation();
                const card = $(this).closest('.product-result-card');
                selectProduct(card.data('code'), card.data('description'));
            });
        })
        .catch(error => {
            searchResultsLoader.hide();
            console.error('Error al buscar productos:', error);
            noResultsMessage.show().html(`
                        <i class="fas fa-exclamation-triangle text-danger fa-3x mb-3"></i>
                        <h5 class="text-danger">Error al buscar productos</h5>
                        <p class="text-muted mb-0">Intente nuevamente</p>
                    `);
        });
}

// Función para seleccionar un producto
function selectProduct(code, description) {
    $('#product_code').val(code);
    $('#reference').val(description);
    $('#searchProductsModal').modal('hide');
}

// Reemplaza la función processFlashMessages actual
function processFlashMessages() {
    const alerts = $('.alert');

    alerts.each(function () {
        const type = $(this).hasClass('alert-success') ? 'success' :
            $(this).hasClass('alert-danger') ? 'error' :
                $(this).hasClass('alert-warning') ? 'warning' : 'info';

        const message = $(this).text().trim();

        if (message) {
            showToast(type, message);
        }
    });
}

// Reemplaza la función showToast actual para usar SweetAlert
function showToast(type, message) {
    // Configurar el icono según el tipo
    const icon =
        type === 'success' ? 'success' :
            type === 'error' ? 'error' :
                type === 'warning' ? 'warning' : 'info';

    // Mostrar la notificación con SweetAlert
    Swal.fire({
        toast: true,
        icon: icon,
        title: message,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true
    });
}

// Función para actualizar el estado de un ticket de reparación interna
function updateRepairStatus($select, ticketId, newStatus, previousStatus) {
    // Mostrar indicador de carga
    $select.addClass('opacity-50');
    $select.prop('disabled', true);

    // Preparar datos
    const data = {
        ticket_id: ticketId,
        state: newStatus  // Usar 'state' para mantener consistencia con el backend
    };

    // Realizar solicitud AJAX
    $.ajax({
        url: '/update_ticket_status_ajax',
        method: 'POST',
        data: data,
        success: function(response) {
            // Quitar indicador de carga
            $select.removeClass('opacity-50');
            $select.prop('disabled', false);
            
            if (response.success) {
                // Actualizar atributos y estado en la interfaz
                const $row = $select.closest('tr');
                $row.attr('data-status', newStatus);
                $select.attr('data-previous-status', newStatus);
                
                // Si es un estado final, deshabilitar botón de edición
                if (newStatus === 'Terminado' || newStatus === 'Cancelado') {
                    const $editBtn = $row.find('a.btn-outline-secondary');
                    $editBtn.addClass('disabled');
                    $editBtn.attr('aria-disabled', 'true');
                    $editBtn.attr('data-bs-toggle', 'tooltip');
                    $editBtn.attr('data-bs-placement', 'top');
                    $editBtn.attr('title', `No se puede editar un ticket en estado ${newStatus}`);
                    $('[data-bs-toggle="tooltip"]').tooltip();
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
                            
                            // Aplicar filtro activo
                            const activeFilter = $('input[name="filterStatus"]:checked').attr('id').replace('btn', '');
                            filterTickets(activeFilter);
                            
                            // Mostrar notificación si ya no es visible debido al filtro
                            if (!$row.is(':visible') && activeFilter !== 'Todos') {
                                showToast('info', `El ticket #${ticketId} se ha movido al filtro "${newStatus}"`, 5000);
                            }
                        }, 1500);
                    });
                }, 300);
                
                // Notificación de éxito
                showToast('success', `Estado actualizado a "${newStatus}" correctamente`);
            } else {
                // Error al actualizar
                $select.val(previousStatus);
                showToast('error', response.message || 'Error al actualizar el estado');
            }
        },
        error: function(xhr, status, error) {
            // Quitar indicador de carga
            $select.removeClass('opacity-50');
            $select.prop('disabled', false);
            
            // Restaurar valor original
            $select.val(previousStatus);
            
            // Mostrar error
            let errorMessage = 'Error al actualizar el estado';
            if (xhr.responseJSON && xhr.responseJSON.message) {
                errorMessage = xhr.responseJSON.message;
            }
            showToast('error', errorMessage);
        }
    });
}
