document.addEventListener('DOMContentLoaded', function() {
    // Comprueba si estamos en la página de edición (con partsTable) antes de intentar acceder
    const partsTable = document.getElementById('partsTable');
    if (partsTable) {
        const partsTableBody = partsTable.getElementsByTagName('tbody')[0];
        const noPartsRow = document.getElementById('noPartsRow');
        const partRowTemplate = document.getElementById('partRowTemplate');
        const addPartBtn = document.getElementById('addPartBtn');
        
        // Script para actualizar automáticamente el documento del técnico al seleccionarlo
        const technicalName = document.getElementById('technical_name');
        if (technicalName) {
            technicalName.addEventListener('change', function() {
                const selectedOption = this.options[this.selectedIndex];
                const documentoInput = document.getElementById('documento');
                if (documentoInput) {
                    documentoInput.value = selectedOption.dataset.document || '';
                }
            });
        }
        
        // Script para calcular el total automáticamente
        function calculateTotal() {
            const spareValue = document.getElementById('spare_value');
            const serviceValue = document.getElementById('service_value');
            const totalValue = document.getElementById('total');
            
            if (spareValue && serviceValue && totalValue) {
                const spareValueNum = unformatNumber(spareValue.value);
                const serviceValueNum = unformatNumber(serviceValue.value);
                totalValue.value = formatNumberWithThousands(spareValueNum + serviceValueNum);
            }
        }
        
        // Configurar eventos para los campos de valor del servicio
        const serviceValue = document.getElementById('service_value');
        if (serviceValue) {
            // Asegurar que el valor esté formateado
            if (serviceValue.value && !serviceValue.value.includes('.')) {
                serviceValue.value = formatNumberWithThousands(serviceValue.value);
            }
            
            serviceValue.addEventListener('focus', function() {
                this.select(); // Seleccionar todo el texto para facilitar edición
            });
            
            serviceValue.addEventListener('input', function() {
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
                
                calculateTotal();
            });
            
            serviceValue.addEventListener('blur', function() {
                if (!this.value) {
                    this.value = '0';
                }
                calculateTotal();
            });
        }
        
        const spareValue = document.getElementById('spare_value');
        if (spareValue) {
            // Asegurar que el valor esté formateado
            if (spareValue.value && !spareValue.value.includes('.')) {
                spareValue.value = formatNumberWithThousands(spareValue.value);
            }
        }
        
        const totalValue = document.getElementById('total');
        if (totalValue) {
            // Asegurar que el valor esté formateado
            if (totalValue.value && !totalValue.value.includes('.')) {
                totalValue.value = formatNumberWithThousands(totalValue.value);
            }
        }

        // Función para eliminar fila de repuestos
        function removePartRow(row) {
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
                    // Si no quedan filas, agregar la fila "No hay repuestos"
                    const rows = partsTableBody.querySelectorAll('tr:not(#noPartsRow)');
                    if (rows.length === 0) {
                        const noPartsRowNew = document.createElement('tr');
                        noPartsRowNew.id = 'noPartsRow';
                        noPartsRowNew.innerHTML = `
                            <td colspan="5" class="text-center py-4">
                                <i class="fas fa-box-open fa-3x text-muted mb-3"></i>
                                <p class="text-muted mb-0">No se han agregado repuestos para este servicio.</p>
                            </td>
                        `;
                        partsTableBody.appendChild(noPartsRowNew);
                    }
                    // Recalcular el valor total de repuestos sin actualizar índices
                    calculateSparesTotalValue();
                }
            });
        }
        
        // Función para calcular el valor total de repuestos
        function calculateSparesTotalValue() {
            let totalSpares = 0;
            const totalInputs = partsTableBody.querySelectorAll('input[name="part_total_value[]"]');
            totalInputs.forEach(input => {
                totalSpares += unformatNumber(input.value);
            });
            
            const spareValueInput = document.getElementById('spare_value');
            if (spareValueInput) {
                spareValueInput.value = formatNumberWithThousands(totalSpares);
                calculateTotal();
            }
        }

        // Función para calcular total de fila de repuesto
        function setupRowCalculations(row) {
            const quantityInput = row.querySelector('input[name="part_quantity[]"]');
            const unitPriceInput = row.querySelector('input[name="part_unit_value[]"]');
            const totalPriceInput = row.querySelector('input[name="part_total_value[]"]');

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
                calculateSparesTotalValue();
            }

            // Calcular el total de la fila al inicio
            calculateRowTotal();

            // Configurar eventos para el input de precio unitario
            unitPriceInput.addEventListener('focus', function() {
                this.select(); // Seleccionar todo para facilitar edición
            });
            
            unitPriceInput.addEventListener('input', function() {
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
                
                calculateRowTotal();
            });
            
            unitPriceInput.addEventListener('blur', function() {
                if (!this.value) {
                    this.value = '0';
                }
                calculateRowTotal();
            });

            // Eventos para el input de cantidad
            quantityInput.addEventListener('input', calculateRowTotal);
            quantityInput.addEventListener('blur', function() {
                if (!this.value || parseInt(this.value) < 1) {
                    this.value = '1';
                    calculateRowTotal();
                }
            });

            // Configurar eliminación de fila
            const removeBtn = row.querySelector('.remove-part');
            if (removeBtn) {
                removeBtn.addEventListener('click', () => removePartRow(row));
            }
        }

        // IMPORTANTE: Desactivamos nuestro evento de agregar repuesto ya que está manejado por internal_repair.js
        // Esto evita la duplicación de filas
        // Solo configuramos la función que será llamada después de que se agregue una fila
        
        // Función para preparar una nueva fila de repuesto agregada
        window.setupNewSpareRow = function(newRow) {
            if (!newRow) return;
            
            // Establecer valor inicial formateado para los campos numéricos
            const unitValueInput = newRow.querySelector('.part-unit-value');
            const totalValueInput = newRow.querySelector('.part-total-value');
            
            if (unitValueInput) {
                unitValueInput.value = '0';
            }
            
            if (totalValueInput) {
                totalValueInput.value = '0';
            }

            // Configurar cálculos y eventos para la nueva fila
            setupRowCalculations(newRow);
        };

        // Configurar cálculos para filas existentes al cargar
        const existingRows = partsTableBody.querySelectorAll('tr:not(#noPartsRow)');
        existingRows.forEach(setupRowCalculations);

        // IMPORTANTE: Configurar eventos para los botones de eliminación existentes
        const existingRemoveBtns = document.querySelectorAll('.remove-part');
        existingRemoveBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                const row = this.closest('tr');
                removePartRow(row);
            });
        });

        // Calcular el valor total inicial de repuestos
        calculateSparesTotalValue();
        
        // Quitar formato de moneda antes de enviar el formulario
        const ticketForm = document.getElementById('ticketForm');
        if (ticketForm) {
            ticketForm.addEventListener('submit', function(e) {
                // Quitar formato de moneda antes de enviar
                document.querySelectorAll('input[name="part_unit_value[]"], input[name="part_total_value[]"], #service_value, #spare_value, #total').forEach(input => {
                    input.value = unformatNumber(input.value);
                });
            });
        }
    }

    // Script para actualizar el textarea cuando cambian las selecciones
    const checkboxes = document.querySelectorAll('.problem-checkbox');
    const textarea = document.getElementById('selected_problems');
    
    if (checkboxes.length > 0 && textarea) {
        // Función para actualizar el textarea con los problemas seleccionados
        function updateTextarea() {
            let selected = [];
            checkboxes.forEach(cb => {
                if (cb.checked) {
                const label = document.querySelector(`label[for="${cb.id}"]`);
                if (label) {
                    selected.push(label.textContent.trim());
                }
                }
            });
            textarea.value = selected.join('\n');
        }
        
        // Llamar a updateTextarea inmediatamente al cargar la página
        updateTextarea();
        
        // Agregar listeners a los checkboxes
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', updateTextarea);
        });
        
        // Configurar botones de selección si existen
        const selectAllProblemsBtn = document.getElementById('selectAllProblems');
        if (selectAllProblemsBtn) {
            selectAllProblemsBtn.addEventListener('click', function() {
                checkboxes.forEach(cb => cb.checked = true);
                updateTextarea();
            });
        }
        
        const clearProblemsBtn = document.getElementById('clearProblems');
        if (clearProblemsBtn) {
            clearProblemsBtn.addEventListener('click', function() {
                checkboxes.forEach(cb => cb.checked = false);
                updateTextarea();
            });
        }
    }

    // Actualizar referencia-código
    const referenceSelect = document.getElementById('reference');
    const productCodeInput = document.getElementById('product_code');
    
    if (referenceSelect && productCodeInput) {
        // Función para actualizar el código de producto
        function updateProductCode() {
            if (referenceSelect.selectedIndex > -1) {
                const selectedOption = referenceSelect.options[referenceSelect.selectedIndex];
                const productCode = selectedOption.getAttribute('data-code') || '';
                productCodeInput.value = productCode;
            }
        }
        
        // Actualizar código cuando cambia la referencia
        referenceSelect.addEventListener('change', updateProductCode);
        
        // Para la carga inicial, si ya tenemos un código de producto del ticket
        // y no coincide con el data-code de la referencia seleccionada,
        // necesitamos establecerlo manualmente
        if (productCodeInput.value) {
            // Verificar si el código actual coincide con el data-code de la referencia seleccionada
            const selectedOption = referenceSelect.options[referenceSelect.selectedIndex];
            const dataCode = selectedOption.getAttribute('data-code') || '';
            
            if (!dataCode || dataCode !== productCodeInput.value) {
                // Si no coinciden, buscar la opción que tenga el data-code correcto
                let found = false;
                for (let i = 0; i < referenceSelect.options.length; i++) {
                    const option = referenceSelect.options[i];
                    if (option.getAttribute('data-code') === productCodeInput.value) {
                        referenceSelect.selectedIndex = i;
                        found = true;
                        break;
                    }
                }
                
                // Si no se encontró una opción con el data-code correcto, mantener el valor actual
                if (!found) {
                    console.log("No se encontró una referencia con el código de producto: " + productCodeInput.value);
                }
            }
        } else {
            // Si no hay un código de producto, actualizar basado en la referencia seleccionada
            updateProductCode();
        }
    }
});

// Actualizar estados (este código se ejecuta independientemente del código anterior)
document.addEventListener('DOMContentLoaded', function() {
    // Escuchar los cambios en el select de estado
    document.querySelectorAll('.status-select').forEach(function(select) {
        select.addEventListener('change', function() {
            const ticketId = this.getAttribute('data-ticket-id');
            const newStatus = this.value;
            const previousStatus = this.getAttribute('data-previous-status');
            
            // Si el estado no ha cambiado, no hacer nada
            if (newStatus === previousStatus) {
                return;
            }
            
            // Confirmar con SweetAlert2
            confirmAction(
                '¿Cambiar estado?',
                `¿Está seguro de cambiar el estado del ticket #${ticketId} a "${newStatus}"?`,
                'Sí, cambiar',
                'Cancelar',
                () => {
                    // Hacer la petición AJAX
                    updateTicketStatus(ticketId, newStatus, select);
                }
            );
        });
    });
    
    // Función para hacer la petición AJAX
    function updateTicketStatus(ticketId, newStatus, selectElement) {
        // Mostrar un indicador de carga
        showInfoToast('Actualizando...', 'top-end');
        
        // Usamos la URL correcta con el prefijo de la ruta
        fetch('/update_ticket_status_ajax', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: `ticket_id=${ticketId}&state=${newStatus}`
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                // Actualizar el atributo de estado anterior
                selectElement.setAttribute('data-previous-status', newStatus);
                
                // Cambiar el color de la fila según el nuevo estado
                const row = selectElement.closest('tr');
                row.setAttribute('data-status', newStatus);
                
                // Mostrar SweetAlert de éxito
                Swal.fire({
                    title: '¡Estado actualizado!',
                    text: data.message,
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false
                });
                
                // Mostrar toast de éxito
                showSuccessToast(data.message, 'top-end');
            } else {
                // Si hay error, mostrar alerta y restaurar valor anterior
                Swal.fire({
                    title: 'Error',
                    text: data.message || 'Error al actualizar el estado',
                    icon: 'error'
                });
                
                // Restaurar el valor anterior
                selectElement.value = selectElement.getAttribute('data-previous-status');
                
                // Mostrar toast de error
                showErrorToast(data.message || 'Error al actualizar el estado', 'top-end');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            
            // Mostrar alerta de error
            Swal.fire({
                title: 'Error',
                text: 'Ocurrió un error al actualizar el estado: ' + error.message,
                icon: 'error'
            });
            
            // Restaurar el valor anterior
            selectElement.value = selectElement.getAttribute('data-previous-status');
            
            // Mostrar toast de error
            showErrorToast('Error al actualizar el estado: ' + error.message, 'top-end');
        });
    }
});

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

/**
 * Quita el formato de miles y devuelve el número
 * @param {string} formattedNumber - Número formateado con separadores
 * @returns {number} - Número sin formato
 */
function unformatNumber(formattedNumber) {
    if (!formattedNumber) return 0;
    
    // Si no es string, convertirlo
    const strValue = formattedNumber.toString();
    
    // Eliminar todos los puntos (separadores de miles)
    return parseInt(strValue.replace(/\./g, ''), 10) || 0;
}

// Asegurar que todos los valores se formateen correctamente al cargar la página
window.addEventListener('load', function() {
    // Formatear valores monetarios existentes
    function formatExistingMonetaryValues() {
        const partsTable = document.getElementById('partsTable');
        if (!partsTable) return;
        
        // Formatear valores unitarios y totales de repuestos
        const unitValueInputs = document.querySelectorAll('input[name="part_unit_value[]"]');
        const totalValueInputs = document.querySelectorAll('input[name="part_total_value[]"]');
        
        unitValueInputs.forEach(input => {
            // Solo formatear si no tiene formato previo (no tiene puntos)
            if (input.value && !input.value.includes('.')) {
                input.value = formatNumberWithThousands(input.value);
            }
        });
        
        totalValueInputs.forEach(input => {
            // Solo formatear si no tiene formato previo (no tiene puntos)
            if (input.value && !input.value.includes('.')) {
                input.value = formatNumberWithThousands(input.value);
            }
        });
        
        // Formatear valor de servicio, repuestos y total
        const serviceValue = document.getElementById('service_value');
        const spareValue = document.getElementById('spare_value');
        const totalValue = document.getElementById('total');
        
        if (serviceValue && !serviceValue.value.includes('.')) {
            serviceValue.value = formatNumberWithThousands(serviceValue.value);
        }
        if (spareValue && !spareValue.value.includes('.')) {
            spareValue.value = formatNumberWithThousands(spareValue.value);
        }
        if (totalValue && !totalValue.value.includes('.')) {
            totalValue.value = formatNumberWithThousands(totalValue.value);
        }
    }
    
    // Ejecutar formateo al cargar la página
    formatExistingMonetaryValues();
}); 