document.addEventListener('DOMContentLoaded', function() {
    const addPartBtn = document.getElementById('addPartBtn');
    const partsTable = document.getElementById('partsTable').getElementsByTagName('tbody')[0];
    const noPartsRow = document.getElementById('noPartsRow');
    const partRowTemplate = document.getElementById('partRowTemplate');

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
    document.getElementById('technical_name').addEventListener('change', function() {
        const selectedOption = this.options[this.selectedIndex];
        document.getElementById('documento').value = selectedOption.dataset.document || '';
    });
    
    // Script para calcular el total automáticamente
    function calculateTotal() {
        const spareValue = unformatCurrency(document.getElementById('spare_value').value);
        const serviceValue = unformatCurrency(document.getElementById('service_value').value);
        document.getElementById('total').value = formatCurrency(spareValue + serviceValue);
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
            totalSpares += unformatCurrency(input.value);
        });
        
        document.getElementById('spare_value').value = formatCurrency(totalSpares);
        calculateTotal();
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
  // actualizar estados 

document.addEventListener('DOMContentLoaded', function() {
  // Inicializar toasts
  var toastElList = [].slice.call(document.querySelectorAll('.toast'));
  var toastList = toastElList.map(function(toastEl) {
      return new bootstrap.Toast(toastEl, {
          autohide: true,
          delay: 3000
      });
  });
  
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
          Swal.fire({
              title: '¿Cambiar estado?',
              text: `¿Está seguro de cambiar el estado del ticket #${ticketId} a "${newStatus}"?`,
              icon: 'question',
              showCancelButton: true,
              confirmButtonColor: '#3085d6',
              cancelButtonColor: '#d33',
              confirmButtonText: 'Sí, cambiar',
              cancelButtonText: 'Cancelar'
          }).then((result) => {
              if (result.isConfirmed) {
                  // Hacer la petición AJAX
                  updateTicketStatus(ticketId, newStatus, select);
              } else {
                  // Restaurar el valor anterior si se cancela
                  select.value = previousStatus;
              }
          });
      });
  });
  
  // Función para hacer la petición AJAX
  function updateTicketStatus(ticketId, newStatus, selectElement) {
      // Mostrar un indicador de carga
      const loadingToast = showToast('Actualizando...', 'info');
      
      fetch('/update_ticket_status', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
              'X-Requested-With': 'XMLHttpRequest'
          },
          body: JSON.stringify({
              ticket_id: ticketId,
              status: newStatus
          })
      })
      .then(response => response.json())
      .then(data => {
          // Ocultar el toast de carga
          if (loadingToast) {
              loadingToast.hide();
          }
          
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
              showToast(data.message, 'success');
          } else {
              // Si hay error, mostrar alerta y restaurar valor anterior
              Swal.fire({
                  title: 'Error',
                  text: data.message,
                  icon: 'error'
              });
              
              // Restaurar el valor anterior
              selectElement.value = selectElement.getAttribute('data-previous-status');
              
              // Mostrar toast de error
              showToast(data.message, 'danger');
          }
      })
      .catch(error => {
          // Ocultar el toast de carga
          if (loadingToast) {
              loadingToast.hide();
          }
          
          console.error('Error:', error);
          
          // Mostrar alerta de error
          Swal.fire({
              title: 'Error',
              text: 'Ocurrió un error al actualizar el estado',
              icon: 'error'
          });
          
          // Restaurar el valor anterior
          selectElement.value = selectElement.getAttribute('data-previous-status');
          
          // Mostrar toast de error
          showToast('Error al actualizar el estado', 'danger');
      });
  }
  
  // Función para mostrar un toast
  function showToast(message, type) {
      const toastContainer = document.getElementById('toast-container');
      if (!toastContainer) {
          console.error('Contenedor de toast no encontrado');
          return null;
      }
      
      const toastId = 'toast-' + Date.now();
      const toastHTML = `
          <div id="${toastId}" class="toast align-items-center text-white bg-${type} border-0" role="alert" aria-live="assertive" aria-atomic="true">
              <div class="d-flex">
                  <div class="toast-body">
                      ${message}
                  </div>
                  <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Cerrar"></button>
              </div>
          </div>
      `;
      
      toastContainer.insertAdjacentHTML('beforeend', toastHTML);
      const toastElement = document.getElementById(toastId);
      const toast = new bootstrap.Toast(toastElement, {
          autohide: true,
          delay: 3000
      });
      
      toast.show();
      
      // Eliminar el toast del DOM después de ocultarse
      toastElement.addEventListener('hidden.bs.toast', function() {
          toastElement.remove();
      });
      
      return toast;
  }
});