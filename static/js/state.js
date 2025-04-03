document.addEventListener('DOMContentLoaded', function() {
    // ===== FILTRADO DE TICKETS POR ESTADO =====
    const filterButtons = document.querySelectorAll('input[name="filterStatus"]');
    const ticketsTable = document.querySelector('table tbody');
    const ticketRows = ticketsTable ? ticketsTable.querySelectorAll('tr[data-status]') : [];
    
    // Variable para mantener el estado del filtro actual
    let currentFilter = 'Todos';
    
    // Función para filtrar tickets por estado
    function filterTicketsByStatus(status) {
        // Si no hay filas para filtrar, salir
        if (!ticketRows.length) return;
        
        // Guardar el filtro actual
        currentFilter = status;
        
        // Contador para tickets visibles
        let visibleCount = 0;
        
        ticketRows.forEach(row => {
            const rowStatus = row.getAttribute('data-status');
            
            // Mapeo de estados de filtro a estados reales
            let shouldShow = false;
            
            if (status === 'Todos') {
                // En la vista principal (Todos) NO mostrar los tickets terminados
                shouldShow = rowStatus !== 'Terminado';
            } else if (status === 'Sin asignar') {
                shouldShow = rowStatus === 'Sin asignar';
            } else if (status === 'Asignados') {
                shouldShow = rowStatus === 'Asignado';
            } else if (status === 'En Proceso') {
                shouldShow = rowStatus === 'En proceso';
            } else if (status === 'Terminados') {
                shouldShow = rowStatus === 'Terminado';
            } else if (status === 'Cancelados') {
                shouldShow = rowStatus === 'Cancelado';
            }
            
            // Mostrar u ocultar la fila según corresponda
            row.style.display = shouldShow ? '' : 'none';
            
            // Incrementar contador si la fila es visible
            if (shouldShow) {
                visibleCount++;
            }
        });
        
        // Actualizar contador de tickets visibles
        const ticketCounter = document.querySelector('.badge.bg-primary strong');
        if (ticketCounter) {
            ticketCounter.textContent = visibleCount;
        }
        
        // Mostrar mensaje si no hay resultados
        updateNoResultsMessage(visibleCount);
    }
    
    // Función para mostrar mensaje de no resultados
    function updateNoResultsMessage(visibleCount) {
        const noResultsRow = document.getElementById('noResultsRow');
        
        if (visibleCount === 0) {
            if (!noResultsRow) {
                const newRow = document.createElement('tr');
                newRow.id = 'noResultsRow';
                newRow.innerHTML = `
                    <td colspan="10" class="text-center py-4">
                        <i class="fas fa-filter fa-2x mb-3 text-muted"></i>
                        <p class="text-muted">No hay tickets que coincidan con el filtro seleccionado.</p>
                    </td>
                `;
                ticketsTable.appendChild(newRow);
            }
        } else if (noResultsRow) {
            noResultsRow.remove();
        }
    }
    
    // Configurar eventos para los botones de filtro
    filterButtons.forEach(button => {
        button.addEventListener('change', function() {
            const status = this.nextElementSibling.textContent.trim();
            filterTicketsByStatus(status);
            
            // Limpiar el campo de búsqueda cuando se cambia el filtro
            const searchInput = document.getElementById("searchRepairs");
            if (searchInput) {
                searchInput.value = '';
            }
            
            // Actualizar clase visual para el botón activo
            document.querySelectorAll('label.filter-active').forEach(label => {
                label.classList.remove('filter-active');
            });
            this.nextElementSibling.classList.add('filter-active');
        });
    });
    
    // Inicializar con el filtro "Todos" seleccionado
    const allFilterButton = document.querySelector('input[id="btnTodos"]');
    if (allFilterButton && allFilterButton.checked) {
        filterTicketsByStatus('Todos');
        allFilterButton.nextElementSibling.classList.add('filter-active');
    }
    
    // ===== BÚSQUEDA EN TABLA DE TICKETS =====
    const searchInput = document.getElementById("searchRepairs");
    
    if (searchInput && ticketsTable) {
        searchInput.addEventListener("input", function() {
            const searchValue = this.value.toLowerCase();
            
            // Si no hay búsqueda, volver al filtro actual
            if (searchValue === '') {
                filterTicketsByStatus(currentFilter);
                return;
            }
            
            // Aplicar la búsqueda respetando el filtro actual, pero con excepción para Todos
            let visibleCount = 0;
            
            ticketRows.forEach(row => {
                const rowStatus = row.getAttribute('data-status');
                const rowText = row.textContent.toLowerCase();
                
                // Determinar si debería mostrarse según el filtro actual
                let matchesFilter = false;
                
                if (currentFilter === 'Todos') {
                    // CAMBIO IMPORTANTE: En búsqueda desde Todos, incluir también los Terminados
                    matchesFilter = true; // Permitir todos los estados en búsqueda
                } else if (currentFilter === 'Sin asignar') {
                    matchesFilter = rowStatus === 'Sin asignar';
                } else if (currentFilter === 'Asignados') {  // ¡Asegurarse de que este caso esté presente!
                    matchesFilter = rowStatus === 'Asignado';
                } else if (currentFilter === 'En proceso') {
                    matchesFilter = rowStatus === 'En proceso';
                } else if (currentFilter === 'Completados') {
                    matchesFilter = rowStatus === 'Terminado';
                } else if (currentFilter === 'Cancelados') {
                    matchesFilter = rowStatus === 'Cancelado';
                }
                
                // La fila debe coincidir tanto con el filtro como con la búsqueda
                const shouldShow = matchesFilter && rowText.includes(searchValue);
                
                row.style.display = shouldShow ? '' : 'none';
                
                if (shouldShow) {
                    visibleCount++;
                }
            });
            
            // Actualizar contador de tickets visibles
            const ticketCounter = document.querySelector('.badge.bg-primary strong');
            if (ticketCounter) {
                ticketCounter.textContent = visibleCount;
            }
            
            // Mostrar mensaje personalizado para búsquedas
            const noResultsRow = document.getElementById('noResultsRow');
            if (visibleCount === 0) {
                if (!noResultsRow) {
                    const newRow = document.createElement('tr');
                    newRow.id = 'noResultsRow';
                    newRow.innerHTML = `
                        <td colspan="10" class="text-center py-4">
                            <i class="fas fa-search fa-2x mb-3 text-muted"></i>
                            <p class="text-muted">No se encontraron tickets que coincidan con la búsqueda.</p>
                        </td>
                    `;
                    ticketsTable.appendChild(newRow);
                } else {
                    // Actualizar el mensaje si ya existe
                    noResultsRow.innerHTML = `
                        <td colspan="10" class="text-center py-4">
                            <i class="fas fa-search fa-2x mb-3 text-muted"></i>
                            <p class="text-muted">No se encontraron tickets que coincidan con la búsqueda.</p>
                        </td>
                    `;
                }
            } else if (noResultsRow) {
                noResultsRow.remove();
            }
        });
    }
});

// Función global para mostrar toast con SweetAlert (vista del tecnico)
function showToast(icon, title, position = 'top-end', timer = 3000) {
    const Toast = Swal.mixin({
        toast: true,
        position: position,
        showConfirmButton: false,
        timer: timer,
        timerProgressBar: true,
        didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer)
            toast.addEventListener('mouseleave', Swal.resumeTimer)
        }
    });

    Toast.fire({
        icon: icon,
        title: title
    });
}

document.addEventListener('DOMContentLoaded', function () {
    // Cuando cambia el estado de un ticket
    $('.status-select').on('change', function () {
        // Obtener elementos y valores
        const $select = $(this);
        const ticketId = $select.data('ticket-id');
        const newStatus = $select.val();
        const originalValue = $select.data('original-value') || $select.find('option:selected').val();
        
        // Guardar el valor original por si hay error
        $select.data('original-value', originalValue);
        
        // Mostrar confirmación antes de cambiar el estado
        Swal.fire({
            title: '¿Cambiar estado?',
            text: `¿Estás seguro de cambiar el estado del ticket #${ticketId} a "${newStatus}"?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, cambiar',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                // Mostrar indicador de carga
                $select.addClass('opacity-50');
                $select.prop('disabled', true);

                // Mostrar toast de carga
                showToast('info', 'Actualizando estado...', 'top-end');

                // Enviar solicitud AJAX
                $.ajax({
                    url: '/update_ticket_status_ajax',
                    method: 'POST',
                    data: {
                        ticket_id: ticketId,
                        state: newStatus
                    },
                    success: function (response) {
                        // Quitar indicador de carga
                        $select.removeClass('opacity-50');
                        $select.prop('disabled', false);

                        if (response.success) {
                            // Actualizar el timestamp mostrado
                            if (response.timestamp) {
                                const $timestamp = $select.closest('tr').find('.timestamp');
                                if ($timestamp.length) {
                                    $timestamp.text(response.timestamp);
                                }
                            }

                            // Actualizar el atributo data-status de la fila
                            $select.closest('tr').attr('data-status', newStatus);

                            // Mostrar notificación de éxito
                            showToast('success', 'Estado actualizado correctamente', 'top-end');
                        } else {
                            // Mostrar error y restaurar valor original
                            showToast('error', response.message || 'Error al actualizar el estado', 'top-end');
                            $select.val(originalValue);
                        }
                    },
                    error: function (xhr) {
                        // Quitar indicador de carga
                        $select.removeClass('opacity-50');
                        $select.prop('disabled', false);

                        // Restaurar valor original
                        $select.val(originalValue);

                        // Mostrar mensaje de error
                        let errorMsg = 'Error al actualizar el estado';
                        if (xhr.responseJSON && xhr.responseJSON.message) {
                            errorMsg = xhr.responseJSON.message;
                        }
                        showToast('error', errorMsg, 'top-end');
                    }
                });
            } else {
                // Si el usuario cancela, restaurar el valor original
                $select.val(originalValue);
            }
        });
    });
});