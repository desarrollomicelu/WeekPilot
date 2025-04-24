/***************************************************
 * create_warranty.js
 * Funciones y validaciones para la creación de garantías
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
    
    // Inicializar Select2 para el selector de facturas
    if (document.getElementById('invoice_selector')) {
        $('#invoice_selector').select2({
            width: '100%',
            placeholder: "Seleccione una factura",
            allowClear: true
        });
        
        // Cuando cambia mediante Select2, disparar el evento change nativo
        $('#invoice_selector').on('select2:select', function (e) {
            this.dispatchEvent(new Event('change'));
        });
    }
    
    $('.searchable-select').not('#state, #city, #priority, #technical_name, #technical_document, #product_code, #invoice_selector').select2({
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

    // Manejador para la selección de factura
    function handleInvoiceSelection() {
        const selectedIndex = parseInt($("#invoiceSelector").val());
        
        if (isNaN(selectedIndex) || selectedIndex < 0 || !clientInvoices || clientInvoices.length === 0) {
            $("#selectedInvoiceDetails").hide();
            return;
        }
        
        const selectedInvoice = clientInvoices[selectedIndex];
        
        // Mostrar los detalles de la factura seleccionada
        $("#invoiceDetailCode").text(selectedInvoice.numero || '-');
        $("#invoiceDetailSerie").text(selectedInvoice.serie || '-');
        $("#invoiceDetailDate").text(selectedInvoice.fecha || '-');
        $("#invoiceDetailReference").text(selectedInvoice.referencia || '-');
        $("#invoiceDetailStatus").text(selectedInvoice.estado || '-');
        $("#invoiceDetailValue").text(selectedInvoice.valor_total || '-');
        $("#invoiceDetailOrigin").text(selectedInvoice.origen || '-');
        
        // Mostrar el panel de detalles
        $("#selectedInvoiceDetails").show();
    }

    // Manejador para el botón de usar datos de factura
    $(document).on("click", "#useInvoiceDataBtn", function() {
        const selectedIndex = parseInt($("#invoiceSelector").val());
        
        if (isNaN(selectedIndex) || selectedIndex < 0 || !clientInvoices || clientInvoices.length === 0) {
            return;
        }
        
        const selectedInvoice = clientInvoices[selectedIndex];
        
        // Rellenar los campos del formulario con datos de la factura
        $("#product_code").val(selectedInvoice.producto || '');
        $("#reference").val(selectedInvoice.referencia || '');
        $("#serial").val(selectedInvoice.serie || '');
        
        if (selectedInvoice.fecha) {
            try {
                // Intentar convertir la fecha de la factura al formato requerido por el input date
                const dateParts = selectedInvoice.fecha.split('/');
                if (dateParts.length === 3) {
                    const formattedDate = `${dateParts[2]}-${dateParts[1].padStart(2, '0')}-${dateParts[0].padStart(2, '0')}`;
                    $("#initial_date").val(formattedDate);
                }
            } catch (e) {
                console.error("Error al formatear la fecha:", e);
            }
        }
        
        // Mostrar notificación de éxito
        Swal.fire({
            title: '¡Datos aplicados!',
            text: 'Los datos de la factura han sido aplicados al formulario',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false
        });
    });
});

// Asegurarse de que, al seleccionar con Select2, se dispare el evento change en el select de referencia
$(document).ready(function () {
    $('#reference').on('select2:select', function (e) {
        this.dispatchEvent(new Event('change'));
    });
});

// Funcionalidad para búsqueda de clientes por documento
document.addEventListener('DOMContentLoaded', function() {
    // Elementos del DOM
    const searchClientBtn = document.getElementById('searchClientBtn');
    const documentInput = document.getElementById('document');
    const documentFeedback = document.getElementById('documentFeedback');
    const clientNamesInput = document.getElementById('client_names');
    const clientLastnamesInput = document.getElementById('client_lastnames');
    const phoneInput = document.getElementById('phone');
    const mailInput = document.getElementById('mail');
    const invoicesSection = document.getElementById('invoicesSection');
    const invoicesTable = document.getElementById('invoicesTable');
    
    // Nuevos elementos para dropdown de facturas
    const invoiceDropdownSection = document.getElementById('invoiceDropdownSection');
    const invoiceSelector = document.getElementById('invoice_selector');
    const selectedInvoiceDetails = document.getElementById('selectedInvoiceDetails');
    const invoiceDetailSerie = document.getElementById('invoiceDetailSerie');
    const invoiceDetailDate = document.getElementById('invoiceDetailDate');
    const invoiceDetailCode = document.getElementById('invoiceDetailCode');
    const invoiceDetailReference = document.getElementById('invoiceDetailReference');
    const useInvoiceDataBtn = document.getElementById('useInvoiceDataBtn');
    
    // Elementos para la tabla de facturas
    const showAllInvoicesBtn = document.getElementById('showAllInvoicesBtn');
    const hideAllInvoicesBtn = document.getElementById('hideAllInvoicesBtn');
    const invoicesTableSection = document.getElementById('invoicesTableSection');
    
    // Inicializar eventos para la tabla de facturas
    if (showAllInvoicesBtn) {
        showAllInvoicesBtn.addEventListener('click', toggleInvoicesTable);
    }
    
    if (hideAllInvoicesBtn) {
        hideAllInvoicesBtn.addEventListener('click', toggleInvoicesTable);
    }
    
    // Agregar evento al botón "Usar para garantía"
    if (useInvoiceDataBtn) {
        useInvoiceDataBtn.addEventListener('click', function() {
            if (!invoiceSelector) return;
            
            const selectedIndex = parseInt(invoiceSelector.value);
            
            if (isNaN(selectedIndex) || selectedIndex < 0 || !clientInvoices || selectedIndex >= clientInvoices.length) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Selección inválida',
                    text: 'Por favor, seleccione una factura válida',
                    timer: 2000,
                    showConfirmButton: false
                });
                return;
            }
            
            const invoice = clientInvoices[selectedIndex];
            applyProductData(invoice.product_code, invoice.product_description);
        });
    }
    
    // También permitir buscar al presionar Enter en el campo de documento
    if (documentInput) {
        documentInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault(); // Evitar envío del formulario
                if (searchClientBtn) searchClientBtn.click();
            }
        });
    }

    // Variable para almacenar las facturas del cliente
    let clientInvoices = [];

    // Función para mostrar error en el campo de documento
    function showDocumentError(message) {
        if (documentInput && documentFeedback) {
            documentInput.classList.add('is-invalid');
            documentFeedback.textContent = message;
            documentFeedback.style.display = 'block';
        }
    }
    
    // Función para limpiar errores
    function clearDocumentError() {
        if (documentInput && documentFeedback) {
            documentInput.classList.remove('is-invalid');
            documentFeedback.textContent = '';
            documentFeedback.style.display = 'none';
        }
    }
    
    // Agregar evento para limpiar espacios y caracteres no válidos al perder el foco
    if (documentInput) {
        documentInput.addEventListener('blur', function() {
            // Guardar la posición del cursor
            const cursorPos = this.selectionStart;
            
            // Eliminar espacios al inicio y final
            this.value = this.value.trim();
            
            // Restaurar cursor si es necesario
            if (document.activeElement === this) {
                this.setSelectionRange(cursorPos, cursorPos);
            }
        });
        
        // Limpiar errores cuando el usuario comienza a escribir de nuevo
        documentInput.addEventListener('input', clearDocumentError);
    }
    
    // Función para buscar cliente por documento
    if (searchClientBtn) {
        searchClientBtn.addEventListener('click', function() {
            const document = documentInput.value.trim();
            
            clearDocumentError(); // Limpiar errores anteriores
            
            if (!document) {
                showDocumentError('Por favor, ingrese un número de documento para buscar');
                return;
            }
            
            // Extraer solo dígitos para validación básica
            const digitsOnly = document.replace(/\D/g, '');
            
            if (digitsOnly.length < 5) {
                showDocumentError('El documento debe tener al menos 5 dígitos');
                return;
            }
            
            console.log(`Buscando cliente. Documento original: ${document}, Dígitos: ${digitsOnly}`);
            
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
                    throw new Error(`Error en la respuesta: ${response.status} ${response.statusText}`);
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
                    fillClientData(data.client);
                    
                    // Mostrar facturas
                    showInvoices(data.invoices);
                    
                    // Actualizar el campo de documento con el formato correcto si es diferente
                    if (data.client.document && data.client.document !== document) {
                        documentInput.value = data.client.document;
                    }
                    
                    // Mostrar notificación
                    Swal.fire({
                        icon: 'success',
                        title: 'Cliente encontrado',
                        text: `Se ha cargado la información de ${data.client.name} y sus facturas`,
                        timer: 2000,
                        showConfirmButton: false
                    });
                } else {
                    showDocumentError(data.message || 'No se encontró ningún cliente con ese documento. Verifique el documento e intente nuevamente.');
                    
                    Swal.fire({
                        icon: 'error',
                        title: 'Cliente no encontrado',
                        text: data.message || 'No se encontró ningún cliente con ese documento. Verifique el documento e intente nuevamente.',
                        confirmButtonText: 'Entendido'
                    });
                }
            })
            .catch(error => {
                // Restaurar botón
                searchClientBtn.disabled = false;
                searchClientBtn.innerHTML = '<i class="fas fa-search"></i>';
                
                console.error('Error en la búsqueda:', error);
                
                showDocumentError(`Error: ${error.message}`);
                
                Swal.fire({
                    icon: 'error',
                    title: 'Error en la búsqueda',
                    text: `Ocurrió un error al buscar el cliente: ${error.message}`,
                    confirmButtonText: 'Entendido'
                });
            });
        });
    }
    
    // Función para llenar datos del cliente
    function fillClientData(client) {
        // Usar los campos nombre1, nombre2, apellido1 y apellido2
        if (clientNamesInput) {
            // Combinar nombre1 y nombre2 en el campo nombres
            const nombre1 = client.nombre1 || '';
            const nombre2 = client.nombre2 || '';
            clientNamesInput.value = `${nombre1} ${nombre2}`.trim();
            // Aplicar estilos para campos solo lectura
            clientNamesInput.classList.add('bg-light');
            clientNamesInput.readOnly = true;
        }
        
        if (clientLastnamesInput) {
            // Combinar apellido1 y apellido2 en el campo apellidos
            const apellido1 = client.apellido1 || '';
            const apellido2 = client.apellido2 || '';
            clientLastnamesInput.value = `${apellido1} ${apellido2}`.trim();
            // Aplicar estilos para campos solo lectura
            clientLastnamesInput.classList.add('bg-light');
            clientLastnamesInput.readOnly = true;
        }
        
        // Llenar otros campos
        if (phoneInput) {
            phoneInput.value = client.phone || '';
            // Aplicar estilos para campos solo lectura
            phoneInput.classList.add('bg-light');
            phoneInput.readOnly = true;
        }
        
        if (mailInput) {
            mailInput.value = client.email || '';
            // Aplicar estilos para campos solo lectura
            mailInput.classList.add('bg-light');
            mailInput.readOnly = true;
        }
        
        // Actualizar el documento con el valor formateado de la base de datos
        if (client.document && documentInput) {
            documentInput.value = client.document;
        }
    }
    
    // Función para mostrar facturas
    function showInvoices(invoices) {
        console.log("Mostrando facturas:", invoices);
        
        // Guardar las facturas en variable global para acceso posterior
        clientInvoices = invoices || [];
        
        // Acceder al selector de facturas
        let invoiceSelector = document.getElementById('invoice_selector');
        let dropdownSection = document.getElementById('invoiceDropdownSection');
        let showAllSection = document.getElementById('showAllInvoicesSection');
        
        // Hacer visible las secciones si hay facturas
        if (invoiceSelector && dropdownSection) {
            dropdownSection.style.display = 'block';
        }
        
        if (showAllSection) {
            showAllSection.style.display = 'block';
        }
        
        // Verificar si hay facturas para mostrar
        if (clientInvoices.length > 0) {
            console.log(`Se encontraron ${clientInvoices.length} facturas`);
            
            // Preparar el selector de facturas
            if (invoiceSelector) {
                // Limpiar opciones previas
                invoiceSelector.innerHTML = '<option value="">Seleccione una factura</option>';
                
                // Añadir cada factura como una opción
                clientInvoices.forEach((invoice, index) => {
                    let option = document.createElement('option');
                    option.value = index; // Usar el índice como valor
                    
                    // Construir texto descriptivo para la opción usando los nuevos campos
                    let optionText = `${invoice.invoice_number || 'Sin serie'} - ${invoice.formatted_date || 'Sin fecha'}`;
                    
                    // Añadir valor formateado si está disponible
                    if (invoice.formatted_value && invoice.formatted_value !== 'N/A') {
                        optionText += ` - ${invoice.formatted_value}`;
                    }
                    
                    option.textContent = optionText;
                    invoiceSelector.appendChild(option);
                });
                
                // Inicializar Select2 si está disponible
                if (typeof $.fn.select2 === 'function') {
                    try {
                        // Primero destruir si ya está inicializado
                        if ($('#invoice_selector').data('select2')) {
                            $('#invoice_selector').select2('destroy');
                        }
                        
                        // Inicializar Select2
                        $('#invoice_selector').select2({
                            placeholder: 'Seleccione una factura',
                            width: '100%',
                            allowClear: true
                        });
                        
                        console.log('Select2 inicializado para el dropdown de facturas');
                    } catch (e) {
                        console.error('Error al inicializar Select2:', e);
                    }
                }
                
                // Agregar evento para detectar cambios en la selección
                invoiceSelector.removeEventListener('change', handleInvoiceSelection);
                invoiceSelector.addEventListener('change', handleInvoiceSelection);
            }
            
            // Preparar también los datos para la tabla detallada
            prepareDetailedInvoicesTable();
        } else {
            console.log('No hay facturas para mostrar');
            
            // Añadir mensaje de no facturas al selector
            if (invoiceSelector) {
                invoiceSelector.innerHTML = '<option value="">No hay facturas disponibles</option>';
                invoiceSelector.disabled = true;
            }
            
            // Ocultar el botón para mostrar todas las facturas
            if (showAllSection) {
                showAllSection.style.display = 'none';
            }
        }
        
        // Ocultar sección de detalles de factura si estaba visible
        let detailsSection = document.getElementById('selectedInvoiceDetails');
        if (detailsSection) {
            detailsSection.style.display = 'none';
        }
        
        // Ocultar también la tabla de facturas detallada
        let tableSection = document.getElementById('invoicesTableSection');
        if (tableSection) {
            tableSection.style.display = 'none';
        }
    }
    
    // Función para preparar la tabla detallada de facturas
    function prepareDetailedInvoicesTable() {
        const tableSection = document.getElementById('invoicesTableSection');
        const table = document.getElementById('detailedInvoicesTable');
        
        if (!table || !tableSection) {
            console.error('No se encontró la tabla o su contenedor');
            return;
        }
        
        // Obtener el tbody donde agregaremos las filas
        const tbody = table.querySelector('tbody');
        if (!tbody) {
            console.error('No se encontró el tbody de la tabla');
            return;
        }
        
        // Limpiar contenido previo
        tbody.innerHTML = '';
        
        // Si no hay facturas, mostrar mensaje
        if (!clientInvoices || clientInvoices.length === 0) {
            const emptyRow = document.createElement('tr');
            emptyRow.innerHTML = '<td colspan="6" class="text-center py-3">No se encontraron facturas para este cliente.</td>';
            tbody.appendChild(emptyRow);
            return;
        }
        
        // Añadir una fila por cada factura
        clientInvoices.forEach((invoice, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><span class="badge bg-secondary">${invoice.product_code || 'N/A'}</span></td>
                <td>${invoice.product_description || 'N/A'}</td>
                <td>${invoice.origin || 'N/A'}</td>
                <td>${invoice.invoice_number || 'N/A'}</td>
                <td>${invoice.formatted_date || 'N/A'}</td>
                <td>
                    <button type="button" class="btn btn-sm btn-primary select-invoice" data-index="${index}">
                        <i class="fas fa-check me-1"></i>Seleccionar
                    </button>
                </td>
            `;
            
            tbody.appendChild(row);
        });
        
        // Añadir eventos a los botones de selección
        const selectButtons = tbody.querySelectorAll('.select-invoice');
        selectButtons.forEach(button => {
            button.addEventListener('click', function() {
                const index = this.getAttribute('data-index');
                selectInvoiceFromTable(index);
            });
        });
    }

    // Función para mostrar/ocultar la tabla de facturas
    function toggleInvoicesTable() {
        const tableSection = document.getElementById('invoicesTableSection');
        const showAllBtn = document.getElementById('showAllInvoicesBtn');
        
        if (!tableSection) return;
        
        if (tableSection.style.display === 'none') {
            // Mostrar tabla
            tableSection.style.display = 'block';
            if (showAllBtn) showAllBtn.style.display = 'none';
        } else {
            // Ocultar tabla
            tableSection.style.display = 'none';
            if (showAllBtn) showAllBtn.style.display = 'block';
        }
    }

    // Función para seleccionar una factura desde la tabla
    function selectInvoiceFromTable(index) {
        // Convertir a número
        index = parseInt(index);
        
        if (isNaN(index) || index < 0 || !clientInvoices || index >= clientInvoices.length) {
            console.error('Índice de factura inválido');
            return;
        }
        
        console.log(`Seleccionando factura del índice ${index} desde la tabla`);
        
        // Actualizar el selector de facturas si existe
        const invoiceSelector = document.getElementById('invoice_selector');
        if (invoiceSelector) {
            invoiceSelector.value = index;
            
            // Si usa Select2, actualizar también la UI de Select2
            if (typeof $.fn.select2 === 'function' && $('#invoice_selector').data('select2')) {
                $('#invoice_selector').trigger('change.select2');
            }
            
            // Disparar evento change para actualizar los detalles
            invoiceSelector.dispatchEvent(new Event('change'));
        } else {
            // Si no existe el selector, mostrar directamente los detalles
            displayInvoiceDetails(clientInvoices[index]);
        }
        
        // Ocultar la tabla
        toggleInvoicesTable();
    }

    // Función para mostrar los detalles de una factura directamente
    function displayInvoiceDetails(invoice) {
        if (!invoice) {
            console.error('No se recibió una factura válida');
            return;
        }
        
        // Actualizar los detalles de la factura con los nuevos campos
        const detailsSection = document.getElementById('selectedInvoiceDetails');
        const invoiceDetailSerie = document.getElementById('invoiceDetailSerie');
        const invoiceDetailDate = document.getElementById('invoiceDetailDate');
        const invoiceDetailCode = document.getElementById('invoiceDetailCode');
        const invoiceDetailReference = document.getElementById('invoiceDetailReference');
        const invoiceDetailStatus = document.getElementById('invoiceDetailStatus');
        
        if (invoiceDetailSerie) invoiceDetailSerie.textContent = invoice.invoice_number || 'N/A';
        if (invoiceDetailDate) invoiceDetailDate.textContent = invoice.formatted_date || 'N/A';
        if (invoiceDetailCode) invoiceDetailCode.textContent = invoice.product_code || 'N/A';
        if (invoiceDetailReference) invoiceDetailReference.textContent = invoice.product_description || 'N/A';
        if (invoiceDetailStatus) invoiceDetailStatus.textContent = invoice.status || 'N/A';
        
        // Mostrar el valor formateado si existe
        const invoiceDetailValue = document.getElementById('invoiceDetailValue');
        if (invoiceDetailValue) {
            invoiceDetailValue.textContent = invoice.formatted_value || 'N/A';
        }
        
        // Mostrar origen si existe
        const invoiceDetailOrigin = document.getElementById('invoiceDetailOrigin');
        if (invoiceDetailOrigin) {
            invoiceDetailOrigin.textContent = invoice.origin || 'N/A';
        }
        
        // Mostrar la sección de detalles
        if (detailsSection) {
            detailsSection.style.display = 'block';
        }
    }

    // Función para aplicar los datos del producto a los campos del formulario
    function applyProductData(code, description) {
        const referenceInput = document.getElementById('reference');
        const productCodeInput = document.getElementById('product_code');
        
        if (referenceInput) {
            // Si reference es un select, buscar la opción que coincida
            if (referenceInput.tagName === 'SELECT') {
                let optionFound = false;
                for (let i = 0; i < referenceInput.options.length; i++) {
                    if (referenceInput.options[i].text.includes(description)) {
                        referenceInput.selectedIndex = i;
                        optionFound = true;
                        // Disparar el evento change para que se actualice el código
                        referenceInput.dispatchEvent(new Event('change'));
                        break;
                    }
                }
                if (!optionFound) {
                    // Si no se encuentra una opción similar, crear una nueva
                    const option = new Option(description, description);
                    option.setAttribute('data-code', code);
                    referenceInput.add(option);
                    referenceInput.value = description;
                    // Disparar el evento change
                    referenceInput.dispatchEvent(new Event('change'));
                }
            } else {
                // Si es un input normal
                referenceInput.value = description;
            }
        }
        
        if (productCodeInput) {
            productCodeInput.value = code;
        }
        
        // Notificar al usuario
        Swal.fire({
            icon: 'success',
            title: 'Producto seleccionado',
            text: 'Se ha seleccionado el producto para la garantía',
            timer: 1500,
            showConfirmButton: false
        });
    }
});
