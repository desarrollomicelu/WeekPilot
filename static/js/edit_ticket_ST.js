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
 * Valida el formato de un correo electrónico.
 * @param {string} email - Correo a validar.
 * @returns {boolean} - True si el email es válido.
 */
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

/**
 * Formatea un número con separadores de miles (punto).
 * Maneja correctamente valores con punto decimal.
 * @param {number|string} number - El número a formatear.
 * @returns {string} - El número formateado.
 */
function formatNumberWithThousands(number) {
    // Si es una cadena, convertirla a número
    if (typeof number === 'string') {
        // Reemplazar comas por puntos (por si acaso)
        number = number.replace(/,/g, '.');
        // Convertir a número (el parseFloat maneja correctamente el punto decimal)
        number = parseFloat(number) || 0;
    }

    // Redondear a entero y formatear con separadores de miles
    return Math.round(number).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/**
 * Elimina los separadores de miles de un número formateado.
 * @param {string} formattedNumber - El número con separadores.
 * @returns {number} - El número sin formato.
 */
function unformatNumber(formattedNumber) {
    if (!formattedNumber) return 0;
    return parseFloat(formattedNumber.replace(/\./g, "")) || 0;
}

/**
 * Aplica formato de miles a un campo de entrada.
 * @param {HTMLElement} input - El elemento de entrada.
 */
function applyThousandsFormatting(input) {
    if (!input) return;

    // Formatear el valor inicial si existe y no está ya formateado
    if (input.value && !input.value.includes('.')) {
        input.value = formatNumberWithThousands(input.value);
    }

    // Agregar evento para formatear mientras se escribe
    input.addEventListener('input', function () {
        const cursorPos = this.selectionStart;
        const originalLength = this.value.length;

        // Eliminar caracteres no numéricos excepto puntos
        let value = this.value.replace(/[^\d\.]/g, '');

        // Eliminar todos los puntos para tener solo el número
        value = value.replace(/\./g, '');

        if (value) {
            this.value = formatNumberWithThousands(value);
        } else {
            this.value = '';
        }

        // Ajustar la posición del cursor
        const newLength = this.value.length;
        const posDiff = newLength - originalLength;
        this.setSelectionRange(Math.max(0, cursorPos + posDiff), Math.max(0, cursorPos + posDiff));
    });
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
 * Calcula el total de una fila de repuesto
 * @param {HTMLElement} row - Fila de la tabla de repuestos
 */
function editPartTotal(row) {
    const quantity = parseInt(row.querySelector('.part-quantity').value) || 0;
    const unitValue = unformatNumber(row.querySelector('.part-unit-value').value);
    const totalValue = quantity * unitValue;
    row.querySelector('.part-total-value').value = formatNumberWithThousands(totalValue);
    updateTotals();
}

/**
 * Actualiza los índices de las filas de repuestos
 */
function editRowIndices() {
    const partsTable = document.getElementById('partsTable');
    if (!partsTable) return;

    const rows = partsTable.querySelector('tbody').querySelectorAll('.part-row');
    rows.forEach((row, index) => {
        row.querySelector('.part-index').textContent = index + 1;
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
        // Inicializar Select2 para el select de repuesto
        $(row.querySelector('select')).select2({
            width: '100%',
            placeholder: "Seleccione un repuesto",
            allowClear: true
        });

        // Obtener referencias a los campos de la fila
        const unitValueInput = row.querySelector('.part-unit-value');
        const totalValueInput = row.querySelector('.part-total-value');
        const quantityInput = row.querySelector('.part-quantity');

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
        quantityInput.addEventListener('input', () => editPartTotal(row));
        unitValueInput.addEventListener('input', () => editPartTotal(row));
        row.querySelector('.remove-part').addEventListener('click', () => removePartRow(row));
    });

    // Actualizar totales iniciales
    updateTotals();
}

/**
 * Agrega una nueva fila de repuesto a la tabla
 */
function addNewPartRow() {
    const partsTable = document.getElementById('partsTable');
    if (!partsTable) return;

    const partsTableBody = partsTable.querySelector('tbody');
    const noPartsRow = document.getElementById('noPartsRow');
    const partRowTemplate = document.getElementById('partRowTemplate');

    // Eliminar la fila de "No hay repuestos" si existe
    if (noPartsRow) noPartsRow.remove();

    // Clonar el template y agregar la nueva fila
    const newRow = document.importNode(partRowTemplate.content, true).querySelector('tr');
    partsTableBody.appendChild(newRow);

    // Inicializar Select2 para el select de repuesto
    $(newRow.querySelector('select')).select2({
        width: '100%',
        placeholder: "Seleccione un repuesto",
        allowClear: true
    });

    // Aplicar formato al campo de valor unitario
    applyThousandsFormatting(newRow.querySelector('.part-unit-value'));

    // Configurar eventos
    newRow.querySelector('.part-quantity').addEventListener('input', () => editPartTotal(newRow));
    newRow.querySelector('.part-unit-value').addEventListener('input', () => editPartTotal(newRow));
    newRow.querySelector('.remove-part').addEventListener('click', () => removePartRow(newRow));

    // Actualizar índices y mostrar mensaje
    editRowIndices();
    showToast('success', 'Repuesto agregado correctamente', 'top-end');

    // Validar la nueva fila
    validatePartsTable();
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
            Swal.fire({
                icon: 'error',
                title: 'Error de validación',
                html: errorMessage,
                confirmButtonText: 'Corregir'
            });
            return;
        }

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
                Swal.fire({
                    title: 'Guardando...',
                    html: 'Por favor espera mientras se guardan los cambios.',
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

                // Agregar campo oculto para indicar redirección
                const redirectInput = document.createElement('input');
                redirectInput.type = 'hidden';
                redirectInput.name = 'redirect_after_save';
                redirectInput.value = 'true';
                ticketForm.appendChild(redirectInput);

                // Enviar el formulario
                ticketForm.removeEventListener('submit', arguments.callee);
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

    // 2. Inicializar Select2 para los campos de selección
    if (document.getElementById('reference')) {
        $('#reference').select2({
            width: '100%',
            placeholder: "Seleccione una referencia",
            allowClear: true
        });
    }

    // Asegurarnos de que state no se incluya, ya que ahora es un input de texto y no un select
    $('.searchable-select').not('#city, #priority, #technical_name, #technical_document, #product_code').select2({
        width: '100%',
        placeholder: "Seleccione una opción",
        allowClear: true
    });

    // 3. Configurar eventos para Select2
    $('#reference').on('select2:select', function (e) {
        this.dispatchEvent(new Event('change'));
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
}

// Inicializar todo cuando el DOM esté completamente cargado
document.addEventListener("DOMContentLoaded", initializeEditTicket);

// Asegurar que los eventos de Select2 se disparen correctamente
$(document).ready(function () {
    $('#reference').on('select2:select', function (e) {
        this.dispatchEvent(new Event('change'));
    });
});


