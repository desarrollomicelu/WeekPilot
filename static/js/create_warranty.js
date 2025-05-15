/*****************************************************
 * create_warranty.js
 * Funciones para la creación de garantías de servicio
 *****************************************************/

// Variables globales
var clientInvoices = [];

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
            timerProgressBar: true
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
 * Muestra las facturas del cliente en el selector
 * @param {Array} invoices - Lista de facturas asociadas al cliente
 */
function showInvoices(invoices) {
    console.log("Mostrando facturas:", invoices);

    // Guardar las facturas en variable global
    clientInvoices = invoices || [];

    // Selector de facturas
    const invoiceSelector = document.getElementById('invoice_selector');
    const invoiceDropdownSection = document.getElementById('invoiceDropdownSection');

    // Limpiar y configurar el selector de facturas
    if (invoiceSelector) {
        // Limpiar opciones previas
        invoiceSelector.innerHTML = '<option value="">Seleccione una factura</option>';

        // Si hay facturas, mostrar la sección y llenar el selector
        if (clientInvoices.length > 0) {
            invoiceDropdownSection.style.display = 'block';

            // Crear una opción para cada factura
            clientInvoices.forEach((invoice, index) => {
                const option = document.createElement('option');
                option.value = index;

                // Formatear descripción de la factura
                const serie = invoice.numero || 'S/N';
                const referencia = invoice.referencia || 'Sin referencia';
                const fecha = invoice.fecha_formateada || 'Sin fecha';

                option.textContent = `${serie} - ${referencia} (${fecha})`;
                invoiceSelector.appendChild(option);
            });

            // Eliminar manejadores previos y añadir el nuevo
            invoiceSelector.removeEventListener('change', handleInvoiceSelection);
            invoiceSelector.addEventListener('change', handleInvoiceSelection);

            // Panel de detalles inicialmente oculto
            const selectedInvoiceDetails = document.getElementById('selectedInvoiceDetails');
            if (selectedInvoiceDetails) {
                selectedInvoiceDetails.style.display = 'none';
            }
        } else {
            // Ocultar sección si no hay facturas
            invoiceDropdownSection.style.display = 'none';
        }
    }
}

/**
 * Maneja la selección de una factura del selector
 */
function handleInvoiceSelection() {
    const invoiceSelector = document.getElementById('invoice_selector');
    if (!invoiceSelector) return;

    const selectedIndex = parseInt(invoiceSelector.value);

    if (isNaN(selectedIndex) || selectedIndex < 0 || !clientInvoices || clientInvoices.length === 0) {
        const detailsPanel = document.getElementById('selectedInvoiceDetails');
        if (detailsPanel) detailsPanel.style.display = 'none';
        return;
    }

    const selectedInvoice = clientInvoices[selectedIndex];
    console.log("Factura seleccionada:", selectedInvoice);

    // Mostrar el panel de detalles
    const detailsPanel = document.getElementById('selectedInvoiceDetails');
    if (detailsPanel) detailsPanel.style.display = 'block';

    // Limpiar valores
    const cleanValue = (value) => value ? value.toString().trim() : '-';

    // Actualizar los inputs con los detalles
    const codeInput = document.getElementById('invoiceDetailCode');
    const serieInput = document.getElementById('invoiceDetailSerie');
    const dateInput = document.getElementById('invoiceDetailDate');
    const refInput = document.getElementById('invoiceDetailReference');
    const documentInput = document.getElementById('invoiceDetailDocument');

    if (codeInput) codeInput.value = cleanValue(selectedInvoice.codigo_producto);
    if (serieInput) serieInput.value = cleanValue(selectedInvoice.numero);
    if (dateInput) dateInput.value = cleanValue(selectedInvoice.fecha_formateada);
    if (refInput) refInput.value = cleanValue(selectedInvoice.referencia);
    if (documentInput) documentInput.value = cleanValue(selectedInvoice.documento);

    // Configurar el botón "Usar para garantía"
    const useDataBtn = document.getElementById('useInvoiceDataBtn');
    if (useDataBtn) {
        // Remover manejadores previos reemplazando el botón
        const newUseDataBtn = useDataBtn.cloneNode(true);
        useDataBtn.parentNode.replaceChild(newUseDataBtn, useDataBtn);

        // Añadir nuevo manejador
        newUseDataBtn.addEventListener('click', function () {
            applyProductData(selectedInvoice);
        });
    }
}

/**
 * Aplica los datos de la factura seleccionada al formulario
 * @param {Object} invoice - Objeto factura seleccionada
 */
function applyProductData(invoice) {
    if (!invoice) return;

    // Función para limpiar valores
    const cleanValue = (value) => value ? value.toString().trim() : '';

    // Actualizar los campos del formulario
    const referenceInput = document.getElementById('reference');
    const productCodeInput = document.getElementById('product_code');
    const imeiInput = document.getElementById('IMEI');
    const invoiceNumberInput = document.getElementById('invoice_number');

    // Procesar la referencia y código del producto
    if (invoice.referencia) {
        const referenciaCompleta = cleanValue(invoice.referencia);

        // Asumimos que la referencia tiene formato "CÓDIGO    DESCRIPCIÓN"
        // El patrón busca un espacio inicial seguido de múltiples espacios después del código
        const partes = referenciaCompleta.split(/\s{2,}/);

        console.log("Partes de la referencia:", partes);

        if (partes.length >= 2) {
            // El primer elemento es el código
            const codigo = partes[0].trim();
            // El resto es la descripción
            const descripcion = partes.slice(1).join(' ').trim();

            console.log("Código extraído:", codigo);
            console.log("Descripción extraída:", descripcion);

            // Actualizar código de producto
            if (productCodeInput) {
                productCodeInput.value = codigo;
            }

            // Actualizar campo de referencia (descripción)
            if (referenceInput) {
                // Si es un campo select, intentamos encontrar la opción que coincida
                if (referenceInput.tagName.toLowerCase() === 'select') {
                    let encontrado = false;
                    const options = referenceInput.options;

                    for (let i = 0; i < options.length; i++) {
                        // Buscamos si la opción contiene la descripción
                        if (options[i].text.trim().includes(descripcion)) {
                            referenceInput.selectedIndex = i;
                            // Disparar evento change para actualizar código de producto
                            const event = new Event('change');
                            referenceInput.dispatchEvent(event);
                            encontrado = true;
                            break;
                        }
                    }

                    // Si no se encontró, seleccionamos la primera opción
                    if (!encontrado && options.length > 0) {
                        console.warn("No se encontró una opción exacta para la descripción:", descripcion);
                        // Dejamos la selección como está o seleccionamos la primera opción no vacía
                    }
                } else {
                    // Si es un input de texto, simplemente asignamos la descripción
                    referenceInput.value = descripcion;
                }
            }
        } else {
            // Si no se pudo separar, usamos toda la referencia
            console.warn("No se pudo separar el código de la descripción:", referenciaCompleta);

            if (productCodeInput && invoice.codigo_producto) {
                productCodeInput.value = cleanValue(invoice.codigo_producto);
            }

            if (referenceInput) {
                if (referenceInput.tagName.toLowerCase() === 'select') {
                    // Buscar en el select la opción que coincida
                    const options = referenceInput.options;
                    for (let i = 0; i < options.length; i++) {
                        if (options[i].value.trim() === referenciaCompleta) {
                            referenceInput.selectedIndex = i;
                            const event = new Event('change');
                            referenceInput.dispatchEvent(event);
                            break;
                        }
                    }
                } else {
                    referenceInput.value = referenciaCompleta;
                }
            }
        }
    } else if (productCodeInput && invoice.codigo_producto) {
        // Si no hay referencia pero sí código de producto
        productCodeInput.value = cleanValue(invoice.codigo_producto);
    }

    // Serie a IMEI
    if (imeiInput && invoice.numero) {
        imeiInput.value = cleanValue(invoice.numero);
    }

    // Documento a número de factura
    if (invoiceNumberInput && invoice.documento) {
        invoiceNumberInput.value = cleanValue(invoice.documento);
    }

    // Mostrar mensaje de confirmación
    showToast('success', 'Datos aplicados al formulario');
}

// Utilidades y funciones de validación
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

/**
 * Formatea un número con separadores de miles
 * @param {number|string} number - Número a formatear
 * @returns {string} Número formateado con separadores de miles
 */
function formatNumberWithThousands(number) {
    // Si no es un valor válido, devolver 0
    if (number === undefined || number === null || isNaN(number)) return '0';
    
    // Si es string, convertir a número eliminando separadores existentes
    if (typeof number === 'string') {
        // Eliminar todo excepto dígitos
        number = parseInt(number.replace(/\./g, ''), 10) || 0;
    } else {
        // Si es número, asegurar que sea entero
        number = Math.floor(number);
    }
    
    // Formatear usando el formato colombiano (punto como separador de miles)
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function unformatNumber(formattedNumber) {
    if (!formattedNumber) return 0;
    
    // Si no es string, convertirlo
    const strValue = formattedNumber.toString();
    
    // Eliminar todos los puntos (separadores de miles)
    return parseInt(strValue.replace(/\./g, ''), 10) || 0;
}

/**
 * Inicializa el manejo de valores monetarios en el formulario
 */
function setupMoneyHandling() {
    const serviceValueInput = document.getElementById('service_value');
    
    /**
     * Aplica formato de moneda a un input
     * @param {HTMLInputElement} input - Input a formatear
     */
    function applyFormatting(input) {
        if (!input) return;
        
        // Añadir eventos para formateo de valores monetarios
        input.addEventListener('input', function() {
            // Guardar posición del cursor
            const start = this.selectionStart;
            const end = this.selectionEnd;
            const originalLength = this.value.length;
            
            // Formatear valor - asegurar que sea entero
            let value = this.value.replace(/[^\d]/g, '');
            // Convertir a entero para eliminar cualquier decimal
            value = parseInt(value) || 0;
            
            if (value) {
                this.value = formatNumberWithThousands(value);
            } else {
                this.value = '0';
            }
            
            // Reposicionar cursor
            const newLength = this.value.length;
            const cursorAdjust = newLength - originalLength;
            
            if (document.activeElement === this) {
                this.setSelectionRange(start + cursorAdjust, end + cursorAdjust);
            }
        });
        
        // Añadir evento para recalcular totales cuando cambie el valor
        input.addEventListener('change', function() {
            updatePartsTotals();
        });
    }
    
    // Aplicar formato al input de valor de servicio
    if (serviceValueInput) {
        applyFormatting(serviceValueInput);
    }
}

// Inicializar el manejo de valores monetarios al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    // Los selectores de repuestos ahora usan la clase form-select de Bootstrap
    // No es necesario inicializarlos con Select2
    
    // Configurar manejo de valores monetarios
    setupMoneyHandling();
});

function showValidationError(input, message) {
    if (!input) return;

    // Asegurarse de que tiene un ID
    if (!input.id) {
        input.id = 'input_' + Math.random().toString(36).substr(2, 9);
    }

    // Crear o actualizar mensaje de error
    let feedback = input.nextElementSibling;

    if (!feedback || !feedback.classList.contains('invalid-feedback')) {
        feedback = document.createElement('div');
        feedback.className = 'invalid-feedback';
        input.parentNode.insertBefore(feedback, input.nextSibling);
    }

    feedback.textContent = message;
    input.classList.add('is-invalid');
}

function removeValidationError(input) {
    if (!input) return;

    input.classList.remove('is-invalid');

    const feedback = input.nextElementSibling;
    if (feedback && feedback.classList.contains('invalid-feedback')) {
        feedback.textContent = '';
    }
}

/***** Inicialización al Cargar el DOM *****/
document.addEventListener('DOMContentLoaded', function () {
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
                                clientNamesInput.classList.add('bg-light');
                                clientNamesInput.readOnly = true;
                            }

                            if (clientLastnamesInput) {
                                const apellido1 = data.client.apellido1 || '';
                                const apellido2 = data.client.apellido2 || '';
                                // Eliminar espacios adicionales antes, después y dejar solo un espacio entre apellidos
                                const apellidoCompleto = `${apellido1.trim()} ${apellido2.trim()}`.trim().replace(/\s+/g, ' ');
                                clientLastnamesInput.value = apellidoCompleto;
                                clientLastnamesInput.classList.add('bg-light');
                                clientLastnamesInput.readOnly = true;
                            }

                            if (phoneInput) {
                                phoneInput.value = data.client.phone || '';
                                phoneInput.classList.add('bg-light');
                                phoneInput.readOnly = true;
                            }

                            if (mailInput) {
                                mailInput.value = data.client.email || '';
                                mailInput.classList.add('bg-light');
                                mailInput.readOnly = true;
                            }

                            // Hacer que el campo documento sea de solo lectura
                            if (documentInput) {
                                documentInput.classList.add('bg-light');
                                documentInput.readOnly = true;
                            }
                        }

                        // Mostrar facturas usando la función global
                        showInvoices(data.invoices);

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

    // Restaurar la funcionalidad para la selección del técnico
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
                technicalDocumentInput.value = techDocument;
            }

            // Actualizar estado
            if (stateInput && stateDisplayInput) {
                if (this.value && this.value !== '') {
                    // Si se seleccionó un técnico, actualizar el estado a "Asignado"
                    stateInput.value = 'Asignado';
                    stateDisplayInput.value = 'Asignado';
                } else {
                    // Si no hay técnico seleccionado, actualizar el estado a "Sin asignar"
                    stateInput.value = 'Sin asignar';
                    stateDisplayInput.value = 'Sin asignar';
                }
            }
        });
    }

    // Inicializar tabla de repuestos
    setupPartsTable();

    // Inicializar selector de problemas
    setupProblemsSelector();

    // Procesar mensajes flash
    processFlashMessages();
});

/***** Inicialización de Repuestos *****/
function setupPartsTable() {
    const partsTable = document.getElementById('partsTable');
    const addPartBtn = document.getElementById('addPartBtn');
    const noPartsRow = document.getElementById('noPartsRow');
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

    // Variable para guardar la fila actual que está seleccionando un repuesto
    let currentEditingRow = null;

    if (!partsTable || !addPartBtn) return;

    // Función para actualizar índices
    function updateRowIndices() {
        const rows = partsTable.querySelectorAll('tbody tr.part-row');
        rows.forEach((row, index) => {
            const indexCell = row.querySelector('.part-index');
            if (indexCell) {
                indexCell.textContent = index + 1;
            }
        });
    }

    // Función para calcular el valor total de una fila
    function updateRowTotal(row) {
        const quantityInput = row.querySelector('.part-quantity');
        const unitValueInput = row.querySelector('.part-unit-value');
        const totalValueInput = row.querySelector('.part-total-value');

        if (!quantityInput || !unitValueInput || !totalValueInput) return;

        const quantity = parseInt(quantityInput.value) || 0;
        const unitValue = unformatNumber(unitValueInput.value) || 0;
        const totalValue = quantity * unitValue;

        // Formatear el total de la fila con el separador de miles
        totalValueInput.value = formatNumberWithThousands(totalValue);

        // Actualizar el total general
        updatePartsTotals();
    }

    // Función para actualizar el total de repuestos y el total general
    function updatePartsTotals() {
        let totalPartsValue = 0;
        const partsTotalInputs = document.querySelectorAll('.part-total-value');

        // Sumar valores de repuestos
        partsTotalInputs.forEach(input => {
            const value = unformatNumber(input.value);
            if (!isNaN(value)) {
                totalPartsValue += value;
            }
        });

        // Actualizar campo de valor de repuestos
        if (spareValueInput) {
            spareValueInput.value = formatNumberWithThousands(totalPartsValue);
        }

        // Calcular y actualizar el total general
        if (totalInput && serviceValueInput) {
            const serviceValue = unformatNumber(serviceValueInput.value) || 0;
            const totalValue = serviceValue + totalPartsValue;
            totalInput.value = formatNumberWithThousands(totalValue);
            
            // Añadir el evento input a serviceValueInput si aún no lo tiene
            if (!serviceValueInput.dataset.eventAttached) {
                serviceValueInput.addEventListener('input', function() {
                    // Guardar posición del cursor
                    const start = this.selectionStart;
                    const end = this.selectionEnd;
                    const originalLength = this.value.length;
                    
                    // Formatear valor
                    let value = this.value.replace(/[^\d]/g, '');
                    if (value) {
                        this.value = formatNumberWithThousands(value);
                    } else {
                        this.value = '0';
                    }
                    
                    // Reposicionar cursor
                    const newLength = this.value.length;
                    const cursorAdjust = newLength - originalLength;
                    
                    if (document.activeElement === this) {
                        this.setSelectionRange(start + cursorAdjust, end + cursorAdjust);
                    }
                    
                    // Actualizar total
                    updatePartsTotals();
                });
                
                // Marcar que ya se añadió el evento
                serviceValueInput.dataset.eventAttached = 'true';
            }
        }

        // Mostrar/ocultar fila de "no hay repuestos"
        if (noPartsRow) {
            const rows = partsTable.querySelectorAll('tbody tr.part-row');
            noPartsRow.style.display = rows.length > 0 ? 'none' : '';
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

                // Agregar contador de resultados
                const resultCount = document.createElement('div');
                resultCount.className = 'col-12 mb-2';
                resultCount.innerHTML = `<small class="text-muted">Se encontraron ${data.parts.length} repuestos</small>`;
                row.appendChild(resultCount);

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

                // Agregar estilos adicionales para la tarjeta de resultados
                const style = document.createElement('style');
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

        // Escapar caracteres especiales en el término de búsqueda
        const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        // Crear una expresión regular para encontrar el término (insensible a mayúsculas/minúsculas)
        const regex = new RegExp(`(${escapedTerm})`, 'gi');

        // Reemplazar todas las ocurrencias con una versión resaltada
        return text.replace(regex, '<span class="highlight">$1</span>');
    }

    // Función para seleccionar un repuesto y actualizar la fila
    function selectPartAndUpdateRow(partData) {
        console.log("Repuesto seleccionado:", partData);

        if (!currentEditingRow) {
            console.error("No hay fila seleccionada para actualizar");
            showToast('error', 'Error: No se pudo identificar la fila a actualizar');
            return;
        }

        try {
            // Obtener los elementos de la fila
            const codeSelect = currentEditingRow.querySelector('select[name="spare_part_code[]"]');
            const quantityInput = currentEditingRow.querySelector('.part-quantity');
            const unitValueInput = currentEditingRow.querySelector('.part-unit-value');
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
            option.text = partData.description;
            codeSelect.add(option);

            // Seleccionar la nueva opción
            codeSelect.value = partData.code;

            // Disparar evento change para activar cualquier listener
            const changeEvent = new Event('change', { bubbles: true });
            codeSelect.dispatchEvent(changeEvent);

            // Establecer valor unitario predeterminado si no está definido
            if (unitValueInput && (!unitValueInput.value || unitValueInput.value === "0")) {
                unitValueInput.value = "0";
                // Aplicar formato de miles si es necesario
                if (typeof applyThousandsFormatting === 'function') {
                    applyThousandsFormatting(unitValueInput);
                }
            }

            // Actualizar el total
            if (quantityInput && unitValueInput && totalValueInput) {
                updateRowTotal(currentEditingRow);
            }

            // Validar la selección
            if (codeSelect.value !== partData.code) {
                throw new Error("No se pudo establecer el valor seleccionado en el campo");
            }

            // Cerrar el modal
            const modal = bootstrap.Modal.getInstance(searchPartsModal);
            if (modal) {
                modal.hide();
            } else {
                // Si no se puede obtener la instancia, intentar cerrar manualmente
                $(searchPartsModal).modal('hide');
            }

            // Limpiar el campo de búsqueda
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

    // Configurar el evento de búsqueda en el modal
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
                initialSearchMessage.style.display = 'block';
                noResultsMessage.style.display = 'none';
                searchResultsLoader.style.display = 'none';

                // Limpiar resultados anteriores
                while (searchResults.firstChild) {
                    if (searchResults.firstChild.id === 'initialSearchMessage' ||
                        searchResults.firstChild.id === 'noResultsMessage') {
                        break;
                    }
                    searchResults.removeChild(searchResults.firstChild);
                }

                return;
            }

            // Mostrar indicador de carga inmediatamente
            searchResultsLoader.style.display = 'block';

            // Establecer un timeout para evitar demasiadas peticiones (debounce)
            searchTimeout = setTimeout(() => {
                searchParts(searchTerm);
            }, 400); // Aumentado a 400ms para dar más tiempo entre búsquedas
        });

        // Agregar navegación con teclado
        modalPartSearch.addEventListener('keydown', function (e) {
            const resultsContainer = searchResults.querySelector('.search-results-container');
            if (!resultsContainer) return;

            const items = resultsContainer.querySelectorAll('.search-result-item');
            if (!items.length) return;

            // Obtener el elemento actualmente seleccionado
            const currentItem = document.activeElement;
            let currentIndex = -1;

            // Determinar el índice actual
            for (let i = 0; i < items.length; i++) {
                if (items[i] === currentItem) {
                    currentIndex = i;
                    break;
                }
            }

            // Manejar teclas de navegación
            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    // Si no hay selección o es el último, seleccionar el primero
                    if (currentIndex === -1 || currentIndex === items.length - 1) {
                        items[0].focus();
                    } else {
                        items[currentIndex + 1].focus();
                    }
                    break;

                case 'ArrowUp':
                    e.preventDefault();
                    // Si no hay selección o es el primero, seleccionar el último
                    if (currentIndex === -1 || currentIndex === 0) {
                        items[items.length - 1].focus();
                    } else {
                        items[currentIndex - 1].focus();
                    }
                    break;

                case 'Escape':
                    // Cerrar el modal
                    const modal = bootstrap.Modal.getInstance(searchPartsModal);
                    if (modal) {
                        modal.hide();
                    }
                    break;
            }
        });
    }

    // Configurar evento para el modal
    if (searchPartsModal) {
        searchPartsModal.addEventListener('shown.bs.modal', function () {
            if (modalPartSearch) {
                modalPartSearch.focus();
                modalPartSearch.value = '';

                // Mostrar mensaje inicial
                initialSearchMessage.style.display = 'block';
                noResultsMessage.style.display = 'none';
                searchResultsLoader.style.display = 'none';

                // Limpiar resultados anteriores
                while (searchResults.firstChild) {
                    if (searchResults.firstChild.id === 'initialSearchMessage' ||
                        searchResults.firstChild.id === 'noResultsMessage') {
                        break;
                    }
                    searchResults.removeChild(searchResults.firstChild);
                }
            }
        });
    }

    // Agregar un nuevo repuesto
    if (addPartBtn) {
        addPartBtn.addEventListener('click', function () {
            const template = document.getElementById('partRowTemplate');
            if (!template) return;

            // Clonar la plantilla
            const clone = document.importNode(template.content, true);
            const newRow = clone.querySelector('tr');

            // Configurar manejadores de eventos para la nueva fila
            setupRowEvents(newRow);

            // Agregar la fila a la tabla
            partsTable.querySelector('tbody').appendChild(newRow);

            // Actualizar índices y totales
            updateRowIndices();
            updatePartsTotals();

            // Ocultar mensaje de "no hay repuestos"
            if (noPartsRow) {
                noPartsRow.style.display = 'none';
            }
        });
    }

    // Configurar eventos para una fila
    function setupRowEvents(row) {
        // Botón para eliminar
        const removeBtn = row.querySelector('.remove-part');
        if (removeBtn) {
            removeBtn.addEventListener('click', function () {
                row.remove();
                updateRowIndices();
                updatePartsTotals();
            });
        }

        // Eventos para actualizar totales
        const quantityInput = row.querySelector('.part-quantity');
        const unitValueInput = row.querySelector('.part-unit-value');
        const codeSelect = row.querySelector('select[name="spare_part_code[]"]');

        if (quantityInput) {
            quantityInput.addEventListener('input', function () {
                updateRowTotal(row);
            });
        }

        if (unitValueInput) {
            // Aplicar formato de miles al campo unitario
            if (unitValueInput.value) {
                unitValueInput.value = formatNumberWithThousands(unitValueInput.value);
            }

            unitValueInput.addEventListener('input', function() {
                // Guardar posición del cursor
                const start = this.selectionStart;
                const end = this.selectionEnd;
                const originalLength = this.value.length;
                
                // Remover caracteres no numéricos 
                let value = this.value.replace(/[^\d]/g, '');
                
                // Si hay valor, formatear
                if (value) {
                    this.value = formatNumberWithThousands(value);
                } else {
                    this.value = '0';
                }
                
                // Calcular desplazamiento del cursor y reposicionar
                const newLength = this.value.length;
                const cursorAdjust = newLength - originalLength;
                
                // Si el usuario estaba editando, mantener la posición relativa del cursor
                if (document.activeElement === this) {
                    this.setSelectionRange(start + cursorAdjust, end + cursorAdjust);
                }
                
                // Actualizar totales de la fila
                updateRowTotal(row);
            });
        }

        if (codeSelect) {
            // Validar selección cuando cambia
            codeSelect.addEventListener('change', function () {
                if (this.value) {
                    removeValidationError(this);
                } else {
                    showValidationError(this, 'Debe seleccionar un repuesto');
                }
            });
        }

        // Configurar botón para abrir el modal de búsqueda
        const selectPartBtn = row.querySelector('.select-part');
        if (selectPartBtn) {
            selectPartBtn.addEventListener('click', function () {
                // Guardar la fila actual
                currentEditingRow = row;

                // Abrir el modal de búsqueda
                const modal = new bootstrap.Modal(document.getElementById('searchPartsModal'));
                modal.show();

                // Enfocar el campo de búsqueda
                setTimeout(() => {
                    if (modalPartSearch) {
                        modalPartSearch.focus();
                    }
                }, 500);
            });
        }
    }
}

// Inicializar filas existentes si las hay
const existingRows = partsTable.querySelectorAll('tbody tr.part-row');
existingRows.forEach(row => {
    setupRowEvents(row);
});

// Actualizar cuando cambia el valor del servicio
if (serviceValueInput) {
    // Eliminar cualquier event listener existente
    serviceValueInput.removeEventListener('input', updatePartsTotals);
    
    // Añadir el evento input para actualizar el total
    serviceValueInput.addEventListener('input', function() {
        updatePartsTotals();
    });
    
    // También añadir el evento change para capturar cambios manuales
    serviceValueInput.addEventListener('change', function() {
        updatePartsTotals();
    });
    
    // Añadir evento blur para asegurar la actualización cuando pierde el foco
    serviceValueInput.addEventListener('blur', function() {
        updatePartsTotals();
    });
}

// Actualizar totales iniciales
updatePartsTotals();

/***** Gestión de Problemas del Dispositivo *****/
function setupProblemsSelector() {
    const problemCheckboxes = document.querySelectorAll('.problem-checkbox');
    const selectedProblemsTextarea = document.getElementById('selected_problems');
    const selectAllBtn = document.getElementById('selectAllProblems');
    const clearBtn = document.getElementById('clearProblems');
    const searchInput = document.getElementById('searchProblems');

    if (!problemCheckboxes.length || !selectedProblemsTextarea) return;

    // Función para actualizar el textarea con los problemas seleccionados
    function updateSelectedProblems() {
        const selectedProblems = [];

        problemCheckboxes.forEach(checkbox => {
            if (checkbox.checked) {
                const label = document.querySelector(`label[for="${checkbox.id}"]`);
                if (label) {
                    selectedProblems.push(label.textContent.trim());
                }
            }
        });

        // Actualizar el textarea
        selectedProblemsTextarea.value = selectedProblems.join(', ');
    }

    // Agregar event listeners a cada checkbox
    problemCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', updateSelectedProblems);
    });

    // Botón para seleccionar todos
    if (selectAllBtn) {
        selectAllBtn.addEventListener('click', function () {
            problemCheckboxes.forEach(checkbox => {
                const option = checkbox.closest('.problem-option');
                // Solo seleccionar las opciones visibles
                if (option && option.style.display !== 'none') {
                    checkbox.checked = true;
                }
            });
            updateSelectedProblems();
        });
    }

    // Botón para limpiar selección
    if (clearBtn) {
        clearBtn.addEventListener('click', function () {
            problemCheckboxes.forEach(checkbox => {
                checkbox.checked = false;
            });
            updateSelectedProblems();
        });
    }

    // Búsqueda de problemas
    if (searchInput) {
        searchInput.addEventListener('input', function () {
            const searchTerm = this.value.toLowerCase();

            // Filtrar opciones
            document.querySelectorAll('.problem-option').forEach(option => {
                const label = option.querySelector('label');
                if (!label) return;

                const problemText = label.textContent.toLowerCase();
                option.style.display = problemText.includes(searchTerm) ? '' : 'none';
            });
        });
    }

    // Inicializar el textarea con los problemas ya seleccionados
    updateSelectedProblems();
}

// Agregar estilos CSS en línea para los elementos de búsqueda
(function addSearchStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .search-results-container {
            max-height: 350px;
            overflow-y: auto;
            margin-top: 10px;
        }
        
        .search-result-item {
            padding: 10px;
            border-bottom: 1px solid #eee;
            cursor: pointer;
            transition: background-color 0.2s;
        }
        
        .search-result-item:hover,
        .search-result-item:focus {
            background-color: #f8f9fa;
            outline: none;
        }
        
        .search-result-item.active {
            background-color: #e9ecef;
            border-left: 3px solid #0d6efd;
        }
        
        .part-code {
            font-weight: bold;
            margin-bottom: 3px;
        }
        
        .part-description {
            color: #555;
            font-size: 0.9em;
        }
        
        .highlight {
            background-color: #fff3cd;
            padding: 0 2px;
            border-radius: 2px;
        }
    `;
    document.head.appendChild(style);
})();

// Función para mostrar el toast de éxito
function showSuccessToast() {
    const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer)
            toast.addEventListener('mouseleave', Swal.resumeTimer)
        }
    })

    Toast.fire({
        icon: 'success',
        title: 'Ticket creado exitosamente'
    })
}

// Modificar el formulario para incluir la confirmación
document.addEventListener('DOMContentLoaded', function() {
    const form = document.querySelector('form[action="{{ url_for(\'warranty.create_warranty\') }}"]');
    
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            Swal.fire({
                title: '¿Crear ticket?',
                text: '¿Estás seguro de que deseas crear este ticket de garantía?',
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#198754',
                cancelButtonColor: '#6c757d',
                confirmButtonText: 'Sí, crear ticket',
                cancelButtonText: 'Cancelar'
            }).then((result) => {
                if (result.isConfirmed) {
                    // Mostrar indicador de carga
                    Swal.fire({
                        title: 'Creando ticket...',
                        text: 'Por favor espere mientras se procesa su solicitud',
                        allowOutsideClick: false,
                        didOpen: () => {
                            Swal.showLoading()
                        }
                    });
                    
                    // Enviar el formulario
                    form.submit();
                }
            });
        });
    }
});

// SOLUCIÓN COMPLETA: Agregar este fragmento al final del archivo
document.addEventListener('DOMContentLoaded', function() {
    // Referencias a los campos
    const serviceValueInput = document.getElementById('service_value');
    const spareValueInput = document.getElementById('spare_value');
    const totalInput = document.getElementById('total');
    
    // Función para actualizar el total manualmente
    function calculateTotal() {
        if (!serviceValueInput || !spareValueInput || !totalInput) return;
        
        // Obtener y procesar los valores
        const serviceValue = unformatNumber(serviceValueInput.value) || 0;
        const spareValue = unformatNumber(spareValueInput.value) || 0;
        
        // Calcular el total
        const total = serviceValue + spareValue;
        
        // Actualizar el campo total
        totalInput.value = formatNumberWithThousands(total);
        
        console.log(`CÁLCULO TOTAL: ${serviceValue} + ${spareValue} = ${total}`);
    }
    
    // Agregar eventos a los campos
    if (serviceValueInput) {
        ['input', 'change', 'blur'].forEach(event => {
            serviceValueInput.addEventListener(event, calculateTotal);
        });
    }
    
    if (spareValueInput) {
        // Observar cambios en el valor de repuestos
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === "attributes" && mutation.attributeName === "value") {
                    calculateTotal();
                }
            });
        });
        
        observer.observe(spareValueInput, { attributes: true });
    }
    
    // Calcular el total inicial
    setTimeout(calculateTotal, 500);
});

// Función para agregar una fila de repuesto
function addPartRow(partData = null) {
    const partsTable = document.getElementById('partsTable');
    const noPartsRow = document.getElementById('noPartsRow');
    if (noPartsRow) {
        noPartsRow.style.display = 'none';
    }

    const row = document.createElement('tr');
    row.className = 'part-row';
    row.innerHTML = `
        <td class="align-middle part-index"></td>
        <td class="align-middle">
            <input type="text" class="form-control part-code" readonly>
            <input type="hidden" name="part_ids[]" class="part-id">
        </td>
        <td class="align-middle"><span class="part-name"></span></td>
        <td class="align-middle">
            <input type="number" name="quantities[]" class="form-control part-quantity" min="1" value="1">
        </td>
        <td class="align-middle">
            <input type="text" name="unit_values[]" class="form-control part-unit-value text-end" value="0">
        </td>
        <td class="align-middle">
            <input type="text" class="form-control part-total-value text-end" readonly value="0">
        </td>
        <td class="align-middle">
            <button type="button" class="btn btn-danger btn-sm remove-part">
                <i class="bi bi-trash"></i>
            </button>
        </td>
    `;

    const tbody = partsTable.querySelector('tbody');
    tbody.appendChild(row);

    // Actualizar índices
    updateRowIndices();

    // Configurar botón para eliminar fila
    const removeBtn = row.querySelector('.remove-part');
    removeBtn.addEventListener('click', () => {
        row.remove();
        updateRowIndices();
        updatePartsTotals();

        const rows = partsTable.querySelectorAll('tbody tr.part-row');
        if (rows.length === 0 && noPartsRow) {
            noPartsRow.style.display = '';
        }
    });

    // Configurar eventos para actualización de totales
    const quantityInput = row.querySelector('.part-quantity');
    const unitValueInput = row.querySelector('.part-unit-value');

    if (quantityInput) {
        quantityInput.addEventListener('input', () => {
            updateRowTotal(row);
        });
    }

    if (unitValueInput) {
        // Aplicar formato inicial si tiene valor
        if (unitValueInput.value && unitValueInput.value !== '0') {
            unitValueInput.value = formatNumberWithThousands(unformatNumber(unitValueInput.value));
        }
        
        unitValueInput.addEventListener('input', function() {
            // Guardar posición del cursor
            const start = this.selectionStart;
            const end = this.selectionEnd;
            const originalLength = this.value.length;
            
            // Remover caracteres no numéricos 
            let value = this.value.replace(/[^\d]/g, '');
            
            // Si hay valor, formatear
            if (value) {
                this.value = formatNumberWithThousands(value);
            } else {
                this.value = '0';
            }
            
            // Calcular desplazamiento del cursor y reposicionar
            const newLength = this.value.length;
            const cursorAdjust = newLength - originalLength;
            
            // Si el usuario estaba editando, mantener la posición relativa del cursor
            if (document.activeElement === this) {
                this.setSelectionRange(start + cursorAdjust, end + cursorAdjust);
            }
            
            // Actualizar totales de la fila
            updateRowTotal(row);
        });
    }

    // Si hay datos, llenar la fila
    if (partData) {
        const codeInput = row.querySelector('.part-code');
        const idInput = row.querySelector('.part-id');
        const nameSpan = row.querySelector('.part-name');

        if (codeInput && partData.code) codeInput.value = partData.code;
        if (idInput && partData.id) idInput.value = partData.id;
        if (nameSpan && partData.name) nameSpan.textContent = partData.name;
        
        if (unitValueInput && partData.price) {
            unitValueInput.value = formatNumberWithThousands(partData.price);
        }
        
        // Actualizar el total de la fila
        updateRowTotal(row);
    }

    return row;
}

/**
 * Procesa los mensajes flash del backend
 */
function processFlashMessages() {
    const flashMessages = document.querySelectorAll('.alert');
    
    flashMessages.forEach(message => {
        const category = message.classList.contains('alert-success') ? 'success' :
                         message.classList.contains('alert-danger') ? 'error' :
                         message.classList.contains('alert-warning') ? 'warning' : 'info';
        
        const content = message.textContent.trim();
        
        if (content) {
            showToast(category, content);
        }
    });
}
