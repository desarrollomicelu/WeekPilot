// El archivo toast-notifications.js ahora maneja todas las notificaciones

$(document).ready(function () {
    // Inicializar tooltips
    $('[data-toggle="tooltip"]').tooltip();

    // Filtro de búsqueda para referencias
    $('#searchReference').on('input', function() {
        const searchText = $(this).val().toLowerCase();
        $('#reference option').each(function() {
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
    $('.currency-input').each(function () {
        const input = $(this);
        const rawField = $(`#${input.attr('id')}_raw`);
        
        input.on('input', function () {
            const rawValue = unformatValue(input.val());
            rawField.val(rawValue);
            formatCurrency(input);
            updateTotal();
        });
        
        formatCurrency(input);
    });

    // Validación de IMEI
    $('#IMEI').on('input', function() {
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
    
    // Evento delegado para los botones de búsqueda de repuestos
    $(document).on('click', '.select-part', function() {
        // Guardar la fila actual para actualización posterior
        currentEditingRow = $(this).closest('tr');
        // Mostrar el modal de búsqueda
        $('#searchPartsModal').modal('show');
    });

    // Botón para limpiar búsqueda en el modal
    $('#clearSearch').on('click', function() {
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

    $('#searchRepairs').on('input', function () {
        const searchText = $(this).val().toLowerCase();
        
        // Filtrar filas de la tabla
        $('#ticketsTable tbody tr').each(function() {
            const rowText = $(this).text().toLowerCase();
            $(this).toggle(rowText.indexOf(searchText) > -1);
        });
        
        // Actualizar paginación después de filtrar
        setTimeout(updatePaginationAfterFilter, 100);
    });
    
    // Filtrado por estado
    $('input[name="filterStatus"]').on('change', function() {
        const status = $(this).attr('id').replace('btn', '');
        
        if (status === 'Todos') {
            // Mostrar todas las filas
            $('#ticketsTable tbody tr').show();
        } else {
            // Filtrar por estado
            $('#ticketsTable tbody tr').each(function() {
                const rowStatus = $(this).data('status');
                $(this).toggle(status === rowStatus);
            });
        }
        
        // Actualizar paginación después de filtrar
        setTimeout(updatePaginationAfterFilter, 100);
    });

    initPagination();
    
    // Exponer la función initPagination globalmente
    window.initPagination = initPagination;
});

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

// Función para validar el formulario antes de enviar
function validateForm() {
    let isValid = true;
    let firstInvalidElement = null;

    // Validar campos requeridos
    const requiredFields = [
        { id: 'technical_name', message: 'Seleccione un técnico' },
        { id: 'reference', message: 'Seleccione una referencia' },
        { id: 'IMEI', message: 'Ingrese un IMEI válido (15 dígitos)' }
    ];

    requiredFields.forEach(field => {
        const element = $(`#${field.id}`);
        const value = element.val();
        
        if (!value || value.trim() === '') {
            showValidationError(element, field.message);
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
        isValid = false;
        if (!firstInvalidElement) firstInvalidElement = $('#IMEI');
    }

    // Verificar la tabla de repuestos
    if ($('#partsTable tbody tr').not('#noPartsRow').length > 0) {
        const partsValid = validatePartsTable();
        if (!partsValid) {
            isValid = false;
            if (!firstInvalidElement) firstInvalidElement = $('#partsTable');
        }
    }

    // Hacer scroll al primer campo inválido
    if (firstInvalidElement) {
        $('html, body').animate({
            scrollTop: firstInvalidElement.offset().top - 100
        }, 500);
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
        checkboxes.each(function() {
            if ($(this).prop('checked')) {
                selectedProblems.push($(this).next('label').text().trim());
            }
        });
        selectedProblemsTextarea.val(selectedProblems.join(', '));
    }
    
    // Event listener para checkboxes
    checkboxes.on('change', updateSelectedProblems);
    
    // Botón para seleccionar todos
    $('#selectAllProblems').on('click', function() {
        checkboxes.prop('checked', true);
        updateSelectedProblems();
    });
    
    // Botón para limpiar selección
    $('#clearProblems').on('click', function() {
        checkboxes.prop('checked', false);
        updateSelectedProblems();
    });
    
    // Filtrado de problemas
    $('#searchProblems').on('input', function() {
        const searchTerm = $(this).val().toLowerCase();
        $('.problem-option').each(function() {
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
    $('#addPartBtn').on('click', function() {
        addNewPartRow();
    });

    // Actualizar índices de las filas
    updateRowIndices();
}

function updateRowIndices() {
    $('#partsTable tbody tr').each(function(index) {
        $(this).find('.row-index').text(index + 1);
        
        // Actualizar los nombres de los campos para mantener el índice correcto
        $(this).find('input[name^="parts["]').each(function() {
            const name = $(this).attr('name');
            const newName = name.replace(/parts\[\d+\]/, `parts[${index}]`);
            $(this).attr('name', newName);
        });
    });
}

function calculatePartTotal() {
    let total = 0;
    $('#partsTable tbody tr').each(function() {
        const subtotalRaw = parseFloat($(this).find('.part-subtotal-raw').val() || 0);
        total += subtotalRaw;
    });
    
    $('#parts_total_raw').val(total);
    $('#parts_total').val(formatNumberWithCommas(total));
    
    // Actualizar el total general si existe esta función
    if (typeof updateTotals === 'function') {
        updateTotals();
    }
}

function updatePartSubtotal(row) {
    const quantity = parseInt(row.find('.part-quantity').val()) || 0;
    const priceRaw = parseFloat(row.find('input[name$="[price_raw]"]').val()) || 0;
    
    const subtotal = quantity * priceRaw;
    
    row.find('.part-subtotal').val(formatNumberWithCommas(subtotal));
    row.find('input[name$="[subtotal_raw]"]').val(subtotal);
    
    updateTotal();
}

// Función para calcular el total
function updateTotal() {
    const serviceValue = unformatValue($('#service_value').val());
    const spareValue = unformatValue($('#spare_value').val());
    const total = serviceValue + spareValue;
    
    $('#total').val(formatNumberWithCommas(total));
    $('#total_raw').val(total);
}

// Función para formatear números con comas para miles
function formatNumberWithCommas(number) {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Formatear moneda en un campo
function formatCurrency(input) {
    const value = input.val();
    const numericValue = unformatValue(value);
    input.val(formatNumberWithCommas(numericValue));
}

// Quitar el formato de un valor
function unformatValue(value) {
    if (!value) return 0;
    return parseFloat(value.toString().replace(/[^\d.-]/g, '')) || 0;
}

// Procesar mensajes flash para mostrarlos como toasts
function processFlashMessages() {
    const alerts = $('.alert');
    
    alerts.each(function() {
        const type = $(this).hasClass('alert-success') ? 'success' : 
                     $(this).hasClass('alert-danger') ? 'error' :
                     $(this).hasClass('alert-warning') ? 'warning' : 'info';
        
        const message = $(this).text();
        
        if (message) {
            showToast(type, message);
        }
    });
}

// Mostrar toast notification
function showToast(type, message) {
    const toastClass = 
        type === 'success' ? 'bg-success' :
        type === 'error' ? 'bg-danger' :
        type === 'warning' ? 'bg-warning' : 'bg-info';
    
    const toastIcon = 
        type === 'success' ? 'check-circle' :
        type === 'error' ? 'exclamation-circle' :
        type === 'warning' ? 'exclamation-triangle' : 'info-circle';
    
    const toast = `
        <div class="toast ${toastClass} text-white" role="alert" aria-live="assertive" aria-atomic="true" data-bs-delay="5000">
            <div class="toast-header">
                <i class="fas fa-${toastIcon} me-2"></i>
                <strong class="me-auto">${type.charAt(0).toUpperCase() + type.slice(1)}</strong>
                <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
            <div class="toast-body">
                ${message}
            </div>
        </div>
    `;
    
    $('.toast-container').append(toast);
    const toastElement = $('.toast').last();
    const bsToast = new bootstrap.Toast(toastElement);
    bsToast.show();
    
    toastElement.on('hidden.bs.toast', function() {
        $(this).remove();
    });
}

// Configurar el modal de búsqueda de repuestos
function setupSearchPartsModal() {
    // Verificar que el modal existe
    if ($('#searchPartsModal').length === 0) {
        console.error('Error: No se encontró el modal de búsqueda de repuestos');
        return;
    }
    
    // Configurar la búsqueda al escribir en el campo
    $('#modalPartSearch').on('input', function() {
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
    $('#searchPartsModal').on('hidden.bs.modal', function() {
        $('#modalPartSearch').val('');
        $('#initialSearchMessage').show();
        $('#noResultsMessage').hide();
        $('#searchResultsLoader').hide();
        $('#searchResultsList').hide().empty();
    });
    
    // Limpiar resultados al abrir el modal
    $('#searchPartsModal').on('shown.bs.modal', function() {
        $('#modalPartSearch').val('');
        $('#initialSearchMessage').show();
        $('#noResultsMessage').hide();
        $('#searchResultsLoader').hide();
        $('#searchResultsList').hide().empty();
        $('#modalPartSearch').focus();
    });
}

// Función para actualizar el total de una fila
function updateRowTotal($row) {
    // Asegurarse de que $row es un objeto jQuery
    $row = $($row);
    
    const quantity = parseInt($row.find('.part-quantity').val()) || 0;
    const unitPrice = unformatValue($row.find('.part-unit-value').val());
    const total = quantity * unitPrice;
    
    // Actualizar el campo de total de la fila
    $row.find('.part-total-value').val(formatNumberWithCommas(total));
    
    // Actualizar el total general
    updatePartsTotals();
}

// Función para actualizar los totales de repuestos y el total general
function updatePartsTotals() {
    let totalParts = 0;
    
    // Sumar todos los totales de repuestos
    $('#partsTable tbody tr.part-row').each(function() {
        const rowTotal = unformatValue($(this).find('.part-total-value').val());
        totalParts += rowTotal;
    });
    
    // Actualizar el campo de valor de repuestos
    $('#spare_value').val(formatNumberWithCommas(totalParts));
    $('#spare_value_raw').val(totalParts);
    
    // Actualizar el total general
    updateTotal();
}

// Función para actualizar una fila de repuestos con los datos seleccionados
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
    
    // Actualizar el valor unitario si viene un precio
    if (partData.price) {
        const unitValueInput = $row.find('.part-unit-value');
        unitValueInput.val(formatNumberWithCommas(partData.price));
    }
    
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

// Función para agregar una nueva fila de repuesto
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
    const newRow = document.importNode(template.content, true);
    
    // Agregar la nueva fila a la tabla
    $('#partsTable tbody').append(newRow);
    
    // Configurar eventos para la nueva fila (ahora usando la fila recién agregada)
    const $lastRow = $('#partsTable tbody tr.part-row').last();
    
    $lastRow.find('.part-quantity').on('input', function() {
        updateRowTotal($(this).closest('tr'));
    });
    
    $lastRow.find('.part-unit-value').on('input', function() {
        // Formatear el valor
        const value = this.value.replace(/[^\d]/g, '');
        this.value = value ? parseInt(value).toLocaleString('es-CO') : '0';
        
        // Actualizar el total de la fila
        updateRowTotal($(this).closest('tr'));
    });
    
    $lastRow.find('.remove-part').on('click', function() {
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
    
    // Actualizar totales
    updateRowTotal($lastRow);
    
    return $lastRow;
}

// Variable global para rastrear qué fila se está editando actualmente
let currentEditingRow = 0;

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
    
    // Realizar petición fetch a la nueva URL
    fetch('/search_spare_parts', {
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
        // Ocultar loader
        searchResultsLoader.hide();
        
        console.log("Resultados de búsqueda:", data);

        // Verificar si hay resultados
        if (!data.parts || data.parts.length === 0) {
            noResultsMessage.show();
        return;
    }
    
        // Crear o mostrar el contenedor de resultados
        let resultsContainer = document.querySelector('.search-results-container');
        if (!resultsContainer) {
            resultsContainer = document.createElement('div');
            resultsContainer.className = 'search-results-container';
            searchResultsList.appendChild(resultsContainer);
        }
        resultsContainer.style.display = 'block';
        resultsContainer.innerHTML = '';
    
        // Crear una fila para los resultados
        const row = document.createElement('div');
        row.className = 'row g-3';
        resultsContainer.appendChild(row);

        // Agregar contador de resultados
        const resultCount = document.createElement('div');
        resultCount.className = 'col-12 mb-2';
        resultCount.innerHTML = `<small class="text-muted">Se encontraron ${data.parts.length} repuestos</small>`;
        row.appendChild(resultCount);

        // Añadir cada repuesto como una tarjeta
        data.parts.forEach(part => {
            const colDiv = document.createElement('div');
            colDiv.className = 'col-md-6';
            
            const formattedPrice = formatNumberWithCommas(part.price || 0);
            
            colDiv.innerHTML = `
                <div class="card mb-2 shadow-sm search-result-card" 
                     data-code="${part.code}" 
                     data-description="${part.description}" 
                     data-price="${part.price || 0}">
                    <div class="card-body py-2">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <h6 class="mb-1">${part.code} - ${part.description}</h6>
                            </div>
                            <button class="btn btn-sm btn-primary select-result">
                                <i class="fas fa-check me-1"></i>Seleccionar
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            row.appendChild(colDiv);
        });
        
        // Agregar evento de clic a las tarjetas
        $('.search-result-card').on('click', function() {
            const code = $(this).data('code');
            const description = $(this).data('description');
            const price = $(this).data('price') || 0;
            
            // Actualizar la fila con los datos seleccionados
            updatePartRow(currentEditingRow, {
                code: code,
                description: description,
                price: price
            });
            
            // Cerrar el modal
            $('#searchPartsModal').modal('hide');
        });
        
        // Evento para los botones de seleccionar
        $('.select-result').on('click', function(e) {
            e.stopPropagation(); // Evitar que se propague al card
            const card = $(this).closest('.search-result-card');
            const code = card.data('code');
            const description = card.data('description');
            const price = card.data('price') || 0;
    
            // Actualizar la fila con los datos seleccionados
            updatePartRow(currentEditingRow, {
                code: code,
                description: description,
                price: price
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
            <p class="text-muted mb-0">Intente nuevamente</p>
        `);
    });
}


