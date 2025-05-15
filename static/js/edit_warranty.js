/*****************************************************
 * edit_warranty.js
 * Funciones para la edición de garantías de servicio
 *****************************************************/

/**
 * Muestra una notificación toast
 * @param {string} icon - Tipo de icono ('success', 'error', 'warning', 'info')
 * @param {string} title - Texto de la notificación
 * @param {string} position - Posición ('top', 'top-start', 'top-end', etc.)
 * @param {number} timer - Tiempo en ms que se mostrará la notificación
 */
function showToast(icon, title, position = 'top-end', timer = 3000) {
    if (typeof Swal !== 'undefined') {
        const Toast = Swal.mixin({
            toast: true,
            position: position,
            showConfirmButton: false,
            timer: timer,
            timerProgressBar: true,
            iconColor: getIconColor(icon),
            customClass: {
                popup: 'colored-toast'
            },
            didOpen: (toast) => {
                toast.addEventListener('mouseenter', Swal.stopTimer);
                toast.addEventListener('mouseleave', Swal.resumeTimer);
            }
        });

        Toast.fire({
            icon: icon,
            title: title
        });
    } else {
        console.log(`${icon.toUpperCase()}: ${title}`);
    }
}

/**
 * Obtiene el color del icono según el tipo de alerta
 * @param {string} icon - Tipo de icono ('success', 'error', 'warning', 'info')
 * @returns {string} - Color en hexadecimal
 */
function getIconColor(icon) {
    switch (icon) {
        case 'success':
            return '#28a745'; // Verde
        case 'error':
            return '#dc3545'; // Rojo
        case 'warning':
            return '#ffc107'; // Amarillo
        case 'info':
            return '#17a2b8'; // Azul claro
        default:
            return '#17a2b8'; // Azul claro (por defecto)
    }
}

/**
 * Muestra un mensaje de error en la validación
 * @param {HTMLElement} input - Elemento de entrada
 * @param {string} message - Mensaje de error
 */
function showValidationError(input, message) {
    if (!input) return;

    // Agregar clase de error
    input.classList.add('is-invalid');

    // Buscar contenedor padre
    const parentElement = input.parentElement;
    if (!parentElement) return;

    // Buscar si ya existe un feedback
    let feedback = parentElement.querySelector('.invalid-feedback');

    // Si no existe, crear uno nuevo
    if (!feedback) {
        feedback = document.createElement('div');
        feedback.className = 'invalid-feedback';
        parentElement.appendChild(feedback);
    }

    // Actualizar mensaje
    feedback.textContent = message;
    feedback.style.display = 'block';

    // Mostrar mensaje de error como toast
    showToast('error', message, 'top-end', 4000);

    // Enfocar el campo con error
    input.focus();
}

/**
 * Elimina el mensaje de error en la validación
 * @param {HTMLElement} input - Elemento de entrada
 */
function removeValidationError(input) {
    if (!input) return;

    // Quitar clase de error
    input.classList.remove('is-invalid');

    // Buscar contenedor padre
    const parentElement = input.parentElement;
    if (!parentElement) return;

    // Buscar feedback y ocultarlo
    const feedback = parentElement.querySelector('.invalid-feedback');
    if (feedback) {
        feedback.style.display = 'none';
    }
}

/**
 * Inicializa la tabla de repuestos
 */
function setupPartsTable() {
    const partsTable = document.getElementById('partsTable');
    const addPartBtn = document.getElementById('addPartBtn');
    const noPartsRow = document.getElementById('noPartsRow');

    // Variables for search modal
    const searchPartsModal = document.getElementById('searchPartsModal');
    const modalPartSearch = document.getElementById('modalPartSearch');
    const clearSearchBtn = document.getElementById('clearSearch');
    const searchResults = document.getElementById('searchResults');
    const searchResultsLoader = document.getElementById('searchResultsLoader');
    const initialSearchMessage = document.getElementById('initialSearchMessage');
    const noResultsMessage = document.getElementById('noResultsMessage');

    // Variable to save the current editing row
    let currentEditingRow = null;

    if (!partsTable || !addPartBtn) return;

    // Only keep the add button event
    if (addPartBtn) {
        addPartBtn.addEventListener('click', function () {
            addPartRow();
        });
    }

    // Configure search functionality
    if (modalPartSearch) {
        // Variable para almacenar el timeout
        let searchTimeout = null;

        modalPartSearch.addEventListener('input', function () {
            const searchTerm = this.value.trim();

            // Limpiar timeout anterior
            if (searchTimeout) {
                clearTimeout(searchTimeout);
            }

            // Si hay menos de 3 caracteres, mostrar mensaje inicial
            if (searchTerm.length < 3) {
                if (initialSearchMessage) initialSearchMessage.style.display = 'block';
                if (noResultsMessage) noResultsMessage.style.display = 'none';
                if (searchResultsLoader) searchResultsLoader.style.display = 'none';
                if (searchResults) {
                    // Limpiar resultados anteriores
                    const resultsContainer = searchResults.querySelector('.search-results-container');
                    if (resultsContainer) {
                        resultsContainer.remove();
                    }
                }
                return;
            }

            // Mostrar indicador de carga inmediatamente
            if (searchResultsLoader) searchResultsLoader.style.display = 'block';
            if (initialSearchMessage) initialSearchMessage.style.display = 'none';

            // Establecer un timeout para evitar demasiadas peticiones (debounce)
            searchTimeout = setTimeout(() => {
                searchParts(searchTerm);
            }, 400); // 400ms para dar tiempo entre búsquedas
        });
    }

    // Clear search button event
    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', function () {
            if (modalPartSearch) {
                modalPartSearch.value = '';
                modalPartSearch.focus();
            }
            if (initialSearchMessage) initialSearchMessage.style.display = 'block';
            if (noResultsMessage) noResultsMessage.style.display = 'none';
            if (searchResultsLoader) searchResultsLoader.style.display = 'none';
            if (searchResults) {
                // Limpiar resultados anteriores
                const resultsContainer = searchResults.querySelector('.search-results-container');
                if (resultsContainer) {
                    resultsContainer.remove();
                }
            }
        });
    }

    // Reset when opening modal
    if (searchPartsModal) {
        searchPartsModal.addEventListener('shown.bs.modal', function () {
            if (modalPartSearch) {
                modalPartSearch.value = '';
                modalPartSearch.focus();
            }
            if (initialSearchMessage) initialSearchMessage.style.display = 'block';
            if (noResultsMessage) noResultsMessage.style.display = 'none';
            if (searchResultsLoader) searchResultsLoader.style.display = 'none';
            if (searchResults) {
                // Limpiar resultados anteriores
                const resultsContainer = searchResults.querySelector('.search-results-container');
                if (resultsContainer) {
                    resultsContainer.remove();
                }
            }
        });
    }

    // Configure existing row events and calculations
    setupPartRowEvents();

    // Set up events to recalculate totals when inputs change
    document.addEventListener('change', function (event) {
        if (event.target.classList.contains('part-quantity') ||
            event.target.classList.contains('part-unit-value')) {

            // Get the row
            const row = event.target.closest('.part-row');
            if (row) {
                calculatePartRowTotal(row);
                calculateSpareTotalValue();
            }
        }
    });
}

/**
 * Configura eventos para las filas de repuestos existentes
 */
function setupPartRowEvents() {
    const partsTable = document.getElementById('partsTable');
    const noPartsRow = document.getElementById('noPartsRow');
    const searchPartsModal = document.getElementById('searchPartsModal');

    if (!partsTable) return;

    const existingRows = partsTable.querySelectorAll('tbody tr.part-row');
    existingRows.forEach(row => {
        const removeBtn = row.querySelector('.remove-part');
        const selectBtn = row.querySelector('.select-part');

        // Remove row event with confirmation
        if (removeBtn) {
            removeBtn.addEventListener('click', function () {
                confirmRemoveRow(row, noPartsRow);
            });
        }

        // Open search modal event
        if (selectBtn && searchPartsModal) {
            selectBtn.addEventListener('click', function () {
                // Save reference to current row
                currentEditingRow = row;

                // Open modal
                const modal = new bootstrap.Modal(searchPartsModal);
                modal.show();
            });
        }

        // Initialize calculation for this row
        calculatePartRowTotal(row);
    });
}

/**
 * Confirma eliminación de fila de repuesto
 * @param {HTMLElement} row - Fila a eliminar 
 * @param {HTMLElement} noPartsRow - Elemento "no hay repuestos"
 */
function confirmRemoveRow(row, noPartsRow) {
    // Obtener información del repuesto para el mensaje
    const selectElement = row.querySelector('select[name="spare_part_code[]"]');
    const partDescription = selectElement && selectElement.selectedOptions[0] ?
        selectElement.selectedOptions[0].text : 'Repuesto';

    Swal.fire({
        title: '¿Eliminar repuesto?',
        text: '¿Estás seguro de eliminar este repuesto?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
        iconColor: getIconColor('warning')
    }).then((result) => {
        if (result.isConfirmed) {
            try {
                // Obtener referencia a la tabla de partes
                const partsTable = document.getElementById('partsTable');

                // Eliminar la fila
                row.remove();

                // Show/hide "no parts" row
                if (noPartsRow && partsTable) {
                    const rows = partsTable.querySelectorAll('tbody tr.part-row');
                    noPartsRow.style.display = rows.length > 0 ? 'none' : '';

                    // Si no quedan filas, mostrar mensaje de "No hay repuestos"
                    if (rows.length === 0 && partsTable.querySelector('tbody')) {
                        const emptyRow = document.createElement('tr');
                        emptyRow.id = 'noPartsRow';
                        emptyRow.innerHTML = `
                            <td colspan="5" class="text-center py-4">
                                <i class="fas fa-box-open fa-3x text-muted mb-3"></i>
                                <p class="text-muted mb-0">No se han agregado repuestos para este servicio.</p>
                            </td>
                        `;
                        partsTable.querySelector('tbody').appendChild(emptyRow);
                    }
                }

                // Recalculate totals
                calculateSpareTotalValue();

                // Mostrar pequeña notificación de éxito
                showToast('success', `Repuesto "${partDescription}" eliminado correctamente`, 'top-end');
            } catch (error) {
                console.error("Error al eliminar repuesto:", error);
                showToast('error', 'Error al eliminar el repuesto', 'top-end');
            }
        }
    });
}

/**
 * Calcula el valor total para una fila de repuesto
 * @param {HTMLElement} row - Fila de la tabla
 */
function calculatePartRowTotal(row) {
    if (!row) return;
    
    const quantityInput = row.querySelector('.part-quantity');
    const unitValueInput = row.querySelector('.part-unit-value');
    const totalValueInput = row.querySelector('.part-total-value');
    const totalValueRawInput = row.querySelector('input[name="part_total_value_raw[]"]');
    
    if (!quantityInput || !unitValueInput || !totalValueInput) return;
    
    // Obtener valores
    const quantity = parseInt(quantityInput.value) || 0;
    
    // Obtener valor unitario limpio (quitar puntos y reemplazar coma por punto)
    const unitValueStr = unitValueInput.value.replace(/\./g, '').replace(',', '.');
    const unitValue = parseFloat(unitValueStr) || 0;
    
    // Calcular total
    const total = quantity * unitValue;
    
    // Actualizar campo de valor total
    totalValueInput.value = formatNumberString(total);
    
    // Actualizar campo oculto si existe
    if (totalValueRawInput) {
        totalValueRawInput.value = total;
    }
    
    // También actualizar el campo oculto del valor unitario
    const unitValueRawInput = row.querySelector('input[name="part_unit_value_raw[]"]');
    if (unitValueRawInput) {
        unitValueRawInput.value = unitValue;
    }
}


/**
 * Calcula el valor total de repuestos y actualiza el total general
 */
function calculateSpareTotalValue() {
    const partsTable = document.getElementById('partsTable');
    const spareValueInput = document.getElementById('spare_value');
    const spareValueRawInput = document.getElementById('spare_value_raw');

    if (!partsTable || !spareValueInput) return;

    let totalSpareValue = 0;

    // Sumar todos los valores totales de repuestos
    const totalValueRawInputs = partsTable.querySelectorAll('input[name="part_total_value_raw[]"]');
    totalValueRawInputs.forEach(input => {
        totalSpareValue += parseFloat(input.value) || 0;
    });

    // Actualizar campo de valor total de repuestos
    spareValueInput.value = formatNumberString(totalSpareValue);

    // Actualizar campo oculto si existe
    if (spareValueRawInput) {
        spareValueRawInput.value = totalSpareValue;
    }

    // Actualizar el total general
    updateTotal();
}

/**
 * Configura el selector de problemas del dispositivo
 */
function setupProblemsSelector() {
    const checkboxes = document.querySelectorAll('.problem-checkbox');
    const selectedProblemsTextarea = document.getElementById('selected_problems');
    const searchInput = document.getElementById('searchProblems');

    // Función para actualizar el textarea de problemas seleccionados
    function updateSelectedProblems() {
        if (!selectedProblemsTextarea) return;

        const selectedProblems = [];
        checkboxes.forEach(checkbox => {
            if (checkbox.checked) {
                const label = document.querySelector(`label[for="${checkbox.id}"]`);
                if (label) {
                    selectedProblems.push(label.textContent.trim());
                }
            }
        });

        selectedProblemsTextarea.value = selectedProblems.join('\n');
    }

    // Añadir eventos a los checkboxes
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', updateSelectedProblems);
    });

    // Configurar búsqueda de problemas
    if (searchInput) {
        searchInput.addEventListener('input', function () {
            const searchTerm = this.value.toLowerCase().trim();

            document.querySelectorAll('.problem-option').forEach(option => {
                const label = option.querySelector('label');
                if (!label) return;

                const problemText = label.textContent.toLowerCase();
                if (problemText.includes(searchTerm) || searchTerm === '') {
                    option.style.display = '';
                } else {
                    option.style.display = 'none';
                }
            });
        });
    }

    // Configurar botones de selección rápida
    const selectAllBtn = document.getElementById('selectAllProblems');
    const clearBtn = document.getElementById('clearProblems');

    if (selectAllBtn) {
        selectAllBtn.addEventListener('click', function () {
            checkboxes.forEach(checkbox => {
                if (checkbox.closest('.problem-option').style.display !== 'none') {
                    checkbox.checked = true;
                }
            });
            updateSelectedProblems();
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', function () {
            checkboxes.forEach(checkbox => {
                checkbox.checked = false;
            });
            updateSelectedProblems();
        });
    }

    // Actualizar inicialmente la lista de problemas seleccionados
    updateSelectedProblems();
}

/**
 * Muestra una alerta de éxito (usada tras actualizar un ticket).
 * Esta función ya no se usa directamente, se utiliza showToast para mantener consistencia.
 */
function showSuccessUpdateAlert() {
    showToast('success', '¡Actualizado con éxito!', 'top-end', 3000);
}

/**
 * Configura la detección de mensajes flash que se agregan dinámicamente
 */
function setupResultHandling() {
    // Verificar parámetros en la URL para mostrar mensajes de éxito
    const urlParams = new URLSearchParams(window.location.search);

    if (urlParams.has('ticket_updated')) {
        if (urlParams.get('ticket_updated') === 'success') {
            showToast('success', '¡Actualizado con éxito!', 'top-end', 3000);
            // Limpiar parámetro de URL
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }
}

/**
 * Agrega una nueva fila de repuesto a la tabla
 * @param {Object|null} partData - Datos del repuesto (opcional)
 */
function addPartRow(partData = null) {
    const partsTable = document.getElementById('partsTable');
    const noPartsRow = document.getElementById('noPartsRow');

    if (!partsTable) return;

    // Hide "no parts" row
    if (noPartsRow) {
        noPartsRow.style.display = 'none';
    }

    // Get template
    const template = document.getElementById('partRowTemplate');
    if (!template) {
        console.error('Part row template not found');
        showToast('error', 'Error: Plantilla de repuesto no encontrada');
        return;
    }

    // Clone template
    const newRow = document.importNode(template.content, true).querySelector('tr');

    // Add row to table
    const tbody = partsTable.querySelector('tbody');
    if (tbody) {
        tbody.appendChild(newRow);
    }

    // Initialize the new row's events
    const removeBtn = newRow.querySelector('.remove-part');
    const selectBtn = newRow.querySelector('.select-part');
    const quantityInput = newRow.querySelector('.part-quantity');
    const unitValueInput = newRow.querySelector('.part-unit-value');

    // Add event to remove button with confirmation
    if (removeBtn) {
        removeBtn.addEventListener('click', function () {
            confirmRemoveRow(newRow, noPartsRow);
        });
    }

    // Add event to select button
    if (selectBtn && typeof bootstrap !== 'undefined') {
        selectBtn.addEventListener('click', function () {
            // Set currentEditingRow
            currentEditingRow = newRow;

            // Open modal
            const searchPartsModal = document.getElementById('searchPartsModal');
            if (searchPartsModal) {
                const modal = new bootstrap.Modal(searchPartsModal);
                modal.show();
            }
        });
    }

    // Add events for calculations
    if (quantityInput) {
        quantityInput.addEventListener('change', function () {
            calculatePartRowTotal(newRow);
            calculateSpareTotalValue();
        });
    }

    if (unitValueInput) {
        unitValueInput.addEventListener('change', function () {
            calculatePartRowTotal(newRow);
            calculateSpareTotalValue();
        });

        // Format for new rows
        unitValueInput.addEventListener('blur', function () {
            formatNumber(this);
        });

        unitValueInput.addEventListener('focus', function () {
            const value = this.value.replace(/\./g, '').replace(',', '.');
            this.value = parseFloat(value) || 0;
        });
    }

    // Initialize calculation for the new row
    calculatePartRowTotal(newRow);

    // Mostrar pequeña notificación de éxito
    showToast('success', 'Repuesto agregado correctamente', 'top-end', 2000);

    return newRow;
}

/**
 * Inicializa el manejo de técnicos
 */
function setupTechnicianHandling() {
    const technicalNameSelect = document.getElementById('technical_name');
    const technicalDocumentInput = document.getElementById('technical_document');
    const stateInput = document.getElementById('state');
    const stateDisplayInput = document.getElementById('state_display');

    if (technicalNameSelect) {
        technicalNameSelect.addEventListener('change', function () {
            // Actualizar documento del técnico
            if (technicalDocumentInput) {
                const selectedOption = this.options[this.selectedIndex];
                const techDocument = selectedOption.dataset.document || '';
                technicalDocumentInput.value = techDocument || 'Sin asignar';
            }

            // No actualizamos el estado en edición para mantener el estado actual
        });
    }
}

/**
 * Procesa los mensajes flash del backend
 */
function processFlashMessages() {
    const flashMessages = document.querySelectorAll('.alert');

    // Objeto para almacenar mensajes procesados y evitar duplicados
    const processedMessages = {};

    flashMessages.forEach(message => {
        const category = message.classList.contains('alert-success') ? 'success' :
            message.classList.contains('alert-danger') ? 'error' :
                message.classList.contains('alert-warning') ? 'warning' : 'info';

        const content = message.textContent.trim();

        // Solo procesar si el mensaje tiene contenido y no es un duplicado
        if (content && !processedMessages[content]) {
            // Marcar como procesado
            processedMessages[content] = true;

            // Usar el tipo de alerta adecuado según la categoría
            const isImportant = category === 'success' || category === 'error';

            if (isImportant) {
                const title = category === 'success' ? 'Operación Exitosa' :
                    category === 'error' ? 'Error' :
                        category === 'warning' ? 'Advertencia' : 'Información';

                showResultModal(category, title, content);
            } else {
                // Usar toast para mensajes menos importantes
                showToast(category, content);
            }
        }
    });
}

/**
 * Configura el formato de los campos numéricos
 */
function setupFormattedNumbers() {
    // Inicializar los inputs con formato de número
    const formattedInputs = document.querySelectorAll('.formatted-number');
    
    formattedInputs.forEach(input => {
        // Asegurarse de que el campo oculto tenga el valor correcto al cargar
        const rawValueField = document.getElementById(input.id + '_raw');
        if (rawValueField) {
            const cleanValue = input.value.replace(/\./g, '').replace(',', '.');
            rawValueField.value = parseFloat(cleanValue) || 0;
        }
        
        // Evento para formatear al perder el foco
        input.addEventListener('blur', function() {
            formatNumber(this);
        });
        
        // Evento para limpiar el formato al obtener el foco
        input.addEventListener('focus', function() {
            // No cambiar el valor si ya está formateado, solo seleccionarlo
            this.select();
        });
        
        // Actualizar campo oculto cuando cambie el valor
        input.addEventListener('change', function() {
            const rawValueField = document.getElementById(this.id + '_raw');
            if (rawValueField) {
                const cleanValue = this.value.replace(/\./g, '').replace(',', '.');
                rawValueField.value = parseFloat(cleanValue) || 0;
            }
        });
    });
    
    // También configurar la actualización del total al cambiar valores
    const serviceValueInput = document.getElementById('service_value');
    const spareValueInput = document.getElementById('spare_value');
    
    if (serviceValueInput && spareValueInput) {
        serviceValueInput.addEventListener('change', updateTotal);
        spareValueInput.addEventListener('change', updateTotal);
    }
}

/**
 * Actualiza el valor total sumando servicio y repuestos
 */
function updateTotal() {
    const serviceValueInput = document.getElementById('service_value');
    const spareValueInput = document.getElementById('spare_value');
    const totalInput = document.getElementById('total');

    if (!serviceValueInput || !spareValueInput || !totalInput) return;

    // Obtener valores limpios
    const serviceValueStr = serviceValueInput.value.replace(/\./g, '').replace(',', '.');
    const spareValueStr = spareValueInput.value.replace(/\./g, '').replace(',', '.');

    // Convertir a números
    const serviceValue = parseFloat(serviceValueStr) || 0;
    const spareValue = parseFloat(spareValueStr) || 0;

    // Calcular total
    const total = serviceValue + spareValue;

    // Actualizar campo total
    totalInput.value = formatNumberString(total);

    // También actualizar el campo oculto si existe
    const totalRawInput = document.getElementById('total_raw');
    if (totalRawInput) {
        totalRawInput.value = total;
    }
}

/**
 * Formatea un número como string con separadores de miles
 * @param {number} number - Número a formatear
 * @returns {string} - Número formateado como string
 */
function formatNumberString(number) {
    return number.toLocaleString('es-CO', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).replace(/,/g, '.');
}

/**
 * Formatea un input con separadores de miles
 * @param {HTMLInputElement} input - Input a formatear
 */
function formatNumber(input) {
    if (!input || !input.value) return;
    
    // Primero verificar si el valor ya está formateado (tiene puntos)
    const isAlreadyFormatted = input.value.includes('.');
    
    // Si ya está formateado, solo actualizar el campo oculto
    if (isAlreadyFormatted) {
        const cleanValue = input.value.replace(/\./g, '').replace(',', '.');
        const number = parseFloat(cleanValue) || 0;
        
        // Actualizar campo oculto si existe
        const rawValueField = document.getElementById(input.id + '_raw');
        if (rawValueField) {
            rawValueField.value = number;
        }
        return;
    }
    
    // Si no está formateado, proceder con el formateo normal
    const value = input.value.replace(/\./g, '').replace(',', '.');
    const number = parseFloat(value) || 0;
    
    // Formatear con separadores de miles
    input.value = formatNumberString(number);
    
    // Actualizar campo oculto si existe
    const rawValueField = document.getElementById(input.id + '_raw');
    if (rawValueField) {
        rawValueField.value = number;
    }
}


/**
 * Busca repuestos en el servidor
 * @param {string} term - Término de búsqueda
 */
function searchParts(term) {
    if (!term || term.length < 3) return;

    const searchResultsLoader = document.getElementById('searchResultsLoader');
    const initialSearchMessage = document.getElementById('initialSearchMessage');
    const noResultsMessage = document.getElementById('noResultsMessage');
    const searchResultsList = document.getElementById('searchResultsList');

    // Mostrar loader y ocultar otros mensajes
    if (searchResultsLoader) searchResultsLoader.style.display = 'block';
    if (initialSearchMessage) initialSearchMessage.style.display = 'none';
    if (noResultsMessage) noResultsMessage.style.display = 'none';
    if (searchResultsList) searchResultsList.style.display = 'none';

    // Crear FormData para enviar en la petición
    const formData = new FormData();
    formData.append('search', term);

    // Hacer petición AJAX al servidor
    fetch('/search_spare_parts', {
        method: 'POST',
        body: formData
    })
        .then(response => response.json())
        .then(data => {
            // Ocultar loader
            if (searchResultsLoader) searchResultsLoader.style.display = 'none';

            // Procesar resultados
            if (data && data.parts && data.parts.length > 0) {
                showSearchResults(data.parts, term);
            } else {
                // Mostrar mensaje de no resultados
                if (noResultsMessage) noResultsMessage.style.display = 'block';
            }
        })
        .catch(error => {
            console.error('Error searching parts:', error);
            // Ocultar loader
            if (searchResultsLoader) searchResultsLoader.style.display = 'none';
            // Mostrar mensaje de no resultados en caso de error
            if (noResultsMessage) {
                noResultsMessage.style.display = 'block';
                noResultsMessage.innerHTML = `
                    <i class="fas fa-exclamation-triangle text-danger fa-3x mb-3"></i>
                    <h5 class="text-danger">Error al buscar repuestos</h5>
                    <p class="text-muted mb-0">${error.message}</p>
                `;
            }
        });
}

/**
 * Muestra los resultados de búsqueda de repuestos
 * @param {Array} results - Resultados de la búsqueda
 * @param {string} term - Término de búsqueda para resaltar
 */
function showSearchResults(results, term) {
    const searchResultsList = document.getElementById('searchResultsList');

    if (!searchResultsList) return;

    // Limpiar resultados anteriores
    searchResultsList.innerHTML = '';

    // Crear contenedor de resultados
    let resultsContainer = document.createElement('div');
    resultsContainer.className = 'search-results-container';
    searchResultsList.appendChild(resultsContainer);

    // Crear una fila para los resultados
    const row = document.createElement('div');
    row.className = 'row g-3';
    resultsContainer.appendChild(row);

    // Agregar contador de resultados
    const resultCount = document.createElement('div');
    resultCount.className = 'col-12 mb-2';
    resultCount.innerHTML = `<small class="text-muted">Se encontraron ${results.length} repuestos</small>`;
    row.appendChild(resultCount);

    // Agregar cada repuesto encontrado en columnas
    results.forEach(part => {
        // Crear columna para este repuesto (6 columnas en pantalla md)
        const col = document.createElement('div');
        col.className = 'col-md-6 mb-2';

        // Crear tarjeta para el repuesto
        const card = document.createElement('div');
        card.className = 'card h-100 shadow-sm part-card';

        // Agregar contenido a la tarjeta
        card.innerHTML = `
            <div class="card-body p-3">
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <h6 class="card-title mb-0 fw-bold">${highlightSearchTerm(part.description, term)}</h6>
                    <span class="badge bg-primary ms-2">Cód: ${highlightSearchTerm(part.code, term)}</span>
                </div>
                <div class="d-flex justify-content-between align-items-center mt-2">
                    <span class="text-success fw-bold">${part.price && part.price != '0' ? '$' + formatNumberString(part.price) : ''}</span>
                    <button class="btn btn-sm btn-primary select-result">
                        <i class="fas fa-check me-1"></i>Seleccionar
                    </button>
                </div>
            </div>
        `;

        // Agregar datos al elemento para su uso posterior
        card.dataset.code = part.code;
        card.dataset.description = part.description;
        card.dataset.price = part.price || '0';

        // Evento de clic para seleccionar un repuesto
        const selectBtn = card.querySelector('.select-result');
        if (selectBtn) {
            selectBtn.addEventListener('click', function () {
                const partData = {
                    code: card.dataset.code,
                    description: card.dataset.description,
                    price: card.dataset.price,
                    stock: part.stock || 0
                };
                selectPart(partData);
            });
        }

        // Agregar a la columna y luego a la fila
        col.appendChild(card);
        row.appendChild(col);
    });

    // Mostrar resultados
    searchResultsList.style.display = 'block';
}

/**
 * Resalta el término de búsqueda en el texto
 * @param {string} text - Texto donde buscar
 * @param {string} term - Término a resaltar
 * @returns {string} - Texto con término resaltado
 */
function highlightSearchTerm(text, term) {
    if (!text) return '';

    // Escapar caracteres especiales en el término de búsqueda
    const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Crear una expresión regular para encontrar el término (insensible a mayúsculas/minúsculas)
    const regex = new RegExp(`(${escapedTerm})`, 'gi');

    // Reemplazar todas las ocurrencias con una versión resaltada
    return text.replace(regex, '<span class="highlight">$1</span>');
}

/**
 * Selecciona un repuesto de los resultados de búsqueda
 * @param {Object} partData - Datos del repuesto seleccionado
 */
function selectPart(partData) {
    console.log("Repuesto seleccionado:", partData);

    // Obtener referencia a la fila que se está editando
    if (!currentEditingRow) {
        console.error("No hay fila seleccionada para actualizar");
        showToast('error', 'Error: No se pudo identificar la fila a actualizar');
        return;
    }

    try {
        // Obtener los campos
        const codeSelect = currentEditingRow.querySelector('select[name="spare_part_code[]"]');
        const quantityInput = currentEditingRow.querySelector('.part-quantity');
        const unitValueInput = currentEditingRow.querySelector('.part-unit-value');
        const unitValueRawInput = currentEditingRow.querySelector('input[name="part_unit_value_raw[]"]');
        const totalValueInput = currentEditingRow.querySelector('.part-total-value');

        if (!codeSelect) {
            throw new Error("No se encontró el selector de código en la fila");
        }

        // Limpiar opciones existentes excepto la primera (placeholder)
        while (codeSelect.options.length > 1) {
            codeSelect.remove(1);
        }

        // Crear nueva opción para el repuesto seleccionado
        const option = document.createElement('option');
        option.value = partData.code;
        option.text = `${partData.code} - ${partData.description}`;
        codeSelect.add(option);

        // Seleccionar la nueva opción
        codeSelect.value = partData.code;

        // Disparar evento change para activar cualquier listener
        const changeEvent = new Event('change', { bubbles: true });
        codeSelect.dispatchEvent(changeEvent);

        // Actualizar precio unitario y campo oculto
        if (unitValueInput) {
            unitValueInput.value = formatNumberString(partData.price || 0);
        }

        if (unitValueRawInput) {
            unitValueRawInput.value = partData.price || 0;
        }

        // Recalcular totales
        calculatePartRowTotal(currentEditingRow);
        calculateSpareTotalValue();

        // Cerrar modal
        const searchPartsModal = document.getElementById('searchPartsModal');
        if (searchPartsModal && typeof bootstrap !== 'undefined') {
            const modal = bootstrap.Modal.getInstance(searchPartsModal);
            if (modal) {
                modal.hide();
            } else {
                // Si no se puede obtener la instancia, intentar cerrar manualmente
                $(searchPartsModal).modal('hide');
            }
        }

        // Limpiar el campo de búsqueda
        const modalPartSearch = document.getElementById('modalPartSearch');
        if (modalPartSearch) {
            modalPartSearch.value = '';
        }

        // Enfocar el campo de cantidad para continuar con la edición
        if (quantityInput) {
            setTimeout(() => {
                quantityInput.focus();
                quantityInput.select();
            }, 100);
        }

        // Mostrar mensaje de éxito
        showToast('success', 'Repuesto seleccionado correctamente');

    } catch (error) {
        console.error("Error al seleccionar repuesto:", error);
        showToast('error', `Error al seleccionar repuesto: ${error.message}`);
    }
}

/**
 * Configura la confirmación para guardar cambios usando SweetAlert
 */
function setupConfirmationModal() {
    const saveButton = document.getElementById('saveButton');
    const warrantyForm = document.getElementById('warrantyForm');
    
    if (!saveButton || !warrantyForm) return;
    
    // Mostrar confirmación al hacer clic en guardar
    saveButton.addEventListener('click', function() {
        // Hacer validación básica del formulario antes de mostrar la confirmación
        if (!validateForm()) {
            return;
        }
        
        // Asegurarse de que todos los valores ocultos estén actualizados
        const formattedInputs = document.querySelectorAll('.formatted-number');
        formattedInputs.forEach(input => {
            const value = input.value.replace(/\./g, '').replace(',', '.');
            const rawInput = document.getElementById(input.id + '_raw');
            if (rawInput) {
                rawInput.value = parseFloat(value) || 0;
            }
        });
        
        // Recalcular todos los totales de repuestos
        const partRows = document.querySelectorAll('.part-row');
        partRows.forEach(row => {
            calculatePartRowTotal(row);
        });
        
        // Recalcular el total general
        calculateSpareTotalValue();
        
        // Mostrar confirmación con SweetAlert
        Swal.fire({
            title: '¿Guardar cambios?',
            text: '¿Estás seguro de guardar los cambios en esta garantía?',
            icon: 'question',
            toast: false,
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, guardar',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                // Mostrar mensaje de guardando como toast
                showToast('info', 'Guardando cambios...', 'top-end');
                
                // Submit the form inmediatamente
                setTimeout(() => {
                    warrantyForm.submit();
                }, 100);
            }
        });
    });
}


/**
 * Realiza validación básica del formulario
 * @returns {boolean} - True si el formulario es válido, false en caso contrario
 */
function validateForm() {
    const serviceValueInput = document.getElementById('service_value');
    const technicalNameSelect = document.getElementById('technical_name');

    let isValid = true;

    // Validar valor de servicio
    if (serviceValueInput) {
        const serviceValueRaw = serviceValueInput.value.replace(/\./g, '').replace(',', '.');
        const serviceValue = parseFloat(serviceValueRaw);

        if (isNaN(serviceValue) || serviceValue < 0) {
            showValidationError(serviceValueInput, 'El valor del servicio debe ser un número válido mayor o igual a cero');
            isValid = false;
        } else {
            removeValidationError(serviceValueInput);

            // Asegurarse de que el campo oculto tenga el valor correcto
            const serviceValueRawInput = document.getElementById('service_value_raw');
            if (serviceValueRawInput) {
                serviceValueRawInput.value = serviceValue;
            }
        }
    }

    // Asegurarse de que los valores de los repuestos estén correctamente formateados
    const partRows = document.querySelectorAll('.part-row');
    partRows.forEach(row => {
        calculatePartRowTotal(row);
    });

    // Recalcular el total general
    calculateSpareTotalValue();

    return isValid;
}

/**
 * Muestra un mensaje de resultado usando Toast en lugar de modal
 * @param {string} type - Tipo de resultado ('success', 'error', 'warning', 'info')
 * @param {string} title - Título del mensaje
 * @param {string} message - Mensaje a mostrar
 */
function showResultModal(type, title, message) {
    // Usar el toast para mantener consistencia
    showToast(type, message || title, 'top-end', 4000);
}

/**
 * Configura la funcionalidad del campo de comentario
 */
function setupCommentField() {
    const commentTextarea = document.getElementById('comment');
    if (!commentTextarea) return;

    // Limpiar el valor "None" si está presente
    if (commentTextarea.value === "None") {
        commentTextarea.value = "";
    }

    // Limitar la longitud del comentario si es necesario
    commentTextarea.addEventListener('input', function () {
        const maxLength = 250; // Ajustar según sea necesario
        if (this.value.length > maxLength) {
            showToast('warning', `El comentario no puede exceder los ${maxLength} caracteres`, 'top-end');
            this.value = this.value.substring(0, maxLength);
        }
    });
}

// Update the DOMContentLoaded event
document.addEventListener('DOMContentLoaded', function () {
    setupTechnicianHandling();
    setupPartsTable();
    setupProblemsSelector();
    setupFormattedNumbers();
    setupConfirmationModal();
    processFlashMessages();
    setupResultHandling();
    setupCommentField();
});
