
document.addEventListener('DOMContentLoaded', function () {
    const partsTable = document.getElementById('partsTable');
    const partsTableBody = partsTable.querySelector('tbody');
    const addPartBtn = document.getElementById('addPartBtn');
    const partRowTemplate = document.getElementById('partRowTemplate');
    const noPartsRow = document.getElementById('noPartsRow');
    const serviceValueInput = document.getElementById('service_value');
    const spareValueInput = document.getElementById('spare_value');
    const totalInput = document.getElementById('total');

    function editPartTotal(row) {
        const quantity = parseFloat(row.querySelector('.part-quantity').value) || 0;
        const unitValue = parseFloat(row.querySelector('.part-unit-value').value) || 0;
        row.querySelector('.part-total-value').value = quantity * unitValue;
        editTotals();
    }

    function editTotals() {
        let spareTotal = 0;
        document.querySelectorAll('.part-total-value').forEach(input => {
            spareTotal += parseFloat(input.value) || 0;
        });
        spareValueInput.value = spareTotal;
        const serviceValue = parseFloat(serviceValueInput.value) || 0;
        totalInput.value = serviceValue + spareTotal;
    }

    function editRowIndices() {
        const rows = partsTableBody.querySelectorAll('.part-row');
        rows.forEach((row, index) => {
            const indexCell = row.querySelector('.part-index');
            indexCell.textContent = index + 1;
    
            // Aplicar padding al índice
            indexCell.style.padding = '15px';
        });
    }
    // Formato para cargar los datos de los respuestos utilizados
    
    addPartBtn.addEventListener('click', function () {
        if (noPartsRow) { noPartsRow.remove(); }
        const newRow = document.importNode(partRowTemplate.content, true).querySelector('tr');
        partsTableBody.appendChild(newRow);
        
    
        newRow.querySelector('.part-quantity').addEventListener('input', () => editPartTotal(newRow));
        newRow.querySelector('.part-unit-value').addEventListener('input', () => editPartTotal(newRow));
        newRow.querySelector('.remove-part').addEventListener('click', () => {
            newRow.remove();
            editRowIndices();
            editTotals();
            if (partsTableBody.querySelectorAll('.part-row').length === 0) {
                const emptyRow = document.createElement('tr');
                emptyRow.id = 'noPartsRow';
                emptyRow.innerHTML = '<td colspan="6" class="text-center py-3">No se han agregado repuestos para este servicio.</td>';
                partsTableBody.appendChild(emptyRow);
            }
        });
    
        editRowIndices();
    });

    serviceValueInput.addEventListener('input', editTotals);
    editTotals();
});
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
