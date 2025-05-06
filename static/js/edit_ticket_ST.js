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
        // Si contiene punto decimal, tomar solo la parte entera
        if (number.includes('.')) {
            number = number.split('.')[0];
        }
        // Eliminar puntos y comas existentes para evitar problemas con diferentes formatos
        number = number.replace(/\./g, '').replace(/,/g, '').replace(/\s/g, '');
        number = parseInt(number, 10) || 0;
    } else if (typeof number === 'number') {
        // Si es número, truncar cualquier parte decimal
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
    
    // Si contiene punto decimal, tomar solo la parte entera
    let valueToProcess = strValue;
    if (valueToProcess.includes('.')) {
        valueToProcess = valueToProcess.split('.')[0];
    }
    
    // Eliminar todos los puntos y comas (separadores de miles)
    return parseInt(valueToProcess.replace(/\./g, '').replace(/,/g, ''), 10) || 0;
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

    if (!spareValueInput || !serviceValueInput || !totalInput) {
        console.warn("No se encontraron los campos de valores totales");
        return;
    }

    try {
    // Calcular el total de repuestos sumando los valores de cada fila
    let spareTotal = 0;
        document.querySelectorAll('.part-total-value').forEach((input, index) => {
            const rowTotal = unformatNumber(input.value);
            spareTotal += rowTotal;
            console.log(`Sumando fila ${index+1}: ${input.value} (${rowTotal}), Acumulado: ${spareTotal}`);
    });

    // Formatear y asignar el valor total de repuestos
    spareValueInput.value = formatNumberWithThousands(spareTotal);
        
    // Calcular el total general (servicio + repuestos)
    const serviceValue = unformatNumber(serviceValueInput.value) || 0;
        const totalValue = serviceValue + spareTotal;
        
        // Mostrar valores para depuración
        console.log(`Actualización de totales: Servicio = ${serviceValue}, Repuestos = ${spareTotal}, Total = ${totalValue}`);
        
        // Asignar total formateado
        totalInput.value = formatNumberWithThousands(totalValue);
    } catch (error) {
        console.error("Error al actualizar totales:", error);
    }
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
        try {
            // Convertir a números, quitando formatos
        const quantity = parseInt(quantityInput.value) || 0;
        const price = unformatNumber(priceInput.value) || 0;
            
            // Calcular total sin decimales
        const total = quantity * price;
        
            // Formatear y asignar el valor total
        subtotalInput.value = formatNumberWithThousands(total);
            
            console.log(`Calculado subtotal para fila: Cantidad ${quantity} x Precio ${price} = ${total} → ${subtotalInput.value}`);
        
        // Actualizar totales generales
        updateTotals();
        } catch (error) {
            console.error("Error al calcular total de la fila:", error);
        }
    } else {
        console.warn("Falta alguno de los inputs necesarios para calcular el total de la fila");
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
            try {
            const partsTable = document.getElementById('partsTable');
            const partsTableBody = partsTable.querySelector('tbody');

                // Obtener información del repuesto para el mensaje
                const selectElement = row.querySelector('select[name="spare_part_code[]"]');
                const partDescription = selectElement && selectElement.selectedOptions[0] ? 
                    selectElement.selectedOptions[0].text : 'Repuesto';

                // Eliminar la fila
            row.remove();
                console.log(`Repuesto eliminado: ${partDescription}`);
                
                // Actualizar índices y totales
            editRowIndices();
            updateTotals();

            // Si no quedan filas, mostrar mensaje de "No hay repuestos"
                const remainingRows = partsTableBody.querySelectorAll('.part-row');
                if (remainingRows.length === 0) {
                const emptyRow = document.createElement('tr');
                emptyRow.id = 'noPartsRow';
                    emptyRow.innerHTML = `
                        <td colspan="5" class="text-center py-4">
                            <i class="fas fa-box-open fa-3x text-muted mb-3"></i>
                            <p class="text-muted mb-0">No se han agregado repuestos para este servicio.</p>
                        </td>
                    `;
                partsTableBody.appendChild(emptyRow);
                    console.log("No hay repuestos, mostrando mensaje vacío");
                }

                showToast('success', `Repuesto "${partDescription}" eliminado correctamente`, 'top-end');
            } catch (error) {
                console.error("Error al eliminar repuesto:", error);
                showToast('error', 'Error al eliminar el repuesto', 'top-end');
            }
        }
    });
}

/**
 * Configura los eventos para las filas de repuestos existentes
 * y formatea correctamente los valores numéricos
 */
function setupExistingRows() {
    const partsTable = document.getElementById('partsTable');
    if (!partsTable) {
        console.log("No se encontró la tabla de repuestos");
        return;
    }

    const partsTableBody = partsTable.querySelector('tbody');
    const existingRows = partsTableBody.querySelectorAll('.part-row');

    console.log(`Configurando ${existingRows.length} filas de repuestos existentes`);

    existingRows.forEach((row, index) => {
        // Obtener referencias a los campos de la fila
        const select = row.querySelector('select[name="spare_part_code[]"]');
        const unitValueInput = row.querySelector('input[name="part_unit_value[]"]');
        const totalValueInput = row.querySelector('input[name="part_total_value[]"]');
        const quantityInput = row.querySelector('input[name="part_quantity[]"]');

        console.log(`Fila ${index+1}: Valor unitario original: ${unitValueInput ? unitValueInput.value : 'N/A'}`);
        
        // IMPORTANTE: Formatear correctamente los valores quitando decimales
        if (unitValueInput && unitValueInput.value) {
            // Aplicamos formateo para eliminar decimales y agregar separadores de miles
            unitValueInput.value = formatNumberWithThousands(unitValueInput.value);
            console.log(`Fila ${index+1}: Valor unitario formateado: ${unitValueInput.value}`);
        }

        if (totalValueInput && totalValueInput.value) {
            // Aplicamos formateo para eliminar decimales y agregar separadores de miles  
            totalValueInput.value = formatNumberWithThousands(totalValueInput.value);
            console.log(`Fila ${index+1}: Valor total formateado: ${totalValueInput.value}`);
        }

        // Configurar eventos para la fila existente
        // 1. Evento para select de repuestos
        if (select) {
            select.addEventListener('change', function() {
                console.log(`Cambio en select de repuesto, fila ${index+1}`);
                editPartTotal(row);
            });
        }
        
        // 2. Evento para cantidad
        if (quantityInput) {
            quantityInput.addEventListener('input', function() {
                console.log(`Cambio en cantidad, fila ${index+1}: ${this.value}`);
                editPartTotal(row);
            });
        }
        
        // 3. Evento para valor unitario
        if (unitValueInput) {
            unitValueInput.addEventListener('input', function() {
                console.log(`Cambio en valor unitario, fila ${index+1}: ${this.value}`);
                applyThousandsFormatting(this);
                editPartTotal(row);
            });
        }
        
        // 4. Evento para el botón de eliminar
        const removeBtn = row.querySelector('.remove-part');
        if (removeBtn) {
            removeBtn.addEventListener('click', function() {
                console.log(`Eliminando fila ${index+1}`);
                removePartRow(row);
            });
        }
    });

    // Actualizar totales iniciales después de formatear todas las filas
    updateTotals();
    console.log("Filas de repuestos existentes configuradas correctamente");
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
        showToast('error', 'Error: No se encontró la plantilla para nuevos repuestos');
        return;
    }
    
    // Crear nueva fila a partir del template
    const newRow = template.content.cloneNode(true).querySelector('tr');
    newRow.classList.add('part-row');
    
    // Verificar si la fila tiene todos los elementos necesarios
    const select = newRow.querySelector('select[name="spare_part_code[]"]');
    const unitValueInput = newRow.querySelector('.part-unit-value');
    const quantityInput = newRow.querySelector('.part-quantity');
    const totalValueInput = newRow.querySelector('.part-total-value');
    
    if (!select || !unitValueInput || !quantityInput || !totalValueInput) {
        console.error("La plantilla de fila no contiene todos los elementos necesarios");
        showToast('error', 'Error: La plantilla de fila está incompleta');
        return;
    }
    
    // Inicializar valores
    if (unitValueInput) {
        unitValueInput.value = '0';
        // Formatear con separador de miles
        unitValueInput.value = formatNumberWithThousands(unitValueInput.value);
    }
    
    if (totalValueInput) {
        totalValueInput.value = '0';
        // Formatear con separador de miles
        totalValueInput.value = formatNumberWithThousands(totalValueInput.value);
    }
    
    // Agregar la fila al cuerpo de la tabla
    tbody.appendChild(newRow);
    
    // Configurar eventos para la nueva fila
    // 1. Evento para cantidad
    if (quantityInput) {
        quantityInput.value = '1';
        quantityInput.addEventListener('input', function() {
            editPartTotal(newRow);
        });
    }
    
    // 2. Evento para valor unitario
    if (unitValueInput) {
        unitValueInput.addEventListener('input', function() {
            applyThousandsFormatting(this);
            editPartTotal(newRow);
        });
    }
    
    // 3. Evento para el botón de eliminar
    const removeBtn = newRow.querySelector('.remove-part');
    if (removeBtn) {
        removeBtn.addEventListener('click', function() {
            removePartRow(newRow);
        });
    }
    
    // 4. Configurar select de repuestos
    if (select) {
        select.addEventListener('change', function() {
            // Si hay un cambio manual en el select, actualizar los valores
            const selectedOption = this.options[this.selectedIndex];
            if (selectedOption && selectedOption.value) {
                // Aquí podríamos buscar información adicional del repuesto si fuera necesario
                editPartTotal(newRow);
            }
        });
    }
    
    // Actualizar índices de las filas
    editRowIndices();
    
    // Calcular totales
    updateTotals();
    
    // Mostrar mensaje de éxito
    showToast('success', 'Repuesto agregado correctamente', 'top-end');
    
    console.log("Fila de repuesto agregada exitosamente");
    return newRow;
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
 * Actualiza el resumen de validación con los errores
 * @param {Array} errors - Lista de mensajes de error
 * @param {boolean} show - Indica si se debe mostrar el área de errores
 */
function updateValidationSummary(errors = [], show = true) {
    const validationSummary = document.getElementById('validation-summary');
    const validationErrors = document.getElementById('validation-errors');
    
    if (!validationSummary || !validationErrors) return;
    
    // Limpiar errores anteriores
    validationErrors.innerHTML = '';
    
    // Agregar nuevos errores
    if (errors.length > 0) {
        errors.forEach(error => {
            const li = document.createElement('li');
            li.textContent = error;
            validationErrors.appendChild(li);
        });
        
        // Mostrar el área de errores
        if (show) {
            validationSummary.style.display = 'block';
            // Desplazarse al área de errores
            validationSummary.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
            validationSummary.style.display = 'none';
        }
    } else {
        // Ocultar el área de errores si no hay errores
        validationSummary.style.display = 'none';
    }
}

/**
 * Actualiza el estado del formulario (procesando, éxito, error)
 * @param {string} status - Estado: 'processing', 'success', 'error'
 * @param {string} message - Mensaje a mostrar
 */
function updateFormStatus(status, message) {
    const formStatusArea = document.getElementById('form-status-area');
    const formStatusTitle = document.getElementById('form-status-title');
    const formStatusMessage = document.getElementById('form-status-message');
    const formStatusSpinner = document.getElementById('form-status-spinner');
    
    if (!formStatusArea || !formStatusTitle || !formStatusMessage) return;
    
    // Configurar según el estado
    switch (status) {
        case 'processing':
            formStatusArea.className = 'mb-3';
            formStatusTitle.textContent = 'Procesando información';
            formStatusMessage.textContent = message || 'Por favor, espere mientras se procesa la información...';
            if (formStatusSpinner) formStatusSpinner.style.display = 'block';
            formStatusArea.style.display = 'block';
            break;
        case 'success':
            formStatusArea.className = 'mb-3 border-success';
            formStatusTitle.textContent = '¡Operación exitosa!';
            formStatusTitle.className = 'mb-1 text-success';
            formStatusMessage.textContent = message || 'Los cambios se han guardado correctamente.';
            if (formStatusSpinner) formStatusSpinner.style.display = 'none';
            formStatusArea.style.display = 'block';
            break;
        case 'error':
            formStatusArea.className = 'mb-3 border-danger';
            formStatusTitle.textContent = 'Error en la operación';
            formStatusTitle.className = 'mb-1 text-danger';
            formStatusMessage.textContent = message || 'Ha ocurrido un error al procesar su solicitud.';
            if (formStatusSpinner) formStatusSpinner.style.display = 'none';
            formStatusArea.style.display = 'block';
            break;
        case 'hide':
            formStatusArea.style.display = 'none';
            break;
        default:
            formStatusArea.style.display = 'none';
    }
}

/**
 * Verifica si hay parámetros de error en la URL
 */
function checkForErrorParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    const errorDetail = urlParams.get('error_detail');
    
    if (error) {
        const errors = [];
        
        switch (error) {
            case 'validation':
                errors.push(errorDetail || 'Hay errores de validación en el formulario.');
                break;
            case 'client':
                errors.push(errorDetail || 'Error al procesar datos del cliente.');
                break;
            case 'ticket':
                errors.push(errorDetail || 'Error al procesar datos del ticket.');
                break;
            case 'spares':
                errors.push(errorDetail || 'Error al procesar los repuestos.');
                break;
            case 'server':
                errors.push(errorDetail || 'Error en el servidor.');
                break;
            default:
                errors.push(errorDetail || 'Ha ocurrido un error desconocido.');
        }
        
        updateValidationSummary(errors);
        
        // Mostrar mensaje de error
        updateFormStatus('error', errorDetail || 'Ha ocurrido un error al procesar la solicitud.');
    }
}

/**
 * Configura la validación y envío del formulario
 */
function setupFormSubmission() {
    const ticketForm = document.querySelector('#ticket-form');
    if (!ticketForm) return;

    ticketForm.addEventListener('submit', function (e) {
        e.preventDefault();
        console.log("Formulario enviado - Inicio de validación");
        
        // Ocultar mensajes anteriores
        updateValidationSummary([], false);
        updateFormStatus('hide');
        
        let errors = [];
        
        // Validar información del cliente (ya está en readonly, no es necesario validar)

        // Validar tipo de servicio
        const typeOfService = document.getElementById('type_of_service');
        if (typeOfService && !typeOfService.value.trim()) {
            errors.push('El tipo de servicio es requerido.');
            typeOfService.classList.add('is-invalid');
        } else if (typeOfService) {
            typeOfService.classList.remove('is-invalid');
        }

        // Validar valor del servicio
        const serviceValue = document.getElementById('service_value');
        if (serviceValue && (!serviceValue.value || isNaN(unformatNumber(serviceValue.value)) || unformatNumber(serviceValue.value) < 0)) {
            errors.push('El valor del servicio debe ser un número positivo.');
            serviceValue.classList.add('is-invalid');
        } else if (serviceValue) {
            serviceValue.classList.remove('is-invalid');
        }
        
        // Validar que se haya seleccionado al menos un problema
        const problemCheckboxes = document.querySelectorAll('.problem-checkbox:checked');
        if (problemCheckboxes.length === 0) {
            errors.push('Debe seleccionar al menos un problema.');
            document.querySelector('.form-check-container').classList.add('border-danger');
        } else {
            document.querySelector('.form-check-container').classList.remove('border-danger');
        }

        // Mostrar errores si los hay
        if (errors.length > 0) {
            console.log("Validación fallida:", errors);
            updateValidationSummary(errors);
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
                updateFormStatus('processing', 'Guardando cambios en el ticket...');

                // Desformatear los campos numéricos antes de enviar
                console.log("Desformateando campos numéricos");
                
                // Guardar valores originales para depuración
                const debugValues = {};
                
                document.querySelectorAll('#service_value, #spare_value, #total, .part-unit-value, .part-total-value')
                    .forEach(input => {
                        const fieldName = input.name || input.id;
                        const originalValue = input.value;
                        // Extraer solo los dígitos sin separadores de miles
                        const rawValue = originalValue.replace(/\./g, '');
                        
                        // Guardar para depuración
                        debugValues[fieldName] = { 
                            original: originalValue, 
                            processed: rawValue 
                        };
                        
                        // Asignar valor sin formato
                        input.value = rawValue;
                    });
                
                console.log("Valores procesados:", debugValues);

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
    console.log("Inicializando componentes de edición de ticket");

    // 4. Aplicar formato a campos numéricos globales
    const serviceValueInput = document.getElementById('service_value');
    const spareValueInput = document.getElementById('spare_value');
    const totalInput = document.getElementById('total');

    // IMPORTANTE: Formatear correctamente los valores eliminando decimales
    if (serviceValueInput && serviceValueInput.value) {
        console.log("Valor original de servicio:", serviceValueInput.value);
        serviceValueInput.value = formatNumberWithThousands(serviceValueInput.value);
        console.log("Valor formateado de servicio:", serviceValueInput.value);
    }

    if (spareValueInput && spareValueInput.value) {
        console.log("Valor original de repuestos:", spareValueInput.value);
        spareValueInput.value = formatNumberWithThousands(spareValueInput.value);
        console.log("Valor formateado de repuestos:", spareValueInput.value);
    }

    if (totalInput && totalInput.value) {
        console.log("Valor original del total:", totalInput.value);
        totalInput.value = formatNumberWithThousands(totalInput.value);
        console.log("Valor formateado del total:", totalInput.value);
    }

    // Aplicar eventos de formateo a los campos
    if (serviceValueInput) {
        applyThousandsFormatting(serviceValueInput);
        serviceValueInput.addEventListener('input', function() {
            updateTotals();
        });
    }

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

    // 14. Configurar la búsqueda de repuestos
    setupPartsSearch();
}

/**
 * Configura los eventos para la búsqueda de repuestos
 */
function setupPartsSearch() {
    // Configuración del modal de búsqueda
    const searchModal = document.getElementById('searchPartsModal');
    const searchInput = document.getElementById('modalPartSearch');
    const clearBtn = document.getElementById('clearSearch');
    
    if (!searchModal || !searchInput || !clearBtn) {
        console.error("No se encontraron elementos necesarios para la búsqueda de repuestos");
        return;
    }
    
    // Limpiar búsqueda al abrir el modal
    searchModal.addEventListener('shown.bs.modal', function() {
        searchInput.value = '';
        searchInput.focus();
            document.getElementById('initialSearchMessage').style.display = 'block';
            document.getElementById('searchResultsLoader').style.display = 'none';
            document.getElementById('noResultsMessage').style.display = 'none';
            document.getElementById('searchResultsList').style.display = 'none';
    });
    
    // Configurar evento de búsqueda
    searchInput.addEventListener('input', function() {
        const query = this.value.trim();
        
        if (window.searchTimeout) {
            clearTimeout(window.searchTimeout);
        }
        
        window.searchTimeout = setTimeout(function() {
            if (query.length >= 3) {
                performPartsSearch(query);
            } else {
                document.getElementById('initialSearchMessage').style.display = 'block';
                document.getElementById('searchResultsLoader').style.display = 'none';
                document.getElementById('noResultsMessage').style.display = 'none';
                document.getElementById('searchResultsList').style.display = 'none';
            }
        }, 300);
    });
    
    // Búsqueda al presionar Enter
    searchInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && this.value.trim().length >= 3) {
            e.preventDefault();
            performPartsSearch(this.value.trim());
        }
    });
    
    // Botón para limpiar búsqueda
    clearBtn.addEventListener('click', function() {
        searchInput.value = '';
        searchInput.focus();
        document.getElementById('initialSearchMessage').style.display = 'block';
        document.getElementById('searchResultsLoader').style.display = 'none';
        document.getElementById('noResultsMessage').style.display = 'none';
        document.getElementById('searchResultsList').style.display = 'none';
    });
    
    // Delegar eventos para botones de selección de repuestos en la tabla
    const partsTable = document.getElementById('partsTable');
    if (partsTable) {
        partsTable.addEventListener('click', function(e) {
            const selectPartBtn = e.target.closest('.select-part');
            if (selectPartBtn) {
                // Guardar referencia a la fila actual
                selectedRow = selectPartBtn.closest('tr');
                // Mostrar el modal
                const bsModal = new bootstrap.Modal(searchModal);
                bsModal.show();
            }
        });
    }
}

/**
 * Realiza la búsqueda de repuestos en el servidor
 * @param {string} query - Término de búsqueda
 */
function performPartsSearch(query) {
    // Mostrar loader
    document.getElementById('initialSearchMessage').style.display = 'none';
    document.getElementById('searchResultsLoader').style.display = 'block';
    document.getElementById('noResultsMessage').style.display = 'none';
    document.getElementById('searchResultsList').style.display = 'none';
    document.getElementById('searchResultsList').innerHTML = '';
    
    console.log('Buscando repuestos con término:', query);
    
    // Realizar petición AJAX usando la ruta específica para búsqueda de repuestos
    fetch('/technical_service/search_spare_parts', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-Requested-With': 'XMLHttpRequest'
        },
        body: `search=${encodeURIComponent(query)}`
    })
        .then(response => {
            if (!response.ok) {
            throw new Error(`Error en la búsqueda: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
        console.log('Resultados de búsqueda:', data);
        // Los resultados vienen dentro del campo 'parts'
        const parts = data.parts || [];
        
        if (parts.length === 0) {
            document.getElementById('searchResultsLoader').style.display = 'none';
            document.getElementById('noResultsMessage').style.display = 'block';
            return;
        }
        
        displaySearchResults(parts, query);
    })
    .catch(error => {
        console.error('Error en la búsqueda de repuestos:', error);
        document.getElementById('searchResultsLoader').style.display = 'none';
        document.getElementById('noResultsMessage').style.display = 'block';
        const errorMessage = document.querySelector('#noResultsMessage p');
        if (errorMessage) {
            errorMessage.textContent = 'Error al buscar repuestos. Intente nuevamente.';
        }
    });
}

/**
 * Muestra los resultados de la búsqueda de repuestos
 * @param {Array} results - Resultados de la búsqueda
 * @param {string} query - Término de búsqueda
 */
function displaySearchResults(results, query) {
    const resultsContainer = document.getElementById('searchResultsList');
    
            // Ocultar loader
            document.getElementById('searchResultsLoader').style.display = 'none';
            
    // Limpiar resultados anteriores
    resultsContainer.innerHTML = '';
            
            // Verificar si hay resultados
    if (!results || results.length === 0) {
                document.getElementById('noResultsMessage').style.display = 'block';
                return;
            }
            
            // Mostrar resultados
    resultsContainer.style.display = 'block';
    
    // Crear elementos para cada resultado
    results.forEach(part => {
        const resultItem = document.createElement('div');
        resultItem.className = 'search-result-item mb-2 cursor-pointer';
        resultItem.dataset.code = part.code;
        resultItem.dataset.description = part.description;
        resultItem.dataset.price = part.price || 0;
        resultItem.style.cursor = 'pointer';
        
        // Resaltar términos de búsqueda en el texto
        const highlightedCode = part.code.replace(
            new RegExp(query, 'gi'), 
            match => `<span class="highlight">${match}</span>`
        );
        
        const highlightedDesc = part.description.replace(
            new RegExp(query, 'gi'), 
            match => `<span class="highlight">${match}</span>`
        );
        
        resultItem.innerHTML = `
            <div class="card search-result-card">
                    <div class="card-body p-2">
                    <div class="d-flex justify-content-between">
                            <div>
                            <h6 class="mb-0">${highlightedCode || part.code}</h6>
                            <p class="mb-0 small text-muted">${highlightedDesc || part.description}</p>
                            </div>
                            <div class="text-end">
                            <strong class="text-primary">$${formatNumberWithThousands(part.price || 0)}</strong>
                            <div>
                                <span class="badge ${part.stock > 0 ? 'bg-success' : 'bg-danger'}">
                                    Stock: ${part.stock || 0}
                                </span>
                            </div>
                        </div>
                            </div>
                        </div>
                    </div>
                `;
                
        // Agregar evento de clic para seleccionar el repuesto
        resultItem.addEventListener('click', function() {
            selectPartFromSearch(this);
        });
        
        // Agregar evento de teclado (Enter) para accesibilidad
        resultItem.setAttribute('tabindex', '0');
        resultItem.addEventListener('keydown', function(event) {
            if (event.key === 'Enter' || event.keyCode === 13) {
                selectPartFromSearch(this);
            }
        });
        
        resultsContainer.appendChild(resultItem);
    });
    
    // Añadir estilos específicos para resaltar los resultados
    const style = document.createElement('style');
    style.textContent = `
        .highlight {
            background-color: #ffc107;
            padding: 0 2px;
            border-radius: 2px;
            font-weight: bold;
        }
        .search-result-item:hover .card {
            border-color: #007bff;
            box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
        }
        .search-result-item:focus .card {
            outline: none;
            border-color: #007bff;
            box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
        }
    `;
    
    // Eliminar estilo anterior si existe
    const oldStyle = document.getElementById('search-results-style');
    if (oldStyle) {
        oldStyle.remove();
    }
    
    // Añadir nuevo estilo
    style.id = 'search-results-style';
    document.head.appendChild(style);
    
    // Enfocar el primer resultado para navegación con teclado
    const firstResult = resultsContainer.querySelector('.search-result-item');
            if (firstResult) {
                firstResult.focus();
            }
}

/**
 * Selecciona un repuesto de los resultados de búsqueda
 * @param {HTMLElement} item - Elemento seleccionado
 */
function selectPartFromSearch(item) {
    if (!selectedRow) {
        showToast('error', 'No se ha seleccionado una fila para agregar el repuesto');
        return;
    }
    
    const code = item.dataset.code;
    const description = item.dataset.description;
    const price = parseFloat(item.dataset.price || 0);
    
    console.log(`Seleccionando repuesto: ${code} - ${description} ($${price})`);
    
    // Buscar o crear la opción en el select
        const select = selectedRow.querySelector('select[name="spare_part_code[]"]');
        if (select) {
        // Verificar si ya existe la opción
            let option = Array.from(select.options).find(opt => opt.value === code);
            
        // Si no existe, crearla
            if (!option) {
            option = new Option(`${code} - ${description}`, code);
            select.appendChild(option);
            console.log(`Opción creada para: ${code} - ${description}`);
            }
            
            // Seleccionar la opción
            select.value = code;
        
        // Si hay evento change personalizado, dispararlo
        select.dispatchEvent(new Event('change'));
    }
    
    // Actualizar precio unitario
    const unitValueInput = selectedRow.querySelector('.part-unit-value');
    if (unitValueInput) {
        // Formatear precio con separadores de miles
        unitValueInput.value = formatNumberWithThousands(price);
        console.log(`Precio actualizado: ${unitValueInput.value}`);
    }
    
    // Asegurar que la cantidad sea al menos 1
    const quantityInput = selectedRow.querySelector('.part-quantity');
    if (quantityInput) {
        const qty = parseInt(quantityInput.value) || 0;
        if (qty <= 0) {
            quantityInput.value = '1';
            console.log('Cantidad ajustada a 1');
        }
    }
    
    // Recalcular total de la fila
    editPartTotal(selectedRow);
    
    // Recalcular totales generales
    updateTotals();
    
    // Cerrar modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('searchPartsModal'));
    if (modal) {
        modal.hide();
    } else {
        console.warn('No se pudo encontrar la instancia del modal');
        // Intentar cerrar de otra manera
        $('#searchPartsModal').modal('hide');
    }
    
    // Mostrar notificación
    showToast('success', `Repuesto "${description}" agregado correctamente`);
}

// Inicialización cuando el documento esté listo
document.addEventListener('DOMContentLoaded', function() {
    console.log("Documento cargado - Inicializando funcionalidad de edición de ticket");
    
    // Inicializar las funciones principales
    initializeEditTicket();
    
    // Verificar parámetros de error en la URL
    checkForErrorParams();
    
    // Verificar si hay éxito en la URL
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    
    if (success === 'true') {
        updateFormStatus('success', 'Los cambios se han guardado correctamente.');
    }
});

// Variable global para la fila seleccionada
let selectedRow = null;


