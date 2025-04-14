/***************************************************
 * create_ticket_ST.js
 * Funciones y validaciones para la creación de tickets
 ***************************************************/

/***** Funciones Globales *****/

/**
 * Muestra un toast (notificación pequeña) usando SweetAlert2.
 * @param {string} icon - Tipo de ícono ('success', 'error', 'info', etc.).
 * @param {string} title - Texto a mostrar.
 * @param {string} [position='top-end'] - Posición en la pantalla.
 * @param {number} [timer=3000] - Tiempo en milisegundos.
 */
function showToast(icon, title, position = 'top-end', timer = 3000) {
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
    Toast.fire({ icon: icon, title: title });
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
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

/**
 * Formatea un número con separadores de miles (punto).
 * @param {number|string} number - El número a formatear.
 * @returns {string} - El número formateado.
 */
function formatNumberWithThousands(number) {
    if (typeof number === 'string') {
        number = parseFloat(number.replace(/\./g, '')) || 0;
    }
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
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
    if (input.value && !isNaN(parseFloat(input.value))) {
        input.value = formatNumberWithThousands(input.value);
    }
    input.addEventListener('input', function () {
        const cursorPos = this.selectionStart;
        const originalLength = this.value.length;
        let value = this.value.replace(/[^\d]/g, '');
        if (value) {
            this.value = formatNumberWithThousands(value);
        } else {
            this.value = '';
        }
        const newLength = this.value.length;
        const posDiff = newLength - originalLength;
        this.setSelectionRange(cursorPos + posDiff, cursorPos + posDiff);
    });
}

/***** Validaciones en Tiempo Real *****/

/**
 * Adjunta validaciones en tiempo real a campos específicos.
 * Se agregan listeners "input" para mostrar o quitar la clase "is-invalid"
 * según se cumplan o no las condiciones.
 */
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



/***** Inicialización al Cargar el DOM *****/
document.addEventListener("DOMContentLoaded", function () {

    // Llamar a la función de validación en tiempo real
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

    setupTechnicianStateRestriction();

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
    const partsTable = document.getElementById('partsTable');
    const addPartBtn = document.getElementById('addPartBtn');
    const partRowTemplate = document.getElementById('partRowTemplate');
    if (partsTable && addPartBtn && partRowTemplate) {
        const partsTableBody = partsTable.querySelector('tbody');
        const noPartsRow = document.getElementById('noPartsRow');
        const serviceValueInput = document.getElementById('service_value');
        const spareValueInput = document.getElementById('spare_value');
        const totalInput = document.getElementById('total');

        // Aplicar formato a campos de valores
        if (serviceValueInput) applyThousandsFormatting(serviceValueInput);
        if (spareValueInput) applyThousandsFormatting(spareValueInput);
        if (totalInput) applyThousandsFormatting(totalInput);

        function editPartTotal(row) {
            const quantity = parseFloat(row.querySelector('.part-quantity').value) || 0;
            const unitValue = unformatNumber(row.querySelector('.part-unit-value').value);
            const totalValue = quantity * unitValue;
            const totalValueInput = row.querySelector('.part-total-value');
            totalValueInput.value = formatNumberWithThousands(totalValue);
            updateTotals();
        }
        function updateTotals() {
            let spareTotal = 0;
            document.querySelectorAll('.part-total-value').forEach(input => {
                spareTotal += unformatNumber(input.value);
            });
            if (spareValueInput) spareValueInput.value = formatNumberWithThousands(spareTotal);
            const serviceValue = unformatNumber(serviceValueInput?.value) || 0;
            if (totalInput) totalInput.value = formatNumberWithThousands(serviceValue + spareTotal);
        }
        function editRowIndices() {
            const rows = partsTableBody.querySelectorAll('.part-row');
            rows.forEach((row, index) => {
                row.querySelector('.part-index').textContent = index + 1;
            });
        }
        function setupExistingRows() {
            const existingRows = partsTableBody.querySelectorAll('.part-row');
            existingRows.forEach(row => {
                $(row.querySelector('select')).select2({
                    width: '100%',
                    placeholder: "Seleccione un repuesto",
                    allowClear: true
                });
                applyThousandsFormatting(row.querySelector('.part-unit-value'));
                applyThousandsFormatting(row.querySelector('.part-total-value'));
                row.querySelector('.part-quantity').addEventListener('input', () => editPartTotal(row));
                row.querySelector('.part-unit-value').addEventListener('input', () => editPartTotal(row));
                row.querySelector('.remove-part').addEventListener('click', () => {
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
                            showToast('success', 'Repuesto eliminado correctamente', 'top-end');
                        }
                    });
                });
            });
            updateTotals();
        }
        setupExistingRows();
        addPartBtn.addEventListener('click', function () {
            if (noPartsRow) {
                noPartsRow.remove();
            }
            const newRow = document.importNode(partRowTemplate.content, true).querySelector('tr');
            partsTableBody.appendChild(newRow);
            $(newRow.querySelector('select')).select2({
                width: '100%',
                placeholder: "Seleccione un repuesto",
                allowClear: true
            });
            applyThousandsFormatting(newRow.querySelector('.part-unit-value'));
            applyThousandsFormatting(newRow.querySelector('.part-total-value'));
            newRow.querySelector('.part-quantity').addEventListener('input', () => editPartTotal(newRow));
            newRow.querySelector('.part-unit-value').addEventListener('input', () => editPartTotal(newRow));
            newRow.querySelector('.remove-part').addEventListener('click', () => {
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
                        showToast('success', 'Repuesto eliminado correctamente', 'top-end');
                    }
                });
            });
            editRowIndices();
            showToast('success', 'Repuesto agregado correctamente', 'top-end');
        });
        if (serviceValueInput) {
            serviceValueInput.addEventListener('input', updateTotals);
        }
    }

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
    $('#reference').on('select2:select', function (e) {
        this.dispatchEvent(new Event('change'));
    });
});
