/***************************************************
 * create_ticket_ST.js
 * Funciones y validaciones para la creación de tickets
 ***************************************************/

/***** Funciones Globales *****/

/**
 * Muestra un toast de Bootstrap con el mensaje proporcionado
 * @param {string} icon - Ícono a mostrar (success, error, warning, info)
 * @param {string} title - Título del mensaje
 * @param {string} position - Posición del toast
 * @param {number} timer - Tiempo en milisegundos
 */
function showToast(icon, title, position = 'top-end', timer = 3000) {
    // Verificar si Swal está disponible
    if (typeof Swal === 'undefined') {
        console.error('SweetAlert2 no está disponible. Mostrando alerta estándar.');
        alert(title);
        return;
    }
    
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

    Toast.fire({
        icon: icon,
        title: title
    });
}

/**
 * Muestra una alerta de éxito para la creación del ticket.
 */
function showSuccessTicketAlert() {
    Swal.fire({
        icon: 'success',
        title: '¡Ticket creado con éxito!',
        text: 'El nuevo ticket se ha generado correctamente.',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        iconColor: '#28a745',
        customClass: {
            popup: 'colored-toast'
        }
    });
}

/**
 * Valida el formato de un correo electrónico.
 * @param {string} email - Correo a validar.
 * @returns {boolean} - True si el email es válido.
 */
function validateEmail(email) {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

/**
 * Formatea un número con separadores de miles (punto).
 * @param {number|string} number - El número a formatear.
 * @returns {string} - El número formateado.
 */
function formatNumberWithThousands(number) {
    if (number === null || number === undefined) return '';
    if (typeof number === 'string' && number.trim() === '') return '';

    // Convertir a número y manejar posibles errores
    const numValue = parseFloat(number.toString().replace(/[^\d.-]/g, ''));
    if (isNaN(numValue)) return '';

    return numValue.toLocaleString('es-CO');
}

/**
 * Elimina los separadores de miles de un número formateado.
 * @param {string} formattedNumber - El número con separadores.
 * @returns {number} - El número sin formato.
 */
function unformatNumber(formattedNumber) {
    if (!formattedNumber) return 0;
    return parseFloat(formattedNumber.toString().replace(/[^\d.-]/g, '')) || 0;
}

/**
 * Aplica formato de miles a un campo de entrada.
 * @param {HTMLElement} input - El elemento de entrada.
 */
function applyThousandsFormatting(input) {
    if (!input) return;

    const unformattedValue = unformatNumber(input.value);
    const formattedValue = formatNumberWithThousands(unformattedValue);

    // Solo actualizar si es diferente para evitar problemas con el cursor
    if (input.value !== formattedValue) {
        const cursorPos = input.selectionStart;
        const lengthDiff = formattedValue.length - input.value.length;

        input.value = formattedValue;

        // Restaurar la posición del cursor
        if (cursorPos !== null) {
            input.setSelectionRange(cursorPos + lengthDiff, cursorPos + lengthDiff);
        }
    }
}

/***** Validaciones en Tiempo Real *****/

/**
 * Muestra un mensaje de error personalizado para un campo
 * @param {HTMLElement} input - El elemento de entrada
 * @param {string} message - El mensaje de error a mostrar
 */
function showValidationError(input, message) {
    // Eliminar mensaje de error anterior si existe
    const existingFeedback = input.nextElementSibling;
    if (existingFeedback && existingFeedback.classList.contains('invalid-feedback')) {
        existingFeedback.remove();
    }
    
    // Crear y agregar nuevo mensaje de error
    const feedback = document.createElement('div');
    feedback.classList.add('invalid-feedback');
    feedback.textContent = message;
    input.parentNode.appendChild(feedback);
    
    // Marcar el campo como inválido
    input.classList.add('is-invalid');
}

/**
 * Elimina el mensaje de error de un campo
 * @param {HTMLElement} input - El elemento de entrada
 */
function removeValidationError(input) {
    input.classList.remove('is-invalid');
    const existingFeedback = input.nextElementSibling;
    if (existingFeedback && existingFeedback.classList.contains('invalid-feedback')) {
        existingFeedback.remove();
    }
}

/**
 * Valida un número de teléfono
 * @param {string} phone - El número a validar
 * @returns {boolean} - True si el teléfono es válido
 */
function validatePhone(phone) {
    // Permitir números, espacios, guiones y paréntesis
    const re = /^[\d\s\-()]+$/;
    return re.test(phone) && phone.replace(/[^\d]/g, '').length >= 7;
}

/**
 * Valida un IMEI o número de serie
 * @param {string} imei - El IMEI a validar
 * @returns {boolean} - True si el IMEI es válido
 */
function validateIMEI(imei) {
    // Un IMEI debe tener exactamente 15 caracteres numéricos
    return imei.length === 15 && /^\d{15}$/.test(imei);
}


/**
 * Adjunta validaciones en tiempo real mejoradas a campos específicos.
 */
function attachEnhancedRealTimeValidation() {
    // Definir los campos y sus reglas de validación
    const fields = [
        { 
            id: 'client_names', 
            required: true, 
            errorMsg: 'El nombre del cliente es obligatorio'
        },
        { 
            id: 'client_lastnames', 
            required: true, 
            errorMsg: 'El apellido del cliente es obligatorio'
        },
        { 
            id: 'document', 
            required: true, 
            errorMsg: 'El documento del cliente es obligatorio',
            minLength: 5,
            minLengthMsg: 'El documento debe tener al menos 5 caracteres',
            maxLength: 15,
            maxLengthMsg: 'El documento no puede tener más de 15 caracteres'
        },
        { 
            id: 'phone', 
            validator: validatePhone, 
            errorMsg: 'Ingrese un número de teléfono válido (mínimo 7 dígitos)'
        },
        { 
            id: 'mail', 
            required: true, 
            email: true, 
            errorMsg: 'Ingrese un correo electrónico válido'
        },
        { 
            id: 'IMEI', 
            validator: validateIMEI, 
            errorMsg: 'El IMEI/Serial debe tener 15 caracteres'
        },
        { 
            id: 'service_value', 
            required: true, 
            number: true, 
            min: 0, 
            errorMsg: 'El valor del servicio debe ser un número positivo'
        }
    ];

    fields.forEach(fieldInfo => {
        const input = document.getElementById(fieldInfo.id);
        if (input) {
            input.addEventListener('input', function () {
                let valid = true;
                let errorMessage = '';
                
                // Validar campo obligatorio
                if (fieldInfo.required && !this.value.trim()) {
                    valid = false;
                    errorMessage = fieldInfo.errorMsg;
                }
                
                // Validar longitud mínima
                if (valid && fieldInfo.minLength && this.value.trim().length < fieldInfo.minLength) {
                    valid = false;
                    errorMessage = fieldInfo.minLengthMsg;
                }
                
                // Validar formato de email si corresponde
                if (valid && fieldInfo.email && this.value.trim() && !validateEmail(this.value.trim())) {
                    valid = false;
                    errorMessage = fieldInfo.errorMsg;
                }
                
                // Validar valor numérico y mínimo
                if (valid && fieldInfo.number) {
                    let num = unformatNumber(this.value);
                    if (isNaN(num) || num < fieldInfo.min) {
                        valid = false;
                        errorMessage = fieldInfo.errorMsg;
                    }
                }
                
                // Usar validador personalizado si existe
                if (valid && fieldInfo.validator && this.value.trim() && !fieldInfo.validator(this.value.trim())) {
                    valid = false;
                    errorMessage = fieldInfo.errorMsg;
                }
                
                // Mostrar u ocultar error
                if (valid) {
                    removeValidationError(this);
                } else {
                    showValidationError(this, errorMessage);
                }
            });
            
            // Validación inicial al cargar la página
            if (input.value) {
                input.dispatchEvent(new Event('input'));
            }
        }
    });
    
    // Validación para campos select
    const selectFields = [
        {
            id: 'reference',
            required: true,
            errorMsg: 'Seleccione una referencia de producto'
        },
        {
            id: 'technical_name',
            errorMsg: 'Seleccione un técnico válido'
        }
    ];
    
    selectFields.forEach(fieldInfo => {
        const select = document.getElementById(fieldInfo.id);
        if (select) {
            select.addEventListener('change', function() {
                if (fieldInfo.required && (!this.value || this.value === '')) {
                    showValidationError(this, fieldInfo.errorMsg);
                } else {
                    removeValidationError(this);
                }
            });
            
            // Para select2, necesitamos un evento adicional
            if ($(select).data('select2')) {
                $(select).on('select2:select select2:unselect', function() {
                    if (fieldInfo.required && (!this.value || this.value === '')) {
                        showValidationError(this, fieldInfo.errorMsg);
                    } else {
                        removeValidationError(this);
                    }
                });
            }
            
            // Validación inicial
            if (fieldInfo.required) {
                select.dispatchEvent(new Event('change'));
            }
        }
    });
    
    // Validación para la tabla de repuestos
    const validatePartsTable = function() {
        const partsTable = document.getElementById('partsTable');
        if (!partsTable) return;
        
        const rows = partsTable.querySelectorAll('tbody tr.part-row');
        rows.forEach(row => {
            // Validar selección de repuesto
            const partSelect = row.querySelector('select[name="spare_part_code[]"]');
            if (partSelect) {
                partSelect.addEventListener('change', function() {
                    if (!this.value || this.value === '') {
                        showValidationError(this, 'Seleccione un repuesto');
                    } else {
                        removeValidationError(this);
                    }
                });
                
                // Para select2
                if ($(partSelect).data('select2')) {
                    $(partSelect).on('select2:select select2:unselect', function() {
                        if (!this.value || this.value === '') {
                            showValidationError(this, 'Seleccione un repuesto');
                        } else {
                            removeValidationError(this);
                        }
                    });
                }
            }
            
            // Validar cantidad
            const quantityInput = row.querySelector('.part-quantity');
            if (quantityInput) {
                quantityInput.addEventListener('input', function() {
                    const quantity = parseInt(this.value);
                    if (isNaN(quantity) || quantity < 1) {
                        showValidationError(this, 'La cantidad debe ser al menos 1');
                    } else {
                        removeValidationError(this);
                    }
                });
            }
            
            // Validar valor unitario
            const unitValueInput = row.querySelector('.part-unit-value');
            if (unitValueInput) {
                unitValueInput.addEventListener('input', function() {
                    const value = unformatNumber(this.value);
                    if (isNaN(value) || value <= 0) {
                        showValidationError(this, 'Ingrese un valor válido mayor a 0');
                    } else {
                        removeValidationError(this);
                    }
                });
            }
        });
    };
    
    // Validar repuestos existentes
    validatePartsTable();
    
    // Agregar validación cuando se agrega un nuevo repuesto
    const addPartBtn = document.getElementById('addPartBtn');
    if (addPartBtn) {
        addPartBtn.addEventListener('click', function() {
            // Esperar a que se agregue la fila
            setTimeout(validatePartsTable, 100);
        });
    }
}

/**
 * Modifica el comportamiento del selector de técnico y estado para prevenir combinaciones inválidas
 */
function setupTechnicianStateRestriction() {
    const technicianSelect = document.getElementById('technical_name');
    const stateSelect = document.getElementById('state');
    const stateDisplay = document.getElementById('state_display');
    
    if (!technicianSelect || !stateSelect) return;
    
    // Función para actualizar el campo de visualización
    function updateStateDisplay() {
        if (stateDisplay) {
            stateDisplay.value = stateSelect.value;
        }
    }
    
    // Modificar el comportamiento original del evento change del técnico
    technicianSelect.addEventListener('change', function() {
        const hasTechnician = this.value && this.value !== '';
        
        // Actualizar el estado basado en la selección del técnico
        if (hasTechnician) {
            stateSelect.value = "Asignado";
        } else {
            stateSelect.value = "Sin asignar";
        }
        
        // Actualizar el campo de visualización
        updateStateDisplay();
        
        // Disparar evento change para que otros listeners se enteren
        stateSelect.dispatchEvent(new Event('change'));
    });
    
    // Inicializar el estado de visualización
    updateStateDisplay();
}

/**
 * Configura el selector de problemas del dispositivo
 */
function setupProblemsSelector() {
    console.log("Configurando selector de problemas...");
    const searchProblems = document.getElementById('searchProblems');
    const problemCheckboxes = document.querySelectorAll('.problem-checkbox');
    const problemOptions = document.querySelectorAll('.problem-option');
    const selectedProblemsTextarea = document.getElementById('selected_problems');
    const selectAllProblemsBtn = document.getElementById('selectAllProblems');
    const clearProblemsBtn = document.getElementById('clearProblems');

    // Verificar que los elementos existan
    if (!searchProblems) console.warn("Elemento searchProblems no encontrado");
    if (!problemCheckboxes.length) console.warn("No se encontraron checkboxes de problemas");
    if (!selectedProblemsTextarea) console.warn("Textarea de problemas seleccionados no encontrado");
    if (!selectAllProblemsBtn) console.warn("Botón selectAllProblems no encontrado");
    if (!clearProblemsBtn) console.warn("Botón clearProblems no encontrado");

    // Función para actualizar el textarea con los problemas seleccionados
    function updateSelectedProblems() {
        if (!selectedProblemsTextarea || !problemCheckboxes.length) return;
        let selectedProblems = [];
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
        searchProblems.addEventListener('input', function() {
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

    // Configurar eventos para los checkboxes
    problemCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', updateSelectedProblems);
    });

    // Configurar botón "Seleccionar Todos"
    if (selectAllProblemsBtn && problemCheckboxes.length) {
        selectAllProblemsBtn.addEventListener('click', function() {
            problemCheckboxes.forEach(checkbox => {
                checkbox.checked = true;
            });
            updateSelectedProblems();
        });
    }

    // Configurar botón "Limpiar Selección"
    if (clearProblemsBtn && problemCheckboxes.length) {
        clearProblemsBtn.addEventListener('click', function() {
            problemCheckboxes.forEach(checkbox => {
                checkbox.checked = false;
            });
            updateSelectedProblems();
        });
    }

    // Inicializar el textarea con los problemas seleccionados
    updateSelectedProblems();
    
    console.log("Configuración de selector de problemas completada");
}

/**
 * Configura la tabla de repuestos
 */
function setupPartsTable() {
    console.log("Setting up parts table");
    
    // Modal initialization
    $("#searchPartsModal").on("shown.bs.modal", function() {
        $("#parts_search").val("").focus();
        $("#parts_search_results").empty();
    });
    
    // Search input event listener
    $("#parts_search").on("keyup", function(event) {
        if (event.key === "Enter") {
            searchParts();
        }
    });
    
    // Search button click
    $("#search_parts_btn").on("click", function() {
        searchParts();
    });
    
    // Elementos DOM relacionados con la tabla de repuestos
    const addPartBtn = document.getElementById('addPartBtn');
    const partsTable = document.getElementById('partsTable');
    const noPartsRow = document.getElementById('noPartsRow');
    const partRowTemplate = document.getElementById('partRowTemplate');
    const spareValueInput = document.getElementById('spare_value');
    const totalInput = document.getElementById('total');
    const serviceValueInput = document.getElementById('service_value');

    // Variables para el modal de búsqueda
    const searchPartsModal = document.getElementById('searchPartsModal');
    const modalPartSearch = document.getElementById('modalPartSearch');
    const searchResults = document.getElementById('searchResults');
    const searchResultsLoader = document.getElementById('searchResultsLoader');
    const initialSearchMessage = document.getElementById('initialSearchMessage');
    const noResultsMessage = document.getElementById('noResultsMessage');
    const clearSearchBtn = document.getElementById('clearSearch');

    // Variable para guardar la fila actual que está seleccionando un repuesto
    let currentEditingRow = null;

    // Verificar que los elementos existan
    if (!addPartBtn) {
        console.error("Botón de agregar repuestos no encontrado");
        return;
    }
    if (!partsTable) {
        console.error("Tabla de repuestos no encontrada");
        return;
    }
    if (!partRowTemplate) {
        console.error("Plantilla de fila de repuesto no encontrada");
        return;
    }

    // Inicializar el modal de búsqueda de repuestos
    if (searchPartsModal) {
        const modal = new bootstrap.Modal(searchPartsModal);
        
        // Manejar click en botón de limpiar búsqueda
        if (clearSearchBtn) {
            clearSearchBtn.addEventListener('click', function() {
                if (modalPartSearch) {
                    modalPartSearch.value = '';
                    modalPartSearch.focus();
                }
                // Mostrar mensaje inicial
                if (initialSearchMessage) initialSearchMessage.style.display = 'block';
                if (searchResultsLoader) searchResultsLoader.style.display = 'none';
                if (noResultsMessage) noResultsMessage.style.display = 'none';
                
                // Limpiar resultados anteriores
                const resultsContainer = document.querySelector('.search-results-container');
                if (resultsContainer) {
                    resultsContainer.style.display = 'none';
                }
            });
        }
        
        // Configurar entrada de búsqueda en el modal
        if (modalPartSearch) {
            modalPartSearch.addEventListener('input', function() {
                const term = this.value.trim();
                
                // Reiniciar temporizador de búsqueda
                if (window.searchTimeout) {
                    clearTimeout(window.searchTimeout);
                }
                
                // Ejecutar búsqueda después de 500ms para evitar múltiples peticiones
                window.searchTimeout = setTimeout(function() {
                    if (term.length >= 3) {
                        searchParts(term);
                    } else {
                        if (initialSearchMessage) initialSearchMessage.style.display = 'block';
                        if (searchResultsLoader) searchResultsLoader.style.display = 'none';
                        if (noResultsMessage) noResultsMessage.style.display = 'none';
                        
                        // Ocultar resultados anteriores
                        const resultsContainer = document.querySelector('.search-results-container');
                        if (resultsContainer) {
                            resultsContainer.style.display = 'none';
                        }
                    }
                }, 500);
            });
            
            // Buscar cuando se presione Enter
            modalPartSearch.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const term = this.value.trim();
                    if (term.length >= 3) {
                        searchParts(term);
                    }
                }
            });
        }
    }

    // Contador para mantener un índice de filas
    let rowCount = 0;

    // Función para actualizar los índices de las filas
    function updateRowIndices() {
        const rows = partsTable.querySelectorAll('tbody .part-row');
        rows.forEach((row, index) => {
            const indexCell = row.querySelector('.part-index');
            if (indexCell) {
                indexCell.textContent = index + 1;
            }
        });
    }

    // Función para actualizar el total de una fila
    function updateRowTotal(row) {
        const quantityInput = row.querySelector('.part-quantity');
        const unitValueInput = row.querySelector('.part-unit-value');
        const totalValueInput = row.querySelector('.part-total-value');

        if (quantityInput && unitValueInput && totalValueInput) {
            const quantity = parseFloat(quantityInput.value) || 0;
            const unitValue = unformatNumber(unitValueInput.value) || 0;
            const total = quantity * unitValue;

            totalValueInput.value = formatNumberWithThousands(total);
            
            // Actualizar el total de repuestos
            updatePartsTotals();
        }
    }

    // Función para actualizar los totales generales
    function updatePartsTotals() {
        let totalPartsValue = 0;
        const totalRows = partsTable.querySelectorAll('tbody .part-row');
        
        totalRows.forEach(row => {
            const totalValueInput = row.querySelector('.part-total-value');
            if (totalValueInput) {
                totalPartsValue += unformatNumber(totalValueInput.value) || 0;
            }
        });

        // Actualizar campo de valor de repuestos
        if (spareValueInput) {
            spareValueInput.value = formatNumberWithThousands(totalPartsValue);
        }

        // Actualizar total general
        updateTotal();
    }

    // Función para actualizar el total general
    function updateTotal() {
        if (serviceValueInput && spareValueInput && totalInput) {
            const serviceValue = unformatNumber(serviceValueInput.value) || 0;
            const spareValue = unformatNumber(spareValueInput.value) || 0;
            const total = serviceValue + spareValue;

            totalInput.value = formatNumberWithThousands(total);
        }
    }

    // Función para buscar repuestos
    function searchParts(term) {
        if (!searchResultsLoader || !initialSearchMessage || !noResultsMessage || !searchResults) {
            console.error("Faltan elementos del modal de búsqueda");
            return;
        }
        
        // Ocultar mensajes y mostrar loader
        initialSearchMessage.style.display = 'none';
        noResultsMessage.style.display = 'none';
        searchResultsLoader.style.display = 'block';

        // Limpiar resultados anteriores
        const existingContainer = document.querySelector('.search-results-container');
        if (existingContainer) {
            existingContainer.innerHTML = '';
        }

        // Validar término de búsqueda
        if (!term || term.length < 3) {
            searchResultsLoader.style.display = 'none';
            initialSearchMessage.style.display = 'block';
            return;
        }

        // Crear FormData para enviar en la petición
        const formData = new FormData();
        formData.append('search', term);

        // Enviar petición AJAX
        console.log("Buscando repuestos con término:", term);
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
                searchResultsLoader.style.display = 'none';
                
                console.log("Resultados de búsqueda:", data);

                // Verificar si hay resultados
                if (!data.parts || data.parts.length === 0) {
                    noResultsMessage.style.display = 'block';
                    return;
                }

                // Crear o mostrar el contenedor de resultados
                let resultsContainer = document.querySelector('.search-results-container');
                if (!resultsContainer) {
                    resultsContainer = document.createElement('div');
                    resultsContainer.className = 'search-results-container';
                    searchResults.appendChild(resultsContainer);
                }
                resultsContainer.style.display = 'block';
                resultsContainer.innerHTML = '';

                // Crear una fila para los resultados
                const row = document.createElement('div');
                row.className = 'row g-3';
                resultsContainer.appendChild(row);

                // Agregar cada repuesto encontrado en columnas
                data.parts.forEach(part => {
                    // Crear columna para este repuesto (6 columnas en pantalla md)
                    const col = document.createElement('div');
                    col.className = 'col-md-6';
                    
                    // Crear tarjeta para el repuesto
                    const card = document.createElement('div');
                    card.className = 'card h-100 shadow-sm';
                    
                    // Agregar contenido a la tarjeta
                    card.innerHTML = `
                        <div class="card-body">
                            <h6 class="card-title mb-1 fw-bold">${highlightSearchTerm(part.description, term)}</h6>
                            <p class="card-text text-muted small mb-2">${highlightSearchTerm(part.code, term)}</p>
                            <div class="d-flex justify-content-between align-items-center">
                                <span class="fs-5 text-success fw-bold">$${formatNumberWithThousands(part.price || 0)}</span>
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
                    card.querySelector('.select-result').addEventListener('click', function() {
                        const partData = {
                            code: card.dataset.code,
                            description: card.dataset.description,
                            price: card.dataset.price
                        };
                        selectPartAndUpdateRow(partData);
                        
                        // Cerrar modal
                        const modal = bootstrap.Modal.getInstance(searchPartsModal);
                        if (modal) modal.hide();
                    });

                    // Agregar a la columna y luego a la fila
                    col.appendChild(card);
                    row.appendChild(col);
                });
            })
            .catch(error => {
                console.error('Error al buscar repuestos:', error);
                searchResultsLoader.style.display = 'none';
                noResultsMessage.style.display = 'block';
                noResultsMessage.innerHTML = `
                    <i class="fas fa-exclamation-triangle text-danger fa-3x mb-3"></i>
                    <h5 class="text-danger">Error al buscar repuestos</h5>
                    <p class="text-muted mb-0">${error.message}</p>
                `;
            });
    }

    // Función para resaltar el término de búsqueda en el texto
    function highlightSearchTerm(text, term) {
        if (!text) return '';
        if (!term) return text;

        // Escapar caracteres especiales en el término de búsqueda
        const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        // Crear una expresión regular para encontrar el término (insensible a mayúsculas/minúsculas)
        const regex = new RegExp(`(${escapedTerm})`, 'gi');

        // Reemplazar todas las ocurrencias con una versión resaltada
        return text.replace(regex, '<span class="highlight">$1</span>');
    }

    // Función para seleccionar un repuesto y actualizar la fila actual
    function selectPartAndUpdateRow(partData) {
        if (!currentEditingRow) {
            console.error('No hay fila seleccionada para actualizar');
            return;
        }

        // Obtener el select de la fila
        const select = currentEditingRow.querySelector('select');
        
        // Verificar si la opción ya existe
        let optionExists = false;
        for (let i = 0; i < select.options.length; i++) {
            if (select.options[i].value === partData.code) {
                select.selectedIndex = i;
                optionExists = true;
                break;
            }
        }

        // Si no existe, crear nueva opción y seleccionarla
        if (!optionExists) {
            const newOption = document.createElement('option');
            newOption.value = partData.code;
            // Solo mostrar la descripción, no el código
            newOption.textContent = partData.description;
            select.appendChild(newOption);
            select.selectedIndex = select.options.length - 1;
        }

        // Actualizar precio unitario
        const unitValueInput = currentEditingRow.querySelector('.part-unit-value');
        if (unitValueInput) {
            unitValueInput.value = formatNumberWithThousands(partData.price);
            unitValueInput.dispatchEvent(new Event('input'));
        }

        // Actualizar el total de la fila
        updateRowTotal(currentEditingRow);
        
        // Mostrar notificación
        showToast('success', 'Repuesto seleccionado correctamente');
    }

    // Manejar evento click en botón de agregar repuesto
    addPartBtn.addEventListener('click', function() {
        addPartRow();
    });

    // Inicializar evento en el campo del valor del servicio
    if (serviceValueInput) {
        // Formatear el valor inicial
        if (serviceValueInput.value) {
            serviceValueInput.value = formatNumberWithThousands(serviceValueInput.value);
        } else {
            serviceValueInput.value = "0";
        }

        // Formatear al cambiar y actualizar total
        serviceValueInput.addEventListener('input', function() {
            applyThousandsFormatting(this);
            updateTotal();
        });
    }

    // Función para agregar una nueva fila de repuesto
    function addPartRow() {
        // Mostrar la plantilla
        if (noPartsRow) {
            noPartsRow.style.display = 'none';
        }

        // Clonar la plantilla
        const content = partRowTemplate.content.cloneNode(true);
        const newRow = content.querySelector('tr');
        
        // Incrementar contador
        rowCount++;
        
        // Agregar eventos para actualizar totales
        const quantityInput = newRow.querySelector('.part-quantity');
        const unitValueInput = newRow.querySelector('.part-unit-value');
        
        if (quantityInput) {
            quantityInput.addEventListener('input', function() {
                updateRowTotal(newRow);
            });
        }
        
        if (unitValueInput) {
            unitValueInput.addEventListener('input', function() {
                applyThousandsFormatting(this);
                updateRowTotal(newRow);
            });
        }

        // Agregar evento para eliminar la fila
        const removeBtn = newRow.querySelector('.remove-part');
        if (removeBtn) {
            removeBtn.addEventListener('click', function() {
                newRow.remove();
                if (partsTable.querySelectorAll('tbody .part-row').length === 0) {
                    if (noPartsRow) {
                        noPartsRow.style.display = '';
                    }
                }
                updateRowIndices();
                updatePartsTotals();
            });
        }

        // Configurar botón de búsqueda de repuestos
        const selectPartBtn = newRow.querySelector('.select-part');
        if (selectPartBtn && searchPartsModal) {
            selectPartBtn.addEventListener('click', function() {
                // Guardar la fila actual para posterior actualización
                currentEditingRow = newRow;
                
                // Limpiar búsqueda anterior
                if (modalPartSearch) modalPartSearch.value = '';
                
                // Mostrar mensaje inicial y ocultar otros
                if (initialSearchMessage) initialSearchMessage.style.display = 'block';
                if (noResultsMessage) noResultsMessage.style.display = 'none';
                if (searchResultsLoader) searchResultsLoader.style.display = 'none';
                
                // Ocultar resultados anteriores
                const resultsContainer = document.querySelector('.search-results-container');
                if (resultsContainer) {
                    resultsContainer.style.display = 'none';
                }
                
                // Mostrar modal
                const modal = new bootstrap.Modal(searchPartsModal);
                modal.show();
                
                // Enfocar campo de búsqueda
                if (modalPartSearch) {
                    setTimeout(() => modalPartSearch.focus(), 500);
                }
            });
        }

        // Añadir la fila a la tabla
        partsTable.querySelector('tbody').appendChild(newRow);
        
        // Actualizar índices y calculados
        updateRowIndices();
        updateRowTotal(newRow);
        
        console.log("Fila de repuesto agregada");
    }

    // Configurar eventos para filas de repuestos existentes
    function setupExistingRows() {
        const existingRows = partsTable.querySelectorAll('tbody .part-row');
        
        existingRows.forEach(row => {
            // Formatear campos numéricos
            const unitValueInput = row.querySelector('.part-unit-value');
            const totalValueInput = row.querySelector('.part-total-value');
            
            if (unitValueInput) {
                applyThousandsFormatting(unitValueInput);
                unitValueInput.addEventListener('input', function() {
                    applyThousandsFormatting(this);
                    updateRowTotal(row);
                });
            }
            
            if (totalValueInput) {
                applyThousandsFormatting(totalValueInput);
            }
            
            // Configurar eventos de cantidad
            const quantityInput = row.querySelector('.part-quantity');
            if (quantityInput) {
                quantityInput.addEventListener('input', function() {
                    updateRowTotal(row);
                });
            }
            
            // Configurar botón de búsqueda
            const selectPartBtn = row.querySelector('.select-part');
            if (selectPartBtn && searchPartsModal) {
                selectPartBtn.addEventListener('click', function() {
                    // Guardar la fila actual para posterior actualización
                    currentEditingRow = row;
                    
                    // Limpiar búsqueda anterior
                    if (modalPartSearch) modalPartSearch.value = '';
                    
                    // Mostrar mensaje inicial y ocultar otros
                    if (initialSearchMessage) initialSearchMessage.style.display = 'block';
                    if (noResultsMessage) noResultsMessage.style.display = 'none';
                    if (searchResultsLoader) searchResultsLoader.style.display = 'none';
                    
                    // Ocultar resultados anteriores
                    const resultsContainer = document.querySelector('.search-results-container');
                    if (resultsContainer) {
                        resultsContainer.style.display = 'none';
                    }
                    
                    // Mostrar modal
                    const modal = new bootstrap.Modal(searchPartsModal);
                    modal.show();
                    
                    // Enfocar campo de búsqueda
                    if (modalPartSearch) {
                        setTimeout(() => modalPartSearch.focus(), 500);
                    }
                });
            }
            
            // Configurar evento de eliminación
            const removeBtn = row.querySelector('.remove-part');
            if (removeBtn) {
                removeBtn.addEventListener('click', function() {
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
                            if (partsTable.querySelectorAll('tbody .part-row').length === 0) {
                                if (noPartsRow) {
                                    noPartsRow.style.display = '';
                                }
                            }
                            updateRowIndices();
                            updatePartsTotals();
                            showToast('success', 'Repuesto eliminado correctamente', 'top-end');
                        }
                    });
                });
            }
        });
    }

    // Inicializar filas existentes
    setupExistingRows();
    
    // Inicializar los totales
    updatePartsTotals();
    
    // Configurar eventos para los valores del servicio
    if (serviceValueInput) {
        applyThousandsFormatting(serviceValueInput);
        serviceValueInput.addEventListener('input', function() {
            applyThousandsFormatting(this);
            updateTotal();
        });
    }

    console.log("Configuración de la tabla de repuestos completada");
}

/***** Inicialización al Cargar el DOM *****/
document.addEventListener("DOMContentLoaded", function () {
    // Configuración de búsqueda de cliente
    setupClientSearch();
    
    // Inicio de validación de técnico y estado
    setupTechnicianStateRestriction();

    // Inicializar selector de problemas
    setupProblemsSelector();

    // Configurar tabla de repuestos
    setupPartsTable();

    // Configurar eventos de validación
    attachEnhancedRealTimeValidation();

    /***** 1. Mostrar alerta si el ticket fue creado *****/
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('ticket_created') === 'success') {
        showToast('success', '¡Ticket creado con éxito!', 'top-end', 3000);
        window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    /***** 2. Inicialización de Select2 *****/
    if (document.getElementById('reference')) {
        $('#reference').select2({
            width: '100%',
            placeholder: "Seleccione una referencia",
            allowClear: true
        });
    }
    $('.searchable-select').not('#state, #city, #priority, #technical_name, #technical_document, #product_code').select2({
        width: '100%',
        placeholder: "Seleccione una opción",
        allowClear: true
    });
    $('#reference').on('select2:select', function (e) {
        this.dispatchEvent(new Event('change'));
    });

    /***** 3. Auto-completar campos *****/
    // Actualizar documento del técnico y cambiar estado a "Asignado"
    const technicianSelect = document.getElementById('technical_name');
    const technicianDocumentInput = document.getElementById('technical_document');
    const stateSelect = document.getElementById('state');
    if (technicianSelect && technicianDocumentInput && stateSelect) {
        technicianSelect.addEventListener('change', function () {
            const selectedOption = this.options[this.selectedIndex];
            if (selectedOption && selectedOption.value) {
                technicianDocumentInput.value = selectedOption.getAttribute('data-document') || '';
                for (let i = 0; i < stateSelect.options.length; i++) {
                    if (stateSelect.options[i].value === "Asignado") {
                        stateSelect.selectedIndex = i;
                        break;
                    }
                }
            } else {
                technicianDocumentInput.value = '';
                for (let i = 0; i < stateSelect.options.length; i++) {
                    if (stateSelect.options[i].value === "Sin asignar") {
                        stateSelect.selectedIndex = i;
                        break;
                    }
                }
            }
        });
        if (technicianSelect.value) {
            const selectedOption = technicianSelect.options[technicianSelect.selectedIndex];
            if (selectedOption && selectedOption.value && (!technicianDocumentInput.value || technicianDocumentInput.value.trim() === '')) {
                technicianDocumentInput.value = selectedOption.getAttribute('data-document') || '';
            }
        }
    }

    // Actualizar el código del producto al cambiar la referencia
    const referenceElem = document.getElementById('reference');
    const productCodeInput = document.getElementById('product_code');
    if (referenceElem && productCodeInput) {
        referenceElem.addEventListener('change', function () {
            const selectedOption = this.options[this.selectedIndex];
            productCodeInput.value = (selectedOption && selectedOption.value) ? (selectedOption.getAttribute('data-code') || '') : '';
        });
        if (referenceElem.value) {
            const selectedOption = referenceElem.options[referenceElem.selectedIndex];
            if (selectedOption && selectedOption.value && !productCodeInput.value) {
                productCodeInput.value = selectedOption.getAttribute('data-code') || '';
            }
        }
    }

    /***** 4. Gestión de Problemas del Dispositivo *****/
    const searchProblems = document.getElementById('searchProblems');
    const problemCheckboxes = document.querySelectorAll('.problem-checkbox');
    const problemOptions = document.querySelectorAll('.problem-option');
    const selectedProblemsTextarea = document.getElementById('selected_problems');
    const selectAllProblemsBtn = document.getElementById('selectAllProblems');
    const clearProblemsBtn = document.getElementById('clearProblems');

    function updateSelectedProblems() {
        if (!selectedProblemsTextarea || !problemCheckboxes.length) return;
        let selectedProblems = [];
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
    if (problemCheckboxes.length) {
        problemCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', updateSelectedProblems);
        });
        updateSelectedProblems();
    }
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

    /***** 5. Gestión de Repuestos (Tabla de Repuestos) *****/
    const setupRepuestos = function () {
        // Esta sección se reemplaza por la nueva implementación de setupPartsTable()
        // La llamada a setupPartsTable() ya está presente en el código principal
    };

    /***** 6. Validación y Envío del Formulario *****/
    const ticketForm = document.querySelector('form');
    if (ticketForm) {
        ticketForm.addEventListener('submit', function (e) {
            e.preventDefault();
            let isValid = true;
            let errorMessage = '';

            // Validar Información del Cliente
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

            // Validar Tipo de Servicio
            const typeOfService = document.getElementById('type_of_service');
            if (typeOfService && !typeOfService.value.trim()) {
                isValid = false;
                errorMessage += 'El tipo de servicio es requerido.<br>';
                typeOfService.classList.add('is-invalid');
            } else if (typeOfService) {
                typeOfService.classList.remove('is-invalid');
            }

            // Validar Valor del Servicio
            const serviceValue = document.getElementById('service_value');
            if (serviceValue && (!serviceValue.value || isNaN(serviceValue.value) || parseFloat(serviceValue.value) < 0)) {
                isValid = false;
                errorMessage += 'El valor del servicio debe ser un número positivo.<br>';
                serviceValue.classList.add('is-invalid');
            } else if (serviceValue) {
                serviceValue.classList.remove('is-invalid');
            }

            if (!isValid) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error de validación',
                    html: errorMessage,
                    confirmButtonText: 'Corregir'
                });
                return;
            }

            Swal.fire({
                title: '¿Crear nuevo ticket?',
                text: '¿Estás seguro de crear este nuevo ticket de servicio técnico?',
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Sí, crear ticket',
                cancelButtonText: 'Cancelar'
            }).then((result) => {
                if (result.isConfirmed) {
                    Swal.fire({
                        title: 'Creando ticket...',
                        html: 'Por favor espera mientras se crea el nuevo ticket.',
                        allowOutsideClick: false,
                        didOpen: () => {
                            Swal.showLoading();
                        }
                    });
                    // Desformatear los campos numéricos antes de enviar
                    document.querySelectorAll('#service_value, #spare_value, #total, .part-unit-value, .part-total-value')
                        .forEach(input => {
                            input.value = unformatNumber(input.value);
                        });
                    ticketForm.removeEventListener('submit', arguments.callee);
                    ticketForm.submit();
                }
            });
        });
    }

    /***** 7. Confirmación al cambiar la referencia del producto *****/
    const referenceSelect = document.getElementById('reference');
    if (referenceSelect) {
        let originalReference = referenceSelect.value;
        let originalReferenceText = referenceSelect.options[referenceSelect.selectedIndex]?.text || 'Sin seleccionar';
        referenceSelect.addEventListener('change', function () {
            const newReference = this.value;
            const newReferenceText = this.options[this.selectedIndex]?.text || 'Sin seleccionar';
            if (newReference == originalReference ) {
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
                        originalReference = newReference;
                        originalReferenceText = newReferenceText;
                        const productCodeInput = document.getElementById('product_code');
                        if (productCodeInput) {
                            const selectedOption = this.options[this.selectedIndex];
                            productCodeInput.value = (selectedOption && selectedOption.getAttribute('data-code')) || '';
                        }
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
                        this.value = originalReference;
                    }
                });
            }
        });
    }
});

// Asegurarse de que, al seleccionar con Select2, se dispare el evento change en el select de referencia
$(document).ready(function () {
    // La funcionalidad de Select2 ya no se usa
    // Se mantienen solo los eventos nativos
});

/**
 * Busca un cliente por documento y muestra sus datos en el formulario
 * @param {string} documentNumber - Documento del cliente a buscar
 */
function searchClient(documentNumber) {
    console.log("Iniciando búsqueda de cliente con documento:", documentNumber);
    if (!documentNumber) {
        console.error("Documento vacío, no se puede buscar");
        return;
    }

    // Mostrar indicador de carga
    const searchClientBtn = document.getElementById('searchClientBtn');
    const documentFeedback = document.getElementById('documentFeedback');
    const documentInput = document.getElementById('document');

    // Limpiar errores previos
    if (documentFeedback) {
        documentFeedback.style.display = 'none';
        documentInput.classList.remove('is-invalid');
    }

    // Validar el documento
    const digitsOnly = documentNumber.replace(/\D/g, '');
    console.log("Documento después de filtrar caracteres no numéricos:", digitsOnly);
    
    if (digitsOnly.length < 5) {
        console.warn("Documento muy corto:", digitsOnly.length, "caracteres");
        if (documentFeedback) {
            documentFeedback.textContent = 'El documento debe tener al menos 5 dígitos';
            documentFeedback.style.display = 'block';
            documentInput.classList.add('is-invalid');
        }
        return;
    }

    // Mostrar indicador de carga
    searchClientBtn.disabled = true;
    searchClientBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>';
    console.log("Indicador de carga mostrado, enviando petición AJAX...");

    // Crear FormData para enviar en la petición
    const formData = new FormData();
    formData.append('document', documentNumber);

    // Enviar petición AJAX
    console.log("URL de búsqueda:", '/search_client');
    fetch('/search_client', {
        method: 'POST',
        body: formData
    })
        .then(response => {
            console.log("Respuesta recibida, estado:", response.status);
            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            // Restaurar botón
            searchClientBtn.disabled = false;
            searchClientBtn.innerHTML = '<i class="fas fa-search"></i>';

            console.log('Respuesta del servidor:', data);

            if (data.success) {
                console.log("Cliente encontrado:", data.client);
                // Mostrar datos del cliente
                if (data.client) {
                    const clientNamesInput = document.getElementById('client_names');
                    const clientLastnamesInput = document.getElementById('client_lastnames');
                    const phoneInput = document.getElementById('phone');
                    const mailInput = document.getElementById('mail');

                    if (clientNamesInput) {
                        const nombre1 = data.client.nombre1 || '';
                        const nombre2 = data.client.nombre2 || '';
                        clientNamesInput.value = `${nombre1} ${nombre2}`.trim();
                        clientNamesInput.classList.add('bg-light');
                        clientNamesInput.readOnly = true;
                        console.log("Nombres actualizados:", clientNamesInput.value);
                    }

                    if (clientLastnamesInput) {
                        const apellido1 = data.client.apellido1 || '';
                        const apellido2 = data.client.apellido2 || '';
                        clientLastnamesInput.value = `${apellido1} ${apellido2}`.trim();
                        clientLastnamesInput.classList.add('bg-light');
                        clientLastnamesInput.readOnly = true;
                        console.log("Apellidos actualizados:", clientLastnamesInput.value);
                    }

                    if (phoneInput) {
                        phoneInput.value = data.client.phone || '';
                        phoneInput.classList.add('bg-light');
                        phoneInput.readOnly = true;
                        console.log("Teléfono actualizado:", phoneInput.value);
                    }

                    if (mailInput) {
                        mailInput.value = data.client.email || '';
                        mailInput.classList.add('bg-light');
                        mailInput.readOnly = true;
                        console.log("Email actualizado:", mailInput.value);
                    }
                }

                // Mostrar notificación
                console.log("Mostrando notificación de éxito");
                showToast('success', 'Cliente encontrado', 'top-end', 3000);
            } else {
                console.warn("Cliente no encontrado:", data.message);
                if (documentFeedback) {
                    documentFeedback.textContent = data.message || 'Cliente no encontrado';
                    documentFeedback.style.display = 'block';
                    documentInput.classList.add('is-invalid');
                }
            }
        })
        .catch(error => {
            // Restaurar botón
            searchClientBtn.disabled = false;
            searchClientBtn.innerHTML = '<i class="fas fa-search"></i>';

            console.error('Error en la búsqueda:', error);

            if (documentFeedback) {
                documentFeedback.textContent = `Error: ${error.message}`;
                documentFeedback.style.display = 'block';
                documentInput.classList.add('is-invalid');
            }
            
            // También mostrar un toast de error para mayor visibilidad
            showToast('error', `Error al buscar cliente: ${error.message}`, 'top-end', 5000);
        });
}

/**
 * Configura la funcionalidad de búsqueda de cliente
 */
function setupClientSearch() {
    console.log("Configurando búsqueda de cliente...");
    const searchClientBtn = document.getElementById('searchClientBtn');
    const documentInput = document.getElementById('document');
    const documentFeedback = document.getElementById('documentFeedback');

    console.log("Botón de búsqueda:", searchClientBtn ? "encontrado" : "no encontrado");
    console.log("Campo de documento:", documentInput ? "encontrado" : "no encontrado");

    // Configurar evento de búsqueda de cliente
    if (searchClientBtn) {
        searchClientBtn.addEventListener('click', function () {
            console.log("Botón de búsqueda clickeado");
            const documentNumber = documentInput.value.trim();
            searchClient(documentNumber);
        });
    } else {
        console.error("No se encontró el botón de búsqueda de cliente");
    }

    // Buscar cliente al presionar Enter en el campo documento
    if (documentInput) {
        documentInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                console.log("Tecla Enter presionada en campo documento");
                e.preventDefault(); // Evitar envío del formulario
                if (searchClientBtn) searchClientBtn.click();
            }
        });

        documentInput.addEventListener('input', function () {
            if (documentFeedback) {
                documentFeedback.style.display = 'none';
                documentInput.classList.remove('is-invalid');
            }
        });
    } else {
        console.error("No se encontró el campo de documento");
    }
    
    console.log("Configuración de búsqueda de cliente completada");
}

function searchParts() {
    const searchTerm = $("#parts_search").val().trim();
    const resultsContainer = $("#parts_search_results");
    resultsContainer.empty();
    
    // Referencias a elementos del DOM
    const searchResultsLoader = document.getElementById('searchResultsLoader');
    const initialSearchMessage = document.getElementById('initialSearchMessage');
    const noResultsMessage = document.getElementById('noResultsMessage');
    
    // Ocultar mensajes previos si existen
    if (initialSearchMessage) initialSearchMessage.style.display = 'none';
    if (noResultsMessage) noResultsMessage.style.display = 'none';
    
    if (searchTerm.length < 2) {
        resultsContainer.html("<p class='text-center text-muted'>Ingrese al menos 2 caracteres para buscar</p>");
        if (initialSearchMessage) initialSearchMessage.style.display = 'block';
        return;
    }
    
    // Mostrar indicador de carga
    resultsContainer.html("<p class='text-center'><i class='fas fa-spinner fa-spin'></i> Buscando repuestos...</p>");
    if (searchResultsLoader) searchResultsLoader.style.display = 'block';
    
    $.ajax({
        url: "/search_spare_parts",
        method: "POST",
        data: { search: searchTerm },
        success: function(response) {
            resultsContainer.empty();
            if (searchResultsLoader) searchResultsLoader.style.display = 'none';
            
            if (response.parts && response.parts.length > 0) {
                // Mostrar mensaje con el número de resultados
                const countMessage = $("<p class='mb-3 text-muted'></p>").text(
                    `Se encontraron ${response.parts.length} repuestos. ${response.parts.length > 100 ? 'Mostrando los primeros 100.' : ''}`
                );
                resultsContainer.append(countMessage);
                
                // Crear contenedor de rejilla para las dos columnas
                const row = $("<div class='row row-cols-1 row-cols-md-2 g-3'></div>");
                resultsContainer.append(row);
                
                // Agregar cada repuesto como una tarjeta en la rejilla
                $.each(response.parts, function(index, part) {
                    // Formatear precio para visualización
                    const formattedPrice = part.price ? formatNumberWithThousands(part.price) : 'N/A';
                    
                    // Crear columna para la tarjeta
                    const col = $("<div class='col'></div>");
                    
                    // Crear tarjeta para el repuesto
                    const card = $("<div class='card h-100 border-light shadow-sm'></div>");
                    
                    // Cuerpo de la tarjeta
                    const cardBody = $("<div class='card-body'></div>");
                    
                    // Título de la tarjeta (descripción del repuesto)
                    cardBody.append($("<h6 class='card-title text-primary'></h6>").text(part.description));
                    
                    // Detalles del repuesto
                    const details = $("<div class='small'></div>");
                    details.append($("<p class='mb-1'></p>").html("<strong>Código:</strong> " + part.code));
                    details.append($("<p class='mb-2 fs-5 fw-bold text-success'></p>").html("$" + formattedPrice));
                    cardBody.append(details);
                    
                    // Botón para seleccionar el repuesto
                    const selectBtn = $("<button class='btn btn-sm btn-outline-primary w-100'><i class='fas fa-check me-1'></i>Seleccionar</button>");
                    selectBtn.on("click", function() {
                        // Preparar datos del repuesto seleccionado
                        const partData = {
                            code: part.code,
                            description: part.description,
                            price: part.price || '0'
                        };
                        
                        // Usar la función existente para seleccionar el repuesto
                        selectPartAndUpdateRow(partData);
                        
                        // Cerrar el modal después de seleccionar
                        $("#searchPartsModal").modal("hide");
                    });
                    cardBody.append(selectBtn);
                    
                    // Ensamblar la tarjeta y agregarla a la columna
                    card.append(cardBody);
                    col.append(card);
                    row.append(col);
                });
            } else {
                resultsContainer.html("<p class='text-center text-muted'>No se encontraron repuestos con ese término de búsqueda</p>");
                if (noResultsMessage) noResultsMessage.style.display = 'block';
            }
        },
        error: function(xhr, status, error) {
            console.error("Error searching for parts:", error);
            resultsContainer.html("<p class='text-center text-danger'>Error al buscar repuestos. Intente nuevamente.</p>");
            if (searchResultsLoader) searchResultsLoader.style.display = 'none';
            if (noResultsMessage) {
                noResultsMessage.style.display = 'block';
                noResultsMessage.innerHTML = `
                    <i class="fas fa-exclamation-triangle text-danger fa-3x mb-3"></i>
                    <h5 class="text-danger">Error al buscar repuestos</h5>
                    <p class="text-muted mb-0">${error}</p>
                `;
            }
        }
    });
}
