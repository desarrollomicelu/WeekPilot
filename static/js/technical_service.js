/***************************************************
 * technical_service.js
 * Funciones para la vista de Technical Service (lista de tickets)
 ***************************************************/

/***** Funciones de Notificación *****/

/**
 * Muestra un toast (notificación pequeña) usando SweetAlert2.
 * @param {string} icon - Tipo de ícono ('success', 'error', 'info', etc.).
 * @param {string} title - Texto a mostrar.
 * @param {string} [position='top-end'] - Posición del toast.
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
 * Muestra una alerta de éxito (usada tras actualizar un ticket).
 * @param {Function} [callback] - Función opcional a ejecutar después de cerrar la alerta
 */
function showSuccessTicketAlert(callback) {
    Swal.fire({
        icon: 'success',
        title: '¡Ticket creado con éxito!',
        text: 'El ticket se ha generado correctamente.',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        iconColor: '#28a745',
        customClass: {
            popup: 'colored-toast'
        },
        didClose: () => {
            if (typeof callback === 'function') {
                callback();
            }
        }
    });
}


/***** Funcionalidad de Búsqueda y Filtrado *****/
document.addEventListener("DOMContentLoaded", function () {
    // Verificar si venimos de una actualización exitosa
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('ticket_updated') === 'success') {
        showSuccessTicketAlert();
        // Limpiar la URL para evitar que se muestre la alerta al refrescar
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    // --- Búsqueda en la tabla de tickets ---
    const searchInput = document.getElementById("searchInput");
    const ticketsTable = document.getElementById("ticketsTable");
    if (searchInput && ticketsTable) {
        searchInput.addEventListener("input", function () {
            const searchValue = this.value.toLowerCase();
            const rows = ticketsTable.getElementsByTagName("tr");
            // Se omite la cabecera (índice 0)
            for (let i = 1; i < rows.length; i++) {
                let rowText = rows[i].textContent.toLowerCase();
                rows[i].style.display = rowText.includes(searchValue) ? "" : "none";
            }
            // Actualizar paginación tras la búsqueda
            setTimeout(updatePaginationAfterFilter, 100);
        });
    }

    // --- Actualización del estado del ticket vía AJAX ---
    $(document).ready(function () {
        // Definir el orden de los estados (de menor a mayor progreso)
        const stateOrder = {
            "Sin asignar": 1,
            "Asignado": 2,
            "En proceso": 3,
            "En revision": 4,
            "Terminado": 5
        };

        // Al cargar la página, guardar el estado original como atributo data-*
        $('.status-select').each(function() {
            const $select = $(this);
            // Usar el atributo data-original-state si existe, o el valor actual
            if (!$select.attr('data-original-state')) {
                $select.attr('data-original-state', $select.val());
            }
        });

        $('.status-select').on('change', function () {
            const $select = $(this);
            const ticketId = $select.data('ticket-id');
            const newStatus = $select.val();
            // Usar el atributo data-original-state en lugar de data()
            const originalValue = $select.attr('data-original-state');
            
            // Validar si es un retroceso de estado
            if (stateOrder[newStatus] < stateOrder[originalValue]) {
                // Es un retroceso, mostrar error y revertir
                Swal.fire({
                    icon: 'error',
                    title: 'Operación no permitida',
                    text: `No se puede cambiar el estado de "${originalValue}" a "${newStatus}". No se permite retroceder en el flujo de estados.`,
                    confirmButtonColor: '#3085d6',
                    confirmButtonText: 'Entendido'
                });
                
                // Restaurar el valor original
                $select.val(originalValue);
                return false;
            }

            // Si no es retroceso, continuar con el flujo normal
            // Preguntar al usuario
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
                    // Indicar carga
                    $select.addClass('opacity-50').prop('disabled', true);
                    showToast('info', 'Actualizando estado...', 'top-end');
                    // Enviar solicitud AJAX
                    $.ajax({
                        url: '/update_ticket_status_ajax',
                        method: 'POST',
                        data: {
                            ticket_id: ticketId,
                            status: newStatus
                        },
                        success: function (response) {
                            $select.removeClass('opacity-50').prop('disabled', false);
                            if (response.success) {
                                showToast('success', 'Estado actualizado correctamente', 'top-end');
                                updateRowStyles($select.closest('tr'), response.status);
                                // Actualizar el valor original después de un cambio exitoso
                                // Usar attr() en lugar de data()
                                $select.attr('data-original-state', newStatus);
                                
                                // Mover la fila al principio de la tabla usando la función global
                                const $row = $select.closest('tr');
                                if (typeof window.moveTicketToTop === 'function') {
                                    window.moveTicketToTop($row);
                                } else {
                                    // Fallback si la función global no está disponible
                                    $row.css('background-color', '#fffde7');
                                    const $table = $('#ticketsTable tbody');
                                    setTimeout(function() {
                                        $row.fadeOut(300, function() {
                                            $table.prepend($row);
                                            $row.fadeIn(300);
                                            setTimeout(function() {
                                                $row.css('background-color', '');
                                                updateTicketCounter();
                                                window.updatePaginationAfterFilter();
                                            }, 1500);
                                        });
                                    }, 300);
                                }
                            } else {
                                showToast('error', response.message || 'Error al actualizar el estado', 'top-end');
                                $select.val(originalValue);
                            }
                        },
                        error: function (xhr) {
                            $select.removeClass('opacity-50').prop('disabled', false);
                            $select.val(originalValue);
                            let errorMsg = 'Error al actualizar el estado';
                            if (xhr.responseJSON && xhr.responseJSON.message) {
                                errorMsg = xhr.responseJSON.message;
                            }
                            showToast('error', errorMsg, 'top-end');
                        }
                    });
                } else {
                    $select.val(originalValue);
                }
            });
        });

        // Función simplificada usando clases de Bootstrap
        function updateRowStyles($row, status) {
            // Quitar todas las clases de estado
            $row.removeClass('table-success table-light');
            
            // Aplicar clase según el estado
            if (status === 'Terminado') {
                $row.addClass('table-secondary');
            } else {
                // Restaurar estilo de texto
                $row.find('td').css('font-style', 'normal');
            }
        }

        // Asegúrate de que esta función se llame cuando se carga la página
        $(document).ready(function() {
            console.log("Inicializando estilos de filas"); // Log para depuración
            
            // Aplicar estilos iniciales a todas las filas según su estado
            $('.status-select').each(function() {
                const $select = $(this);
                const status = $select.val();
                console.log("Estado inicial:", status); // Log para depuración
                updateRowStyles($select.closest('tr'), status);
            });
            
            // También actualizar cuando cambia el estado
            $('.status-select').on('change', function() {
                const $select = $(this);
                const newStatus = $select.val();
                console.log("Estado cambiado a:", newStatus); // Log para depuración
                updateRowStyles($select.closest('tr'), newStatus);
            });
        });
    });


    // --- Filtros Rápidos por Estado ---
    $(document).ready(function () {
        function filterTickets(status) {
            if (status === 'Todos') {
                $('tbody tr').show();
            } else if (status === 'Activos') {
                // Mostrar todos los tickets que NO están en estado "Terminado"
                $('tbody tr').each(function () {
                    var ticketStatus = $(this).find('td:nth-child(5) select').val();
                    $(this).toggle(ticketStatus !== 'Terminado');
                });
            } else {
                $('tbody tr').each(function () {
                    var ticketStatus = $(this).find('td:nth-child(5) select').val();
                    $(this).toggle(ticketStatus === status);
                });
            }
            updateTicketCounter();
            // updatePaginationAfterFilter(); // Comentar o eliminar esta línea
        }

        function updateTicketCounter() {
            const visibleTickets = $('tbody tr:visible').length;
            $('.badge.bg-primary strong').text(visibleTickets);
        }

        $('input[name="filterStatus"]').on('change', function () {
            const selectedStatus = $(this).next('label').text().trim();
            filterTickets(selectedStatus);
            $('.filter-active').removeClass('filter-active');
            $(this).next('label').addClass('filter-active');
        });

        $('select[name="status"]').on('change', function () {
            const activeFilter = $('input[name="filterStatus"]:checked').next('label').text().trim();
            filterTickets(activeFilter);
        });

        // Inicializar con "Todos"
        filterTickets('Todos');
        $('input[name="filterStatus"]:checked').next('label').addClass('filter-active');
    });


    /***** Paginación de Tickets *****/
    $(document).ready(function () {
        let currentPage = 1;
        let rowsPerPage = 10;
        let totalPages = 1;
        let filteredRows = [];

        function initPagination() {
            const allRows = $('#ticketsTable tbody tr').not('.no-results');
            filteredRows = allRows;
            rowsPerPage = parseInt($('#rowsPerPage').val());
            totalPages = Math.ceil(filteredRows.length / rowsPerPage);
            generatePaginationButtons();
            showPage(1);
        }

        function generatePaginationButtons() {
            $('#pagination li').not('#prevPage, #nextPage').remove();
            if (totalPages <= 7) {
                for (let i = 1; i <= totalPages; i++) {
                    const isActive = i === currentPage ? 'active' : '';
                    $('#nextPage').before(`<li class="page-item ${isActive}" data-page="${i}"><a class="page-link" href="#">${i}</a></li>`);
                }
            } else {
                $('#nextPage').before(`<li class="page-item ${currentPage === 1 ? 'active' : ''}" data-page="1"><a class="page-link" href="#">1</a></li>`);
                let startPage = Math.max(2, currentPage - 2);
                let endPage = Math.min(totalPages - 1, currentPage + 2);
                if (startPage > 2) {
                    $('#nextPage').before('<li class="page-item disabled"><a class="page-link" href="#">...</a></li>');
                }
                for (let i = startPage; i <= endPage; i++) {
                    const isActive = i === currentPage ? 'active' : '';
                    $('#nextPage').before(`<li class="page-item ${isActive}" data-page="${i}"><a class="page-link" href="#">${i}</a></li>`);
                }
                if (endPage < totalPages - 1) {
                    $('#nextPage').before('<li class="page-item disabled"><a class="page-link" href="#">...</a></li>');
                }
                $('#nextPage').before(`<li class="page-item ${currentPage === totalPages ? 'active' : ''}" data-page="${totalPages}"><a class="page-link" href="#">${totalPages}</a></li>`);
            }
            updatePrevNextButtons();
        }

        function showPage(pageNum) {
            if (pageNum < 1 || pageNum > totalPages) return;
            currentPage = pageNum;
            filteredRows.hide();
            const startIndex = (pageNum - 1) * rowsPerPage;
            const endIndex = Math.min(startIndex + rowsPerPage, filteredRows.length);
            filteredRows.slice(startIndex, endIndex).show();
            $('#currentRowsCount').text(Math.min(rowsPerPage, filteredRows.length - startIndex));
            $('#pagination li').removeClass('active');
            $(`#pagination li[data-page="${pageNum}"]`).addClass('active');
            updatePrevNextButtons();
        }

        function updatePrevNextButtons() {
            if (currentPage === 1) {
                $('#prevPage').addClass('disabled');
            } else {
                $('#prevPage').removeClass('disabled');
            }
            if (currentPage === totalPages || totalPages === 0) {
                $('#nextPage').addClass('disabled');
            } else {
                $('#nextPage').removeClass('disabled');
            }
        }

        // Función para actualizar la paginación después de filtrar
        function updatePaginationAfterFilter() {
            const filteredRows = $('#ticketsTable tbody tr:visible').not('.no-results');
            const rowsPerPage = parseInt($('#rowsPerPage').val() || 10);
            const totalPages = Math.ceil(filteredRows.length / rowsPerPage);
            
            // Actualizar contador de tickets visibles
            $('#currentRowsCount').text(Math.min(rowsPerPage, filteredRows.length));
            
            // Regenerar botones de paginación si es necesario
            if ($('#pagination').length) {
                $('#pagination li').not('#prevPage, #nextPage').remove();
                for (let i = 1; i <= totalPages; i++) {
                    const isActive = i === 1 ? 'active' : '';
                    $('#nextPage').before(`<li class="page-item ${isActive}" data-page="${i}"><a class="page-link" href="#">${i}</a></li>`);
                }
                // Actualizar los botones de navegación
                $('#prevPage').addClass('disabled');
                if (totalPages <= 1) {
                    $('#nextPage').addClass('disabled');
                } else {
                    $('#nextPage').removeClass('disabled');
                }
            }
            
            console.log("Paginación actualizada");
        }

        $('#rowsPerPage').on('change', function () {
            rowsPerPage = parseInt($(this).val());
            totalPages = Math.ceil(filteredRows.length / rowsPerPage);
            currentPage = 1;
            generatePaginationButtons();
            showPage(1);
        });

        $('#pagination').on('click', 'li:not(.disabled)', function (e) {
            e.preventDefault();
            const $this = $(this);
            if ($this.attr('id') === 'prevPage') {
                showPage(currentPage - 1);
            } else if ($this.attr('id') === 'nextPage') {
                showPage(currentPage + 1);
            } else {
                const pageNum = parseInt($this.data('page'));
                if (!isNaN(pageNum)) {
                    showPage(pageNum);
                }
            }
        });

        $('#searchInput').on('input', function () {
            setTimeout(updatePaginationAfterFilter, 100);
        });

        $('input[name="filterStatus"]').on('change', function () {
            setTimeout(updatePaginationAfterFilter, 100);
        });

        initPagination();
    });



    // Función para ordenar tickets
    function sortTickets(sortBy) {
        const rows = $('#ticketsTable tbody tr').get();
        
        rows.sort(function(a, b) {
            if (sortBy === 'id-desc') {
                const idA = parseInt($(a).find('td:first').text().replace('#', ''));
                const idB = parseInt($(b).find('td:first').text().replace('#', ''));
                return idB - idA;
            } else if (sortBy === 'id-asc') {
                const idA = parseInt($(a).find('td:first').text().replace('#', ''));
                const idB = parseInt($(b).find('td:first').text().replace('#', ''));
                return idA - idB;
            } else if (sortBy === 'status') {
                const statusA = $(a).find('td:nth-child(5) select').val();
                const statusB = $(b).find('td:nth-child(5) select').val();
                return statusA.localeCompare(statusB);
            } else if (sortBy === 'priority') {
                const priorityA = $(a).find('td:nth-child(6) span').text().trim();
                const priorityB = $(b).find('td:nth-child(6) span').text().trim();
                return priorityA.localeCompare(priorityB);
            }
        });
        
        $.each(rows, function(index, row) {
            $('#ticketsTable tbody').append(row);
        });
        
        // Reinicializar la paginación después de ordenar
        initPagination();
    }

    // Manejar clics en opciones de ordenamiento
    $(document).on('click', '.sort-option', function(e) {
        e.preventDefault();
        const sortBy = $(this).data('sort');
        sortTickets(sortBy);
    });

    // Ordenar por ID descendente al cargar la página
    $(document).ready(function() {
        sortTickets('id-desc');
    });
});

/**
 * Función para actualizar el contador de tickets visibles.
 */
function updateTicketCounter() {
    const visibleTickets = $('tbody tr:visible').length;
    $('.badge.bg-primary strong').text(visibleTickets);
}

/**
 * Actualiza la paginación después de filtrar o modificar la tabla.
 * Esta función es global para que pueda usarse desde otros scripts.
 */
window.updatePaginationAfterFilter = function() {
    const filteredRows = $('#ticketsTable tbody tr:visible').not('.no-results');
    const rowsPerPage = parseInt($('#rowsPerPage').val() || 10);
    const totalPages = Math.ceil(filteredRows.length / rowsPerPage);
    
    // Actualizar contador de tickets visibles
    $('#currentRowsCount').text(Math.min(rowsPerPage, filteredRows.length));
    
    // Regenerar botones de paginación si es necesario
    if ($('#pagination').length) {
        $('#pagination li').not('#prevPage, #nextPage').remove();
        for (let i = 1; i <= totalPages; i++) {
            const isActive = i === 1 ? 'active' : '';
            $('#nextPage').before(`<li class="page-item ${isActive}" data-page="${i}"><a class="page-link" href="#">${i}</a></li>`);
        }
        // Actualizar los botones de navegación
        $('#prevPage').addClass('disabled');
        if (totalPages <= 1) {
            $('#nextPage').addClass('disabled');
        } else {
            $('#nextPage').removeClass('disabled');
        }
    }
    
    console.log("Paginación actualizada");
};
