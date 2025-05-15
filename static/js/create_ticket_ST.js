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
        // y reemplazar comas por puntos para manejar números decimales
        const cleanNumber = number.replace(/\./g, '').replace(',', '.');
        number = parseFloat(cleanNumber) || 0;
    }
    
    // Manejar números decimales correctamente
    const parts = number.toString().split('.');
    const integerPart = parts[0];
    const decimalPart = parts.length > 1 ? ',' + parts[1] : '';
    
    // Formatear usando el formato colombiano (punto como separador de miles)
    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    
    return formattedInteger + decimalPart;
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
    
    // Manejar números con parte decimal (coma como separador decimal)
    const parts = strValue.split(',');
    
    // Eliminar todos los puntos (separadores de miles) de la parte entera
    const integerPart = parts[0].replace(/\./g, '');
    
    // Reconstruir el número con punto como separador decimal para JavaScript
    const cleanNumber = parts.length > 1 ? `${integerPart}.${parts[1]}` : integerPart;
    
    return parseFloat(cleanNumber) || 0;
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

    try {
        // Formatear valor
        const value = input.value;
        
        // Determinar si tiene coma decimal
        const hasDecimal = value.includes(',');
        const parts = value.split(',');
        const integerPart = parts[0].replace(/[^\d]/g, '');
        const decimalPart = hasDecimal && parts.length > 1 ? parts[1].replace(/[^\d]/g, '') : '';
        
        if (integerPart) {
            // Formatear parte entera
            const formattedInteger = formatNumberWithThousands(integerPart);
            // Reconstruir el valor con la parte decimal si existe
            input.value = hasDecimal ? `${formattedInteger},${decimalPart}` : formattedInteger;
        } else {
            input.value = hasDecimal ? `0,${decimalPart}` : '0';
        }
        
        // Reposicionar cursor
        const newLength = input.value.length;
        const cursorAdjust = newLength - originalLength;
        
        if (document.activeElement === input) {
            input.setSelectionRange(start + cursorAdjust, end + cursorAdjust);
        }
    } catch (error) {
        console.error('Error al formatear número:', error);
        // En caso de error, asegurar un valor por defecto
        input.value = input.value || '0';
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

    // Definir campos select y sus reglas de validación
    const selectFields = [
        {
            id: 'technical_name',
            required: false,
            errorMsg: 'Seleccione un técnico'
        },
        {
            id: 'city',
            required: true,
            errorMsg: 'Seleccione una ciudad'
        },
        {
            id: 'priority',
            required: true,
            errorMsg: 'Seleccione una prioridad'
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
                    removePartRow(this.closest('tr'));
                });
            }
        }
    });
    
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
                removePartRow(this.closest('tr'));
            });
        }

        // Actualizar totales iniciales
        updateRowTotal(row);
    });

    // Configurar el modal de búsqueda de repuestos
    setupSearchPartsModal();
}

/**
 * Remueve una fila de repuesto con confirmación
 * @param {HTMLElement} row - Fila a eliminar
 */
function removePartRow(row) {
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
            const partsTable = document.getElementById('partsTable');
            const remainingRows = partsTable.querySelectorAll('tbody .part-row');
            
            if (noPartsRow && remainingRows.length === 0) {
                noPartsRow.style.display = '';
            }
            
            // Actualizar índices y totales
            updateRowIndices();
            updatePartsTotals();
        }
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
        try {
            const quantity = parseInt(quantityInput.value) || 0;
            const unitValue = unformatNumber(unitValueInput.value) || 0;
            const total = quantity * unitValue;

            totalValueInput.value = formatNumberWithThousands(total);
            
            // Actualizar el total de repuestos
            updatePartsTotals();
        } catch (e) {
            console.error('Error actualizando totales de fila:', e);
            totalValueInput.value = '0'; // Valor por defecto en caso de error
        }
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
    
    try {
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
        
        console.log(`Totales actualizados: Servicio=${unformatNumber(serviceValueInput.value)}, Repuestos=${totalPartsValue}, Total=${unformatNumber(totalInput.value)}`);
    } catch (e) {
        console.error('Error actualizando totales:', e);
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
 * Configura el modal de búsqueda de repuestos
 */
function setupSearchPartsModal() {
    const modalPartSearch = document.getElementById('modalPartSearch');
    const searchPartsModal = document.getElementById('searchPartsModal');
    
    if (!searchPartsModal) {
        console.error("Modal de búsqueda de repuestos no encontrado");
        return;
    }

    // Configurar el evento de mostrar el modal
    searchPartsModal.addEventListener('shown.bs.modal', function() {
        if (modalPartSearch) {
            modalPartSearch.value = '';
            modalPartSearch.focus();
        }
        
        // Restablecer estado inicial del modal
        const initialSearchMessage = document.getElementById('initialSearchMessage');
        const searchResultsLoader = document.getElementById('searchResultsLoader');
        const noResultsMessage = document.getElementById('noResultsMessage');
        const searchResultsList = document.getElementById('searchResultsList');
        
        if (initialSearchMessage) initialSearchMessage.style.display = 'block';
        if (searchResultsLoader) searchResultsLoader.style.display = 'none';
        if (noResultsMessage) noResultsMessage.style.display = 'none';
        if (searchResultsList) {
            searchResultsList.style.display = 'none';
            searchResultsList.innerHTML = '';
        }
    });
    
    // Configurar la búsqueda al escribir
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
}

/**
 * Busca repuestos según el término proporcionado
 * @param {string} searchTerm - Término de búsqueda
 */
function searchParts(searchTerm) {
    // Referencias a elementos del DOM
    const initialSearchMessage = document.getElementById('initialSearchMessage');
    const searchResultsLoader = document.getElementById('searchResultsLoader');
    const noResultsMessage = document.getElementById('noResultsMessage');
    const searchResultsList = document.getElementById('searchResultsList');
    
    if (!searchResultsLoader || !initialSearchMessage || !noResultsMessage || !searchResultsList) {
        console.error("Faltan elementos del modal de búsqueda");
        return;
    }
    
    // Ocultar mensajes y mostrar loader
    initialSearchMessage.style.display = 'none';
    noResultsMessage.style.display = 'none';
    searchResultsLoader.style.display = 'block';
    searchResultsList.style.display = 'none';
    searchResultsList.innerHTML = '';
    
    // Realizar la petición AJAX
    fetch('/search_spare_parts', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-Requested-With': 'XMLHttpRequest'
        },
        body: new URLSearchParams({
            'search': searchTerm
        })
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
        
        // Verificar si hay resultados
        if (!data.parts || data.parts.length === 0) {
            noResultsMessage.style.display = 'block';
            return;
        }
        
        // Mostrar resultados
        searchResultsList.style.display = 'block';
        searchResultsList.innerHTML = '';
        
        // Contador de resultados
        const resultCount = document.createElement('div');
        resultCount.className = 'col-12 mb-2';
        resultCount.innerHTML = `<small class="text-muted">Se encontraron ${data.parts.length} repuestos</small>`;
        searchResultsList.appendChild(resultCount);
        
        // Crear grid para los resultados
        const row = document.createElement('div');
        row.className = 'row g-3';
        searchResultsList.appendChild(row);
        
        // Agregar cada repuesto como una tarjeta
        data.parts.forEach(part => {
            const col = document.createElement('div');
            col.className = 'col-md-6 mb-2';
            
            // Crear tarjeta para el repuesto
            const card = document.createElement('div');
            card.className = 'card h-100 shadow-sm part-card';
            
            // Contenido de la tarjeta
            card.innerHTML = `
                <div class="card-body p-3">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <h6 class="card-title mb-0 fw-bold">${highlightSearchTerm(part.description, searchTerm)}</h6>
                        <span class="badge bg-primary ms-2">Cód: ${highlightSearchTerm(part.code, searchTerm)}</span>
                    </div>
                    <div class="d-flex justify-content-between align-items-center mt-2">
                        <span class="text-success fw-bold">${part.price && part.price != '0' ? '$' + formatNumberWithThousands(part.price) : ''}</span>
                        <button class="btn btn-sm btn-primary select-result">
                            <i class="fas fa-check me-1"></i>Seleccionar
                        </button>
                    </div>
                </div>
            `;
            
            // Agregar datos al elemento
            card.dataset.code = part.code;
            card.dataset.description = part.description;
            card.dataset.price = part.price || '0';
            
            // Evento para seleccionar el repuesto
            card.querySelector('.select-result').addEventListener('click', function() {
                selectPartAndUpdateRow({
                    code: part.code,
                    description: part.description,
                    price: part.price || '0'
                });
                
                // Cerrar modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('searchPartsModal'));
                if (modal) modal.hide();
            });
            
            // Agregar a la columna y fila
            col.appendChild(card);
            row.appendChild(col);
        });
        
        // Agregar estilos para destacar términos de búsqueda si no existen
        if (!document.getElementById('highlight-styles')) {
            const style = document.createElement('style');
            style.id = 'highlight-styles';
            style.textContent = `
                .highlight {
                    background-color: #fff3cd;
                    padding: 0 2px;
                    border-radius: 2px;
                }
                .part-card {
                    transition: all 0.2s ease;
                }
                .part-card:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 0.5rem 1rem rgba(0,0,0,0.15) !important;
                }
            `;
            document.head.appendChild(style);
        }
    })
    .catch(error => {
        console.error('Error al buscar repuestos:', error);
        
        // Ocultar loader y mostrar mensaje de error
        searchResultsLoader.style.display = 'none';
        noResultsMessage.style.display = 'block';
        noResultsMessage.innerHTML = `
            <div class="text-center">
                <i class="fas fa-exclamation-triangle text-danger fa-3x mb-3"></i>
                <h5 class="text-danger">Error al buscar repuestos</h5>
                <p class="text-muted mb-0">${error.message}</p>
            </div>
        `;
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

    // Inicializar búsqueda de productos para referencia
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
    
    // Verificar si venimos de un error anterior
    checkForErrorParams();
    
    // Configurar confirmación al enviar el formulario
    const ticketForm = document.getElementById('ticket-form');
    if (ticketForm) {
        ticketForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Limpiar status y errores anteriores
            updateFormStatus('none');
            updateValidationSummary([], false);
            
            // Validar el formulario antes de mostrar la confirmación
            const isValid = validateForm();
            
            if (isValid) {
                // Recopilar todos los datos del formulario para mostrarlos en consola
                logFormData(this);
                
                Swal.fire({
                    title: '¿Crear ticket?',
                    text: "¿Está seguro que desea crear este ticket?",
                    icon: 'question',
                    showCancelButton: true,
                    confirmButtonColor: '#3085d6',
                    cancelButtonColor: '#d33',
                    confirmButtonText: 'Sí, crear ticket',
                    cancelButtonText: 'Cancelar'
                }).then((result) => {
                    if (result.isConfirmed) {
                        // Mostrar indicador de estado
                        updateFormStatus('processing', 'Enviando datos, por favor espere...');
                        
                        // Submit del formulario
                        setTimeout(() => {
                            ticketForm.submit();
                        }, 500); // Pequeño retraso para que se vea el estado
                    }
                });
            } else {
                Swal.fire({
                    title: 'Error de validación',
                    text: 'Por favor corrija los errores señalados antes de continuar',
                    icon: 'error',
                    confirmButtonText: 'Entendido'
                });
            }
        });
    }
    
    console.log("Componentes de servicio técnico inicializados correctamente");
});

/**
 * Verifica si hay parámetros de error en la URL y muestra mensajes adecuados
 */
function checkForErrorParams() {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Verificar si hay error desde el backend
    if (urlParams.has('error')) {
        const errorType = urlParams.get('error');
        let errorMessage = 'Ha ocurrido un error al crear el ticket.';
        
        switch (errorType) {
            case 'validation':
                errorMessage = 'Hay campos con información inválida. Por favor revise el formulario.';
                break;
            case 'server':
                errorMessage = 'Error en el servidor. Por favor contacte al administrador.';
                break;
            case 'client':
                errorMessage = 'Error al crear o actualizar el cliente.';
                break;
            case 'ticket':
                errorMessage = 'Error al crear el ticket. Verifique todos los datos.';
                break;
            case 'spares':
                errorMessage = 'Error al procesar los repuestos. Verifique cantidades y valores.';
                break;
        }
        
        // Mostrar mensaje de error
        updateFormStatus('error', errorMessage);
        
        // Si hay detalle de error, mostrarlo también
        if (urlParams.has('error_detail')) {
            const errorDetails = decodeURIComponent(urlParams.get('error_detail'));
            const errors = [errorDetails];
            updateValidationSummary(errors, true);
        }
    }
}

/**
 * Muestra u oculta el resumen de validación con todos los errores encontrados
 * @param {Array} errors - Array de mensajes de error
 * @param {boolean} show - Si se debe mostrar (true) u ocultar (false)
 */
function updateValidationSummary(errors = [], show = true) {
    const validationSummary = document.getElementById('validation-summary');
    const errorsList = document.getElementById('validation-errors');
    
    if (!validationSummary || !errorsList) return;
    
    if (show && errors.length > 0) {
        // Limpiar lista anterior
        errorsList.innerHTML = '';
        
        // Añadir cada error como un elemento de lista
        errors.forEach(error => {
            const li = document.createElement('li');
            li.textContent = error;
            errorsList.appendChild(li);
        });
        
        // Mostrar el sumario de validación
        validationSummary.style.display = 'block';
        
        // Hacer scroll hacia el sumario
        validationSummary.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
        // Ocultar el sumario
        validationSummary.style.display = 'none';
    }
}

/**
 * Actualiza el área de estado del formulario
 * @param {string} status - Estado actual ('processing', 'success', 'error')
 * @param {string} message - Mensaje descriptivo
 */
function updateFormStatus(status, message) {
    const statusArea = document.getElementById('form-status-area');
    const statusTitle = document.getElementById('form-status-title');
    const statusMessage = document.getElementById('form-status-message');
    const spinner = document.getElementById('form-status-spinner');
    
    if (!statusArea || !statusTitle || !statusMessage) return;
    
    switch (status) {
        case 'processing':
            statusArea.style.display = 'block';
            statusTitle.textContent = 'Procesando información';
            statusMessage.textContent = message || 'Por favor, espere mientras se procesa la información...';
            statusTitle.className = 'mb-1';
            if (spinner) spinner.style.display = 'block';
            break;
        case 'success':
            statusArea.style.display = 'block';
            statusTitle.textContent = '¡Operación exitosa!';
            statusMessage.textContent = message || 'El ticket ha sido creado correctamente.';
            statusTitle.className = 'mb-1 text-success';
            if (spinner) spinner.style.display = 'none';
            break;
        case 'error':
            statusArea.style.display = 'block';
            statusTitle.textContent = 'Error en la operación';
            statusMessage.textContent = message || 'Ha ocurrido un error al procesar la información.';
            statusTitle.className = 'mb-1 text-danger';
            if (spinner) spinner.style.display = 'none';
            break;
        default:
            statusArea.style.display = 'none';
    }
}

/**
 * Registra en consola todos los datos del formulario para depuración
 * @param {HTMLFormElement} form - El formulario a evaluar
 */
function logFormData(form) {
    if (!form) return;
    
    const formData = new FormData(form);
    const formDataObj = {};
    
    // Extraer datos básicos
    formData.forEach((value, key) => {
        // Si ya existe esta clave y es un array, añadir el valor
        if (key.endsWith('[]')) {
            const cleanKey = key.slice(0, -2);
            if (!formDataObj[cleanKey]) {
                formDataObj[cleanKey] = [];
            }
            formDataObj[cleanKey].push(value);
        } else {
            formDataObj[key] = value;
        }
    });
    
    // Mostrar datos importantes de manera más clara
    console.group('DATOS DEL FORMULARIO A ENVIAR:');
    
    // Sección cliente
    console.group('Datos del Cliente:');
    console.log('Documento:', formDataObj.document);
    console.log('Nombres:', formDataObj.client_names);
    console.log('Apellidos:', formDataObj.client_lastnames);
    console.log('Email:', formDataObj.mail);
    console.log('Teléfono:', formDataObj.phone);
    console.groupEnd();
    
    // Sección ticket
    console.group('Datos del Ticket:');
    console.log('Técnico:', formDataObj.technical_name);
    console.log('Documento Técnico:', formDataObj.technical_document);
    console.log('Estado:', formDataObj.state);
    console.log('Ciudad:', formDataObj.city);
    console.log('Prioridad:', formDataObj.priority);
    console.log('Referencia:', formDataObj.reference);
    console.log('Código Producto:', formDataObj.product_code);
    console.log('IMEI:', formDataObj.IMEI);
    console.groupEnd();
    
    // Problemas
    console.group('Problemas Seleccionados:');
    const problemCheckboxes = document.querySelectorAll('.problem-checkbox:checked');
    problemCheckboxes.forEach(cb => {
        const label = document.querySelector(`label[for="${cb.id}"]`);
        console.log(`- ${label ? label.textContent.trim() : cb.value}`);
    });
    console.groupEnd();
    
    // Valores 
    console.group('Valores Financieros:');
    console.log('Valor Servicio:', formDataObj.service_value, '→', unformatNumber(formDataObj.service_value));
    console.log('Valor Repuestos:', formDataObj.spare_value, '→', unformatNumber(formDataObj.spare_value));
    console.log('Total:', formDataObj.total, '→', unformatNumber(formDataObj.total));
    console.groupEnd();
    
    // Repuestos
    console.group('Repuestos:');
    const sparePartCodes = formData.getAll('spare_part_code[]');
    const quantities = formData.getAll('part_quantity[]');
    const unitPrices = formData.getAll('part_unit_value[]');
    const totalPrices = formData.getAll('part_total_value[]');
    
    if (sparePartCodes.length > 0) {
        for (let i = 0; i < sparePartCodes.length; i++) {
            if (sparePartCodes[i]) {
                console.group(`Repuesto #${i+1}`);
                console.log('Código:', sparePartCodes[i]);
                console.log('Cantidad:', quantities[i]);
                console.log('Valor Unitario:', unitPrices[i], '→', unformatNumber(unitPrices[i]));
                console.log('Valor Total:', totalPrices[i], '→', unformatNumber(totalPrices[i]));
                console.groupEnd();
            }
        }
    } else {
        console.log('No hay repuestos');
    }
    console.groupEnd();
    
    console.groupEnd();
}

/**
 * Configura la búsqueda de productos para el campo de referencia
 */
function setupReferenceSearch() {
    // Configurar botón de búsqueda de productos
    const searchReferenceBtn = document.getElementById('searchReferenceBtn');
    if (searchReferenceBtn) {
        searchReferenceBtn.addEventListener('click', function() {
            // Mostrar el modal de búsqueda de productos
            const searchProductsModal = new bootstrap.Modal(document.getElementById('searchProductsModal'));
            if (searchProductsModal) {
                searchProductsModal.show();
            } else {
                console.error("Modal de búsqueda de productos no encontrado");
            }
        });
    }

    // Configurar el modal de búsqueda de productos
    const searchProductsModal = document.getElementById('searchProductsModal');
    if (searchProductsModal) {
        searchProductsModal.addEventListener('shown.bs.modal', function() {
            const modalProductSearch = document.getElementById('modalProductSearch');
            if (modalProductSearch) {
                modalProductSearch.value = '';
                modalProductSearch.focus();
            }
            
            // Restablecer estado inicial del modal
            const initialProductSearchMessage = document.getElementById('initialProductSearchMessage');
            const productSearchResultsLoader = document.getElementById('productSearchResultsLoader');
            const noProductResultsMessage = document.getElementById('noProductResultsMessage');
            const productSearchResultsList = document.getElementById('productSearchResultsList');
            
            if (initialProductSearchMessage) initialProductSearchMessage.style.display = 'block';
            if (productSearchResultsLoader) productSearchResultsLoader.style.display = 'none';
            if (noProductResultsMessage) noProductResultsMessage.style.display = 'none';
            if (productSearchResultsList) productSearchResultsList.style.display = 'none';
        });
    }

    // Configurar la búsqueda de productos
    const modalProductSearch = document.getElementById('modalProductSearch');
    if (modalProductSearch) {
        modalProductSearch.addEventListener('input', function() {
            const searchTerm = this.value.trim();
            if (searchTerm.length >= 3) {
                searchProducts(searchTerm);
            } else {
                const initialProductSearchMessage = document.getElementById('initialProductSearchMessage');
                const productSearchResultsLoader = document.getElementById('productSearchResultsLoader');
                const noProductResultsMessage = document.getElementById('noProductResultsMessage');
                const productSearchResultsList = document.getElementById('productSearchResultsList');
                
                if (initialProductSearchMessage) initialProductSearchMessage.style.display = 'block';
                if (productSearchResultsLoader) productSearchResultsLoader.style.display = 'none';
                if (noProductResultsMessage) noProductResultsMessage.style.display = 'none';
                if (productSearchResultsList) {
                    productSearchResultsList.style.display = 'none';
                    productSearchResultsList.innerHTML = '';
                }
            }
        });
    }

    // Configurar botón para limpiar búsqueda
    const clearProductSearch = document.getElementById('clearProductSearch');
    if (clearProductSearch && modalProductSearch) {
        clearProductSearch.addEventListener('click', function() {
            modalProductSearch.value = '';
            modalProductSearch.focus();
            
            const initialProductSearchMessage = document.getElementById('initialProductSearchMessage');
            const productSearchResultsLoader = document.getElementById('productSearchResultsLoader');
            const noProductResultsMessage = document.getElementById('noProductResultsMessage');
            const productSearchResultsList = document.getElementById('productSearchResultsList');
            
            if (initialProductSearchMessage) initialProductSearchMessage.style.display = 'block';
            if (productSearchResultsLoader) productSearchResultsLoader.style.display = 'none';
            if (noProductResultsMessage) noProductResultsMessage.style.display = 'none';
            if (productSearchResultsList) {
                productSearchResultsList.style.display = 'none';
                productSearchResultsList.innerHTML = '';
            }
        });
    }
}

/**
 * Busca productos según el término proporcionado
 * @param {string} searchTerm - Término de búsqueda
 */
function searchProducts(searchTerm) {
    // Referencias a elementos del DOM
    const initialProductSearchMessage = document.getElementById('initialProductSearchMessage');
    const productSearchResultsLoader = document.getElementById('productSearchResultsLoader');
    const noProductResultsMessage = document.getElementById('noProductResultsMessage');
    const productSearchResultsList = document.getElementById('productSearchResultsList');

    if (!productSearchResultsLoader || !initialProductSearchMessage || !noProductResultsMessage || !productSearchResultsList) {
        console.error("Faltan elementos del modal de búsqueda de productos");
        return;
    }

    // Ocultar mensajes y mostrar loader
    initialProductSearchMessage.style.display = 'none';
    noProductResultsMessage.style.display = 'none';
    productSearchResultsLoader.style.display = 'block';
    productSearchResultsList.style.display = 'none';
    productSearchResultsList.innerHTML = '';

    // Realizar la petición AJAX
    fetch('/search_products', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-Requested-With': 'XMLHttpRequest'
        },
        body: new URLSearchParams({
            'search': searchTerm
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        return response.json();
    })
    .then(data => {
        // Ocultar loader
        productSearchResultsLoader.style.display = 'none';
        
        // Verificar si hay resultados
        if (!data.products || data.products.length === 0) {
            noProductResultsMessage.style.display = 'block';
            return;
        }
        
        // Mostrar resultados
        productSearchResultsList.style.display = 'block';
        productSearchResultsList.innerHTML = '';
        
        // Contador de resultados
        const resultCount = document.createElement('div');
        resultCount.className = 'col-12 mb-2';
        resultCount.innerHTML = `<small class="text-muted">Se encontraron ${data.products.length} productos</small>`;
        productSearchResultsList.appendChild(resultCount);
        
        // Crear grid para los resultados
        const row = document.createElement('div');
        row.className = 'row g-3';
        productSearchResultsList.appendChild(row);
        
        // Agregar cada producto como una tarjeta
        data.products.forEach(product => {
            const col = document.createElement('div');
            col.className = 'col-md-6 mb-2';
            
            // Crear tarjeta para el producto
            const card = document.createElement('div');
            card.className = 'card h-100 shadow-sm product-card';
            
            // Contenido de la tarjeta
            card.innerHTML = `
                <div class="card-body py-2">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <h6 class="mb-1">${highlightSearchTerm(product.CODIGO, searchTerm)} - ${highlightSearchTerm(product.DESCRIPCIO, searchTerm)}</h6>
                        </div>
                        <button class="btn btn-sm btn-primary select-product">
                            <i class="fas fa-check me-1"></i>Seleccionar
                        </button>
                    </div>
                </div>
            `;
            
            // Agregar datos al elemento
            card.dataset.code = product.CODIGO;
            card.dataset.description = product.DESCRIPCIO;
            
            // Evento para seleccionar el producto
            card.querySelector('.select-product').addEventListener('click', function() {
                selectProduct(product.CODIGO, product.DESCRIPCIO);
                
                // Cerrar modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('searchProductsModal'));
                if (modal) modal.hide();
            });
            
            // Agregar a la columna y fila
            col.appendChild(card);
            row.appendChild(col);
        });
    })
    .catch(error => {
        console.error('Error al buscar productos:', error);
        
        // Ocultar loader y mostrar mensaje de error
        productSearchResultsLoader.style.display = 'none';
        noProductResultsMessage.style.display = 'block';
        noProductResultsMessage.innerHTML = `
            <div class="text-center">
                <i class="fas fa-exclamation-triangle text-danger fa-3x mb-3"></i>
                <h5 class="text-danger">Error al buscar productos</h5>
                <p class="text-muted mb-0">${error.message}</p>
            </div>
        `;
    });
}

/**
 * Selecciona un producto y actualiza los campos correspondientes
 * @param {string} code - Código del producto
 * @param {string} description - Descripción del producto
 */
function selectProduct(code, description) {
    const referenceInput = document.getElementById('reference');
    const productCodeInput = document.getElementById('product_code');
    
    if (referenceInput) referenceInput.value = description;
    if (productCodeInput) productCodeInput.value = code;
    
    // Mostrar notificación de éxito
    showToast('success', 'Producto seleccionado', 'top-end', 2000);
}

/**
 * Valida el formulario antes de enviarlo
 * @returns {boolean} - Verdadero si el formulario es válido
 */
function validateForm() {
    console.log("Validando formulario...");
    
    let isValid = true;
    let firstInvalidField = null;
    let validationErrors = [];
    
    // Validar campos obligatorios
    const requiredFields = [
        { id: 'document', message: 'El documento del cliente es obligatorio' },
        { id: 'client_names', message: 'El nombre del cliente es obligatorio' },
        { id: 'client_lastnames', message: 'El apellido del cliente es obligatorio' },
        { id: 'mail', message: 'El correo electrónico es obligatorio' },
        { id: 'city', message: 'La ciudad es obligatoria' },
        { id: 'priority', message: 'La prioridad es obligatoria' },
        { id: 'reference', message: 'La referencia del producto es obligatoria' }
    ];
    
    // Validar cada campo obligatorio
    requiredFields.forEach(field => {
        const element = document.getElementById(field.id);
        if (element && (!element.value || element.value.trim() === '')) {
            showValidationError(element, field.message);
            isValid = false;
            validationErrors.push(field.message);
            if (!firstInvalidField) {
                firstInvalidField = element;
            }
        } else {
            removeValidationError(element);
        }
    });
    
    // Validar formato de email
    const mailInput = document.getElementById('mail');
    if (mailInput && mailInput.value.trim() && !validateEmail(mailInput.value.trim())) {
        showValidationError(mailInput, 'Ingrese un correo electrónico válido');
        isValid = false;
        validationErrors.push('Correo electrónico inválido');
        if (!firstInvalidField) {
            firstInvalidField = mailInput;
        }
    }
    
    // Validar IMEI si está presente
    const imeiInput = document.getElementById('IMEI');
    if (imeiInput && imeiInput.value.trim() && !validateIMEI(imeiInput.value.trim())) {
        showValidationError(imeiInput, 'El IMEI debe tener exactamente 15 dígitos numéricos');
        isValid = false;
        validationErrors.push('IMEI inválido');
        if (!firstInvalidField) {
            firstInvalidField = imeiInput;
        }
    }
    
    // Validar que se haya seleccionado al menos un problema
    const problemCheckboxes = document.querySelectorAll('.problem-checkbox:checked');
    if (problemCheckboxes.length === 0) {
        const problemsContainer = document.querySelector('.form-check-container');
        if (problemsContainer) {
            problemsContainer.classList.add('border-danger');
            const problemsLabel = document.querySelector('label[for="selected_problems"]');
            if (problemsLabel) {
                problemsLabel.classList.add('text-danger');
                problemsLabel.textContent = 'Debe seleccionar al menos un problema';
            }
            isValid = false;
            validationErrors.push('No se han seleccionado problemas');
            if (!firstInvalidField) {
                firstInvalidField = problemsContainer;
            }
        }
    } else {
        const problemsContainer = document.querySelector('.form-check-container');
        if (problemsContainer) {
            problemsContainer.classList.remove('border-danger');
            const problemsLabel = document.querySelector('label[for="selected_problems"]');
            if (problemsLabel) {
                problemsLabel.classList.remove('text-danger');
                problemsLabel.textContent = 'Problemas Seleccionados:';
            }
        }
    }
    
    // Validar valores numéricos
    const serviceValueInput = document.getElementById('service_value');
    if (serviceValueInput) {
        try {
            const serviceValue = unformatNumber(serviceValueInput.value);
            if (isNaN(serviceValue) || serviceValue < 0) {
                showValidationError(serviceValueInput, 'El valor del servicio debe ser un número positivo');
                isValid = false;
                validationErrors.push('Valor de servicio inválido');
                if (!firstInvalidField) firstInvalidField = serviceValueInput;
            } else {
                removeValidationError(serviceValueInput);
            }
        } catch (e) {
            console.error('Error validando valor de servicio:', e);
            showValidationError(serviceValueInput, 'Error al procesar el valor');
            isValid = false;
            validationErrors.push('Error en valor de servicio');
            if (!firstInvalidField) firstInvalidField = serviceValueInput;
        }
    }
    
    // Validar que los repuestos tengan datos válidos si existen
    const partRows = document.querySelectorAll('#partsTable tbody .part-row');
    partRows.forEach((row, index) => {
        const codeSelect = row.querySelector('select[name="spare_part_code[]"]');
        const quantityInput = row.querySelector('input[name="part_quantity[]"]');
        const unitPriceInput = row.querySelector('input[name="part_unit_value[]"]');
        
        // Si hay un código seleccionado, validar cantidad y precio unitario
        if (codeSelect && codeSelect.value) {
            if (quantityInput && (isNaN(parseInt(quantityInput.value)) || parseInt(quantityInput.value) <= 0)) {
                showValidationError(quantityInput, 'La cantidad debe ser mayor a 0');
                isValid = false;
                validationErrors.push(`Cantidad inválida en repuesto ${index + 1}`);
                if (!firstInvalidField) firstInvalidField = quantityInput;
            }
            
            if (unitPriceInput) {
                try {
                    const unitPrice = unformatNumber(unitPriceInput.value);
                    if (isNaN(unitPrice) || unitPrice < 0) {
                        showValidationError(unitPriceInput, 'El precio unitario debe ser un valor positivo');
                        isValid = false;
                        validationErrors.push(`Precio unitario inválido en repuesto ${index + 1}`);
                        if (!firstInvalidField) firstInvalidField = unitPriceInput;
                    }
                } catch (e) {
                    console.error('Error validando precio unitario:', e);
                    showValidationError(unitPriceInput, 'Error al procesar el valor');
                    isValid = false;
                    validationErrors.push(`Error en precio de repuesto ${index + 1}`);
                    if (!firstInvalidField) firstInvalidField = unitPriceInput;
                }
            }
        }
    });
    
    // Actualizar resumen de validación
    updateValidationSummary(validationErrors, !isValid);
    
    // Si hay campos inválidos, hacer scroll al primero
    if (firstInvalidField) {
        firstInvalidField.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    
    // Mostrar resumen de errores en consola
    if (!isValid) {
        console.group('Errores de validación:');
        validationErrors.forEach(error => console.error(`- ${error}`));
        console.groupEnd();
    } else {
        console.log('Formulario validado correctamente');
    }
    
    return isValid;
}

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
            try {
                if (!this.value || this.value === '0') {
                    this.value = '0';
                } else {
                    // Permitir valores decimales con coma
                    const value = unformatNumber(this.value);
                    this.value = formatNumberWithThousands(value);
                }
                updatePartsTotals();
            } catch (e) {
                console.error('Error formateando valor al perder foco:', e);
                this.value = '0'; // Valor por defecto en caso de error
                updatePartsTotals();
            }
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
