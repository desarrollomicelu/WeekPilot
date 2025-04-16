// Función global para mostrar toast con SweetAlert

function showToast(icon, title, position = 'top-end', timer = 3000) {
    const Toast = Swal.mixin({
        toast: true,
        position: position,
        showConfirmButton: false,
        timer: timer,
        timerProgressBar: true,
        didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer)
            toast.addEventListener('mouseleave', Swal.resumeTimer)
        }
    });

    Toast.fire({
        icon: icon,
        title: title
    });
}

document.addEventListener('DOMContentLoaded', function () {
    // ===== GESTIÓN DE REPUESTOS =====
    const partsTable = document.getElementById('partsTable');
    if (partsTable) {
        const partsTableBody = partsTable.querySelector('tbody');
        const addPartBtn = document.getElementById('addPartBtn');
        const partRowTemplate = document.getElementById('partRowTemplate');
        const noPartsRow = document.getElementById('noPartsRow');
        const serviceValueInput = document.getElementById('service_value');
        const spareValueInput = document.getElementById('spare_value');
        const totalInput = document.getElementById('total');

        // Función para calcular el total de un repuesto individual
        function editPartTotal(row) {
            const quantity = parseFloat(row.querySelector('.part-quantity').value) || 0;
            const unitValue = parseFloat(row.querySelector('.part-unit-value').value) || 0;
            const totalValue = quantity * unitValue;
            row.querySelector('.part-total-value').value = totalValue;
            editTotals();
        }

        // Función para actualizar todos los totales
        function editTotals() {
            let spareTotal = 0;
            document.querySelectorAll('.part-total-value').forEach(input => {
                spareTotal += parseFloat(input.value) || 0;
            });
            spareValueInput.value = spareTotal;
            const serviceValue = parseFloat(serviceValueInput.value) || 0;
            totalInput.value = serviceValue + spareTotal;
        }

        // Función para actualizar los índices de las filas
        function editRowIndices() {
            const rows = partsTableBody.querySelectorAll('.part-row');
            rows.forEach((row, index) => {
                const indexCell = row.querySelector('.part-index');
                indexCell.textContent = index + 1;
                // Aplicar padding al índice
                indexCell.style.padding = '15px';
            });

            // Mostrar/ocultar la fila "No se han agregado repuestos"
            if (rows.length === 0 && noPartsRow) {
                noPartsRow.style.display = '';
            } else if (noPartsRow) {
                noPartsRow.style.display = 'none';
            }
        }

        // Evento para agregar un nuevo repuesto
        if (addPartBtn) {
            addPartBtn.addEventListener('click', function () {
                if (noPartsRow) {
                    noPartsRow.remove();
                }

                const newRow = document.importNode(partRowTemplate.content, true).querySelector('tr');
                partsTableBody.appendChild(newRow);

                // Inicializar Select2 para el nuevo select de repuesto si está disponible
                if ($.fn.select2 && newRow.querySelector('select')) {
                    $(newRow.querySelector('select')).select2({
                        width: '90%',
                        placeholder: "Seleccione un repuesto",
                        allowClear: true
                    });
                }

                // Configurar eventos para el nuevo repuesto
                newRow.querySelector('.part-quantity').addEventListener('input', () => editPartTotal(newRow));
                newRow.querySelector('.part-unit-value').addEventListener('input', () => editPartTotal(newRow));
                newRow.querySelector('.remove-part').addEventListener('click', () => {
                    // Pedir confirmación antes de eliminar
                    Swal.fire({
                        title: '¿Eliminar repuesto?',
                        text: '¿Estás seguro de eliminar este repuesto?',
                        icon: 'warning',
                        showCancelButton: true,
                        confirmButtonColor: '#d33',
                        cancelButtonColor: '#3085d6',
                        confirmButtonText: 'Sí, eliminar',
                        cancelButtonText: 'Cancelar'
                    }).then((result) => {
                        if (result.isConfirmed) {
                            newRow.remove();
                            editRowIndices();
                            editTotals();

                            if (partsTableBody.querySelectorAll('.part-row').length === 0) {
                                const emptyRow = document.createElement('tr');
                                emptyRow.id = 'noPartsRow';
                                emptyRow.innerHTML = '<td colspan="6" class="text-center py-3">No se han agregado repuestos para este servicio.</td>';
                                partsTableBody.appendChild(emptyRow);
                            }

                            // Mostrar toast de confirmación
                            showToast('success', 'Repuesto eliminado correctamente');
                        }
                    });
                });

                editRowIndices();

                // Mostrar toast de confirmación
                showToast('success', 'Repuesto agregado correctamente');
            });
        }

        // Configurar eventos para filas existentes
        function setupExistingRows() {
            const existingRows = partsTableBody.querySelectorAll('.part-row');

            existingRows.forEach(row => {
                // Configurar Select2 para el select de descripción si está disponible
                if ($.fn.select2 && row.querySelector('select')) {
                    $(row.querySelector('select')).select2({
                        width: '100%',
                        placeholder: "Seleccione un repuesto",
                        allowClear: true
                    });
                }

                // Configurar eventos para cantidad y valor unitario
                row.querySelector('.part-quantity').addEventListener('input', () => editPartTotal(row));
                row.querySelector('.part-unit-value').addEventListener('input', () => editPartTotal(row));

                // Configurar evento para eliminar
                row.querySelector('.remove-part').addEventListener('click', () => {
                    // Pedir confirmación antes de eliminar
                    Swal.fire({
                        title: '¿Eliminar repuesto?',
                        text: '¿Estás seguro de eliminar este repuesto?',
                        icon: 'warning',
                        showCancelButton: true,
                        confirmButtonColor: '#d33',
                        cancelButtonColor: '#3085d6',
                        confirmButtonText: 'Sí, eliminar',
                        cancelButtonText: 'Cancelar'
                    }).then((result) => {
                        if (result.isConfirmed) {
                            row.remove();
                            editRowIndices();
                            editTotals();

                            if (partsTableBody.querySelectorAll('.part-row').length === 0) {
                                const emptyRow = document.createElement('tr');
                                emptyRow.id = 'noPartsRow';
                                emptyRow.innerHTML = '<td colspan="6" class="text-center py-3">No se han agregado repuestos para este servicio.</td>';
                                partsTableBody.appendChild(emptyRow);
                            }

                            // Mostrar toast de confirmación
                            showToast('success', 'Repuesto eliminado correctamente');
                        }
                    });
                });
            });

            // Inicializar los totales
            editTotals();
        }

        // Configurar filas existentes al cargar la página
        setupExistingRows();

        // Evento para cuando cambia el valor del servicio
        if (serviceValueInput) {
            serviceValueInput.addEventListener('input', editTotals);
        }
    }

    // ===== BÚSQUEDA EN TABLA DE TICKETS =====
    const searchRepairs = document.getElementById("searchRepairs");
    const ticketsTable = document.getElementById("ticketsTable");

    if (searchRepairs && ticketsTable) {
        searchRepairs.addEventListener("input", function () {
            const searchValue = this.value.toLowerCase();
            const rows = ticketsTable.getElementsByTagName("tr");

            let visibleRows = 0;
            for (let i = 1; i < rows.length; i++) {
                let rowText = rows[i].textContent.toLowerCase();
                if (rowText.includes(searchValue)) {
                    rows[i].style.display = "";
                    visibleRows++;
                } else {
                    rows[i].style.display = "none";
                }
            }

            // Actualizar contador después de la búsqueda
            document.getElementById('currentRowsCount').textContent = visibleRows;

            // Actualizar paginación después de buscar
            if (typeof updatePaginationAfterFilter === 'function') {
                updatePaginationAfterFilter();
            }
        });
    }

    // ===== GESTIÓN DE PROBLEMAS DEL DISPOSITIVO =====
    const searchProblems = document.getElementById("searchProblems");
    const problemCheckboxes = document.querySelectorAll(".problem-checkbox");
    const problemOptions = document.querySelectorAll(".problem-option");
    const selectedProblemsTextarea = document.getElementById("selected_problems");
    const selectAllProblemsBtn = document.getElementById("selectAllProblems");
    const clearProblemsBtn = document.getElementById("clearProblems");

    // Función para actualizar el textarea de problemas seleccionados
    function updateSelectedProblems() {
        if (!selectedProblemsTextarea || !problemCheckboxes.length) return;

        const selectedProblems = [];
        problemCheckboxes.forEach(checkbox => {
            if (checkbox.checked) {
                const label = document.querySelector(`label[for="${checkbox.id}"]`);
                if (label) {
                    selectedProblems.push(label.textContent.trim());
                }
            }
        });

        selectedProblemsTextarea.value = selectedProblems.join(', ');
    }

    // Configurar búsqueda de problemas
    if (searchProblems && problemOptions.length) {
        searchProblems.addEventListener('input', function () {
            const searchTerm = this.value.toLowerCase();

            problemOptions.forEach(option => {
                const label = option.querySelector('label');
                if (label) {
                    const text = label.textContent.toLowerCase();
                    option.style.display = text.includes(searchTerm) ? '' : 'none';
                }
            });
        });
    }

    // Configurar checkboxes de problemas
    if (problemCheckboxes.length) {
        problemCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', updateSelectedProblems);
        });

        // Inicializar el textarea con los problemas ya seleccionados
        updateSelectedProblems();
    }

    // Configurar botones de selección de problemas
    if (selectAllProblemsBtn) {
        selectAllProblemsBtn.addEventListener('click', function () {
            problemCheckboxes.forEach(checkbox => {
                const option = checkbox.closest('.problem-option');
                if (option && option.style.display !== 'none') {
                    checkbox.checked = true;
                }
            });
            updateSelectedProblems();
        });
    }

    if (clearProblemsBtn) {
        clearProblemsBtn.addEventListener('click', function () {
            problemCheckboxes.forEach(checkbox => {
                checkbox.checked = false;
            });
            updateSelectedProblems();
        });
    }

    // ===== AUTOCOMPLETADO DE DOCUMENTO DEL TÉCNICO =====
    const technicianSelect = document.getElementById('technical_name');
    const technicianDocumentInput = document.getElementById('documento');
    const statusSelect = document.getElementById('state');

    if (technicianSelect && technicianDocumentInput) {
        technicianSelect.addEventListener('change', function () {
            const selectedOption = this.options[this.selectedIndex];

            // Actualizar el documento del técnico
            if (selectedOption && selectedOption.value) {
                technicianDocumentInput.value = selectedOption.getAttribute('data-document') || '';

                // Cambiar el estado a "Asignado" si se selecciona un técnico y existe el select de estado
                if (statusSelect) {
                    for (let i = 0; i < statusSelect.options.length; i++) {
                        if (statusSelect.options[i].value === "Asignado") {
                            statusSelect.selectedIndex = i;
                            break;
                        }
                    }
                }
            } else {
                technicianDocumentInput.value = '';

                // Cambiar el estado a "Sin asignar" si no se selecciona un técnico y existe el select de estado
                if (statusSelect) {
                    for (let i = 0; i < statusSelect.options.length; i++) {
                        if (statusSelect.options[i].value === "Sin asignar") {
                            statusSelect.selectedIndex = i;
                            break;
                        }
                    }
                }
            }
        });

        // Ejecutar una vez al cargar para manejar valores preseleccionados
        if (technicianSelect.value) {
            const selectedOption = technicianSelect.options[technicianSelect.selectedIndex];
            if (selectedOption && selectedOption.value) {
                // Asignar el documento del técnico solo si no tiene valor o está vacío
                if (!technicianDocumentInput.value || technicianDocumentInput.value.trim() === '') {
                    technicianDocumentInput.value = selectedOption.getAttribute('data-document') || '';
                }
            }
        }
    }

    // ===== AUTOCOMPLETADO DE CÓDIGO DE PRODUCTO =====
    const referenceSelect = document.getElementById('reference');
    const productCodeInput = document.getElementById('product_code');

    if (referenceSelect && productCodeInput) {
        // Guardar el valor original al cargar la página
        let originalReference = referenceSelect.value;
        let originalReferenceText = referenceSelect.options[referenceSelect.selectedIndex]?.text || 'Sin seleccionar';

        referenceSelect.addEventListener('change', function () {
            const newReference = this.value;
            const newReferenceText = this.options[this.selectedIndex]?.text || 'Sin seleccionar';
            const selectedOption = this.options[this.selectedIndex];

            // Si la referencia es diferente a la original, pedir confirmación
            if (newReference !== originalReference && originalReference !== '') {
                Swal.fire({
                    title: 'Cambiar referencia',
                    text: `¿Estás seguro de cambiar la referencia del producto a "${newReferenceText}"?`,
                    icon: 'question',
                    showCancelButton: true,
                    confirmButtonColor: '#3085d6',
                    cancelButtonColor: '#d33',
                    confirmButtonText: 'Sí, cambiar',
                    cancelButtonText: 'Cancelar'
                }).then((result) => {
                    if (result.isConfirmed) {
                        // Actualizar el valor original
                        originalReference = newReference;
                        originalReferenceText = newReferenceText;

                        // Actualizar el código
                        // Actualizar el código del producto
                        if (productCodeInput) {
                            productCodeInput.value = selectedOption && selectedOption.getAttribute('data-code') ?
                                selectedOption.getAttribute('data-code') : '';
                        }

                        // Mostrar toast de confirmación
                        showToast('success', `Referencia cambiada a "${newReferenceText}"`);
                    } else {
                        // Restaurar el valor original
                        this.value = originalReference;
                    }
                });
            } else {
                // Actualizar el código del producto sin confirmación si es la misma referencia
                if (productCodeInput) {
                    productCodeInput.value = selectedOption && selectedOption.getAttribute('data-code') ?
                        selectedOption.getAttribute('data-code') : '';
                }
            }
        });

        // Ejecutar una vez al cargar para manejar valores preseleccionados
        if (referenceSelect.value) {
            const selectedOption = referenceSelect.options[referenceSelect.selectedIndex];
            if (selectedOption && selectedOption.value) {
                // Asegurar que se cargue el código del producto seleccionado
                if (!productCodeInput.value) {
                    productCodeInput.value = selectedOption.getAttribute('data-code');
                }
            }
        }
    }

    // ===== INICIALIZACIÓN DE SELECT2 =====
    if ($.fn.select2) {
        // Inicializar Select2 para selectores específicos
        $('#reference').select2({
            width: '100%',
            placeholder: "Seleccione una opción",
            allowClear: true
        });

        // Para los selects dentro de la tabla de repuestos
        $('.searchable-select').not('#state, #city, #priority, #technical_name, #documento, #product_code').select2({
            width: '100%',
            placeholder: "Seleccione una opción",
            allowClear: true
        });
    }

    // ===== VALIDACIÓN DE FORMULARIO =====
    // ===== VALIDACIÓN DE FORMULARIO =====
    const ticketForm = document.getElementById('ticketForm');

    if (ticketForm) {
        ticketForm.addEventListener('submit', function (e) {
            // Evitar que el formulario se envíe automáticamente
            e.preventDefault();

            // Quitar formato de moneda antes de enviar
            document.querySelectorAll('.part-unit-value, .part-total-value, #service_value, #spare_value, #total').forEach(input => {
                input.value = unformatCurrency(input.value);
            });

            // Validar campos requeridos
            let isValid = true;
            let errorMessage = '';

            // Validar sede
            const sede = document.getElementById('sede');
            if (sede && !sede.value.trim()) {
                isValid = false;
                errorMessage += 'La sede es requerida.<br>';
                sede.classList.add('is-invalid');
            } else if (sede) {
                sede.classList.remove('is-invalid');
            }

            // Validar referencia del producto
            if (referenceSelect && !referenceSelect.value.trim()) {
                isValid = false;
                errorMessage += 'La referencia del producto es requerida.<br>';
                referenceSelect.classList.add('is-invalid');
            } else if (referenceSelect) {
                referenceSelect.classList.remove('is-invalid');
            }

            // Validar código del producto
            if (productCodeInput && !productCodeInput.value.trim()) {
                isValid = false;
                errorMessage += 'El código del producto es requerido.<br>';
                productCodeInput.classList.add('is-invalid');
            } else if (productCodeInput) {
                productCodeInput.classList.remove('is-invalid');
            }

            // Validar IMEI o Serial
            const imeiInput = document.getElementById('IMEI');
            if (imeiInput && !imeiInput.value.trim()) {
                isValid = false;
                errorMessage += 'El IMEI o Serial es requerido.<br>';
                imeiInput.classList.add('is-invalid');
            } else if (imeiInput) {
                imeiInput.classList.remove('is-invalid');
            }

            // Validar valor del servicio
            const serviceValue = document.getElementById('service_value');
            if (serviceValue && (!serviceValue.value || isNaN(serviceValue.value) || parseFloat(serviceValue.value) < 0)) {
                isValid = false;
                errorMessage += 'El valor del servicio debe ser un número positivo.<br>';
                serviceValue.classList.add('is-invalid');
            } else if (serviceValue) {
                serviceValue.classList.remove('is-invalid');
            }

            // Si hay errores, mostrar mensaje
            if (!isValid) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error de validación',
                    html: errorMessage,
                    confirmButtonText: 'Corregir'
                });
                return; // Detener el envío del formulario
            }

            // Si todo está bien, mostrar confirmación
            Swal.fire({
                title: '¿Guardar cambios?',
                text: '¿Estás seguro de guardar los cambios en este ticket?',
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Sí, guardar',
                cancelButtonText: 'Cancelar'
            }).then((result) => {
                if (result.isConfirmed) {
                    // Mostrar indicador de carga
                    Swal.fire({
                        title: 'Guardando...',
                        html: 'Por favor espera mientras se guardan los cambios.',
                        allowOutsideClick: false,
                        didOpen: () => {
                            Swal.showLoading();
                        }
                    });

                    // Enviar el formulario
                    ticketForm.removeEventListener('submit', arguments.callee);
                    ticketForm.submit();
                }
            });
        });
    }

    // ===== FUNCIONALIDAD DE FILTRADO Y PAGINACIÓN PARA TABLA DE TICKETS =====
    if (ticketsTable) {
        // Variables para la paginación
        let currentPage = 1;
        let rowsPerPage = 10; // Default
        let totalPages = 1;
        let filteredRows = $(); // jQuery object to store rows matching filters

        // Función para generar los botones de paginación
        function generatePaginationButtons() {
            const paginationElement = $('#pagination');
            if (!paginationElement.length) return;

            // Limpiar botones existentes (excepto Anterior y Siguiente)
            paginationElement.find('li').not('#prevPage, #nextPage').remove();

            if (totalPages === 0) {
                $('#prevPage').addClass('disabled');
                $('#nextPage').addClass('disabled');
                return; // No buttons if no pages
            }

            // Si hay pocas páginas, mostrar todas
            if (totalPages <= 7) {
                for (let i = 1; i <= totalPages; i++) {
                    const isActive = i === currentPage ? 'active' : '';
                    $('#nextPage').before(`<li class="page-item ${isActive}" data-page="${i}"><a class="page-link" href="#">${i}</a></li>`);
                }
            } else {
                // Para muchas páginas, mostrar un subconjunto con elipsis
                // Siempre mostrar primera página
                $('#nextPage').before(`<li class="page-item ${currentPage === 1 ? 'active' : ''}" data-page="1"><a class="page-link" href="#">1</a></li>`);

                // Determinar rango de páginas a mostrar
                let startPage = Math.max(2, currentPage - 2);
                let endPage = Math.min(totalPages - 1, currentPage + 2);

                // Mostrar elipsis antes si es necesario
                if (startPage > 2) {
                    $('#nextPage').before('<li class="page-item disabled"><a class="page-link" href="#">...</a></li>');
                }

                // Mostrar páginas intermedias
                for (let i = startPage; i <= endPage; i++) {
                    const isActive = i === currentPage ? 'active' : '';
                    $('#nextPage').before(`<li class="page-item ${isActive}" data-page="${i}"><a class="page-link" href="#">${i}</a></li>`);
                }

                // Mostrar elipsis después si es necesario
                if (endPage < totalPages - 1) {
                    $('#nextPage').before('<li class="page-item disabled"><a class="page-link" href="#">...</a></li>');
                }

                // Siempre mostrar última página (si no está ya incluida en el rango)
                if (totalPages > 1) {
                    $('#nextPage').before(`<li class="page-item ${currentPage === totalPages ? 'active' : ''}" data-page="${totalPages}"><a class="page-link" href="#">${totalPages}</a></li>`);
                }
            }

            // Actualizar estado de botones Anterior/Siguiente (se llama desde showPage)
            // updatePrevNextButtons(); // No need to call here, showPage does it
        }

        // Función para mostrar una página específica
        function showPage(pageNum) {
            // Recalculate totalPages based on the current filteredRows count and rowsPerPage
            totalPages = (filteredRows.length > 0) ? Math.ceil(filteredRows.length / rowsPerPage) : 0;

            // Validate page number
            if (pageNum < 1) pageNum = 1;
            if (pageNum > totalPages) pageNum = totalPages;
            if (totalPages === 0) pageNum = 0; // Indicate no page if no results

            currentPage = pageNum;

            // Ocultar todas las filas filtradas primero
            if (filteredRows) filteredRows.hide();

            let rowsToShowOnPage = $();
            let countOnPage = 0;

            // Calcular y mostrar filas para la página actual si hay una página válida
            if (currentPage > 0 && filteredRows && filteredRows.length > 0) {
                const startIndex = (currentPage - 1) * rowsPerPage;
                // Ensure endIndex does not exceed filteredRows length
                const endIndex = Math.min(startIndex + rowsPerPage, filteredRows.length);

                rowsToShowOnPage = filteredRows.slice(startIndex, endIndex);
                rowsToShowOnPage.show();
                countOnPage = rowsToShowOnPage.length;
            }

            // Actualizar contador de filas mostradas en la página actual
            if ($('#currentRowsCount').length) {
                $('#currentRowsCount').text(countOnPage);
            }
            // Actualizar contador total de filas filtradas
            if ($('#totalRowsCount').length) {
                $('#totalRowsCount').text(filteredRows ? filteredRows.length : 0);
            }


            // Actualizar botones de paginación (highlight active page)
            $('#pagination li').removeClass('active');
            if (currentPage > 0) {
                $(`#pagination li[data-page="${currentPage}"]`).addClass('active');
            }

            // Actualizar estado de botones Anterior/Siguiente
            updatePrevNextButtons();

            // Show/Hide "No results" message (handled in updateAndPaginateResults)
        }

        // Función para actualizar estado de botones Anterior/Siguiente
        function updatePrevNextButtons() {
            const prevPage = $('#prevPage');
            const nextPage = $('#nextPage');

            if (!prevPage.length || !nextPage.length) return;

            // Botón Anterior
            if (currentPage <= 1) { // Disable if on page 1 or if there are no pages (currentPage=0)
                prevPage.addClass('disabled');
            } else {
                prevPage.removeClass('disabled');
            }

            // Botón Siguiente
            if (currentPage === totalPages || totalPages === 0) { // Disable if on last page or no pages
                nextPage.addClass('disabled');
            } else {
                nextPage.removeClass('disabled');
            }
        }

        // Función principal que filtra, busca y actualiza la paginación
        function updateAndPaginateResults() {
            const searchTerm = ($('#searchRepairs').val() || '').toLowerCase();
            const selectedStatusLabel = $('input[name="filterStatus"]:checked').next('label').text().trim() || 'Todos'; // Get the label text
            rowsPerPage = parseInt($('#rowsPerPage').val()); // Get current rows per page setting

            // 1. Obtener todas las filas originales (excluyendo la de "sin resultados")
            const allRows = $('#ticketsTable tbody tr').not('.no-results');

            // 2. Filtrar por estado
            let statusFilteredRows = allRows.filter(function () {
                const $row = $(this);
                const ticketStatus = $row.data('status'); // e.g., 'En proceso', 'Terminado'

                // Explicitly handle 'Todos'
                if (selectedStatusLabel === 'Todos') {
                    return true; // Include all rows if 'Todos' is selected
                }

                // Handle specific status filters based on the label text
                switch (selectedStatusLabel) {
                    case 'Sin asignar':
                        return !ticketStatus || ticketStatus === 'Sin asignar';
                    case 'Asignados':
                        return ticketStatus === 'Asignado';
                    case 'En Proceso':
                        // Compare case-insensitively
                        return ticketStatus && ticketStatus.toLowerCase() === 'en proceso';
                    case 'Terminados':
                        return ticketStatus === 'Terminado';
                    case 'Cancelados':
                        return ticketStatus === 'Cancelado';
                    default:
                        return false; // Default case, should not be reached
                }
            });

            // 3. Filtrar por término de búsqueda sobre las filas ya filtradas por estado
            filteredRows = statusFilteredRows.filter(function () {
                if (!searchTerm) return true; // Si no hay búsqueda, mantener todas las filas filtradas por estado
                const rowText = $(this).text().toLowerCase();
                return rowText.includes(searchTerm);
            });

            // Ocultar todas las filas antes de mostrar las de la página correcta
            allRows.hide();

            // Recalcular total de páginas basado en las filas filtradas finales
            totalPages = (filteredRows.length > 0) ? Math.ceil(filteredRows.length / rowsPerPage) : 0;

            // Resetear a la página 1 si es necesario
            if (currentPage > totalPages) {
                currentPage = Math.max(1, totalPages);
            }
            if (currentPage === 0 && totalPages > 0) {
                currentPage = 1;
            }

            // Generar botones de paginación ANTES de llamar a showPage
            generatePaginationButtons();

            // Mostrar la página correcta (que actualizará contadores y botones prev/next)
            showPage(currentPage);

            // Mostrar/Ocultar mensaje "Sin resultados"
            const noResultsRow = $('#ticketsTable tbody .no-results');
            if (filteredRows.length === 0) {
                if (noResultsRow.length === 0) {
                    $('#ticketsTable tbody').append('<tr class="no-results"><td colspan="9" class="text-center py-5 text-muted">No hay tickets que coincidan con los filtros aplicados.</td></tr>');
                }
                $('#ticketsTable tbody .no-results').show();
            } else {
                if (noResultsRow.length > 0) {
                    noResultsRow.hide();
                }
            }
        }

        // Inicializar paginación al cargar la página si existe el contenedor
        if ($('#pagination').length) {

            // Evento para cambiar número de filas por página
            $('#rowsPerPage').on('change', function () {
                currentPage = 1; // Volver a la página 1 al cambiar filas por página
                updateAndPaginateResults();
            });

            // Evento para navegar entre páginas usando los botones generados
            $('#pagination').on('click', 'li[data-page]', function (e) {
                e.preventDefault();
                const $this = $(this);
                if ($this.hasClass('disabled') || $this.hasClass('active')) {
                    return; // No hacer nada si está deshabilitado o ya activo
                }
                const pageNum = parseInt($this.data('page'));
                if (!isNaN(pageNum)) {
                    showPage(pageNum); // Solo mostrar la página, no recalcular todo
                }
            });

            // Evento para botones Anterior/Siguiente
            $('#pagination').on('click', '#prevPage, #nextPage', function (e) {
                e.preventDefault();
                const $this = $(this);
                if ($this.hasClass('disabled')) {
                    return;
                }
                if ($this.attr('id') === 'prevPage') {
                    showPage(currentPage - 1);
                } else if ($this.attr('id') === 'nextPage') {
                    showPage(currentPage + 1);
                }
            });


            // Event listener para búsqueda
            $('#searchRepairs').on('input', function () {
                // Podrías usar debounce aquí para no ejecutar en cada tecla
                setTimeout(() => {
                    currentPage = 1; // Volver a la página 1 al buscar
                    updateAndPaginateResults();
                }, 200); // Pequeño retraso
            });

            // Event listeners para botones de filtro de estado
            $('input[name="filterStatus"]').on('change', function () {
                currentPage = 1; // Volver a la página 1 al cambiar filtro
                updateAndPaginateResults();
                // Actualizar estilo visual del filtro activo
                $('input[name="filterStatus"]').next('label').removeClass('btn-secondary').addClass('btn-outline-secondary'); // Reset all
                $(this).next('label').removeClass('btn-outline-secondary').addClass('btn-secondary'); // Activate clicked
            });

            // Establecer estilo inicial del filtro activo
            $('input[name="filterStatus"]:checked').next('label').removeClass('btn-outline-secondary').addClass('btn-secondary');

            // Llamada inicial para configurar la tabla al cargar
            updateAndPaginateResults();
        }
    }

    // ===== FUNCIONALIDAD PARA ACTUALIZAR ESTADO DE TICKETS =====
    // Cuando cambia el estado de un ticket
    $('.status-select').on('change', function () {
        // Obtener elementos y valores
        const $select = $(this);
        const ticketId = $select.data('ticket-id');
        const newStatus = $select.val();
        const originalValue = $select.data('original-value') || $select.find('option:selected').val();

        // Guardar el valor original por si hay error
        $select.data('original-value', originalValue);

        // Mostrar confirmación antes de cambiar el estado
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
                // Mostrar indicador de carga
                $select.addClass('opacity-50');
                $select.prop('disabled', true);

                // Mostrar toast de carga
                showToast('info', 'Actualizando estado...', 'top-end');

                // Enviar solicitud AJAX
                $.ajax({
                    url: '/update_ticket_status_ajax',
                    method: 'POST',
                    data: {
                        ticket_id: ticketId,
                        state: newStatus
                    },
                    success: function (response) {
                        // Quitar indicador de carga
                        $select.removeClass('opacity-50');
                        $select.prop('disabled', false);

                        if (response.success) {
                            // Actualizar el timestamp mostrado
                            if (response.timestamp) {
                                const $timestamp = $select.closest('tr').find('.timestamp');
                                if ($timestamp.length) {
                                    $timestamp.text(response.timestamp);
                                }
                            }

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

// Asegurarse de que el evento change se dispare cuando se selecciona una opción con Select2
$(document).ready(function () {
    // Para el select de referencia
    $('#reference').on('select2:select', function (e) {
        // Disparar el evento change manualmente
        this.dispatchEvent(new Event('change'));
    });

    // Para otros selects que usan Select2
    $('.searchable-select').on('select2:select', function (e) {
        // Disparar el evento change manualmente
        this.dispatchEvent(new Event('change'));
    });
});
// Función para formatear números como moneda (separador de miles)
// Función para formatear números como moneda (separador de miles sin decimales)
function formatCurrency(value) {
    // Convertir a número entero y luego a string con formato
    const numValue = Math.round(parseFloat(value) || 0);
    return numValue.toLocaleString('es-CO', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
}

// Función para quitar el formato y obtener solo el número
function unformatCurrency(value) {
    if (!value) return 0;
    // Quitar todos los puntos que son separadores de miles
    return parseInt(value.replace(/\./g, '')) || 0;
}

// Formatear todos los campos de moneda
function formatAllCurrencyFields() {
    // Formatear campos de valor de servicio, repuestos y total
    const serviceValue = document.getElementById('service_value');
    const spareValue = document.getElementById('spare_value');
    const totalValue = document.getElementById('total');

    if (serviceValue) serviceValue.value = formatCurrency(serviceValue.value);
    if (spareValue) spareValue.value = formatCurrency(spareValue.value);
    if (totalValue) totalValue.value = formatCurrency(totalValue.value);

    // Formatear valores en la tabla de repuestos
    document.querySelectorAll('.part-unit-value, .part-total-value').forEach(input => {
        input.value = formatCurrency(input.value);
    });
}

// Función para actualizar los totales cuando cambia un valor
function updateTotalsWithFormat() {
    // Primero actualizar los totales de cada fila
    document.querySelectorAll('.part-row').forEach(row => {
        const quantity = parseInt(row.querySelector('.part-quantity').value) || 0;
        const unitValue = unformatCurrency(row.querySelector('.part-unit-value').value);
        const totalValue = quantity * unitValue;

        row.querySelector('.part-total-value').value = formatCurrency(totalValue);
    });

    // Luego calcular el total de repuestos
    let totalPartsValue = 0;
    document.querySelectorAll('.part-total-value').forEach(input => {
        totalPartsValue += unformatCurrency(input.value);
    });

    // Actualizar el campo de valor de repuestos
    const spareValue = document.getElementById('spare_value');
    if (spareValue) {
        spareValue.value = formatCurrency(totalPartsValue);
    }

    // Calcular el total general
    const serviceValue = document.getElementById('service_value');
    const totalValue = document.getElementById('total');

    if (serviceValue && totalValue) {
        const serviceAmount = unformatCurrency(serviceValue.value);
        totalValue.value = formatCurrency(serviceAmount + totalPartsValue);
    }
}

// Inicializar eventos para campos de moneda
document.addEventListener('DOMContentLoaded', function () {
    // Formatear valores iniciales
    formatAllCurrencyFields();

    // Manejar el evento de cambio en el valor del servicio
    const serviceValue = document.getElementById('service_value');
    if (serviceValue) {
        serviceValue.addEventListener('focus', function () {
            this.value = unformatCurrency(this.value);
        });

        serviceValue.addEventListener('blur', function () {
            this.value = formatCurrency(this.value);
            updateTotalsWithFormat();
        });
    }

    // Observar cambios en la tabla para formatear nuevas filas
    const observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                // Buscar nuevos campos de moneda en las filas agregadas
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1 && node.classList.contains('part-row')) {
                        const unitValueInput = node.querySelector('.part-unit-value');

                        if (unitValueInput) {
                            // Formatear el valor inicial
                            unitValueInput.value = formatCurrency(unitValueInput.value);

                            // Agregar eventos
                            unitValueInput.addEventListener('focus', function () {
                                this.value = unformatCurrency(this.value);
                            });

                            unitValueInput.addEventListener('blur', function () {
                                this.value = formatCurrency(this.value);
                                updateTotalsWithFormat();
                            });
                        }

                        // Agregar evento a la cantidad
                        const quantityInput = node.querySelector('.part-quantity');
                        if (quantityInput) {
                            quantityInput.addEventListener('change', updateTotalsWithFormat);
                        }
                    }
                });
            }
        });
    });

    // Observar cambios en la tabla de repuestos
    const partsTable = document.querySelector('#partsTable tbody');
    if (partsTable) {
        observer.observe(partsTable, { childList: true });
    }

    // Manejar eliminación de filas
    document.addEventListener('click', function (e) {
        if (e.target.classList.contains('remove-part') || e.target.closest('.remove-part')) {
            // Esperar a que se elimine la fila antes de actualizar totales
            setTimeout(updateTotalsWithFormat, 0);
        }
    });
});


