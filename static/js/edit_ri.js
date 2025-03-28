document.addEventListener('DOMContentLoaded', function() {
    const addPartBtn = document.getElementById('addPartBtn');
    const partsTable = document.getElementById('partsTable').getElementsByTagName('tbody')[0];
    const noPartsRow = document.getElementById('noPartsRow');
    const partRowTemplate = document.getElementById('partRowTemplate');

    // Script para actualizar automáticamente el documento del técnico al seleccionarlo
    document.getElementById('technical_name').addEventListener('change', function() {
        const selectedOption = this.options[this.selectedIndex];
        document.getElementById('documento').value = selectedOption.dataset.document || '';
    });
    
    // Script para calcular el total automáticamente
    function calculateTotal() {
        const spareValue = parseFloat(document.getElementById('spare_value').value) || 0;
        const serviceValue = parseFloat(document.getElementById('service_value').value) || 0;
        document.getElementById('total').value = (spareValue + serviceValue).toFixed(2);
    }
    
    document.getElementById('spare_value').addEventListener('input', calculateTotal);
    document.getElementById('service_value').addEventListener('input', calculateTotal);

    // Función para eliminar fila de repuestos
    function removePartRow(row) {
        row.remove();
        
        // Actualizar los índices de las filas restantes
        const rows = partsTable.querySelectorAll('tr:not(#noPartsRow)');
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
            partsTable.appendChild(noPartsRowNew);
        }
        
        // Recalcular el valor total de repuestos
        calculateSparesTotalValue();
    }
    
    // Función para calcular el valor total de repuestos
    function calculateSparesTotalValue() {
        let totalSpares = 0;
        const totalInputs = partsTable.querySelectorAll('input[name="part_total_value[]"]');
        totalInputs.forEach(input => {
            totalSpares += parseFloat(input.value) || 0;
        });
        
        document.getElementById('spare_value').value = totalSpares.toFixed(2);
        calculateTotal();
    }

    // Función para calcular total de fila de repuesto
    function setupRowCalculations(row) {
        const quantityInput = row.querySelector('input[name="part_quantity[]"]');
        const unitPriceInput = row.querySelector('input[name="part_unit_value[]"]');
        const totalPriceInput = row.querySelector('input[name="part_total_value[]"]');

        function calculateRowTotal() {
            const quantity = parseFloat(quantityInput.value) || 0;
            const unitPrice = parseFloat(unitPriceInput.value) || 0;
            totalPriceInput.value = (quantity * unitPrice).toFixed(2);
            calculateSparesTotalValue();
        }

        quantityInput.addEventListener('input', calculateRowTotal);
        unitPriceInput.addEventListener('input', calculateRowTotal);

        // Configurar eliminación de fila
        const removeBtn = row.querySelector('.remove-part, .removePartBtn');
        if (removeBtn) {
            removeBtn.addEventListener('click', () => removePartRow(row));
        }
    }

    // Agregar evento para añadir nuevo repuesto
    addPartBtn.addEventListener('click', function() {
        // Eliminar la fila "No hay repuestos" si existe
        const noPartsRowElement = document.getElementById('noPartsRow');
        if (noPartsRowElement) {
            noPartsRowElement.remove();
        }

        // Clonar la plantilla de fila
        const newRow = partRowTemplate.content.cloneNode(true).querySelector('tr');
        
        // Establecer el índice de fila
        const indexCell = newRow.querySelector('.part-index');
        const existingRows = partsTable.querySelectorAll('tr:not(#noPartsRow)');
        indexCell.textContent = existingRows.length + 1;

        // Agregar la nueva fila a la tabla
        partsTable.appendChild(newRow);

        // Configurar cálculos y eventos para la nueva fila
        setupRowCalculations(newRow);
    });

    // Configurar cálculos para filas existentes al cargar
    const existingRows = partsTable.querySelectorAll('tr:not(#noPartsRow)');
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
});

// funciones de las alertas 
function mostrarToast(mensaje, tipo = 'success') {
    // Eliminar cualquier toast existente
    const toastExistentes = document.querySelectorAll('.toast');
    toastExistentes.forEach(toast => toast.remove());

    // Crear contenedor de toast si no existe
    let contenedorToast = document.getElementById('contenedor-toast');
    if (!contenedorToast) {
        contenedorToast = document.createElement('div');
        contenedorToast.id = 'contenedor-toast';
        contenedorToast.className = 'position-fixed top-0 end-0 p-3';
        contenedorToast.style.zIndex = '11';
        document.body.appendChild(contenedorToast);
    }

    // Crear elemento toast
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-bg-${tipo === 'success' ? 'success' : 'danger'} border-0`;
    toast.role = 'alert';
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');

    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                ${mensaje}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Cerrar"></button>
        </div>
    `;

    // Agregar al contenedor
    contenedorToast.appendChild(toast);

    // Inicializar y mostrar toast usando el método de Bootstrap
    const toastBootstrap = new bootstrap.Toast(toast, {
        delay: 5000 // 5 segundos
    });
    toastBootstrap.show();
}

// Función para manejar mensajes flash del servidor
function manejarMensajesFlash() {
    const mensajesFlash = document.querySelectorAll('.alert');
    mensajesFlash.forEach(mensaje => {
        const esExito = mensaje.classList.contains('alert-success');
        const esError = mensaje.classList.contains('alert-danger');
        
        if (esExito) {
            mostrarToast(mensaje.textContent, 'success');
        } else if (esError) {
            mostrarToast(mensaje.textContent, 'error');
        }
        
        // Eliminar el mensaje flash original
        mensaje.remove();
    });
}

// Llamar cuando el DOM está cargado
document.addEventListener('DOMContentLoaded', manejarMensajesFlash);

 // Script mínimo para actualizar el textarea cuando cambian las selecciones
 document.addEventListener("DOMContentLoaded", function() {
    const checkboxes = document.querySelectorAll('.problem-checkbox');
    const textarea = document.getElementById('selected_problems');
    
    // Llamar a updateTextarea inmediatamente al cargar la página para mostrar los repuestos inicialmente seleccionados
    updateTextarea();
    
    checkboxes.forEach(checkbox => {
      checkbox.addEventListener('change', updateTextarea);
    });
    
    document.getElementById('selectAllProblems').addEventListener('click', function() {
      checkboxes.forEach(cb => cb.checked = true);
      updateTextarea();
    });
    
    document.getElementById('clearProblems').addEventListener('click', function() {
      checkboxes.forEach(cb => cb.checked = false);
      updateTextarea();
    });
    
    function updateTextarea() {
      let selected = [];
      checkboxes.forEach(cb => {
        if (cb.checked) {
          const label = document.querySelector(`label[for="${cb.id}"]`);
          selected.push(label.textContent.trim());
        }
      });
      textarea.value = selected.join('\n');
    }
  });
  // actualizar la referencia-codigo
  document.addEventListener('DOMContentLoaded', function() {
    const referenceSelect = document.getElementById('reference');
    const productCodeInput = document.getElementById('product_code');
    
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
  });