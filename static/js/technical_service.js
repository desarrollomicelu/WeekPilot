document.addEventListener("DOMContentLoaded", function () {
    const searchInput = document.getElementById("searchInput");
    const ticketsTable = document.getElementById("ticketsTable");

    // Filtro de búsqueda
    searchInput.addEventListener("input", function () {
        const searchValue = this.value.toLowerCase();
        const rows = ticketsTable.getElementsByTagName("tr");
        
        for (let i = 1; i < rows.length; i++) {
            let rowText = rows[i].textContent.toLowerCase();
            rows[i].style.display = rowText.includes(searchValue) ? "" : "none";
        }
    });


});


  $(document).ready(function() {
    // Función para filtrar las filas de la tabla
    function filterTickets(status) {
      $('tbody tr').each(function() {
        var ticketStatus = $(this).data('status');
        if (status === 'Todos' || ticketStatus === status) {
          $(this).show();
        } else {
          $(this).hide();
        }
      });
    }

    // Evento al cambiar el filtro
    $('input[name="filterStatus"]').on('change', function() {
      var selectedStatus = $(this).next('label').text().trim();
      filterTickets(selectedStatus);
    });

    // Aplicar el filtro inicial (por defecto "Todos")
    filterTickets('Todos');
  });