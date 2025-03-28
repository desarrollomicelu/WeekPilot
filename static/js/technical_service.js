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
}

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
    $(document).ready(function () {
        // Cuando cambia el estado de un ticket (para technical_service.html)
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
                            status: newStatus
                        },
                        success: function (response) {
                            // Quitar indicador de carga
                            $select.removeClass('opacity-50');
                            $select.prop('disabled', false);

                            if (response.success) {
                                // Actualizar el timestamp mostrado
                                if (response.timestamp) {
                                    $timestamp.text(response.timestamp);
                                }

                                // Mostrar notificación de éxito
                                showToast('success', 'Estado actualizado correctamente', 'top-end');

                                // Actualizar estilos según el estado
                                updateRowStyles($select.closest('tr'), response.status);
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

        // Función para mostrar toast con SweetAlert
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

        // Función para actualizar estilos de la fila según el estado (ahora no hace nada)
        function updateRowStyles($row, status) {
            // Esta función ahora está vacía ya que no queremos aplicar colores
            // según el estado del ticket
        }

        // Inicializar estilos de filas al cargar la página
        $('.status-select').each(function () {
            const $select = $(this);
            const status = $select.val();
            updateRowStyles($select.closest('tr'), status);
        });
    });

    // Funcionalidad para filtrar tickets por estado
    $(document).ready(function () {
        function filterTickets(status) {
            // Si el estado es "Todos", mostrar todos los tickets
            if (status === 'Todos') {
                $('tbody tr').show();
            } else {
                // Filtrar por el estado seleccionado
                $('tbody tr').each(function () {
                    // Obtener el estado del ticket de la celda correspondiente
                    var ticketStatus = $(this).find('td:nth-child(5) select').val();

                    if (ticketStatus === status) {
                        $(this).show();
                    } else {
                        $(this).hide();
                    }
                });
            }

            // Actualizar el contador de tickets mostrados
            updateTicketCounter();
            
            // Actualizar la paginación después de filtrar
            updatePaginationAfterFilter();
        }

        // Función para actualizar el contador de tickets
        function updateTicketCounter() {
            const visibleTickets = $('tbody tr:visible').length;
            $('.badge.bg-primary strong').text(visibleTickets);
        }

        // Event listener para los botones de filtro
        $('input[name="filterStatus"]').on('change', function () {
            var selectedStatus = $(this).next('label').text().trim();
            filterTickets(selectedStatus);

            // Actualizar la UI para mostrar el filtro activo
            $('.filter-active').removeClass('filter-active');
            $(this).next('label').addClass('filter-active');
        });

        // También permitir filtrar cuando cambia el estado de un ticket
        $('select[name="status"]').on('change', function () {
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
    // Opciones comunes para todos los Select2
    const select2Options = {
        width: '100%',
        placeholder: "Seleccione una opción",
        allowClear: true,
        theme: 'bootstrap-5', // Usar tema compatible con Bootstrap 5
        selectionCssClass: 'form-select', // Aplicar clase form-select de Bootstrap
        dropdownCssClass: 'select2-dropdown-bootstrap', // Clase personalizada para el dropdown
    };

    // Inicializar Select2 para referencia
    $('#reference').select2(select2Options);

    // Para los selects dentro de la tabla de repuestos
    $('.searchable-select').not('#state, #city, #priority, #technical_name, #technical_document, #product_code').select2(select2Options);
});

// También actualizar en la función setupExistingRows() y en el evento para agregar un nuevo repuesto
// Buscar todas las instancias donde se inicializa Select2 y actualizar con las mismas opciones


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
                if (selectedOption && selectedOption.value) {
                    technicianDocumentInput.value = selectedOption.getAttribute('data-document') || '';

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
            // Esta parte es crucial para cargar el documento del técnico al inicio
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

        // Funcionalidad para autocompletar el código de producto
        const referenceSelect = document.getElementById('reference');
        const productCodeInput = document.getElementById('product_code');

        if (referenceSelect && productCodeInput) {
            referenceSelect.addEventListener('change', function() {
                const selectedOption = this.options[this.selectedIndex];
                
                // Actualizar el código de producto
                if (selectedOption && selectedOption.value) {
                    productCodeInput.value = selectedOption.getAttribute('data-code');
                } else {
                    productCodeInput.value = '';
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
                                updateTotals();

                                if (partsTableBody.querySelectorAll('.part-row').length === 0) {
                                    const emptyRow = document.createElement('tr');
                                    emptyRow.id = 'noPartsRow';
                                    emptyRow.innerHTML = '<td colspan="6" class="text-center py-3">No se han agregado repuestos para este servicio.</td>';
                                    partsTableBody.appendChild(emptyRow);
                                }
                                
                                // Mostrar toast de confirmación
                                const Toast = Swal.mixin({
                                    toast: true,
                                    position: 'top-end',
                                    showConfirmButton: false,
                                    timer: 3000,
                                    timerProgressBar: true
                                });
                                
                                Toast.fire({
                                    icon: 'success',
                                    title: 'Repuesto eliminado correctamente'
                                });
                            }
                        });
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
                            updateTotals();

                            if (partsTableBody.querySelectorAll('.part-row').length === 0) {
                                const emptyRow = document.createElement('tr');
                                emptyRow.id = 'noPartsRow';
                                emptyRow.innerHTML = '<td colspan="6" class="text-center py-3">No se han agregado repuestos para este servicio.</td>';
                                partsTableBody.appendChild(emptyRow);
                            }
                            
                            // Mostrar toast de confirmación
                            const Toast = Swal.mixin({
                                toast: true,
                                position: 'top-end',
                                showConfirmButton: false,
                                timer: 3000,
                                timerProgressBar: true
                            });
                            
                            Toast.fire({
                                icon: 'success',
                                title: 'Repuesto eliminado correctamente'
                            });
                        }
                    });
                });

                editRowIndices();
                
                // Mostrar toast de confirmación
                const Toast = Swal.mixin({
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 3000,
                    timerProgressBar: true
                });
                
                Toast.fire({
                    icon: 'success',
                    title: 'Repuesto agregado correctamente'
                });
            });
            // Evento para cuando cambia el valor del servicio
            if (serviceValueInput) {
                serviceValueInput.addEventListener('input', updateTotals);
            }
        }
    }

    // Agregar después del código existente, dentro del evento DOMContentLoaded

    // Validaciones para formularios de tickets
    if (document.getElementById('create-ticket-page') || document.getElementById('edit-ticket-page')) {
        // Obtener el formulario
        const ticketForm = document.querySelector('form');
        
        // Agregar validación al enviar el formulario
        if (ticketForm) {
            ticketForm.addEventListener('submit', function(e) {
                // Evitar que el formulario se envíe automáticamente
                e.preventDefault();
                
                // Validar campos requeridos
                let isValid = true;
                let errorMessage = '';
                
                // Validar información del cliente
                const clientNames = document.getElementById('client_names');
                const clientLastnames = document.getElementById('client_lastnames');
                const documentField = document.getElementById('document');
                const mail = document.getElementById('mail');
                
                if (clientNames && !clientNames.value.trim()) {
                    isValid = false;
                    errorMessage += 'El nombre del cliente es requerido.<br>';
                    clientNames.classList.add('is-invalid');
                } else if (clientNames) {
                    clientNames.classList.remove('is-invalid');
                }
                
                if (clientLastnames && !clientLastnames.value.trim()) {
                    isValid = false;
                    errorMessage += 'El apellido del cliente es requerido.<br>';
                    clientLastnames.classList.add('is-invalid');
                } else if (clientLastnames) {
                    clientLastnames.classList.remove('is-invalid');
                }
                
                if (documentField && !documentField.value.trim()) {
                    isValid = false;
                    errorMessage += 'El documento del cliente es requerido.<br>';
                    documentField.classList.add('is-invalid');
                } else if (documentField) {
                    documentField.classList.remove('is-invalid');
                }
                
                if (mail) {
                    if (!mail.value.trim()) {
                        isValid = false;
                        errorMessage += 'El correo electrónico del cliente es requerido.<br>';
                        mail.classList.add('is-invalid');
                    } else if (!validateEmail(mail.value.trim())) {
                        isValid = false;
                        errorMessage += 'El correo electrónico no tiene un formato válido.<br>';
                        mail.classList.add('is-invalid');
                    } else {
                        mail.classList.remove('is-invalid');
                    }
                }
                
                // Validar tipo de servicio
                const typeOfService = document.getElementById('type_of_service');
                if (typeOfService && !typeOfService.value.trim()) {
                    isValid = false;
                    errorMessage += 'El tipo de servicio es requerido.<br>';
                    typeOfService.classList.add('is-invalid');
                } else if (typeOfService) {
                    typeOfService.classList.remove('is-invalid');
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
        
        // Función para validar email
        function validateEmail(email) {
            const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return re.test(email);
        }
    }

    // Confirmación al cambiar la referencia del producto
    const referenceSelect = document.getElementById('reference');
    if (referenceSelect) {
        // Guardar el valor original al cargar la página
        let originalReference = referenceSelect.value;
        let originalReferenceText = referenceSelect.options[referenceSelect.selectedIndex]?.text || 'Sin seleccionar';
        
        referenceSelect.addEventListener('change', function() {
            const newReference = this.value;
            const newReferenceText = this.options[this.selectedIndex]?.text || 'Sin seleccionar';
            
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
                        
                        // Actualizar el código del producto
                        const productCodeInput = document.getElementById('product_code');
                        if (productCodeInput) {
                            const selectedOption = this.options[this.selectedIndex];
                            productCodeInput.value = selectedOption && selectedOption.getAttribute('data-code') ? 
                                                   selectedOption.getAttribute('data-code') : '';
                        }
                        
                        // Mostrar toast de confirmación
                        const Toast = Swal.mixin({
                            toast: true,
                            position: 'top-end',
                            showConfirmButton: false,
                            timer: 3000,
                            timerProgressBar: true
                        });
                        
                        Toast.fire({
                            icon: 'success',
                            title: `Referencia cambiada a "${newReferenceText}"`
                        });
                    } else {
                        // Restaurar el valor original
                        this.value = originalReference;
                    }
                });
            }
        });
    }
});

// Asegurarse de que el evento change se dispare cuando se selecciona una opción con Select2
$(document).ready(function() {
    $('#reference').on('select2:select', function(e) {
        // Disparar el evento change manualmente
        this.dispatchEvent(new Event('change'));
    });
});

// Funcionalidad de paginación
$(document).ready(function() {
    // Variables para la paginación
    let currentPage = 1;
    let rowsPerPage = 10;
    let totalPages = 1;
    let filteredRows = [];
    
    // Función para inicializar la paginación
    function initPagination() {
        // Obtener todas las filas de la tabla (excepto la cabecera)
        const allRows = $('#ticketsTable tbody tr').not('.no-results');
        
        // Guardar referencia a las filas filtradas (inicialmente todas)
        filteredRows = allRows;
        
        // Configurar filas por página según el selector
        rowsPerPage = parseInt($('#rowsPerPage').val());
        
        // Calcular el número total de páginas
        totalPages = Math.ceil(filteredRows.length / rowsPerPage);
        
        // Generar los botones de paginación
        generatePaginationButtons();
        
        // Mostrar la primera página
        showPage(1);
    }
    
    // Función para generar los botones de paginación
    function generatePaginationButtons() {
        // Limpiar botones existentes (excepto Anterior y Siguiente)
        $('#pagination li').not('#prevPage, #nextPage').remove();
        
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
            
            // Siempre mostrar última página
            $('#nextPage').before(`<li class="page-item ${currentPage === totalPages ? 'active' : ''}" data-page="${totalPages}"><a class="page-link" href="#">${totalPages}</a></li>`);
        }
        
        // Actualizar estado de botones Anterior/Siguiente
        updatePrevNextButtons();
    }
    
    // Función para mostrar una página específica
    function showPage(pageNum) {
        // Validar número de página
        if (pageNum < 1 || pageNum > totalPages) return;
        
        // Actualizar página actual
        currentPage = pageNum;
        
        // Ocultar todas las filas
        filteredRows.hide();
        
        // Calcular índices de filas a mostrar
        const startIndex = (pageNum - 1) * rowsPerPage;
        const endIndex = Math.min(startIndex + rowsPerPage, filteredRows.length);
        
        // Mostrar filas de la página actual
        filteredRows.slice(startIndex, endIndex).show();
        
        // Actualizar contador de filas mostradas
        $('#currentRowsCount').text(Math.min(rowsPerPage, filteredRows.length - startIndex));
        
        // Actualizar botones de paginación
        $('#pagination li').removeClass('active');
        $(`#pagination li[data-page="${pageNum}"]`).addClass('active');
        
        // Actualizar estado de botones Anterior/Siguiente
        updatePrevNextButtons();
    }
    
    // Función para actualizar estado de botones Anterior/Siguiente
    function updatePrevNextButtons() {
        // Botón Anterior
        if (currentPage === 1) {
            $('#prevPage').addClass('disabled');
        } else {
            $('#prevPage').removeClass('disabled');
        }
        
        // Botón Siguiente
        if (currentPage === totalPages || totalPages === 0) {
            $('#nextPage').addClass('disabled');
        } else {
            $('#nextPage').removeClass('disabled');
        }
    }
    
    // Función para actualizar la paginación después de filtrar
    function updatePaginationAfterFilter() {
        // Obtener filas visibles después del filtrado
        filteredRows = $('#ticketsTable tbody tr:visible').not('.no-results');
        
        // Recalcular número total de páginas
        totalPages = Math.ceil(filteredRows.length / rowsPerPage);
        
        // Si la página actual es mayor que el total de páginas, ir a la última página
        if (currentPage > totalPages) {
            currentPage = Math.max(1, totalPages);
        }
        
        // Regenerar botones de paginación
        generatePaginationButtons();
        
        // Mostrar la página actual
        showPage(currentPage);
    }
    
    // Inicializar paginación al cargar la página
    initPagination();
    
    // Evento para cambiar número de filas por página
    $('#rowsPerPage').on('change', function() {
        rowsPerPage = parseInt($(this).val());
        totalPages = Math.ceil(filteredRows.length / rowsPerPage);
        currentPage = 1; // Volver a la primera página
        generatePaginationButtons();
        showPage(1);
    });
    
    // Evento para navegar entre páginas
    $('#pagination').on('click', 'li:not(.disabled)', function(e) {
        e.preventDefault();
        
        const $this = $(this);
        
        // Manejar botones Anterior/Siguiente
        if ($this.attr('id') === 'prevPage') {
            showPage(currentPage - 1);
        } else if ($this.attr('id') === 'nextPage') {
            showPage(currentPage + 1);
        } else {
            // Manejar clic en número de página
            const pageNum = parseInt($this.data('page'));
            if (!isNaN(pageNum)) {
                showPage(pageNum);
            }
        }
    });
    
    // Integrar paginación con la búsqueda
    $('#searchInput').on('input', function() {
        // La función de búsqueda existente se ejecutará primero
        // Luego actualizamos la paginación
        setTimeout(updatePaginationAfterFilter, 100);
    });
    
    // Integrar paginación con los filtros de estado
    $('input[name="filterStatus"]').on('change', function() {
        // La función de filtrado existente se ejecutará primero
        // Luego actualizamos la paginación
        setTimeout(updatePaginationAfterFilter, 100);
    });
});
