// Variables globales
var clientInvoices = [];

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
        newUseDataBtn.addEventListener('click', function() {
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