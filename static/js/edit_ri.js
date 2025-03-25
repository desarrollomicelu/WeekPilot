// agregaar los repuesto en el editar 
document.addEventListener('DOMContentLoaded', function() {
    const addPartBtn = document.getElementById('addPartBtn');
    const partsTable = document.getElementById('partsTable').getElementsByTagName('tbody')[0];
    const noPartsRow = document.getElementById('noPartsRow');

    addPartBtn.addEventListener('click', function() {
        // Eliminar la fila "No hay repuestos" si existe
        if (noPartsRow) {
            noPartsRow.remove();
        }

        // Crear nueva fila de repuesto
        const newRow = partsTable.insertRow();
        const rowIndex = partsTable.rows.length;

        newRow.innerHTML = `
            <td>${rowIndex}</td>
            <td>
                <input type="text" name="part_description[]" class="form-control" required>
            </td>
            <td>
                <input type="number" name="part_quantity[]" class="form-control" min="1" value="1" required>
            </td>
            <td>
                <input type="number" name="part_unit_value[]" class="form-control" min="0" step="0.01" required>
            </td>
            <td>
                <button type="button" class="btn btn-sm btn-danger removePartBtn">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;

        // Agregar evento para eliminar fila
        newRow.querySelector('.removePartBtn').addEventListener('click', function() {
            partsTable.deleteRow(newRow.rowIndex - 1);
            
            // Si no quedan filas, agregar la fila "No hay repuestos"
            if (partsTable.rows.length === 0) {
                const noPartsRow = partsTable.insertRow();
                noPartsRow.id = 'noPartsRow';
                noPartsRow.innerHTML = `
                    <td colspan="5" class="text-center py-3">
                        No se han agregado repuestos para este servicio.
                    </td>
                `;
            }
        });
    });

    // Agregar eventos para eliminar filas existentes
    document.querySelectorAll('.removePartBtn').forEach(btn => {
        btn.addEventListener('click', function() {
            const row = this.closest('tr');
            partsTable.deleteRow(row.rowIndex - 1);
            
            // Si no quedan filas, agregar la fila "No hay repuestos"
            if (partsTable.rows.length === 0) {
                const noPartsRow = partsTable.insertRow();
                noPartsRow.id = 'noPartsRow';
                noPartsRow.innerHTML = `
                    <td colspan="5" class="text-center py-3">
                        No se han agregado repuestos para este servicio.
                    </td>
                `;
            }
        });
    });
});