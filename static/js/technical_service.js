document.addEventListener("DOMContentLoaded", function () {
    // Funcionalidad de búsqueda para la tabla de tickets
    const searchInput = document.getElementById("searchInput");
    const ticketsTable = document.getElementById("ticketsTable");

    if (searchInput && ticketsTable) {
        searchInput.addEventListener("input", function () {
            const searchValue = this.value.toLowerCase();
            const rows = ticketsTable.getElementsByTagName("tr");

            for (let i = 1; i < rows.length; i++) {
                let rowText = rows[i].textContent.toLowerCase();
                rows[i].style.display = rowText.includes(searchValue) ? "" : "none";
            }
        });
    }

    // Funcionalidad para actualizar estado de tickets
$(document).ready(function() {
    // Cuando cambia el estado de un ticket
    $('.status-select').on('change', function() {
        // Mostrar indicador de carga
        $(this).addClass('opacity-50');
        
        // Enviar el formulario
        $(this).closest('form').submit();
    });
});

    // Funcionalidad para filtrar tickets por estado
$(document).ready(function() {
    function filterTickets(status) {
        // Si el estado es "Todos", mostrar todos los tickets
        if (status === 'Todos') {
            $('tbody tr').show();
            return;
        }
        
        // Filtrar por el estado seleccionado
        $('tbody tr').each(function() {
            // Obtener el estado del ticket de la celda correspondiente
            var ticketStatus = $(this).find('td:nth-child(5) select').val();
            
            if (ticketStatus === status) {
                $(this).show();
            } else {
                $(this).hide();
            }
        });
        
        // Actualizar el contador de tickets mostrados
        updateTicketCounter();
    }
    
    // Función para actualizar el contador de tickets
    function updateTicketCounter() {
        const visibleTickets = $('tbody tr:visible').length;
        $('.badge.bg-primary strong').text(visibleTickets);
    }

    // Event listener para los botones de filtro
    $('input[name="filterStatus"]').on('change', function() {
        var selectedStatus = $(this).next('label').text().trim();
        filterTickets(selectedStatus);
        
        // Actualizar la UI para mostrar el filtro activo
        $('.filter-active').removeClass('filter-active');
        $(this).next('label').addClass('filter-active');
    });
    
    // También permitir filtrar cuando cambia el estado de un ticket
    $('select[name="status"]').on('change', function() {
        // Obtener el filtro actualmente seleccionado
        const activeFilter = $('input[name="filterStatus"]:checked').next('label').text().trim();
        // Volver a aplicar el filtro
        filterTickets(activeFilter);
    });

    // Inicializar con el filtro "Todos"
    filterTickets('Todos');
    
    // Agregar clase CSS para el botón activo
    $('input[name="filterStatus"]:checked').next('label').addClass('filter-active');
});


    // Inicializar Select2 para selectores específicos
    $(document).ready(function () {
        // Inicializar Select2 solo para los campos que lo necesitan
        $('#reference, #product_code').select2({
            width: '100%',
            placeholder: "Seleccione una opción",
            allowClear: true
        });

        // Para los selects dentro de la tabla de repuestos, mantenemos la clase searchable-select
        $('.searchable-select').not('#state, #city, #priority, #technical_name, #technical_document').select2({
            width: '100%',
            placeholder: "Seleccione una opción",
            allowClear: true
        });
    });

    // Funcionalidad común para páginas de creación y edición de tickets
    if (document.getElementById('create-ticket-page') || document.getElementById('edit-ticket-page')) {
        // Funcionalidad para autocompletar el documento del técnico
        const technicianSelect = document.getElementById('technical_name');
        const technicianDocumentInput = document.getElementById('technical_document');
        const stateSelect = document.getElementById('state');

        if (technicianSelect && technicianDocumentInput && stateSelect) {
            technicianSelect.addEventListener('change', function () {
                const selectedOption = this.options[this.selectedIndex];

                // Actualizar el documento del técnico
                if (selectedOption.value) {
                    technicianDocumentInput.value = selectedOption.getAttribute('data-document');

                    // Cambiar el estado a "Asignado" si se selecciona un técnico
                    for (let i = 0; i < stateSelect.options.length; i++) {
                        if (stateSelect.options[i].value === "Asignado") {
                            stateSelect.selectedIndex = i;
                            break;
                        }
                    }
                } else {
                    technicianDocumentInput.value = '';

                    // Cambiar el estado a "Sin asignar" si no se selecciona un técnico
                    for (let i = 0; i < stateSelect.options.length; i++) {
                        if (stateSelect.options[i].value === "Sin asignar") {
                            stateSelect.selectedIndex = i;
                            break;
                        }
                    }
                }
            });

            // Ejecutar una vez al cargar para manejar valores preseleccionados
            if (technicianSelect.value) {
                const selectedOption = technicianSelect.options[technicianSelect.selectedIndex];
                if (selectedOption.value) {
                    technicianDocumentInput.value = selectedOption.getAttribute('data-document');

                    // Establecer estado a "Asignado" para valores preseleccionados
                    for (let i = 0; i < stateSelect.options.length; i++) {
                        if (stateSelect.options[i].value === "Asignado") {
                            stateSelect.selectedIndex = i;
                            break;
                        }
                    }
                }
            }
        }

        // Sincronización entre referencia y código de producto
        const referenceSelect = document.getElementById('reference');
        const productCodeSelect = document.getElementById('product_code');

        if (referenceSelect && productCodeSelect) {
            // Crear mapeos entre referencias y códigos
            const refToCodeMap = {};
            const codeToRefMap = {};

            // Construir mapeos basados en CODLINEA
            function buildMappings() {
                const refOptions = Array.from(referenceSelect.options).filter(opt => opt.value);
                const codeOptions = Array.from(productCodeSelect.options).filter(opt => opt.value);

                refOptions.forEach(refOpt => {
                    const refText = refOpt.textContent;
                    const refValue = refOpt.value;
                    const codLineaMatch = refText.match(/\(([^)]+)\)/);

                    if (codLineaMatch && codLineaMatch[1]) {
                        const codLinea = codLineaMatch[1].trim();

                        codeOptions.forEach(codeOpt => {
                            const codeText = codeOpt.textContent;
                            const codeValue = codeOpt.value;

                            if (codeText.includes(`(${codLinea})`)) {
                                refToCodeMap[refValue] = codeValue;
                                codeToRefMap[codeValue] = refValue;
                            }
                        });
                    }
                });

                console.log("Mapeo de referencia a código:", refToCodeMap);
                console.log("Mapeo de código a referencia:", codeToRefMap);
            }

            buildMappings();

            // Variable para evitar bucles infinitos
            let isUpdating = false;

            // Cuando cambia la referencia, actualizar el código
            referenceSelect.addEventListener('change', function () {
                if (isUpdating) return;

                const selectedRef = this.value;
                console.log("Referencia seleccionada:", selectedRef);

                if (selectedRef && refToCodeMap[selectedRef]) {
                    isUpdating = true;
                    console.log("Actualizando código a:", refToCodeMap[selectedRef]);
                    productCodeSelect.value = refToCodeMap[selectedRef];

                    // Si estamos usando Select2, disparar el evento change
                    if ($.fn.select2) {
                        $(productCodeSelect).trigger('change');
                    }

                    isUpdating = false;
                }
            });

            // Cuando cambia el código, actualizar la referencia
            productCodeSelect.addEventListener('change', function () {
                if (isUpdating) return;

                const selectedCode = this.value;
                console.log("Código seleccionado:", selectedCode);

                if (selectedCode && codeToRefMap[selectedCode]) {
                    isUpdating = true;
                    console.log("Actualizando referencia a:", codeToRefMap[selectedCode]);
                    referenceSelect.value = codeToRefMap[selectedCode];

                    // Si estamos usando Select2, disparar el evento change
                    if ($.fn.select2) {
                        $(referenceSelect).trigger('change');
                    }

                    isUpdating = false;
                }
            });
        }

        // Funcionalidad para problemas del dispositivo
        const searchProblems = document.getElementById('searchProblems');
        const problemCheckboxes = document.querySelectorAll('.problem-checkbox');
        const problemOptions = document.querySelectorAll('.problem-option');
        const selectedProblemsTextarea = document.getElementById('selected_problems');
        const selectAllProblemsBtn = document.getElementById('selectAllProblems');
        const clearProblemsBtn = document.getElementById('clearProblems');

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

        // Gestión de repuestos
        const partsTable = document.getElementById('partsTable');
        const addPartBtn = document.getElementById('addPartBtn');
        const partRowTemplate = document.getElementById('partRowTemplate');

        if (partsTable && addPartBtn && partRowTemplate) {
            const partsTableBody = partsTable.querySelector('tbody');
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

                // Actualizar el total de repuestos y el total general
                updateTotals();
            }

            // Función para actualizar todos los totales
            function updateTotals() {
                let spareTotal = 0;

                // Sumar todos los valores totales de repuestos
                document.querySelectorAll('.part-total-value').forEach(input => {
                    spareTotal += parseFloat(input.value) || 0;
                });

                // Actualizar el campo de valor de repuestos
                spareValueInput.value = spareTotal;

                // Actualizar el total general (servicio + repuestos)
                const serviceValue = parseFloat(serviceValueInput.value) || 0;
                totalInput.value = serviceValue + spareTotal;
            }

            function editRowIndices() {
                const rows = partsTableBody.querySelectorAll('.part-row');
                rows.forEach((row, index) => {
                    row.querySelector('.part-index').textContent = index + 1;
                });
            }

            // Configurar eventos para filas existentes (importante para edición)
            function setupExistingRows() {
                const existingRows = partsTableBody.querySelectorAll('.part-row');

                existingRows.forEach(row => {
                    // Configurar Select2 para el select de descripción
                    $(row.querySelector('select')).select2({
                        width: '100%',
                        placeholder: "Seleccione un repuesto",
                        allowClear: true
                    });

                    // Configurar eventos para cantidad y valor unitario
                    row.querySelector('.part-quantity').addEventListener('input', () => editPartTotal(row));
                    row.querySelector('.part-unit-value').addEventListener('input', () => editPartTotal(row));

                    // Configurar evento para eliminar
                    row.querySelector('.remove-part').addEventListener('click', () => {
                        row.remove();
                        editRowIndices();
                        updateTotals();

                        if (partsTableBody.querySelectorAll('.part-row').length === 0) {
                            const emptyRow = document.createElement('tr');
                            emptyRow.id = 'noPartsRow';
                            emptyRow.innerHTML = '<td colspan="6" class="text-center py-3">No se han agregado repuestos para este servicio.</td>';
                            partsTableBody.appendChild(emptyRow);
                        }
                    });
                });

                // Inicializar los totales
                updateTotals();
            }

            // Configurar filas existentes al cargar la página
            setupExistingRows();

            // Evento para agregar un nuevo repuesto
            addPartBtn.addEventListener('click', function () {
                if (noPartsRow) {
                    noPartsRow.remove();
                }

                const newRow = document.importNode(partRowTemplate.content, true).querySelector('tr');
                partsTableBody.appendChild(newRow);

                // Inicializar Select2 para el nuevo select de repuesto
                $(newRow.querySelector('select')).select2({
                    width: '100%',
                    placeholder: "Seleccione un repuesto",
                    allowClear: true
                });

                // Configurar eventos para el nuevo repuesto
                newRow.querySelector('.part-quantity').addEventListener('input', () => editPartTotal(newRow));
                newRow.querySelector('.part-unit-value').addEventListener('input', () => editPartTotal(newRow));
                newRow.querySelector('.remove-part').addEventListener('click', () => {
                    newRow.remove();
                    editRowIndices();
                    updateTotals();

                    if (partsTableBody.querySelectorAll('.part-row').length === 0) {
                        const emptyRow = document.createElement('tr');
                        emptyRow.id = 'noPartsRow';
                        emptyRow.innerHTML = '<td colspan="6" class="text-center py-3">No se han agregado repuestos para este servicio.</td>';
                        partsTableBody.appendChild(emptyRow);
                    }
                });

                editRowIndices();
            });
            // Evento para cuando cambia el valor del servicio
            if (serviceValueInput) {
                serviceValueInput.addEventListener('input', updateTotals);
            }
        }
    }
});
