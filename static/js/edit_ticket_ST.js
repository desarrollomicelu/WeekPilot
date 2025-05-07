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
 * @returns {string} Número sin formatear
 */
function formatNumberWithThousands(number) {
    // Si no es un valor válido, devolver 0
    if (number === undefined || number === null || isNaN(number)) return '0';

    // Convertir a string sin formateo
    if (typeof number === 'string') {
        // Eliminar puntos y comas existentes para evitar problemas
        number = number.replace(/\./g, '').replace(/,/g, '').replace(/\s/g, '');
    }

    // Devolver el número como string sin formateo
    return number.toString();
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

    // Obtener el valor sin formato
    let rawValue = input.value.replace(/\./g, '');

    // Asignar valor sin formateo
    if (rawValue) {
        input.value = rawValue;
    } else {
        input.value = '0';
    }
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
    // Importante: NO truncar ni dividir por punto decimal
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

    // Obtener el valor sin formato
    let rawValue = input.value.replace(/\./g, '');

    // Formatear valor (asegurarse de preservar todos los dígitos)
    if (rawValue) {
        input.value = formatNumberWithThousands(rawValue);
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
            console.log(`Sumando fila ${index + 1}: ${input.value} (${rowTotal}), Acumulado: ${spareTotal}`);
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
 * Configura los eventos de formateo para todos los campos numéricos
 */
function setupNumberFormatting() {
    // Formatear campos de valor de servicio, repuestos y total
    const serviceValueInput = document.getElementById('service_value');
    const spareValueInput = document.getElementById('spare_value');
    const totalInput = document.getElementById('total');

    // Aplicar formato inicial
    if (serviceValueInput) {
        applyThousandsFormatting(serviceValueInput);
        serviceValueInput.addEventListener('input', function () {
            applyThousandsFormatting(this);
            updateTotals();
        });
    }

    if (spareValueInput) {
        applyThousandsFormatting(spareValueInput);
    }

    if (totalInput) {
        applyThousandsFormatting(totalInput);
    }

    // Configurar formateo para campos de valor unitario en filas existentes
    document.querySelectorAll('.part-unit-value').forEach(input => {
        applyThousandsFormatting(input);
        input.addEventListener('input', function () {
            applyThousandsFormatting(this);
            const row = this.closest('.part-row');
            if (row) {
                editPartTotal(row);
            }
        });
    });

    // Configurar eventos para campos de cantidad
    document.querySelectorAll('.part-quantity').forEach(input => {
        input.addEventListener('input', function () {
            const row = this.closest('.part-row');
            if (row) {
                editPartTotal(row);
            }
        });
    });
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
    technicianSelect.addEventListener('change', function () {
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
 * Configura la tabla de repuestos y sus eventos
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
    console.log(`Configurando ${existingRows.length} filas de repuestos existentes`);

    existingRows.forEach(row => {
        setupRowCalculations(row);
    });
}

/**
 * Configura los cálculos y eventos para una fila de repuesto
 * @param {HTMLElement} row - Fila a configurar
 */
function setupRowCalculations(row) {
    const quantityInput = row.querySelector('input[name="part_quantity[]"]');
    const unitPriceInput = row.querySelector('.part-unit-value');
    const totalPriceInput = row.querySelector('.part-total-value');
    const removeBtn = row.querySelector('.remove-part');
    const selectBtn = row.querySelector('.select-part');
    const searchPartsModal = document.getElementById('searchPartsModal');

    if (!quantityInput || !unitPriceInput || !totalPriceInput) return;

    // Formatear valores iniciales si no están formateados
    if (unitPriceInput.value && !unitPriceInput.value.includes('.')) {
        unitPriceInput.value = formatNumberWithThousands(unitPriceInput.value);
    }

    if (totalPriceInput.value && !totalPriceInput.value.includes('.')) {
        totalPriceInput.value = formatNumberWithThousands(totalPriceInput.value);
    }

    function calculateRowTotal() {
        const quantity = parseInt(quantityInput.value) || 0;
        const unitPrice = unformatNumber(unitPriceInput.value);
        const total = quantity * unitPrice;
        totalPriceInput.value = formatNumberWithThousands(total);
        updateTotals();
    }

    // Calcular el total de la fila al inicio
    calculateRowTotal();

    // Configurar eventos para el input de precio unitario
    unitPriceInput.addEventListener('input', function () {
        applyThousandsFormatting(this);
        calculateRowTotal();
    });

    // Eventos para el input de cantidad
    quantityInput.addEventListener('input', calculateRowTotal);
    quantityInput.addEventListener('blur', function () {
        if (!this.value || parseInt(this.value) < 1) {
            this.value = '1';
            calculateRowTotal();
        }
    });

    // Configurar eliminación de fila
    if (removeBtn) {
        removeBtn.addEventListener('click', function () {
            confirmRemoveRow(row);
        });
    }

    // Configurar botón de búsqueda de repuestos
    if (selectBtn && searchPartsModal) {
        selectBtn.addEventListener('click', function () {
            // Guardar referencia a la fila actual
            currentEditingRow = row;

            // Abrir modal
            const modal = new bootstrap.Modal(searchPartsModal);
            modal.show();
        });
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
    totalInput.value = formatNumberWithThousands(total);
}

/**
 * Calcula el valor total de repuestos y actualiza el total general
 */
function calculateSpareTotalValue() {
    const partsTable = document.getElementById('partsTable');
    const spareValueInput = document.getElementById('spare_value');

    if (!partsTable || !spareValueInput) return;

    let totalSpareValue = 0;

    // Sumar todos los valores totales de repuestos
    const totalValueInputs = partsTable.querySelectorAll('.part-total-value');
    totalValueInputs.forEach(input => {
        totalSpareValue += unformatNumber(input.value);
    });

    // Actualizar campo de valor total de repuestos
    spareValueInput.value = formatNumberWithThousands(totalSpareValue);

    // Actualizar el total general
    updateTotal();
}

/**
 * Confirma eliminación de fila de repuesto
 * @param {HTMLElement} row - Fila a eliminar 
 */
function confirmRemoveRow(row) {
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
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            try {
                // Obtener referencia a la tabla de partes
                const partsTable = document.getElementById('partsTable');
                const tbody = partsTable.querySelector('tbody');

                // Eliminar la fila
                row.remove();

                // Si no quedan filas, mostrar mensaje de "No hay repuestos"
                const remainingRows = tbody.querySelectorAll('.part-row');
                if (remainingRows.length === 0) {
                    const emptyRow = document.createElement('tr');
                    emptyRow.id = 'noPartsRow';
                    emptyRow.innerHTML = `
                        <td colspan="5" class="text-center py-4">
                            <i class="fas fa-box-open fa-3x text-muted mb-3"></i>
                            <p class="text-muted mb-0">No se han agregado repuestos para este servicio.</p>
                        </td>
                    `;
                    tbody.appendChild(emptyRow);
                }

                // Recalcular totales
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
 * Agrega una nueva fila de repuesto a la tabla
 * @param {Object|null} partData - Datos del repuesto (opcional)
 */
function addPartRow(partData = null) {
    const partsTable = document.getElementById('partsTable');
    if (!partsTable) return;

    const tbody = partsTable.querySelector('tbody');
    const noPartsRow = document.getElementById('noPartsRow');

    // Ocultar fila de "No hay repuestos" si existe
    if (noPartsRow) {
        noPartsRow.remove();
    }

    // Obtener template
    const template = document.getElementById('partRowTemplate');
    if (!template) {
        console.error('Part row template not found');
        showToast('error', 'Error: Plantilla de repuesto no encontrada');
        return;
    }

    // Clonar template
    const newRow = document.importNode(template.content, true).querySelector('tr');
    newRow.classList.add('part-row');

    // Agregar fila a la tabla
    tbody.appendChild(newRow);

    // Si hay datos de repuesto, llenar la fila
    if (partData) {
        const select = newRow.querySelector('select[name="spare_part_code[]"]');
        const unitValueInput = newRow.querySelector('.part-unit-value');

        if (select) {
            // Buscar si ya existe la opción
            let option = Array.from(select.options).find(opt => opt.value === partData.code);

            // Si no existe, crearla
            if (!option) {
                option = new Option(`${partData.code} - ${partData.description}`, partData.code);
                select.appendChild(option);
            }

            // Seleccionar la opción
            select.value = partData.code;
        }

        if (unitValueInput) {
            unitValueInput.value = formatNumberWithThousands(partData.price || 0);
        }
    }

    // Configurar eventos y cálculos para la nueva fila
    setupRowCalculations(newRow);

    // Mostrar notificación
    showToast('success', 'Repuesto agregado correctamente', 'top-end', 2000);

    return newRow;
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

    // Hacer petición AJAX al servidor
    fetch('/search_spare_parts', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-Requested-With': 'XMLHttpRequest'
        },
        body: `search=${encodeURIComponent(term)}`
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error en la búsqueda: ${response.status}`);
            }
            return response.json();
        })
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
        card.style.cursor = 'pointer';

        // Agregar contenido a la tarjeta
        card.innerHTML = `
            <div class="card-body p-3">
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <h6 class="card-title mb-0 fw-bold">${highlightSearchTerm(part.description, term)}</h6>
                    <span class="badge bg-primary ms-2">Cód: ${highlightSearchTerm(part.code, term)}</span>
                </div>
                <div class="d-flex justify-content-between align-items-center mt-2">
                    <span class="text-success fw-bold">${part.price && part.price != '0' ? formatNumberWithThousands(part.price) : ''}</span>
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
        card.addEventListener('click', function () {
            const partData = {
                code: this.dataset.code,
                description: this.dataset.description,
                price: this.dataset.price,
                stock: part.stock || 0
            };
            selectPart(partData);
        });

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

        // Actualizar precio unitario
        if (unitValueInput) {
            unitValueInput.value = formatNumberWithThousands(partData.price || 0);

            // Disparar evento input para recalcular
            const inputEvent = new Event('input', { bubbles: true });
            unitValueInput.dispatchEvent(inputEvent);
        }

        // Recalcular total de la fila
        editPartTotal(currentEditingRow);

        // Recalcular totales generales
        updateTotals();

        // Método simplificado para cerrar el modal
        const searchPartsModal = document.getElementById('searchPartsModal');

        // Usar jQuery si está disponible (método más confiable)
        if (typeof $ !== 'undefined' && searchPartsModal) {
            $(searchPartsModal).modal('hide');

            // Asegurarse de que el backdrop se elimine
            $('.modal-backdrop').remove();

            // Restaurar el scroll y el estado del body
            document.body.classList.remove('modal-open');
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
        }
        // Fallback a Bootstrap nativo
        else if (typeof bootstrap !== 'undefined' && searchPartsModal) {
            const modal = bootstrap.Modal.getInstance(searchPartsModal);
            if (modal) {
                modal.hide();
            }
        }

        // Mostrar notificación
        showToast('success', `Repuesto "${partData.description}" agregado correctamente`);


    } catch (error) {
        console.error("Error al seleccionar repuesto:", error);
        showToast('error', `Error al seleccionar repuesto: ${error.message}`);
    }
}




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
            console.log(`Sumando fila ${index + 1}: ${input.value} (${rowTotal}), Acumulado: ${spareTotal}`);
        });

        // Asignar el valor total de repuestos sin formateo
        spareValueInput.value = spareTotal;

        // Calcular el total general (servicio + repuestos)
        const serviceValue = unformatNumber(serviceValueInput.value) || 0;
        const totalValue = serviceValue + spareTotal;

        // Mostrar valores para depuración
        console.log(`Actualización de totales: Servicio = ${serviceValue}, Repuestos = ${spareTotal}, Total = ${totalValue}`);

        // Asignar total sin formateo
        totalInput.value = totalValue;
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

            // Asignar el valor total sin formateo
            subtotalInput.value = total;

            console.log(`Calculado subtotal para fila: Cantidad ${quantity} x Precio ${price} = ${total}`);

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
    let originalRefText = 'Sin seleccionar';

    // Verificar si hay una opción seleccionada antes de intentar acceder a sus propiedades
    if (referenceElem.selectedIndex >= 0 && referenceElem.options[referenceElem.selectedIndex]) {
        originalRefText = referenceElem.options[referenceElem.selectedIndex].text || 'Sin seleccionar';
    }

    referenceElem.addEventListener('change', function () {
        const newRef = this.value;
        let newRefText = 'Sin seleccionar';

        // Verificar si hay una opción seleccionada
        if (this.selectedIndex >= 0 && this.options[this.selectedIndex]) {
            newRefText = this.options[this.selectedIndex].text || 'Sin seleccionar';
        }

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
                    if (this.selectedIndex >= 0 && this.options[this.selectedIndex]) {
                        const selectedOption = this.options[this.selectedIndex];
                        productCodeInput.value = (selectedOption && selectedOption.getAttribute('data-code')) || '';
                    }

                    showToast('success', `Referencia cambiada a "${newRefText}"`, 'top-end');
                } else {
                    // Revertir al valor original si se cancela
                    this.value = originalRef;
                    $(this).trigger('change'); // Para Select2
                }
            });
        } else {
            // Actualizar el código del producto sin confirmación si es la misma referencia
            if (this.selectedIndex >= 0 && this.options[this.selectedIndex]) {
                const selectedOption = this.options[this.selectedIndex];
                productCodeInput.value = (selectedOption && selectedOption.getAttribute('data-code')) || '';
            }
        }
    });

    // Inicialización al cargar la página
    if (referenceElem.value && referenceElem.selectedIndex >= 0) {
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
    commentTextarea.addEventListener('input', function () {
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
                errors.push(errorDetail || 'Error en el servidor.')
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
                        // Asegurarse de que el valor sea numérico
                        const numericValue = parseInt(input.value) || 0;
                        input.value = numericValue;

                        console.log(`Campo ${fieldName}: valor preparado = ${numericValue}`);
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
    searchModal.addEventListener('shown.bs.modal', function () {
        searchInput.value = '';
        searchInput.focus();
        document.getElementById('initialSearchMessage').style.display = 'block';
        document.getElementById('searchResultsLoader').style.display = 'none';
        document.getElementById('noResultsMessage').style.display = 'none';
        document.getElementById('searchResultsList').style.display = 'none';
    });

    // Configurar evento de búsqueda
    searchInput.addEventListener('input', function () {
        const query = this.value.trim();

        if (window.searchTimeout) {
            clearTimeout(window.searchTimeout);
        }

        window.searchTimeout = setTimeout(function () {
            if (query.length >= 3) {
                searchParts(query);
            } else {
                document.getElementById('initialSearchMessage').style.display = 'block';
                document.getElementById('searchResultsLoader').style.display = 'none';
                document.getElementById('noResultsMessage').style.display = 'none';
                document.getElementById('searchResultsList').style.display = 'none';
            }
        }, 300);
    });

    // Búsqueda al presionar Enter
    searchInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && this.value.trim().length >= 3) {
            e.preventDefault();
            searchParts(this.value.trim());
        }
    });

    // Botón para limpiar búsqueda
    clearBtn.addEventListener('click', function () {
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
        partsTable.addEventListener('click', function (e) {
            const selectPartBtn = e.target.closest('.select-part');
            if (selectPartBtn) {
                // Guardar referencia a la fila actual
                currentEditingRow = selectPartBtn.closest('tr');
                // Mostrar el modal
                const bsModal = new bootstrap.Modal(searchModal);
                bsModal.show();
            }
        });
    }
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

    // IMPORTANTE: Corregir el valor del servicio si tiene dos ceros adicionales
    if (serviceValueInput && serviceValueInput.value) {
        console.log("Valor original de servicio:", serviceValueInput.value);
        
        // Eliminar cualquier formato existente
        let rawValue = serviceValueInput.value.replace(/\./g, '').replace(/,/g, '');
        
        // Si el valor termina en dos ceros, dividir por 100
        if (rawValue.endsWith('00') && rawValue.length > 2) {
            rawValue = Math.floor(parseInt(rawValue, 10) / 100);
        } else {
            rawValue = parseInt(rawValue, 10) || 0;
        }
        
        // Formatear y asignar el valor corregido
        serviceValueInput.value = formatNumberWithThousands(rawValue);
        console.log("Valor corregido de servicio:", serviceValueInput.value);
    }

    // Formatear valores de repuestos y total
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
        serviceValueInput.addEventListener('input', function () {
            applyThousandsFormatting(this);
            updateTotals();
        });
    }

    // El resto del código de inicialización permanece igual...
    
    // 5. Configurar autocompletado y restricciones
    setupProductCodeUpdate();

    // 6. Configurar gestión de problemas
    setupProblemSearch();
    setupProblemButtons();

    // 7. Configurar gestión de repuestos
    setupExistingRows();

    // 8. Configurar gestión de repuestos
    setupPartsSearch();

    // 9. Configurar formato de números
    setupNumberFormatting();

    // IMPORTANTE: Remover cualquier event listener previo antes de agregar uno nuevo
    const addPartBtn = document.getElementById('addPartBtn');
    if (addPartBtn) {
        // Clonar el botón para eliminar todos los event listeners
        const oldBtn = addPartBtn;
        const newBtn = oldBtn.cloneNode(true);
        oldBtn.parentNode.replaceChild(newBtn, oldBtn);

        // Agregar el nuevo event listener
        newBtn.addEventListener('click', function () {
            addNewPartRow();
        });
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

        console.log(`Fila ${index + 1}: Valor unitario original: ${unitValueInput ? unitValueInput.value : 'N/A'}`);

        // IMPORTANTE: Formatear correctamente los valores quitando decimales
        if (unitValueInput && unitValueInput.value) {
            // Aplicamos formateo para eliminar decimales y agregar separadores de miles
            unitValueInput.value = formatNumberWithThousands(unitValueInput.value);
            console.log(`Fila ${index + 1}: Valor unitario formateado: ${unitValueInput.value}`);
        }

        if (totalValueInput && totalValueInput.value) {
            // Aplicamos formateo para eliminar decimales y agregar separadores de miles  
            totalValueInput.value = formatNumberWithThousands(totalValueInput.value);
            console.log(`Fila ${index + 1}: Valor total formateado: ${totalValueInput.value}`);
        }

        // Configurar eventos para la fila existente
        setupRowCalculations(row);
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
    setupRowCalculations(newRow);

    // Mostrar mensaje de éxito
    showToast('success', 'Repuesto agregado correctamente', 'top-end');

    console.log("Fila de repuesto agregada exitosamente");
    return newRow;
}


// Variable global para la fila seleccionada
let currentEditingRow = null;

// Inicialización cuando el documento esté listo
document.addEventListener('DOMContentLoaded', function () {
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

    // Configurar filas existentes
    setupExistingRows();
});




