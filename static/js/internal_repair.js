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
                        width: '100%',
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
        technicianSelect.addEventListener('change', function() {
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
        
        referenceSelect.addEventListener('change', function() {
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
    ticketForm.addEventListener('submit', function(e) {
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
        // Funcionalidad para filtrar tickets por estado
        // Modificar la función filterTickets para corregir la lógica de filtrado
        function filterTickets(state) {
            // Si el estado es "Todos", mostrar todos los tickets
            if (state === 'Todos') {
                $('tbody tr').show();
            } else {
                // Filtrar por el estado seleccionado
                $('tbody tr').each(function () {
                    // Obtener el estado del ticket de la celda correspondiente (5ta columna)
                    var ticketStatus = $(this).find('td:nth-child(5) select').val();
                    
                    // Mapear los estados del filtro a los estados reales del ticket
                    let matchStatus = false;
                    if (state === 'Pendientes' && (ticketStatus === 'Sin asignar')) {
                        matchStatus = true;
                    } else if (state === 'Asignados' && (ticketStatus === 'Asignado')) {
                        matchStatus = true;
                    } else if (state === 'En Proceso' && (ticketStatus === 'En proceso')) {
                        // Cambiado de "En Reparación" a "En Proceso"
                        matchStatus = true;
                    } else if (state === 'Terminado' && ticketStatus === 'Terminado') {
                       
                        matchStatus = true;
                    } else if (state === 'Cancelados' && ticketStatus === 'Cancelado') {
                        matchStatus = true;
                    }
                    
                    if (matchStatus) {
                        $(this).show();
                    } else {
                        $(this).hide();
                    }
                });
            }
        
            // Actualizar el contador de tickets mostrados
            updateTicketCounter();
            
            // Actualizar la paginación después de filtrar
            if (typeof updatePaginationAfterFilter === 'function') {
                updatePaginationAfterFilter();
            }
        }

        
        // Añadir el evento que conecta los botones con la función
        $(document).ready(function() {
            // Manejar los clics en los botones de filtro
            $('input[name="filterStatus"]').on('change', function() {
                var selectedState = $(this).attr('id').replace('btn', '');
                filterTickets(selectedState);
            });
        });
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
        $('select[name="state"]').on('change', function () {
            // Obtener el filtro actualmente seleccionado
            const activeFilter = $('input[name="filterStatus"]:checked').next('label').text().trim();
            // Volver a aplicar el filtro
            filterTickets(activeFilter);
        });

        // Inicializar con el filtro "Todos" si existe
        if ($('input[name="filterStatus"]').length) {
            filterTickets('Todos');
            // Agregar clase CSS para el botón activo
            $('input[name="filterStatus"]:checked').next('label').addClass('filter-active');
        }

        // Funcionalidad de paginación
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
            if ($('#rowsPerPage').length) {
                rowsPerPage = parseInt($('#rowsPerPage').val());
            }
            
            // Calcular el número total de páginas
            totalPages = Math.ceil(filteredRows.length / rowsPerPage);
            
            // Generar los botones de paginación
            generatePaginationButtons();
            
            // Mostrar la primera página
            showPage(1);
        }
        
        // Función para generar los botones de paginación
        function generatePaginationButtons() {
            // Verificar si existe el contenedor de paginación
            if (!$('#pagination').length) return;
            
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
            if ($('#currentRowsCount').length) {
                $('#currentRowsCount').text(Math.min(rowsPerPage, filteredRows.length - startIndex));
            }
            
            // Actualizar botones de paginación
            $('#pagination li').removeClass('active');
            $(`#pagination li[data-page="${pageNum}"]`).addClass('active');
            
            // Actualizar estado de botones Anterior/Siguiente
            updatePrevNextButtons();
        }
        
        // Función para actualizar estado de botones Anterior/Siguiente
        function updatePrevNextButtons() {
            if (!$('#prevPage').length || !$('#nextPage').length) return;
            
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
        
        // Inicializar paginación al cargar la página si existe el contenedor
        if ($('#pagination').length) {
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
                if ($this.attr('id') === 'prevPage')

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
                $(document).ready(function() {
                    // Para el select de referencia
                    $('#reference').on('select2:select', function(e) {
                        // Disparar el evento change manualmente
                        this.dispatchEvent(new Event('change'));
                    });
                    
                    // Para otros selects que usan Select2
                    $('.searchable-select').on('select2:select', function(e) {
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
  document.addEventListener('DOMContentLoaded', function() {
    // Formatear valores iniciales
    formatAllCurrencyFields();
    
    // Manejar el evento de cambio en el valor del servicio
    const serviceValue = document.getElementById('service_value');
    if (serviceValue) {
      serviceValue.addEventListener('focus', function() {
        this.value = unformatCurrency(this.value);
      });
      
      serviceValue.addEventListener('blur', function() {
        this.value = formatCurrency(this.value);
        updateTotalsWithFormat();
      });
    }
    
    // Observar cambios en la tabla para formatear nuevas filas
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // Buscar nuevos campos de moneda en las filas agregadas
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === 1 && node.classList.contains('part-row')) {
              const unitValueInput = node.querySelector('.part-unit-value');
              
              if (unitValueInput) {
                // Formatear el valor inicial
                unitValueInput.value = formatCurrency(unitValueInput.value);
                
                // Agregar eventos
                unitValueInput.addEventListener('focus', function() {
                  this.value = unformatCurrency(this.value);
                });
                
                unitValueInput.addEventListener('blur', function() {
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
    document.addEventListener('click', function(e) {
      if (e.target.classList.contains('remove-part') || e.target.closest('.remove-part')) {
        // Esperar a que se elimine la fila antes de actualizar totales
        setTimeout(updateTotalsWithFormat, 0);
      }
    });
  });
  
                
