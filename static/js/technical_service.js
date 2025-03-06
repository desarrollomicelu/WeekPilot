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
