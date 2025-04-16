document.addEventListener('DOMContentLoaded', function() {
    // Comprueba si estamos en la página de edición (con partsTable) antes de intentar acceder
    const partsTable = document.getElementById('partsTable');
    if (partsTable) {
        const partsTableBody = partsTable.getElementsByTagName('tbody')[0];
        const noPartsRow = document.getElementById('noPartsRow');
        const partRowTemplate = document.getElementById('partRowTemplate');
        const addPartBtn = document.getElementById('addPartBtn');

        // Función para formatear números como moneda (separador de miles sin decimales)
        function formatCurrency(value) {
            // Convertir a número entero y luego a string con formato
            const numValue = Math.round(parseFloat(value) || 0);
            return numValue.toLocaleString('es-CO', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            }).replace(/,/g, '.');
        }

        // Función para quitar el formato y obtener solo el número
        function unformatCurrency(value) {
            if (!value) return 0;
            // Quitar todos los puntos que son separadores de miles
            return parseInt(value.toString().replace(/\./g, '')) || 0;
        }

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
                const spareValueNum = unformatCurrency(spareValue.value);
                const serviceValueNum = unformatCurrency(serviceValue.value);
                totalValue.value = formatCurrency(spareValueNum + serviceValueNum);
            }
        }
        
        // Configurar eventos para los campos de valor del servicio
        const serviceValue = document.getElementById('service_value');
        if (serviceValue) {
            serviceValue.value = formatCurrency(serviceValue.value);
            
            serviceValue.addEventListener('focus', function() {
                this.value = unformatCurrency(this.value);
            });
            
            serviceValue.addEventListener('blur', function() {
                this.value = formatCurrency(this.value);
                calculateTotal();
            });
            
            serviceValue.addEventListener('input', calculateTotal);
        }
        
        const spareValue = document.getElementById('spare_value');
        if (spareValue) {
            spareValue.value = formatCurrency(spareValue.value);
            spareValue.addEventListener('input', calculateTotal);
        }
        
        const totalValue = document.getElementById('total');
        if (totalValue) {
            totalValue.value = formatCurrency(totalValue.value);
        }

        // Función para eliminar fila de repuestos
        function removePartRow(row) {
            row.remove();
            
            // Actualizar los índices de las filas restantes
            const rows = partsTableBody.querySelectorAll('tr:not(#noPartsRow)');
            rows.forEach((row, index) => {
                const indexCell = row.querySelector('td:first-child');
                if (indexCell) {
                    indexCell.textContent = index + 1;
                }
            });
            
            // Si no quedan filas, agregar la fila "No hay repuestos"
            if (rows.length === 0) {
                const noPartsRowNew = document.createElement('tr');
                noPartsRowNew.id = 'noPartsRow';
                noPartsRowNew.innerHTML = `
                    <td colspan="6" class="text-center py-3">
                        No se han agregado repuestos para este servicio.
                    </td>
                `;
                partsTableBody.appendChild(noPartsRowNew);
            }
            
            // Recalcular el valor total de repuestos
            calculateSparesTotalValue();
        }
        
        // Función para calcular el valor total de repuestos
        function calculateSparesTotalValue() {
            let totalSpares = 0;
            const totalInputs = partsTableBody.querySelectorAll('input[name="part_total_value[]"]');
            totalInputs.forEach(input => {
                totalSpares += unformatCurrency(input.value);
            });
            
            const spareValueInput = document.getElementById('spare_value');
            if (spareValueInput) {
                spareValueInput.value = formatCurrency(totalSpares);
                calculateTotal();
            }
        }

        // Función para calcular total de fila de repuesto
        function setupRowCalculations(row) {
            const quantityInput = row.querySelector('input[name="part_quantity[]"]');
            const unitPriceInput = row.querySelector('input[name="part_unit_value[]"]');
            const totalPriceInput = row.querySelector('input[name="part_total_value[]"]');

            // Formatear valores iniciales
            unitPriceInput.value = formatCurrency(unitPriceInput.value);
            totalPriceInput.value = formatCurrency(totalPriceInput.value);

            function calculateRowTotal() {
                const quantity = parseInt(quantityInput.value) || 0;
                const unitPrice = unformatCurrency(unitPriceInput.value);
                totalPriceInput.value = formatCurrency(quantity * unitPrice);
                calculateSparesTotalValue();
            }

            // Configurar eventos para quitar/poner formato al editar
            unitPriceInput.addEventListener('focus', function() {
                this.value = unformatCurrency(this.value);
            });
            
            unitPriceInput.addEventListener('blur', function() {
                this.value = formatCurrency(this.value);
                calculateRowTotal();
            });

            quantityInput.addEventListener('input', calculateRowTotal);
            unitPriceInput.addEventListener('input', calculateRowTotal);

            // Configurar eliminación de fila
            const removeBtn = row.querySelector('.remove-part, .removePartBtn');
            if (removeBtn) {
                removeBtn.addEventListener('click', () => removePartRow(row));
            }
        }

        // Agregar evento para añadir nuevo repuesto
        if (addPartBtn) {
            addPartBtn.addEventListener('click', function() {
                // Eliminar la fila "No hay repuestos" si existe
                const noPartsRowElement = document.getElementById('noPartsRow');
                if (noPartsRowElement) {
                    noPartsRowElement.remove();
                }

                // Clonar la plantilla de fila
                if (partRowTemplate) {
                    const newRow = partRowTemplate.content.cloneNode(true).querySelector('tr');
                    
                    // Establecer el índice de fila
                    const indexCell = newRow.querySelector('.part-index');
                    const existingRows = partsTableBody.querySelectorAll('tr:not(#noPartsRow)');
                    indexCell.textContent = existingRows.length + 1;

                    // Agregar la nueva fila a la tabla
                    partsTableBody.appendChild(newRow);

                    // Configurar cálculos y eventos para la nueva fila
                    setupRowCalculations(newRow);
                }
            });
        }

        // Configurar cálculos para filas existentes al cargar
        const existingRows = partsTableBody.querySelectorAll('tr:not(#noPartsRow)');
        existingRows.forEach(setupRowCalculations);

        // IMPORTANTE: Configurar eventos para los botones de eliminación existentes
        const existingRemoveBtns = document.querySelectorAll('.removePartBtn');
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
                    input.value = unformatCurrency(input.value);
                });
            });
        }
    }

    // Función para manejar mensajes flash del servidor
    // Esta función es reemplazada por handleFlashMessages del archivo toast-notifications.js

    // Script mínimo para actualizar el textarea cuando cambian las selecciones
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