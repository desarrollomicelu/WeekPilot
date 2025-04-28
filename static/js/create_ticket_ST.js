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
 * Formatea un número con separadores de miles (puntos en formato colombiano)
 * @param {number|string} number - Número a formatear
 * @returns {string} Número formateado con separadores de miles
 */
function formatNumberWithThousands(number) {
    // Si no es un valor válido, devolver 0
    if (number === undefined || number === null || isNaN(number)) return '0';

    // Si es string, convertir a número eliminando separadores existentes
    if (typeof number === 'string') {
        // Eliminar puntos existentes para evitar problemas con diferentes formatos
        number = parseInt(number.replace(/\./g, ''), 10) || 0;
    } else {
        // Si es número, asegurar que sea entero
        number = Math.floor(number);
    }
    
    // Formatear usando el formato colombiano (punto como separador de miles)
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/**
 * Elimina los separadores de miles de un número
 * @param {string} formattedNumber - Número con formato (separadores de miles)
 * @returns {number} Número sin formato
 */
function unformatNumber(formattedNumber) {
    if (!formattedNumber) return 0;
    
    // Convertir a string si no lo es
    const strValue = formattedNumber.toString();
    
    // Eliminar todos los puntos (separadores de miles)
    return parseInt(strValue.replace(/\./g, ''), 10) || 0;
}

/**
 * Aplica formato de miles a un input al escribir
 * @param {HTMLInputElement} input - Input a formatear
 */
function applyThousandsFormatting(input) {
    if (!input) return;

    // Guardar posición del cursor
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const originalLength = input.value.length;

    // Formatear valor
    let value = input.value.replace(/[^\d]/g, '');
    if (value) {
        input.value = formatNumberWithThousands(value);
    } else {
        input.value = '0';
    }
    
    // Reposicionar cursor
    const newLength = input.value.length;
    const cursorAdjust = newLength - originalLength;
    
    if (document.activeElement === input) {
        input.setSelectionRange(start + cursorAdjust, end + cursorAdjust);
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
    const technicianDocumentInput = document.getElementById('technical_document');
    
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
            
            // Obtener y asignar el documento del técnico seleccionado
            if (technicianDocumentInput) {
                const selectedOption = this.options[this.selectedIndex];
                const technicianDocument = selectedOption.getAttribute('data-document') || '';
                technicianDocumentInput.value = technicianDocument;
                
                // Asegurarse de que se ha asignado correctamente el documento
                console.log("Técnico seleccionado: " + this.value);
                console.log("Documento asignado: " + technicianDocument);
            }
        } else {
            stateSelect.value = "Sin asignar";
            if (technicianDocumentInput) {
                technicianDocumentInput.value = '';
            }
        }
        
        // Actualizar el campo de visualización
        updateStateDisplay();
        
        // Disparar evento change para que otros listeners se enteren
        stateSelect.dispatchEvent(new Event('change'));
    });
    
    // Inicializar el estado de visualización al cargar la página
    updateStateDisplay();
    
    // Ejecutar el evento change al inicio para asegurar consistencia
    if (technicianSelect.value && technicianSelect.value !== '') {
        technicianSelect.dispatchEvent(new Event('change'));
    }
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
    const partsTable = document.getElementById('partsTable');
    const addPartBtn = document.getElementById('addPartBtn');
    
    if (!partsTable || !addPartBtn) {
        console.error("Faltan elementos necesarios para configurar la tabla de repuestos");
        return;
    }
    
    // Agregar evento para botón de agregar repuesto
    addPartBtn.addEventListener('click', function() {
        const newRow = addNewPartRow();
        
        if (newRow) {
            // Configurar botón de búsqueda de repuestos en la nueva fila
            const searchButton = newRow.querySelector('.select-part');
            if (searchButton) {
                searchButton.addEventListener('click', function() {
                    currentEditingRow = this.closest('tr');
                    const searchPartsModal = new bootstrap.Modal(document.getElementById('searchPartsModal'));
                    if (searchPartsModal) {
                        searchPartsModal.show();
                    }
                });
            }
            
            // Configurar evento para actualizar total al cambiar cantidad
            const quantityInput = newRow.querySelector('.part-quantity');
            if (quantityInput) {
                quantityInput.addEventListener('input', function() {
                    updateRowTotal(this.closest('tr'));
    });
            }
            
            // Configurar evento para formatear y actualizar precio unitario
            const unitValueInput = newRow.querySelector('.part-unit-value');
            if (unitValueInput) {
                unitValueInput.addEventListener('input', function() {
                    applyThousandsFormatting(this);
                    updateRowTotal(this.closest('tr'));
                });
                
                unitValueInput.addEventListener('focus', function() {
                    if (this.value === '0') {
                        this.value = '';
                    }
                });
                
                unitValueInput.addEventListener('blur', function() {
                    this.value = formatNumberWithThousands(unformatNumber(this.value));
                    updateRowTotal(this.closest('tr'));
                });
            }
            
            // Configurar botón de eliminar
            const removeButton = newRow.querySelector('.remove-part');
            if (removeButton) {
                removeButton.addEventListener('click', function() {
                    const row = this.closest('tr');
    
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
                            row.remove();
                            
                            // Si no quedan filas, mostrar la fila de "no hay repuestos"
    const noPartsRow = document.getElementById('noPartsRow');
                            const remainingRows = partsTable.querySelectorAll('tbody .part-row');
                            
                            if (noPartsRow && remainingRows.length === 0) {
                                noPartsRow.style.display = '';
                            }
                            
                            // Actualizar índices y totales
                            updateRowIndices();
                            updatePartsTotals();
                        }
                    });
                });
            }
        }
    });

    // Configurar modal de búsqueda de repuestos
    const modalPartSearch = document.getElementById('modalPartSearch');
    if (modalPartSearch) {
        modalPartSearch.addEventListener('input', function() {
            const searchTerm = this.value.trim();
            if (searchTerm.length >= 3) {
                searchParts(searchTerm);
            } else {
    const initialSearchMessage = document.getElementById('initialSearchMessage');
    const noResultsMessage = document.getElementById('noResultsMessage');
                const searchResultsLoader = document.getElementById('searchResultsLoader');
                const searchResultsList = document.getElementById('searchResultsList');
                
                if (initialSearchMessage) initialSearchMessage.style.display = 'block';
                if (noResultsMessage) noResultsMessage.style.display = 'none';
                if (searchResultsLoader) searchResultsLoader.style.display = 'none';
                if (searchResultsList) {
                    searchResultsList.style.display = 'none';
                    searchResultsList.innerHTML = '';
                }
            }
        });
    }

    // Configurar botón para limpiar búsqueda
    const clearSearchBtn = document.getElementById('clearSearch');
    if (clearSearchBtn && modalPartSearch) {
            clearSearchBtn.addEventListener('click', function() {
                    modalPartSearch.value = '';
                    modalPartSearch.focus();
                
            const initialSearchMessage = document.getElementById('initialSearchMessage');
            const noResultsMessage = document.getElementById('noResultsMessage');
            const searchResultsLoader = document.getElementById('searchResultsLoader');
                const searchResultsList = document.getElementById('searchResultsList');
            
            if (initialSearchMessage) initialSearchMessage.style.display = 'block';
            if (noResultsMessage) noResultsMessage.style.display = 'none';
            if (searchResultsLoader) searchResultsLoader.style.display = 'none';
                if (searchResultsList) {
                    searchResultsList.style.display = 'none';
                    searchResultsList.innerHTML = '';
                }
            });
        }
        
    // Configurar eventos para filas existentes (para el caso de edición)
    const existingRows = partsTable.querySelectorAll('tbody .part-row');
    existingRows.forEach(row => {
        // Configurar botón de búsqueda
        const searchButton = row.querySelector('.select-part');
        if (searchButton) {
            searchButton.addEventListener('click', function() {
                currentEditingRow = this.closest('tr');
                const searchPartsModal = new bootstrap.Modal(document.getElementById('searchPartsModal'));
                if (searchPartsModal) {
                    searchPartsModal.show();
                }
            });
                }
                
        // Configurar cantidad
        const quantityInput = row.querySelector('.part-quantity');
        if (quantityInput) {
            quantityInput.addEventListener('input', function() {
                updateRowTotal(this.closest('tr'));
            });
        }
        
        // Configurar precio unitario
        const unitValueInput = row.querySelector('.part-unit-value');
        if (unitValueInput) {
            // Formatear valor inicial
            unitValueInput.value = formatNumberWithThousands(unformatNumber(unitValueInput.value));
            
            unitValueInput.addEventListener('input', function() {
                applyThousandsFormatting(this);
                updateRowTotal(this.closest('tr'));
            });
            
            unitValueInput.addEventListener('focus', function() {
                if (this.value === '0') {
                    this.value = '';
                }
            });
            
            unitValueInput.addEventListener('blur', function() {
                this.value = formatNumberWithThousands(unformatNumber(this.value));
                updateRowTotal(this.closest('tr'));
            });
        }
        
        // Configurar botón de eliminar
        const removeButton = row.querySelector('.remove-part');
        if (removeButton) {
            removeButton.addEventListener('click', function() {
                const rowToRemove = this.closest('tr');
            
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
                        rowToRemove.remove();
                        
                        // Si no quedan filas, mostrar la fila de "no hay repuestos"
                        const noPartsRow = document.getElementById('noPartsRow');
                        const remainingRows = partsTable.querySelectorAll('tbody .part-row');
                        
                        if (noPartsRow && remainingRows.length === 0) {
                            noPartsRow.style.display = '';
                        }
                        
                        // Actualizar índices y totales
                        updateRowIndices();
                        updatePartsTotals();
                    }
                });
            });
    }

        // Actualizar totales iniciales
        updateRowTotal(row);
    });
}

/**
 * Actualiza los índices de las filas
 */
    function updateRowIndices() {
    const partsTable = document.getElementById('partsTable');
    if (!partsTable) return;
    
        const rows = partsTable.querySelectorAll('tbody .part-row');
        rows.forEach((row, index) => {
            const indexCell = row.querySelector('.part-index');
            if (indexCell) {
                indexCell.textContent = index + 1;
            }
        });
    }

/**
 * Actualiza el total de una fila de repuestos
 * @param {HTMLElement} row - Fila a actualizar
 */
    function updateRowTotal(row) {
        const quantityInput = row.querySelector('.part-quantity');
        const unitValueInput = row.querySelector('.part-unit-value');
        const totalValueInput = row.querySelector('.part-total-value');

        if (quantityInput && unitValueInput && totalValueInput) {
        const quantity = parseInt(quantityInput.value) || 0;
            const unitValue = unformatNumber(unitValueInput.value) || 0;
            const total = quantity * unitValue;

            totalValueInput.value = formatNumberWithThousands(total);
            
            // Actualizar el total de repuestos
            updatePartsTotals();
        }
    }

/**
 * Actualiza los totales de repuestos y el total general
 */
    function updatePartsTotals() {
    const partsTable = document.getElementById('partsTable');
    const spareValueInput = document.getElementById('spare_value');
    const totalInput = document.getElementById('total');
    const serviceValueInput = document.getElementById('service_value');
    
    if (!partsTable || !spareValueInput) return;
    
        let totalPartsValue = 0;
    const rows = partsTable.querySelectorAll('tbody .part-row');
        
    rows.forEach(row => {
            const totalValueInput = row.querySelector('.part-total-value');
            if (totalValueInput) {
                totalPartsValue += unformatNumber(totalValueInput.value) || 0;
            }
        });

        // Actualizar campo de valor de repuestos
            spareValueInput.value = formatNumberWithThousands(totalPartsValue);

        // Actualizar total general
    if (totalInput && serviceValueInput) {
            const serviceValue = unformatNumber(serviceValueInput.value) || 0;
        const total = serviceValue + totalPartsValue;

            totalInput.value = formatNumberWithThousands(total);
        }
    }

    /**
 * Agrega una nueva fila de repuesto a la tabla
 */
function addNewPartRow() {
    const partsTable = document.getElementById('partsTable');
    const noPartsRow = document.getElementById('noPartsRow');
    const partRowTemplate = document.getElementById('partRowTemplate');
    
    if (!partsTable || !partRowTemplate) {
        console.error("Faltan elementos necesarios para agregar una fila");
        return;
    }
    
    // Ocultar fila de "no hay repuestos"
    if (noPartsRow) {
        noPartsRow.style.display = 'none';
    }
    
    // Clonar la plantilla
    const template = document.importNode(partRowTemplate.content, true);
    
    // Agregar la nueva fila a la tabla
    partsTable.querySelector('tbody').appendChild(template);
    
    // Obtener la fila recién agregada
    const newRow = partsTable.querySelector('tbody tr.part-row:last-child');
    
    // Actualizar el total inicial de la fila
    updateRowTotal(newRow);
    
    return newRow;
}

/**
 * Selecciona un repuesto y actualiza la fila correspondiente
 * @param {Object} partData - Datos del repuesto seleccionado
 */
function selectPartAndUpdateRow(partData) {
    if (!currentEditingRow) {
        console.error("No hay una fila seleccionada para actualizar");
        return;
    }
    
    // Configurar el select de repuestos
    const select = currentEditingRow.querySelector('select[name="spare_part_code[]"]');
    if (select) {
        // Limpiar opciones actuales
        select.innerHTML = '';
        
        // Crear la nueva opción con los datos del repuesto
        const option = document.createElement('option');
        option.value = partData.code;
        option.textContent = `${partData.code} - ${partData.description}`;
        option.selected = true;
        
        // Agregar opción al select
        select.appendChild(option);
    }
    
    // Actualizar el precio unitario
    const unitValueInput = currentEditingRow.querySelector('.part-unit-value');
    if (unitValueInput && partData.price) {
        unitValueInput.value = formatNumberWithThousands(partData.price);
    }
    
    // Recalcular el total de la fila
    updateRowTotal(currentEditingRow);
    
    // Resaltar la fila brevemente
    currentEditingRow.classList.add('bg-success-subtle');
    setTimeout(() => {
        currentEditingRow.classList.remove('bg-success-subtle');
    }, 500);
    }

    /**
 * Resalta términos de búsqueda en un texto
 * @param {string} text - Texto donde buscar
     * @param {string} term - Término a resaltar
 * @returns {string} - Texto con término resaltado
     */
    function highlightSearchTerm(text, term) {
        if (!text) return '';
        if (!term) return text;

        // Escapar caracteres especiales en el término de búsqueda
        const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        // Crear expresión regular para coincidencias insensibles a mayúsculas/minúsculas
        const regex = new RegExp(`(${escapedTerm})`, 'gi');

        // Reemplazar coincidencias con span resaltado
        return text.replace(regex, '<span class="highlight">$1</span>');
    }

    /**
 * Busca repuestos según el término proporcionado
     * @param {string} term - Término de búsqueda
     */
    function searchParts(term) {
        // Referencias a elementos del DOM
        const initialSearchMessage = document.getElementById('initialSearchMessage');
        const searchResultsLoader = document.getElementById('searchResultsLoader');
        const noResultsMessage = document.getElementById('noResultsMessage');
        const searchResultsList = document.getElementById('searchResultsList');
        const searchPartsModal = document.getElementById('searchPartsModal');

        if (!searchResultsLoader || !initialSearchMessage || !noResultsMessage || !searchResults) {
            console.error("Faltan elementos del modal de búsqueda");
                return;
            }

        // Validar término de búsqueda
        if (!term || term.length < 3) {
            searchResultsLoader.style.display = 'none';
            initialSearchMessage.style.display = 'block';
            noResultsMessage.style.display = 'none';
            if (searchResultsList) searchResultsList.style.display = 'none';
        return;
    }

        // Ocultar mensajes y mostrar loader
        initialSearchMessage.style.display = 'none';
        noResultsMessage.style.display = 'none';
        searchResultsLoader.style.display = 'block';
        
        // Limpiar resultados anteriores
        if (searchResultsList) {
            searchResultsList.innerHTML = '';
            searchResultsList.style.display = 'none';
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
                    if (searchResultsList) searchResultsList.style.display = 'none';
                    return;
                }

                // Mostrar contenedor de resultados
                if (searchResultsList) {
                    searchResultsList.style.display = 'block';
                    searchResultsList.innerHTML = '';
                }

                // Agregar contador de resultados
                const resultCount = document.createElement('div');
                resultCount.className = 'col-12 mb-2';
                resultCount.innerHTML = `<small class="text-muted">Se encontraron ${data.parts.length} repuestos</small>`;
                searchResultsList.appendChild(resultCount);

                // Crear una fila para los resultados
                const row = document.createElement('div');
                row.className = 'row g-3';
                searchResultsList.appendChild(row);

                // Agregar cada repuesto encontrado en columnas
                data.parts.forEach(part => {
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
                                <span class="text-success fw-bold">${part.price && part.price != '0' ? '$' + formatNumberWithThousands(part.price) : ''}</span>
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
                    card.dataset.id = part.id || '';
                    card.dataset.stock = part.stock || '0';
                    card.dataset.location = part.location || '';

                    // Evento de clic para seleccionar un repuesto
            card.querySelector('.select-result').addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                        const partData = {
                            id: card.dataset.id,
                            code: card.dataset.code,
                            description: card.dataset.description,
                            price: card.dataset.price,
                            stock: parseInt(card.dataset.stock),
                            location: card.dataset.location
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
                
                // Agregar estilos adicionales para la tarjeta de resultados
                if (!document.getElementById('part-card-styles')) {
                    const style = document.createElement('style');
                    style.id = 'part-card-styles';
                    style.textContent = `
                        .part-card {
                            transition: all 0.2s ease;
                            border: 1px solid #dee2e6;
                        }
                        .part-card:hover {
                            transform: translateY(-3px);
                            box-shadow: 0 0.5rem 1rem rgba(0,0,0,0.15) !important;
                            border-color: #6c757d;
                        }
                        .highlight {
                            background-color: #ffeeba;
                            padding: 0 2px;
                            border-radius: 2px;
                        }
                        .search-input:focus {
                            border-color: #80bdff;
                            box-shadow: 0 0 0 0.2rem rgba(0,123,255,.25);
                        }
                    `;
                    document.head.appendChild(style);
            }
        })
        .catch(error => {
                console.error('Error al buscar repuestos:', error);
                
                // Ocultar loader y mostrar mensaje de error
                searchResultsLoader.style.display = 'none';
                
                if (searchResultsList) {
                    searchResultsList.innerHTML = `
                        <div class="alert alert-danger" role="alert">
                            <i class="fas fa-exclamation-triangle me-2"></i>
                            Error al buscar repuestos: ${error.message}
                        </div>
                    `;
                    searchResultsList.style.display = 'block';
                } else {
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
 * Configura la funcionalidad de búsqueda de cliente
 */
function setupClientSearch() {
    // Identificar elementos del DOM
    const searchClientBtn = document.getElementById('searchClientBtn');
    const documentInput = document.getElementById('document');
    const documentFeedback = document.getElementById('documentFeedback');
    const clientNamesInput = document.getElementById('client_names');
    const clientLastnamesInput = document.getElementById('client_lastnames');
    const phoneInput = document.getElementById('phone');
    const mailInput = document.getElementById('mail');

    // Configurar evento de búsqueda de cliente
    if (searchClientBtn) {
        searchClientBtn.addEventListener('click', function () {
            const document = documentInput.value.trim();

            // Limpiar errores previos
            if (documentFeedback) {
                documentFeedback.style.display = 'none';
                documentFeedback.classList.remove('d-block');
                documentInput.classList.remove('is-invalid');
            }

            if (!document) {
                if (documentFeedback) {
                    documentFeedback.textContent = 'Por favor, ingrese un número de documento';
                    documentFeedback.style.display = 'block';
                    documentInput.classList.add('is-invalid');
                }
                return;
            }

            // Extraer solo dígitos para validación básica
            const digitsOnly = document.replace(/\D/g, '');

            if (digitsOnly.length < 5) {
                if (documentFeedback) {
                    documentFeedback.textContent = 'El documento debe tener al menos 5 dígitos';
                    documentFeedback.style.display = 'block';
                    documentInput.classList.add('is-invalid');
                }
                return;
            }

            console.log(`Buscando cliente con documento: ${document}`);

            // Crear FormData para enviar en la petición
            const formData = new FormData();
            formData.append('document', document);

            // Mostrar indicador de carga
            searchClientBtn.disabled = true;
            searchClientBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>';

            // Enviar petición AJAX
            fetch('/search_client', {
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
                    // Restaurar botón
                    searchClientBtn.disabled = false;
                    searchClientBtn.innerHTML = '<i class="fas fa-search"></i>';

                    console.log('Respuesta del servidor:', data);

                    if (data.success) {
                        // Mostrar datos del cliente
                        if (data.client) {
                            if (clientNamesInput) {
                                const nombre1 = data.client.nombre1 || '';
                                const nombre2 = data.client.nombre2 || '';
                                // Eliminar espacios adicionales antes, después y dejar solo un espacio entre nombres
                                const nombreCompleto = `${nombre1.trim()} ${nombre2.trim()}`.trim().replace(/\s+/g, ' ');
                                clientNamesInput.value = nombreCompleto;
                                clientNamesInput.readOnly = true;
                                clientNamesInput.classList.add('bg-light');
                            }

                            if (clientLastnamesInput) {
                                const apellido1 = data.client.apellido1 || '';
                                const apellido2 = data.client.apellido2 || '';
                                // Eliminar espacios adicionales antes, después y dejar solo un espacio entre apellidos
                                const apellidoCompleto = `${apellido1.trim()} ${apellido2.trim()}`.trim().replace(/\s+/g, ' ');
                                clientLastnamesInput.value = apellidoCompleto;
                                clientLastnamesInput.readOnly = true;
                                clientLastnamesInput.classList.add('bg-light');
                            }

                            if (phoneInput) {
                                phoneInput.value = data.client.phone || '';
                                phoneInput.readOnly = true;
                                phoneInput.classList.add('bg-light');
                            }

                            if (mailInput) {
                                mailInput.value = data.client.email || '';
                                mailInput.readOnly = true;
                                mailInput.classList.add('bg-light');
                            }
                        }

                        // Mostrar notificación
                        showToast('success', 'Cliente encontrado', 'top-end', 3000);
                    } else {
                        if (documentFeedback) {
                            documentFeedback.textContent = 'Cliente no encontrado';
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
                });
        });
    }

    // Buscar cliente al presionar Enter en el campo documento
    if (documentInput) {
        documentInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
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
    }
}

/**
 * Inicializa todos los componentes de la página
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log("Inicializando componentes de servicio técnico...");

    // Inicializar búsqueda de cliente
    setupClientSearch();

    // Inicializar selector de problemas
    setupProblemsSelector();

    // Inicializar tabla de repuestos
    setupPartsTable();

    // Inicializar búsqueda de referencias
    setupReferenceSearch();

    // Inicializar formatos de moneda
    setupMoneyHandling();
    
    // Inicializar restricción de técnico-estado
    setupTechnicianStateRestriction();

    // Inicializar validaciones en tiempo real
    attachEnhancedRealTimeValidation();
    
    // Procesar mensajes flash si existen
    if (typeof processFlashMessages === 'function') {
        processFlashMessages();
    }
    
    console.log("Componentes de servicio técnico inicializados correctamente");
});

/**
 * Configura el manejo de campos de moneda para formatear números
 */
function setupMoneyHandling() {
    const serviceValueInput = document.getElementById('service_value');
    
    if (serviceValueInput) {
        // Formatear valor inicial
        serviceValueInput.value = formatNumberWithThousands(serviceValueInput.value);
        
        // Aplicar formato al escribir
        serviceValueInput.addEventListener('input', function() {
            applyThousandsFormatting(this);
            updatePartsTotals();
        });
        
        // Al perder el foco, asegurar que tenga formato
        serviceValueInput.addEventListener('blur', function() {
            if (!this.value || this.value === '0') {
                this.value = '0';
            } else {
                this.value = formatNumberWithThousands(unformatNumber(this.value));
            }
            updatePartsTotals();
        });
        
        // Al hacer foco, eliminar formato para facilitar la edición
        serviceValueInput.addEventListener('focus', function() {
            // Si el valor es 0, dejarlo como string vacío para facilitar la entrada
            if (this.value === '0') {
                this.value = '';
            }
        });
    }
}

/**
 * Procesa los mensajes flash y los muestra como notificaciones toast
 */
function processFlashMessages() {
    // Buscar mensajes flash
    const alerts = document.querySelectorAll('.alert');
    
    alerts.forEach(alert => {
        let type = 'info';
        
        if (alert.classList.contains('alert-success')) {
            type = 'success';
        } else if (alert.classList.contains('alert-danger')) {
            type = 'error';
        } else if (alert.classList.contains('alert-warning')) {
            type = 'warning';
        }
        
        const message = alert.textContent;
        
        if (message && message.trim()) {
            // Usar la función showToast para mostrar el mensaje
            showToast(type, message);
            
            // Opcionalmente, remover el alert después de procesarlo
            alert.remove();
        }
    });
}

/**
 * Configura la funcionalidad de búsqueda de referencias
 */
function setupReferenceSearch() {
    const searchReferenceBtn = document.getElementById('searchReferenceBtn');
    const referenceSelect = document.getElementById('reference');
    const productCodeInput = document.getElementById('product_code');
    const searchReferenceModal = document.getElementById('searchReferenceModal');
    const modalReferenceSearch = document.getElementById('modalReferenceSearch');
    const clearReferenceSearch = document.getElementById('clearReferenceSearch');
    const referenceResultsList = document.getElementById('referenceResultsList');
    const initialReferenceMessage = document.getElementById('initialReferenceMessage');
    const referenceResultsLoader = document.getElementById('referenceResultsLoader');
    const noReferenceResults = document.getElementById('noReferenceResults');

    // Verificar si los elementos existen
    if (!searchReferenceBtn || !referenceSelect || !searchReferenceModal) {
        console.error("Faltan elementos para la búsqueda de referencias");
        return;
    }

    // Configurar el valor inicial del código de producto si hay una referencia seleccionada
    if (referenceSelect.value) {
        const selectedOption = referenceSelect.options[referenceSelect.selectedIndex];
        if (selectedOption && productCodeInput) {
            productCodeInput.value = selectedOption.dataset.code || '';
        }
    }

    // Evento de cambio en el select de referencia para actualizar el código
    referenceSelect.addEventListener('change', function() {
        if (productCodeInput) {
            const selectedOption = this.options[this.selectedIndex];
            productCodeInput.value = selectedOption && selectedOption.dataset.code ? selectedOption.dataset.code : '';
        }
    });

    // Configurar botón de búsqueda de referencia
    searchReferenceBtn.addEventListener('click', function() {
        // Mostrar el modal
        const modal = new bootstrap.Modal(searchReferenceModal);
        modal.show();
    });

    // Configurar botón para limpiar búsqueda
    if (clearReferenceSearch) {
        clearReferenceSearch.addEventListener('click', function() {
            if (modalReferenceSearch) {
                modalReferenceSearch.value = '';
                modalReferenceSearch.focus();
            }
            // Restaurar estado inicial
            if (initialReferenceMessage) initialReferenceMessage.style.display = 'block';
            if (referenceResultsLoader) referenceResultsLoader.style.display = 'none';
            if (noReferenceResults) noReferenceResults.style.display = 'none';
            if (referenceResultsList) {
                referenceResultsList.style.display = 'none';
                referenceResultsList.innerHTML = '';
            }
        });
    }

    // Configurar búsqueda en el modal
    if (modalReferenceSearch) {
        modalReferenceSearch.addEventListener('input', function() {
            const searchTerm = this.value.trim().toLowerCase();
            
            // Ocultar/mostrar elementos según corresponda
            if (searchTerm.length < 3) {
                if (initialReferenceMessage) initialReferenceMessage.style.display = 'block';
                if (referenceResultsLoader) referenceResultsLoader.style.display = 'none';
                if (noReferenceResults) noReferenceResults.style.display = 'none';
                if (referenceResultsList) {
                    referenceResultsList.style.display = 'none';
                    referenceResultsList.innerHTML = '';
                }
                return;
            }
            
            // Mostrar indicador de carga
            if (initialReferenceMessage) initialReferenceMessage.style.display = 'none';
            if (referenceResultsLoader) referenceResultsLoader.style.display = 'block';
            if (noReferenceResults) noReferenceResults.style.display = 'none';
            
            // Buscar referencias que coincidan
            filterReferences(searchTerm);
        });
    }

    // Configurar eventos para cerrar el modal
    if (searchReferenceModal) {
        searchReferenceModal.addEventListener('hidden.bs.modal', function() {
            // Limpiar búsqueda al cerrar
            if (modalReferenceSearch) modalReferenceSearch.value = '';
            if (initialReferenceMessage) initialReferenceMessage.style.display = 'block';
            if (referenceResultsLoader) referenceResultsLoader.style.display = 'none';
            if (noReferenceResults) noReferenceResults.style.display = 'none';
            if (referenceResultsList) {
                referenceResultsList.style.display = 'none';
                referenceResultsList.innerHTML = '';
            }
        });
    }
}

/**
 * Filtra las referencias según el término de búsqueda y muestra los resultados en el modal
 * @param {string} searchTerm - Término de búsqueda
 */
function filterReferences(searchTerm) {
    const referenceSelect = document.getElementById('reference');
    const referenceResultsList = document.getElementById('referenceResultsList');
    const referenceResultsLoader = document.getElementById('referenceResultsLoader');
    const noReferenceResults = document.getElementById('noReferenceResults');
    const searchReferenceModal = document.getElementById('searchReferenceModal');
    
    if (!referenceSelect || !referenceResultsList || !referenceResultsLoader || !noReferenceResults) {
        console.error("Faltan elementos para mostrar resultados de referencias");
        return;
    }
    
    // Obtener todas las opciones del select
    const options = Array.from(referenceSelect.options).slice(1); // Excluir la primera opción (placeholder)
    
    // Filtrar opciones que coincidan con el término de búsqueda
    const matchingOptions = options.filter(option => {
        const text = option.textContent.toLowerCase();
        const code = option.dataset.code ? option.dataset.code.toLowerCase() : '';
        return text.includes(searchTerm) || code.includes(searchTerm);
    });
    
    // Ocultar loader
    referenceResultsLoader.style.display = 'none';
    
    // Mostrar mensaje si no hay resultados
    if (matchingOptions.length === 0) {
        noReferenceResults.style.display = 'block';
        referenceResultsList.style.display = 'none';
        return;
    }
    
    // Mostrar resultados
    referenceResultsList.style.display = 'block';
    referenceResultsList.innerHTML = '';
    
    // Crear contador de resultados
    const resultCount = document.createElement('div');
    resultCount.className = 'col-12 mb-2';
    resultCount.innerHTML = `<small class="text-muted">Se encontraron ${matchingOptions.length} referencias</small>`;
    referenceResultsList.appendChild(resultCount);
    
    // Crear fila para resultados
    const row = document.createElement('div');
    row.className = 'row g-3';
    referenceResultsList.appendChild(row);
    
    // Agregar cada referencia como tarjeta
    matchingOptions.forEach(option => {
        const description = option.textContent.trim();
        const code = option.dataset.code || '';
        const value = option.value;
        
        // Crear columna
        const col = document.createElement('div');
        col.className = 'col-md-6 mb-2';
        
        // Crear tarjeta
        const card = document.createElement('div');
        card.className = 'card h-100 shadow-sm reference-card';
        card.dataset.description = description;
        card.dataset.code = code;
        card.dataset.value = value;
        
        // Agregar contenido a la tarjeta
        card.innerHTML = `
            <div class="card-body p-3">
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <h6 class="card-title mb-0 fw-bold">${highlightSearchTerm(description, searchTerm)}</h6>
                </div>
                <p class="card-text text-muted mb-1">Código: ${highlightSearchTerm(code, searchTerm)}</p>
                <div class="d-flex justify-content-end mt-2">
                    <button class="btn btn-sm btn-primary select-reference">
                        <i class="fas fa-check me-1"></i>Seleccionar
                    </button>
                </div>
            </div>
        `;
        
        // Agregar evento para seleccionar esta referencia
        card.querySelector('.select-reference').addEventListener('click', function() {
            selectReference(value, code);
            
            // Cerrar modal
            const modal = bootstrap.Modal.getInstance(searchReferenceModal);
            if (modal) modal.hide();
        });
        
        // Agregar tarjeta a la columna y la columna a la fila
        col.appendChild(card);
        row.appendChild(col);
    });
}

/**
 * Selecciona una referencia y actualiza el código de producto
 * @param {string} referenceValue - Valor de la referencia a seleccionar
 * @param {string} codeValue - Código del producto correspondiente
 */
function selectReference(referenceValue, codeValue) {
    const referenceSelect = document.getElementById('reference');
    const productCodeInput = document.getElementById('product_code');
    
    if (!referenceSelect || !productCodeInput) return;
    
    // Buscar la opción correspondiente
    const options = Array.from(referenceSelect.options);
    const optionIndex = options.findIndex(opt => opt.value === referenceValue);
    
    if (optionIndex > -1) {
        // Seleccionar la opción
        referenceSelect.selectedIndex = optionIndex;
        
        // Actualizar el código de producto
        productCodeInput.value = codeValue;
        
        // Disparar evento de cambio para que otras funciones puedan responder
        referenceSelect.dispatchEvent(new Event('change'));
        
        // Mostrar mensaje de éxito
        showToast('success', 'Referencia seleccionada', 'top-end', 2000);
    }
}
