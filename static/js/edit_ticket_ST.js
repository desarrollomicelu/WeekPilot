/***************************************************
 * edit_ticket_ST.js
 * Funciones y validaciones para la edición de tickets de servicio técnico
 ***************************************************/

/***** SECCIÓN 1: FUNCIONES UTILITARIAS *****/

/**
 * Muestra un toast (notificación pequeña) usando SweetAlert2.
 * @param {string} icon - Tipo de ícono ('success', 'error', 'info', etc.).
 * @param {string} title - Texto a mostrar.
 * @param {string} [position='top-end'] - Posición en la pantalla.
 * @param {number} [timer=3000] - Tiempo en milisegundos.
 */
function showToast(icon, title, position = 'top-end', timer = 3000) {
    // Definir colores según el tipo de notificación
    let iconColor = '#3085d6'; // Color azul por defecto
    
    if (icon === 'success') {
        iconColor = '#28a745'; // Verde para éxito
    } else if (icon === 'error') {
        iconColor = '#dc3545'; // Rojo para error
    } else if (icon === 'warning') {
        iconColor = '#ffc107'; // Amarillo para advertencia
    } else if (icon === 'info') {
        iconColor = '#17a2b8'; // Celeste para información
    }
    
    const Toast = Swal.mixin({
        toast: true,
        position: position,
        showConfirmButton: false,
        timer: timer,
        timerProgressBar: true,
        iconColor: iconColor,
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
}

/**
 * Muestra una alerta de éxito (usada tras actualizar un ticket).
 */
function showSuccessUpdateAlert() {
    Swal.fire({
        icon: 'success',
        title: '¡Actualizado con éxito!',
        text: 'Los cambios han sido guardados correctamente.',
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
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
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

/***** SECCIÓN 2: FUNCIONES DE VALIDACIÓN *****/

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
            select.addEventListener('change', function () {
                if (fieldInfo.required && (!this.value || this.value === '')) {
                    showValidationError(this, fieldInfo.errorMsg);
                } else {
                    removeValidationError(this);
                }
            });

            // Para select2, necesitamos un evento adicional
            if ($(select).data('select2')) {
                $(select).on('select2:select select2:unselect', function () {
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
    validatePartsTable();
}

/**
 * Configura la relación entre el técnico seleccionado y su documento
 * Actualiza automáticamente el documento cuando cambia el técnico
 */
function setupTechnicianDocumentRelation() {
    // Obtener referencias a los elementos del DOM
    const technicianSelect = document.getElementById('technical_name');
    const technicianDocumentInput = document.getElementById('technical_document');
    const stateInput = document.getElementById('state');
    
    // Verificar que los elementos existen
    if (!technicianSelect || !technicianDocumentInput || !stateInput) {
        console.error("No se encontraron los elementos necesarios para la relación técnico-documento");
        return;
    }
    
    // Crear un mapa de técnicos para acceso rápido (opcional, para respaldo)
    const technicianMap = {};
    Array.from(technicianSelect.options).forEach(option => {
        if (option.value) {
            technicianMap[option.value] = option.getAttribute('data-document') || '';
        }
    });
    
    /**
     * Actualiza el documento del técnico basado en la selección actual
     */
    function updateTechnicianDocument() {
        const selectedOption = technicianSelect.options[technicianSelect.selectedIndex];
        
        if (selectedOption && selectedOption.value) {
            // Obtener el documento del atributo data-document
            let document = selectedOption.getAttribute('data-document');
            
            // Si no se encuentra en el atributo, intentar obtenerlo del mapa
            if (!document || document.trim() === '') {
                document = technicianMap[selectedOption.value] || '';
            }
            
            // Actualizar el campo de documento
            if (document && document.trim() !== '') {
                technicianDocumentInput.value = document;
            } else {
                technicianDocumentInput.value = "Sin documento";
                console.warn(`No se encontró documento para el técnico: ${selectedOption.value}`);
            }
            
            // Actualizar el estado a "Asignado"
            stateInput.value = "Asignado";
        } else {
            // Si no hay técnico seleccionado
            technicianDocumentInput.value = "Sin asignar";
            
            // Actualizar el estado a "Sin asignar"
            stateInput.value = "Sin asignar";
        }
    }
    
    // Asignar el evento change al select de técnicos
    technicianSelect.addEventListener('change', function() {
        updateTechnicianDocument();
        
        // Mostrar notificación de cambio
        if (this.value) {
            showToast('info', `Técnico cambiado a: ${this.options[this.selectedIndex].text}`, 'top-end', 2000);
            showToast('info', `Estado cambiado a: Asignado`, 'top-end', 2000);
        } else {
            showToast('info', `Estado cambiado a: Sin asignar`, 'top-end', 2000);
        }
    });
    
    // Ejecutar la actualización de solo el documento al cargar la página
    // (No cambiar el estado, solo actualizar el documento)
    if (technicianSelect.value) {
        const selectedOption = technicianSelect.options[technicianSelect.selectedIndex];
        if (selectedOption && selectedOption.value) {
            // Obtener el documento del atributo data-document
            let document = selectedOption.getAttribute('data-document');
            
            // Si no se encuentra en el atributo, intentar obtenerlo del mapa
            if (!document || document.trim() === '') {
                document = technicianMap[selectedOption.value] || '';
            }
            
            // Actualizar el campo de documento
            if (document && document.trim() !== '') {
                technicianDocumentInput.value = document;
            } else {
                technicianDocumentInput.value = "Sin documento";
                console.warn(`No se encontró documento para el técnico: ${selectedOption.value}`);
            }
        } else {
            technicianDocumentInput.value = "Sin asignar";
        }
    }
    
    // Devolver la función de actualización para uso externo si es necesario
    return { update: updateTechnicianDocument };
}

/**
 * Valida los campos de la tabla de repuestos
 */
function validatePartsTable() {
    const partsTable = document.getElementById('partsTable');
    if (!partsTable) return;

    const rows = partsTable.querySelectorAll('tbody tr.part-row');
    rows.forEach(row => {
        // Validar selección de repuesto
        const partSelect = row.querySelector('select[name="spare_part_code[]"]');
        if (partSelect) {
            partSelect.addEventListener('change', function () {
                if (!this.value || this.value === '') {
                    showValidationError(this, 'Seleccione un repuesto');
                } else {
                    removeValidationError(this);
                }
            });

            // Para select2
            if ($(partSelect).data('select2')) {
                $(partSelect).on('select2:select select2:unselect', function () {
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
            quantityInput.addEventListener('input', function () {
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
            unitValueInput.addEventListener('input', function () {
                const value = unformatNumber(this.value);
                if (isNaN(value) || value <= 0) {
                    showValidationError(this, 'Ingrese un valor válido mayor a 0');
                } else {
                    removeValidationError(this);
                }
            });
        }
    });
}

/***** SECCIÓN 3: FUNCIONES DE GESTIÓN DE REPUESTOS *****/

/**
 * Actualiza los totales (valor de repuestos y total general)
 */
function updateTotals() {
    const spareValueInput = document.getElementById('spare_value');
    const serviceValueInput = document.getElementById('service_value');
    const totalInput = document.getElementById('total');

    if (!spareValueInput || !serviceValueInput || !totalInput) return;

    // Calcular el total de repuestos sumando los valores de cada fila
    let spareTotal = 0;
    document.querySelectorAll('.part-total-value').forEach(input => {
        spareTotal += unformatNumber(input.value);
    });

    // Formatear y asignar el valor total de repuestos
    spareValueInput.value = formatNumberWithThousands(spareTotal);
    // Calcular el total general (servicio + repuestos)
    const serviceValue = unformatNumber(serviceValueInput.value) || 0;
    totalInput.value = formatNumberWithThousands(serviceValue + spareTotal);
}

/**
 * Actualiza el total de una fila de repuesto
 * @param {HTMLElement} row - Fila a actualizar
 */
function editPartTotal(row) {
    const quantityInput = row.querySelector('input[name="part_quantity[]"]');
    const priceInput = row.querySelector('input[name="part_unit_value[]"]');
    const subtotalInput = row.querySelector('input[name="part_total_value[]"]');
    
    if (quantityInput && priceInput && subtotalInput) {
        const quantity = parseInt(quantityInput.value) || 0;
        const price = unformatNumber(priceInput.value) || 0;
        const total = quantity * price;
        
        subtotalInput.value = formatNumberWithThousands(total);
        
        // Actualizar totales generales
        updateTotals();
    }
}

/**
 * Actualiza los índices de las filas de repuestos
 */
function editRowIndices() {
    const partsTable = document.getElementById('partsTable');
    if (!partsTable) return;

    const rows = partsTable.querySelector('tbody').querySelectorAll('.part-row');
    rows.forEach((row, index) => {
        const indexSpan = row.querySelector('.part-index');
        if (indexSpan) {
            indexSpan.textContent = index + 1;
        }
    });
}

/**
 * Elimina una fila de repuesto con confirmación
 * @param {HTMLElement} row - Fila a eliminar
 */
function removePartRow(row) {
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
            const partsTable = document.getElementById('partsTable');
            const partsTableBody = partsTable.querySelector('tbody');

            row.remove();
            editRowIndices();
            updateTotals();

            // Si no quedan filas, mostrar mensaje de "No hay repuestos"
            if (partsTableBody.querySelectorAll('.part-row').length === 0) {
                const emptyRow = document.createElement('tr');
                emptyRow.id = 'noPartsRow';
                emptyRow.innerHTML = '<td colspan="6" class="text-center py-3">No se han agregado repuestos para este servicio.</td>';
                partsTableBody.appendChild(emptyRow);
            }

            showToast('success', 'Repuesto eliminado correctamente', 'top-end');
        }
    });
}

/**
 * Configura los eventos para las filas de repuestos existentes
 * y formatea correctamente los valores numéricos
 */
function setupExistingRows() {
    const partsTable = document.getElementById('partsTable');
    if (!partsTable) return;

    const partsTableBody = partsTable.querySelector('tbody');
    const existingRows = partsTableBody.querySelectorAll('.part-row');

    existingRows.forEach(row => {
        // Obtener referencias a los campos de la fila
        const unitValueInput = row.querySelector('input[name="part_unit_value[]"]');
        const totalValueInput = row.querySelector('input[name="part_total_value[]"]');
        const quantityInput = row.querySelector('input[name="part_quantity[]"]');

        // IMPORTANTE: Formatear correctamente los valores sin multiplicarlos
        if (unitValueInput && unitValueInput.value) {
            unitValueInput.value = formatNumberWithThousands(unitValueInput.value);
        }

        if (totalValueInput && totalValueInput.value) {
            totalValueInput.value = formatNumberWithThousands(totalValueInput.value);
        }

        // Aplicar formato a los campos numéricos para eventos futuros
        applyThousandsFormatting(unitValueInput);

        // Configurar eventos
        if (quantityInput) {
            quantityInput.addEventListener('input', () => editPartTotal(row));
        }
        
        if (unitValueInput) {
            unitValueInput.addEventListener('input', () => editPartTotal(row));
        }
        
        const removeBtn = row.querySelector('.remove-part');
        if (removeBtn) {
            removeBtn.addEventListener('click', () => removePartRow(row));
        }
        
        // Configurar evento para el botón de búsqueda de repuestos
        const searchBtn = row.querySelector('.select-part');
        if (searchBtn) {
            searchBtn.addEventListener('click', function() {
                selectedRow = row;
                const searchModal = new bootstrap.Modal(document.getElementById('searchPartsModal'));
                searchModal.show();
                
                // Limpiar búsqueda anterior
                document.getElementById('modalPartSearch').value = '';
                document.getElementById('initialSearchMessage').style.display = 'block';
                document.getElementById('searchResultsLoader').style.display = 'none';
                document.getElementById('noResultsMessage').style.display = 'none';
                document.getElementById('searchResultsList').style.display = 'none';
                document.getElementById('searchResultsList').innerHTML = '';
            });
        }
    });

    // Actualizar totales iniciales
    updateTotals();
}

/**
 * Agrega una nueva fila de repuesto a la tabla
 */
function addNewPartRow() {
    console.log("Ejecutando addNewPartRow");
    
    // Obtener elementos clave de la tabla
    const partsTable = document.getElementById('partsTable');
    if (!partsTable) {
        console.error("No se encontró la tabla de repuestos");
        return;
    }
    
    const tbody = partsTable.querySelector('tbody');
    const noPartsRow = document.getElementById('noPartsRow');
    
    // Eliminar la fila de "No hay repuestos" si existe
    if (noPartsRow) {
        noPartsRow.remove();
    }
    
    // Clonar el template de fila
    const template = document.getElementById('partRowTemplate');
    if (!template) {
        console.error("No se encontró la plantilla de fila");
        return;
    }
    
    // Crear nueva fila a partir del template
    const newRow = template.content.cloneNode(true).querySelector('tr');
    
    // Agregar la fila al cuerpo de la tabla
    tbody.appendChild(newRow);
    
    // Aplicar formato al campo de valor unitario
    const unitValue = newRow.querySelector('.part-unit-value');
    if (unitValue) {
        applyThousandsFormatting(unitValue);
    }
    
    // Configurar evento para cantidad
    const qtyInput = newRow.querySelector('.part-quantity');
    if (qtyInput) {
        qtyInput.addEventListener('input', function() {
            editPartTotal(newRow);
        });
    }
    
    // Configurar evento para valor unitario
    if (unitValue) {
        unitValue.addEventListener('input', function() {
            editPartTotal(newRow);
        });
    }
    
    // Configurar evento para el botón de eliminar
    const removeBtn = newRow.querySelector('.remove-part');
    if (removeBtn) {
        removeBtn.addEventListener('click', function() {
            removePartRow(newRow);
        });
    }
    
    // Configurar evento para el botón de búsqueda
    const searchBtn = newRow.querySelector('.select-part');
    if (searchBtn) {
        searchBtn.addEventListener('click', function() {
            selectedRow = newRow;
            const searchModal = new bootstrap.Modal(document.getElementById('searchPartsModal'));
            searchModal.show();
            
            // Limpiar búsqueda anterior
            document.getElementById('modalPartSearch').value = '';
            document.getElementById('initialSearchMessage').style.display = 'block';
            document.getElementById('searchResultsLoader').style.display = 'none';
            document.getElementById('noResultsMessage').style.display = 'none';
            document.getElementById('searchResultsList').style.display = 'none';
            document.getElementById('searchResultsList').innerHTML = '';
        });
    }
    
    // Actualizar índices de las filas
    editRowIndices();
    
    // Mostrar mensaje de éxito
    showToast('success', 'Repuesto agregado correctamente', 'top-end');
    
    // Validar la nueva fila
    validatePartsTable();
    
    console.log("Fila de repuesto agregada exitosamente");
}

/***** SECCIÓN 4: FUNCIONES DE GESTIÓN DE PROBLEMAS *****/

/**
 * Actualiza el textarea con los problemas seleccionados
 */
function updateSelectedProblems() {
    const selectedProblemsTextarea = document.getElementById('selected_problems');
    const problemCheckboxes = document.querySelectorAll('.problem-checkbox');

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

/**
 * Configura la funcionalidad de búsqueda de problemas
 */
function setupProblemSearch() {
    const searchProblems = document.getElementById('searchProblems');
    const problemOptions = document.querySelectorAll('.problem-option');

    if (!searchProblems || !problemOptions.length) return;

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

/**
 * Configura los botones de selección de problemas
 */
function setupProblemButtons() {
    const selectAllProblemsBtn = document.getElementById('selectAllProblems');
    const clearProblemsBtn = document.getElementById('clearProblems');
    const problemCheckboxes = document.querySelectorAll('.problem-checkbox');

    if (!problemCheckboxes.length) return;

    // Configurar evento de cambio para cada checkbox
    problemCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', updateSelectedProblems);
    });

    // Inicializar el textarea con los problemas ya seleccionados
    updateSelectedProblems();

    // Configurar botón "Seleccionar Todos"
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

    // Configurar botón "Limpiar Selección"
    if (clearProblemsBtn) {
        clearProblemsBtn.addEventListener('click', function () {
            problemCheckboxes.forEach(checkbox => {
                checkbox.checked = false;
            });
            updateSelectedProblems();
        });
    }
}

/***** SECCIÓN 5: FUNCIONES DE GESTIÓN DE IMÁGENES *****/

/**
 * Configura la funcionalidad para eliminar imágenes
 */
function setupImageDeletion() {
    const imagesToDeleteInput = document.getElementById('imagesToDelete');
    const previewContainer = document.getElementById('previewContainer');

    if (!imagesToDeleteInput || !previewContainer) return;

    // Array para almacenar IDs de imágenes a eliminar
    let imagesToDelete = [];

    // Inicializar el valor del campo oculto
    imagesToDeleteInput.value = JSON.stringify(imagesToDelete);

    // Delegación de eventos para botones de eliminar imagen
    previewContainer.addEventListener('click', function (e) {
        const removeBtn = e.target.closest('.remove-image');
        if (!removeBtn) return;

        const imageId = removeBtn.getAttribute('data-image-id');
        if (!imageId) return;

        // Confirmar eliminación
        Swal.fire({
            title: '¿Eliminar imagen?',
            text: 'Esta acción no se puede deshacer hasta guardar los cambios',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                // Agregar ID a la lista de imágenes a eliminar
                imagesToDelete.push(imageId);
                imagesToDeleteInput.value = JSON.stringify(imagesToDelete);

                // Eliminar la vista previa
                const container = removeBtn.closest('.preview-image-container');
                if (container) {
                    container.remove();
                }

                showToast('success', 'Imagen marcada para eliminación', 'top-end');
            }
        });
    });
}

/***** SECCIÓN 6: FUNCIONES DE AUTOCOMPLETADO *****/
/**
 * Configura la actualización del código de producto al cambiar la referencia
 */
function setupProductCodeUpdate() {
    const referenceElem = document.getElementById('reference');
    const productCodeInput = document.getElementById('product_code');

    if (!referenceElem || !productCodeInput) return;

    // Guardar la referencia original para confirmación de cambios
    let originalRef = referenceElem.value;
    let originalRefText = referenceElem.options[referenceElem.selectedIndex]?.text || 'Sin seleccionar';

    referenceElem.addEventListener('change', function () {
        const newRef = this.value;
        const newRefText = this.options[this.selectedIndex]?.text || 'Sin seleccionar';

        if (newRef !== originalRef) {
            Swal.fire({
                title: 'Cambiar referencia',
                text: `¿Estás seguro de cambiar la referencia del producto a "${newRefText}"?`,
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Sí, cambiar',
                cancelButtonText: 'Cancelar'
            }).then((result) => {
                if (result.isConfirmed) {
                    originalRef = newRef;
                    originalRefText = newRefText;

                    // Actualizar el código del producto
                    const selectedOption = this.options[this.selectedIndex];
                    productCodeInput.value = (selectedOption && selectedOption.getAttribute('data-code')) || '';

                    showToast('success', `Referencia cambiada a "${newRefText}"`, 'top-end');
                } else {
                    // Revertir al valor original si se cancela
                    this.value = originalRef;
                    $(this).trigger('change'); // Para Select2
                }
            });
        } else {
            // Actualizar el código del producto sin confirmación si es la misma referencia
            const selectedOption = this.options[this.selectedIndex];
            productCodeInput.value = (selectedOption && selectedOption.getAttribute('data-code')) || '';
        }
    });

    // Inicialización al cargar la página
    if (referenceElem.value) {
        const selectedOption = referenceElem.options[referenceElem.selectedIndex];
        if (selectedOption && selectedOption.value && !productCodeInput.value) {
            productCodeInput.value = selectedOption.getAttribute('data-code') || '';
        }
    }
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
    commentTextarea.addEventListener('input', function() {
        const maxLength = 250; // Ajustar según sea necesario
        if (this.value.length > maxLength) {
            showToast('warning', `El comentario no puede exceder los ${maxLength} caracteres`, 'top-end');
            this.value = this.value.substring(0, maxLength);
        }
        
        // Eliminar mensaje de error si existe
        removeValidationError(this);
    });
}

/***** SECCIÓN 7: VALIDACIÓN Y ENVÍO DEL FORMULARIO *****/

/**
 * Configura la validación y envío del formulario
 */
function setupFormSubmission() {
    const ticketForm = document.querySelector('form');
    if (!ticketForm) return;

    ticketForm.addEventListener('submit', function (e) {
        e.preventDefault();
        console.log("Formulario enviado - Inicio de validación");
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
        if (serviceValue && (!serviceValue.value || isNaN(unformatNumber(serviceValue.value)) || unformatNumber(serviceValue.value) < 0)) {
            isValid = false;
            errorMessage += 'El valor del servicio debe ser un número positivo.<br>';
            serviceValue.classList.add('is-invalid');
        } else if (serviceValue) {
            serviceValue.classList.remove('is-invalid');
        }

        // Mostrar errores si los hay
        if (!isValid) {
            console.log("Validación fallida:", errorMessage);
            Swal.fire({
                icon: 'error',
                title: 'Error de validación',
                html: errorMessage,
                confirmButtonText: 'Corregir'
            });
            return;
        }

        console.log("Validación exitosa - Mostrando confirmación");
        // Confirmar envío del formulario
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
                console.log("Confirmación aceptada - Preparando envío");
                // Mostrar pantalla de carga
                Swal.fire({
                    title: 'Guardando...',
                    html: 'Por favor espera mientras se guardan los cambios.',
                    allowOutsideClick: false,
                    didOpen: () => {
                        Swal.showLoading();
                    }
                });

                // Desformatear los campos numéricos antes de enviar
                console.log("Desformateando campos numéricos");
                document.querySelectorAll('#service_value, #spare_value, #total, .part-unit-value, .part-total-value')
                    .forEach(input => {
                        const originalValue = input.value;
                        input.value = unformatNumber(input.value);
                        console.log(`Campo ${input.name || input.id}: ${originalValue} → ${input.value}`);
                    });

                // Agregar campo oculto para indicar redirección
                const redirectInput = document.createElement('input');
                redirectInput.type = 'hidden';
                redirectInput.name = 'redirect_after_save';
                redirectInput.value = 'true';
                ticketForm.appendChild(redirectInput);

                // Información sobre la acción del formulario
                console.log("Formulario listo para enviar a:", ticketForm.action);
                
                // Remover listener para evitar múltiples envíos
                ticketForm.removeEventListener('submit', arguments.callee);
                
                // Enviar el formulario
                console.log("Enviando formulario...");
                ticketForm.submit();
            }
        });
    });
}

/***** SECCIÓN 8: INICIALIZACIÓN *****/

/**
 * Inicializa todos los componentes y funcionalidades al cargar la página
 */
function initializeEditTicket() {

    // Los campos select ahora usan la clase de Bootstrap
    if (document.getElementById('reference')) {
        // No inicializar con Select2, Bootstrap maneja los selects
    }

    // Asegurarnos de que state no se incluya, ya que ahora es un input de texto y no un select
    $('.searchable-select').not('#city, #priority, #technical_name, #technical_document, #product_code').each(function() {
        // Los selects usan la clase form-select de Bootstrap
    });

    // 3. Configurar eventos para selectores normales
    $('#reference').on('change', function (e) {
        // El evento select2:select se cambia a change
    });

    // 4. Aplicar formato a campos numéricos globales
    const serviceValueInput = document.getElementById('service_value');
    const spareValueInput = document.getElementById('spare_value');
    const totalInput = document.getElementById('total');

    // IMPORTANTE: Formatear correctamente los valores sin multiplicarlos
    if (serviceValueInput && serviceValueInput.value) {
        serviceValueInput.value = formatNumberWithThousands(serviceValueInput.value);
    }

    if (spareValueInput && spareValueInput.value) {
        spareValueInput.value = formatNumberWithThousands(spareValueInput.value);
    }

    if (totalInput && totalInput.value) {
        totalInput.value = formatNumberWithThousands(totalInput.value);
    }

    // Aplicar eventos de formateo a los campos
    if (serviceValueInput) applyThousandsFormatting(serviceValueInput);
    if (spareValueInput) applyThousandsFormatting(spareValueInput);
    if (totalInput) applyThousandsFormatting(totalInput);

    // 5. Configurar autocompletado y restricciones
    setupProductCodeUpdate();

    // 6. Configurar gestión de problemas
    setupProblemSearch();
    setupProblemButtons();

    // 7. Configurar gestión de repuestos
    setupExistingRows();

    const addPartBtn = document.getElementById('addPartBtn');
    if (addPartBtn) {
        addPartBtn.addEventListener('click', addNewPartRow);
    }

    // 8. Configurar gestión de imágenes
    setupImageDeletion();

    // 9. Configurar validaciones en tiempo real
    attachEnhancedRealTimeValidation();

    // 10. Configurar envío del formulario
    setupFormSubmission();

    // 11. Actualizar totales iniciales
    updateTotals();

    // 12. Configurar relación técnico-documento y estado
    const technicianDocumentManager = setupTechnicianDocumentRelation();

    // 13. Configurar campo de comentario
    setupCommentField();

    // Los selectores de repuestos ahora usan la clase form-select de Bootstrap
    $('select[name="spare_part_code[]"]').each(function() {
        // No es necesario inicializarlos con Select2
    });
}

// Inicialización simple cuando el documento esté listo
document.addEventListener('DOMContentLoaded', function() {
    console.log("Documento cargado - Inicializando funcionalidad de repuestos con código nativo");
    
    // Inicializar las funciones principales
    initializeEditTicket();
    setupPartsTable();
    
    // Configurar listeners para actualizar valores financieros
    setupFinancialListeners();
});

// Variable global para la fila seleccionada
let selectedRow = null;
let isAddingRow = false; // Variable global para controlar la adición de filas

// Actualizar la función setupPartsTable para usar la nueva lógica de búsqueda
function setupPartsTable() {
    const partsTable = document.getElementById('partsTable');
    const partsTableBody = partsTable ? partsTable.querySelector('tbody') : null;
    const addPartBtn = document.getElementById('addPartBtn');
    const searchModal = new bootstrap.Modal(document.getElementById('searchPartsModal'));
    
    // Si no existe la tabla de repuestos, salir
    if (!partsTable || !partsTableBody || !addPartBtn) {
        return;
    }
    
    // Evento para agregar nueva fila de repuesto
    addPartBtn.addEventListener('click', function() {
        console.log("Botón de agregar repuesto clickeado");
        addNewPartRow();
    });
    
    // Evento para eliminar fila de repuesto (delegación de eventos)
    partsTableBody.addEventListener('click', function(e) {
        if (e.target.classList.contains('remove-part') || e.target.closest('.remove-part')) {
            const row = e.target.closest('tr');
            if (row) {
                removePartRow(row);
            }
        }
    });
    
    // Evento para abrir modal de búsqueda (delegación de eventos)
    partsTableBody.addEventListener('click', function(e) {
        if (e.target.classList.contains('select-part') || e.target.closest('.select-part')) {
            selectedRow = e.target.closest('tr');
            searchModal.show();
            
            // Limpiar búsqueda anterior
            document.getElementById('modalPartSearch').value = '';
            document.getElementById('initialSearchMessage').style.display = 'block';
            document.getElementById('searchResultsLoader').style.display = 'none';
            document.getElementById('noResultsMessage').style.display = 'none';
            document.getElementById('searchResultsList').style.display = 'none';
            document.getElementById('searchResultsList').innerHTML = '';
        }
    });
    
    // Evento para cambiar cantidad o precio y recalcular
    partsTableBody.addEventListener('input', function(e) {
        if (e.target.name === 'part_quantity[]' || e.target.name === 'part_unit_value[]') {
            const row = e.target.closest('tr');
            editPartTotal(row);
        }
    });
    
    // Configuración del buscador en el modal
    const searchInput = document.getElementById('modalPartSearch');
    const clearSearchBtn = document.getElementById('clearSearch');
    
    // Evento de búsqueda
    searchInput.addEventListener('input', function() {
        const query = this.value.trim();
        
        // Reiniciar temporizador de búsqueda
        if (window.searchTimeout) {
            clearTimeout(window.searchTimeout);
        }
        
        // Ejecutar búsqueda después de 500ms para evitar múltiples peticiones
        window.searchTimeout = setTimeout(function() {
            if (query.length >= 3) {
                searchParts(query);
            } else {
                document.getElementById('initialSearchMessage').style.display = 'block';
                document.getElementById('searchResultsLoader').style.display = 'none';
                document.getElementById('noResultsMessage').style.display = 'none';
                document.getElementById('searchResultsList').style.display = 'none';
            }
        }, 500);
    });
    
    // Buscar cuando se presione Enter
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            const query = this.value.trim();
            if (query.length >= 3) {
                searchParts(query);
            }
        }
    });
    
    // Evento para limpiar búsqueda
    clearSearchBtn.addEventListener('click', function() {
        searchInput.value = '';
        document.getElementById('initialSearchMessage').style.display = 'block';
        document.getElementById('searchResultsLoader').style.display = 'none';
        document.getElementById('noResultsMessage').style.display = 'none';
        document.getElementById('searchResultsList').style.display = 'none';
        document.getElementById('searchResultsList').innerHTML = '';
    });
    
    // Configurar las filas de repuestos existentes
    setupExistingRows();
    
    // Actualizar índices
    editRowIndices();
    
    // Calcular totales iniciales
    calculateTotals();
}

/**
 * Busca repuestos en el sistema
 * @param {string} query - Término de búsqueda
 */
function searchParts(query) {
    // Validar longitud mínima
    if (!query || query.length < 3) {
        showToast('Por favor ingrese al menos 3 caracteres para buscar', 'warning');
        return;
    }
    
    // Mostrar loader y ocultar otros elementos
    document.getElementById('initialSearchMessage').style.display = 'none';
    document.getElementById('searchResultsLoader').style.display = 'block';
    document.getElementById('noResultsMessage').style.display = 'none';
    document.getElementById('searchResultsList').style.display = 'none';
    
    // Realizar petición AJAX
    fetch(`/api/parts/search?term=${encodeURIComponent(query)}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Error en la respuesta del servidor');
            }
            return response.json();
        })
        .then(data => {
            // Ocultar loader
            document.getElementById('searchResultsLoader').style.display = 'none';
            
            // Obtener elemento contenedor
            const resultsList = document.getElementById('searchResultsList');
            resultsList.innerHTML = '';
            
            // Verificar si hay resultados
            if (!data || data.length === 0) {
                document.getElementById('noResultsMessage').style.display = 'block';
                return;
            }
            
            // Mostrar resultados
            resultsList.style.display = 'block';
            
            // Crear tarjetas para cada resultado
            data.forEach((part, index) => {
                const card = document.createElement('div');
                card.classList.add('card', 'mb-2', 'select-part-item');
                card.dataset.code = part.code;
                card.dataset.description = part.description;
                card.dataset.price = part.price;
                card.tabIndex = 0; // Para navegación con teclado
                
                // Aplicar borde especial al primer resultado
                if (index === 0) {
                    card.classList.add('first-result');
                }
                
                // Contenido de la tarjeta
                card.innerHTML = `
                    <div class="card-body p-2">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <h6 class="mb-0">${highlightMatch(part.code, query)}</h6>
                                <p class="mb-0 small text-muted">${highlightMatch(part.description, query)}</p>
                            </div>
                            <div class="text-end">
                                <div class="text-primary fw-bold">${formatCurrency(part.price)}</div>
                                <span class="badge ${part.stock > 0 ? 'bg-success' : 'bg-danger'}">
                                    Stock: ${part.stock || 0}
                                </span>
                            </div>
                        </div>
                    </div>
                `;
                
                // Agregar evento de clic
                card.addEventListener('click', function() {
                    selectPart(this);
                });
                
                // Agregar evento de teclado (Enter)
                card.addEventListener('keydown', function(e) {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        selectPart(this);
                    }
                });
                
                // Agregar a la lista
                resultsList.appendChild(card);
            });
            
            // Enfocar primer resultado para navegación con teclado
            const firstResult = resultsList.querySelector('.first-result');
            if (firstResult) {
                firstResult.focus();
            }
        })
        .catch(error => {
            console.error('Error al buscar repuestos:', error);
            document.getElementById('searchResultsLoader').style.display = 'none';
            document.getElementById('noResultsMessage').style.display = 'block';
            document.getElementById('noResultsMessage').textContent = 'Error al buscar repuestos. Intente nuevamente.';
        });
}

/**
 * Selecciona un repuesto del modal y lo agrega a la fila
 * @param {HTMLElement} item - Elemento seleccionado
 */
function selectPart(item) {
    const code = item.dataset.code;
    const description = item.dataset.description;
    const price = item.dataset.price;
    const searchModal = bootstrap.Modal.getInstance(document.getElementById('searchPartsModal'));
    
    if (selectedRow) {
        // Actualizar campos en la fila
        const select = selectedRow.querySelector('select[name="spare_part_code[]"]');
        if (select) {
            // Ver si la opción ya existe
            let option = Array.from(select.options).find(opt => opt.value === code);
            
            // Si no existe, crear nueva opción
            if (!option) {
                option = new Option(description, code);
                select.add(option);
            }
            
            // Seleccionar la opción
            select.value = code;
        }
        
        const priceInput = selectedRow.querySelector('input[name="part_unit_value[]"]');
        if (priceInput) {
            priceInput.value = parseFloat(price).toFixed(2);
        }
        
        // Actualizar subtotal
        editPartTotal(selectedRow);
    }
    
    // Cerrar modal
    searchModal.hide();
}

/**
 * Resalta el término de búsqueda en un texto
 * @param {string} text - Texto a procesar
 * @param {string} term - Término a resaltar
 * @returns {string} - Texto con el término resaltado
 */
function highlightMatch(text, term) {
    if (!text) return '';
    
    // Escapar caracteres especiales de regex
    const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Crear regex para coincidencia insensible a mayúsculas
    const regex = new RegExp(`(${escapedTerm})`, 'gi');
    
    // Reemplazar coincidencias con span resaltado
    return text.replace(regex, '<span class="highlight">$1</span>');
}

/**
 * Formatea un número como moneda
 * @param {number} value - Valor a formatear
 * @returns {string} - Valor formateado
 */
function formatCurrency(value) {
    return '$' + parseFloat(value).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
}

/**
 * Actualiza el subtotal de una fila
 */
function updateRowSubtotal(row) {
    const quantityInput = row.querySelector('input[name="part_quantity[]"]');
    const priceInput = row.querySelector('input[name="part_unit_value[]"]');
    const subtotalInput = row.querySelector('input[name="part_total_value[]"]');
    
    if (quantityInput && priceInput && subtotalInput) {
        const quantity = parseFloat(quantityInput.value) || 0;
        const price = parseFloat(priceInput.value.replace(/,/g, '')) || 0;
        const subtotal = quantity * price;
        
        subtotalInput.value = subtotal.toFixed(2);
    }
}

/**
 * Calcula el total de repuestos
 */
function calculateTotals() {
    const rows = document.querySelectorAll('#partsTable tbody .part-row');
    let subtotal = 0;
    
    rows.forEach(row => {
        const subtotalInput = row.querySelector('input[name="part_total_value[]"]');
        if (subtotalInput && subtotalInput.value) {
            subtotal += parseFloat(subtotalInput.value) || 0;
        }
    });
    
    // Actualizar el subtotal en la UI
    const subtotalElement = document.getElementById('partsSubtotal');
    if (subtotalElement) {
        subtotalElement.textContent = subtotal.toFixed(2);
    }
    
    // Si hay más cálculos financieros (IVA, total, etc.), se pueden agregar aquí
    updateTotalAndIVA(subtotal);
}

/**
 * Actualiza el IVA y el total general
 */
function updateTotalAndIVA(subtotal) {
    const ivaPercentage = 0.16; // 16% de IVA
    const ivaAmount = subtotal * ivaPercentage;
    const total = subtotal + ivaAmount;
    
    // Actualizar campos de IVA y total si existen
    const ivaElement = document.getElementById('partsIVA');
    const totalElement = document.getElementById('partsTotal');
    
    if (ivaElement) {
        ivaElement.textContent = ivaAmount.toFixed(2);
    }
    
    if (totalElement) {
        totalElement.textContent = total.toFixed(2);
    }
}

/**
 * Inicializa los selectores Select2
 */
function initializeSelect2() {
    // Inicializar el select para las referencias de producto
    const referenceSelect = document.getElementById('reference');
    if (referenceSelect) {
        $(referenceSelect).select2({
            placeholder: "Seleccione una referencia",
            allowClear: true,
            width: '100%'
        });
    }
    
    // Inicializar los selects para los repuestos (existentes y nuevos)
    $('.form-select[name="spare_part_code[]"]').each(function() {
        if (!$(this).data('select2-initialized')) {
            $(this).select2({
                placeholder: "Seleccione un repuesto",
                allowClear: true,
                width: '100%'
            }).data('select2-initialized', true);
        }
    });
}

/**
 * Configura los listeners para los campos financieros
 */
function setupFinancialListeners() {
    const serviceValueInput = document.getElementById('service_value');
    const spareValueInput = document.getElementById('spare_value');
    const totalInput = document.getElementById('total');
    
    if (serviceValueInput && spareValueInput && totalInput) {
        // Formatear valores iniciales
        serviceValueInput.value = formatNumberWithThousands(unformatNumber(serviceValueInput.value) || 0);
        spareValueInput.value = formatNumberWithThousands(unformatNumber(spareValueInput.value) || 0);
        totalInput.value = formatNumberWithThousands(unformatNumber(totalInput.value) || 0);
        
        // Actualizar total cuando cambie el valor del servicio
        serviceValueInput.addEventListener('input', function() {
            const rawValue = unformatNumber(this.value);
            this.value = formatNumberWithThousands(rawValue);
            
            // Actualizar total
            updateTotal();
        });
    }
    
    // Función para actualizar el total
    function updateTotal() {
        if (serviceValueInput && spareValueInput && totalInput) {
            const serviceValue = unformatNumber(serviceValueInput.value) || 0;
            const spareValue = unformatNumber(spareValueInput.value) || 0;
            const total = serviceValue + spareValue;
            
            totalInput.value = formatNumberWithThousands(total);
        }
    }
}


