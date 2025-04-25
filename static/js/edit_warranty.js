/*****************************************************
 * edit_warranty.js
 * Funciones para la edición de garantías de servicio
 *****************************************************/

/**
 * Muestra una notificación toast
 * @param {string} icon - Tipo de icono ('success', 'error', 'warning', 'info')
 * @param {string} title - Texto de la notificación
 * @param {string} position - Posición ('top', 'top-start', 'top-end', etc.)
 * @param {number} timer - Tiempo en ms que se mostrará la notificación
 */
function showToast(icon, title, position = 'top-end', timer = 3000) {
    if (typeof Swal !== 'undefined') {
        const Toast = Swal.mixin({
            toast: true,
            position: position,
            showConfirmButton: false,
            timer: timer,
            timerProgressBar: true
        });

        Toast.fire({
            icon: icon,
            title: title
        });
    } else {
        console.log(`${icon.toUpperCase()}: ${title}`);
    }
}

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
        // Eliminar puntos y comas para asegurar que no haya problemas con diferentes formatos
        number = parseInt(number.replace(/\./g, '').replace(/,/g, ''), 10) || 0;
    }
    
    // Asegurar que sea un entero (sin decimales)
    number = Math.floor(Number(number));
    
    // Formatear usando el formato colombiano (punto como separador de miles)
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/**
 * Elimina los separadores de miles de un número
 * @param {string} formattedNumber - Número con formato (separadores de miles)
 * @returns {number} Número sin formato
 */
function unformatNumber(formattedNumber) {
    if (typeof formattedNumber !== 'string' && typeof formattedNumber !== 'number') return 0;
    
    // Convertir a string
    const strValue = formattedNumber.toString();
    
    // Eliminar todos los puntos (separadores de miles)
    return parseInt(strValue.replace(/\./g, ''), 10) || 0;
}

/**
 * Muestra un mensaje de error en la validación
 * @param {HTMLElement} input - Elemento de entrada
 * @param {string} message - Mensaje de error
 */
function showValidationError(input, message) {
    if (!input) return;
    
    // Agregar clase de error
    input.classList.add('is-invalid');
    
    // Buscar contenedor padre
    const parentElement = input.parentElement;
    if (!parentElement) return;
    
    // Buscar si ya existe un feedback
    let feedback = parentElement.querySelector('.invalid-feedback');
    
    // Si no existe, crear uno nuevo
    if (!feedback) {
        feedback = document.createElement('div');
        feedback.className = 'invalid-feedback';
        parentElement.appendChild(feedback);
    }
    
    // Actualizar mensaje
    feedback.textContent = message;
    feedback.style.display = 'block';
}

/**
 * Elimina el mensaje de error en la validación
 * @param {HTMLElement} input - Elemento de entrada
 */
function removeValidationError(input) {
    if (!input) return;
    
    // Quitar clase de error
    input.classList.remove('is-invalid');
    
    // Buscar contenedor padre
    const parentElement = input.parentElement;
    if (!parentElement) return;
    
    // Buscar feedback y ocultarlo
    const feedback = parentElement.querySelector('.invalid-feedback');
    if (feedback) {
        feedback.style.display = 'none';
    }
}

/**
 * Inicializa el manejo de valores monetarios en el formulario
 */
function setupMoneyHandling() {
    const serviceValueInput = document.getElementById('service_value');
    const spareValueInput = document.getElementById('spare_value');
    const totalInput = document.getElementById('total');
    
    /**
     * Aplica formato de moneda a un input
     * @param {HTMLInputElement} input - Input a formatear
     */
    function applyFormatting(input) {
        if (!input) return;
        
        // Añadir eventos para formateo de valores monetarios
        input.addEventListener('input', function() {
            // Guardar posición del cursor
            const start = this.selectionStart;
            const end = this.selectionEnd;
            const originalLength = this.value.length;
            
            // Formatear valor - eliminar todo excepto dígitos
            let value = this.value.replace(/[^\d]/g, '');
            
            // Convertir a entero para eliminar cualquier decimal
            value = parseInt(value) || 0;
            
            if (value) {
                this.value = formatNumberWithThousands(value);
            } else {
                this.value = '0';
            }
            
            // Reposicionar cursor
            const newLength = this.value.length;
            const cursorAdjust = newLength - originalLength;
            
            if (document.activeElement === this) {
                this.setSelectionRange(start + cursorAdjust, end + cursorAdjust);
            }
        });
        
        // Añadir evento para recalcular totales cuando cambie el valor
        input.addEventListener('change', function() {
            updatePartsTotals();
        });
    }
    
    // Inicialmente formatear los valores de los campos
    if (serviceValueInput) {
        serviceValueInput.value = formatNumberWithThousands(serviceValueInput.value);
        applyFormatting(serviceValueInput);
    }
    
    if (spareValueInput) {
        spareValueInput.value = formatNumberWithThousands(spareValueInput.value);
        applyFormatting(spareValueInput);
    }
    
    if (totalInput) {
        totalInput.value = formatNumberWithThousands(totalInput.value);
        // No se aplica formatting al total porque se calcula automáticamente
    }
}

/**
 * Inicializa la tabla de repuestos
 */
function setupPartsTable() {
    const partsTable = document.getElementById('partsTable');
    const addPartBtn = document.getElementById('addPartBtn');
    const noPartsRow = document.getElementById('noPartsRow');
    const spareValueInput = document.getElementById('spare_value');
    const totalInput = document.getElementById('total');
    const serviceValueInput = document.getElementById('service_value');

    // Variables para el modal de búsqueda
    const searchPartsModal = document.getElementById('searchPartsModal');
    const modalPartSearch = document.getElementById('modalPartSearch');
    const searchResults = document.getElementById('searchResults');
    const searchResultsLoader = document.getElementById('searchResultsLoader');
    const initialSearchMessage = document.getElementById('initialSearchMessage');
    const noResultsMessage = document.getElementById('noResultsMessage');

    // Variable para guardar la fila actual que está seleccionando un repuesto
    let currentEditingRow = null;

    if (!partsTable || !addPartBtn) return;

    // Función para actualizar índices
    function updateRowIndices() {
        const rows = partsTable.querySelectorAll('tbody tr.part-row');
        rows.forEach((row, index) => {
            const indexCell = row.querySelector('.part-index');
            if (indexCell) {
                indexCell.textContent = index + 1;
            }
        });
    }

    // Función para calcular el valor total de una fila
    function updateRowTotal(row) {
        const quantityInput = row.querySelector('.part-quantity');
        const unitValueInput = row.querySelector('.part-unit-value');
        const totalValueInput = row.querySelector('.part-total-value');

        if (!quantityInput || !unitValueInput || !totalValueInput) return;

        const quantity = parseInt(quantityInput.value) || 0;
        const unitValue = unformatNumber(unitValueInput.value) || 0;
        const totalValue = quantity * unitValue;

        // Formatear el total de la fila con el separador de miles
        totalValueInput.value = formatNumberWithThousands(totalValue);

        // Actualizar el total general
        updatePartsTotals();
    }

    // Función para actualizar el total de repuestos y el total general
    function updatePartsTotals() {
        let totalPartsValue = 0;
        const partsTotalInputs = document.querySelectorAll('.part-total-value');

        // Sumar valores de repuestos
        partsTotalInputs.forEach(input => {
            const value = unformatNumber(input.value);
            if (!isNaN(value)) {
                totalPartsValue += value;
            }
        });

        // Actualizar campo de valor de repuestos
        if (spareValueInput) {
            spareValueInput.value = formatNumberWithThousands(totalPartsValue);
        }

        // Calcular y actualizar el total general
        if (totalInput && serviceValueInput) {
            const serviceValue = unformatNumber(serviceValueInput.value) || 0;
            const totalValue = serviceValue + totalPartsValue;
            totalInput.value = formatNumberWithThousands(totalValue);
        }

        // Mostrar/ocultar fila de "no hay repuestos"
        if (noPartsRow) {
            const rows = partsTable.querySelectorAll('tbody tr.part-row');
            noPartsRow.style.display = rows.length > 0 ? 'none' : '';
        }
    }

    // Función para buscar repuestos
    function searchParts(term) {
        if (!searchResultsLoader || !initialSearchMessage || !noResultsMessage || !searchResults) {
            console.error("Faltan elementos del modal de búsqueda");
            return;
        }
        
        // Ocultar mensajes y mostrar loader
        initialSearchMessage.style.display = 'none';
        noResultsMessage.style.display = 'none';
        searchResultsLoader.style.display = 'block';

        // Limpiar resultados anteriores
        const existingContainer = document.querySelector('.search-results-container');
        if (existingContainer) {
            existingContainer.innerHTML = '';
        }

        // Validar término de búsqueda
        if (!term || term.length < 3) {
            searchResultsLoader.style.display = 'none';
            initialSearchMessage.style.display = 'block';
            return;
        }

        // Crear FormData para enviar en la petición
        const formData = new FormData();
        formData.append('search', term);

        // Enviar petición AJAX
        console.log("Buscando repuestos con término:", term);
        fetch('/search_spare_parts', {
            method: 'POST',
            body: formData
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Error ${response.status}: ${response.statusText}`);
                }
                return response.json();
            })
            .then(data => {
                // Ocultar loader
                searchResultsLoader.style.display = 'none';
                
                console.log("Resultados de búsqueda:", data);

                // Verificar si hay resultados
                if (!data.parts || data.parts.length === 0) {
                    noResultsMessage.style.display = 'block';
                    return;
                }

                // Crear o mostrar el contenedor de resultados
                let resultsContainer = document.querySelector('.search-results-container');
                if (!resultsContainer) {
                    resultsContainer = document.createElement('div');
                    resultsContainer.className = 'search-results-container';
                    searchResults.appendChild(resultsContainer);
                }
                resultsContainer.style.display = 'block';
                resultsContainer.innerHTML = '';

                // Crear una fila para los resultados
                const row = document.createElement('div');
                row.className = 'row g-3';
                resultsContainer.appendChild(row);

                // Agregar contador de resultados
                const resultCount = document.createElement('div');
                resultCount.className = 'col-12 mb-2';
                resultCount.innerHTML = `<small class="text-muted">Se encontraron ${data.parts.length} repuestos</small>`;
                row.appendChild(resultCount);

                // Agregar cada repuesto encontrado en columnas
                data.parts.forEach(part => {
                    // Crear columna para este repuesto (6 columnas en pantalla md)
                    const col = document.createElement('div');
                    col.className = 'col-md-6 mb-2';
                    
                    // Crear tarjeta para el repuesto
                    const card = document.createElement('div');
                    card.className = 'card h-100 shadow-sm part-card';
                    
                    // Agregar contenido a la tarjeta
                    card.innerHTML = `
                        <div class="card-body p-3">
                            <div class="d-flex justify-content-between align-items-start mb-2">
                                <h6 class="card-title mb-0 fw-bold">${highlightSearchTerm(part.description, term)}</h6>
                                <span class="badge bg-primary ms-2">Cód: ${highlightSearchTerm(part.code, term)}</span>
                            </div>
                            <div class="d-flex justify-content-between align-items-center mt-2">
                                <span class="text-success fw-bold">${part.price && part.price != '0' ? '$' + formatNumberWithThousands(part.price) : ''}</span>
                                <button class="btn btn-sm btn-primary select-result">
                                    <i class="fas fa-check me-1"></i>Seleccionar
                                </button>
                            </div>
                        </div>
                    `;

                    // Agregar datos al elemento para su uso posterior
                    card.dataset.code = part.code;
                    card.dataset.description = part.description;
                    card.dataset.price = part.price || '0';

                    // Evento de clic para seleccionar un repuesto
                    card.querySelector('.select-result').addEventListener('click', function() {
                        const partData = {
                            code: card.dataset.code,
                            description: card.dataset.description,
                            price: card.dataset.price
                        };
                        selectPartAndUpdateRow(partData);
                        
                        // Cerrar modal
                        const modal = bootstrap.Modal.getInstance(searchPartsModal);
                        if (modal) modal.hide();
                    });

                    // Agregar a la columna y luego a la fila
                    col.appendChild(card);
                    row.appendChild(col);
                });

                // Agregar estilos adicionales para la tarjeta de resultados
                const style = document.createElement('style');
                style.textContent = `
                    .part-card {
                        transition: all 0.2s ease;
                        border: 1px solid #dee2e6;
                    }
                    .part-card:hover {
                        transform: translateY(-3px);
                        box-shadow: 0 0.5rem 1rem rgba(0,0,0,0.15) !important;
                        border-color: #6c757d;
                    }
                    .highlight {
                        background-color: #ffeeba;
                        padding: 0 2px;
                        border-radius: 2px;
                    }
                    .search-input:focus {
                        border-color: #80bdff;
                        box-shadow: 0 0 0 0.2rem rgba(0,123,255,.25);
                    }
                `;
                document.head.appendChild(style);
            })
            .catch(error => {
                console.error('Error al buscar repuestos:', error);
                searchResultsLoader.style.display = 'none';
                noResultsMessage.style.display = 'block';
                noResultsMessage.innerHTML = `
                    <i class="fas fa-exclamation-triangle text-danger fa-3x mb-3"></i>
                    <h5 class="text-danger">Error al buscar repuestos</h5>
                    <p class="text-muted mb-0">${error.message}</p>
                `;
            });
    }

    // Resaltar término de búsqueda en resultados
    function highlightSearchTerm(text, term) {
        if (!term || !text) return text;
        
        const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        return text.replace(regex, '<span class="highlight">$1</span>');
    }

    // Función para seleccionar un repuesto y actualizar la fila
    function selectPartAndUpdateRow(part) {
        if (!currentEditingRow || !part) return;

        const select = currentEditingRow.querySelector('select[name="spare_part_code[]"]');
        const unitValueInput = currentEditingRow.querySelector('.part-unit-value');

        if (select) {
            // Buscar si ya existe la opción
            let option = Array.from(select.options).find(opt => opt.value === part.code);
            
            // Si no existe, crear nueva opción
            if (!option) {
                option = document.createElement('option');
                option.value = part.code;
                option.textContent = part.description;
                select.appendChild(option);
            }
            
            // Seleccionar la opción
            select.value = part.code;
            
            // Actualizar valor unitario si está disponible
            if (unitValueInput && part.price) {
                unitValueInput.value = formatNumberWithThousands(part.price);
                
                // Actualizar total de la fila
                updateRowTotal(currentEditingRow);
            }
            
            // Restablecer variable
            currentEditingRow = null;
        }
    }

    // Si existe el botón de agregar, configurar evento
    if (addPartBtn) {
        addPartBtn.addEventListener('click', function() {
            addPartRow();
            updatePartsTotals();
        });
    }

    // Si existe el modal de búsqueda, configurar eventos
    if (searchPartsModal && modalPartSearch) {
        // Evento de entrada para búsqueda
        modalPartSearch.addEventListener('input', function() {
            const term = this.value.trim();
            
            if (term.length >= 3) {
                searchParts(term);
            } else {
                initialSearchMessage.style.display = 'block';
                noResultsMessage.style.display = 'none';
                
                const resultsContainer = document.querySelector('.search-results-container');
                if (resultsContainer) {
                    resultsContainer.remove();
                }
            }
        });
        
        // Evento de tecla Enter para iniciar búsqueda
        modalPartSearch.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                const term = this.value.trim();
                if (term.length >= 3) {
                    searchParts(term);
                }
            }
        });
        
        // Botón para limpiar búsqueda
        const clearSearchBtn = document.getElementById('clearSearch');
        if (clearSearchBtn) {
            clearSearchBtn.addEventListener('click', function() {
                modalPartSearch.value = '';
                initialSearchMessage.style.display = 'block';
                noResultsMessage.style.display = 'none';
                
                const resultsContainer = document.querySelector('.search-results-container');
                if (resultsContainer) {
                    resultsContainer.remove();
                }
            });
        }
        
        // Reiniciar al abrir el modal
        searchPartsModal.addEventListener('shown.bs.modal', function() {
            modalPartSearch.value = '';
            modalPartSearch.focus();
            initialSearchMessage.style.display = 'block';
            noResultsMessage.style.display = 'none';
            searchResultsLoader.style.display = 'none';
            
            const resultsContainer = document.querySelector('.search-results-container');
            if (resultsContainer) {
                resultsContainer.remove();
            }
        });
    }

    // Configurar eventos para filas existentes
    const existingRows = partsTable.querySelectorAll('tbody tr.part-row');
    existingRows.forEach(row => {
        setupRowEvents(row);
    });

    // Función para configurar eventos en una fila
    function setupRowEvents(row) {
        const quantityInput = row.querySelector('.part-quantity');
        const unitValueInput = row.querySelector('.part-unit-value');
        const removeBtn = row.querySelector('.remove-part');
        const selectBtn = row.querySelector('.select-part');

        // Evento para actualizar al cambiar cantidad
        if (quantityInput) {
            quantityInput.addEventListener('input', function() {
                // Validar que sea un número positivo
                let value = parseInt(this.value) || 0;
                if (value < 1) value = 1;
                this.value = value;
                
                // Actualizar total de la fila
                updateRowTotal(row);
            });
        }

        // Evento para formatear valor unitario
        if (unitValueInput) {
            unitValueInput.addEventListener('input', function() {
                // Guardar posición del cursor
                const start = this.selectionStart;
                const end = this.selectionEnd;
                const originalLength = this.value.length;
                
                // Formatear valor
                let value = this.value.replace(/[^\d]/g, '');
                if (value) {
                    this.value = formatNumberWithThousands(value);
                } else {
                    this.value = '0';
                }
                
                // Reposicionar cursor
                const newLength = this.value.length;
                const cursorAdjust = newLength - originalLength;
                
                if (document.activeElement === this) {
                    this.setSelectionRange(start + cursorAdjust, end + cursorAdjust);
                }
                
                // Actualizar total de la fila
                updateRowTotal(row);
            });
        }

        // Evento para eliminar la fila
        if (removeBtn) {
            removeBtn.addEventListener('click', function() {
                row.remove();
                updateRowIndices();
                updatePartsTotals();
            });
        }

        // Evento para abrir modal de búsqueda
        if (selectBtn && searchPartsModal) {
            selectBtn.addEventListener('click', function() {
                // Guardar referencia a la fila actual
                currentEditingRow = row;
                
                // Abrir modal
                const modal = new bootstrap.Modal(searchPartsModal);
                modal.show();
            });
        }
    }

    // Actualizar totales iniciales
    updatePartsTotals();
}

/**
 * Configura el selector de problemas del dispositivo
 */
function setupProblemsSelector() {
    const checkboxes = document.querySelectorAll('.problem-checkbox');
    const selectedProblemsTextarea = document.getElementById('selected_problems');
    const searchInput = document.getElementById('searchProblems');
    
    // Función para actualizar el textarea de problemas seleccionados
    function updateSelectedProblems() {
        if (!selectedProblemsTextarea) return;
        
        const selectedProblems = [];
        checkboxes.forEach(checkbox => {
            if (checkbox.checked) {
                const label = document.querySelector(`label[for="${checkbox.id}"]`);
                if (label) {
                    selectedProblems.push(label.textContent.trim());
                }
            }
        });
        
        selectedProblemsTextarea.value = selectedProblems.join('\n');
    }
    
    // Añadir eventos a los checkboxes
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', updateSelectedProblems);
    });
    
    // Configurar búsqueda de problemas
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase().trim();
            
            document.querySelectorAll('.problem-option').forEach(option => {
                const label = option.querySelector('label');
                if (!label) return;
                
                const problemText = label.textContent.toLowerCase();
                if (problemText.includes(searchTerm) || searchTerm === '') {
                    option.style.display = '';
                } else {
                    option.style.display = 'none';
                }
            });
        });
    }
    
    // Configurar botones de selección rápida
    const selectAllBtn = document.getElementById('selectAllProblems');
    const clearBtn = document.getElementById('clearProblems');
    
    if (selectAllBtn) {
        selectAllBtn.addEventListener('click', function() {
            checkboxes.forEach(checkbox => {
                if (checkbox.closest('.problem-option').style.display !== 'none') {
                    checkbox.checked = true;
                }
            });
            updateSelectedProblems();
        });
    }
    
    if (clearBtn) {
        clearBtn.addEventListener('click', function() {
            checkboxes.forEach(checkbox => {
                checkbox.checked = false;
            });
            updateSelectedProblems();
        });
    }
    
    // Actualizar inicialmente la lista de problemas seleccionados
    updateSelectedProblems();
}

/**
 * Agrega una nueva fila de repuesto a la tabla
 * @param {Object|null} partData - Datos del repuesto (opcional)
 */
function addPartRow(partData = null) {
    const partsTable = document.getElementById('partsTable');
    const noPartsRow = document.getElementById('noPartsRow');
    
    if (!partsTable) return;
    
    // Ocultar fila "no hay repuestos"
    if (noPartsRow) {
        noPartsRow.style.display = 'none';
    }
    
    // Obtener template
    const template = document.getElementById('partRowTemplate');
    if (!template) {
        console.error('Template de fila de repuesto no encontrado');
        return;
    }
    
    // Clonar template
    const newRow = document.importNode(template.content, true).querySelector('tr');
    
    // Agregar fila a la tabla
    const tbody = partsTable.querySelector('tbody');
    if (tbody) {
        tbody.appendChild(newRow);
    }
    
    // Si hay datos, llenar la fila
    if (partData) {
        const select = newRow.querySelector('select');
        const unitValueInput = newRow.querySelector('.part-unit-value');
        
        if (select) {
            // Crear opción para el repuesto
            const option = document.createElement('option');
            option.value = partData.code;
            option.textContent = partData.description;
            
            // Agregar opción al select
            select.appendChild(option);
            
            // Seleccionar la opción
            select.value = partData.code;
        }
        
        // Establecer valor unitario
        if (unitValueInput && partData.price) {
            unitValueInput.value = formatNumberWithThousands(partData.price);
        }
    }
    
    // Configurar eventos para la nueva fila
    setupPartsTable();
    
    // Actualizar totales
    const updatePartsTotals = document.querySelector('.part-total-value');
    if (updatePartsTotals) {
        updateRowTotal(newRow);
    }
    
    return newRow;
}

/**
 * Inicializa el manejo de técnicos
 */
function setupTechnicianHandling() {
    const technicalNameSelect = document.getElementById('technical_name');
    const technicalDocumentInput = document.getElementById('technical_document');
    const stateInput = document.getElementById('state');
    const stateDisplayInput = document.getElementById('state_display');

    if (technicalNameSelect) {
        technicalNameSelect.addEventListener('change', function () {
            // Actualizar documento del técnico
            if (technicalDocumentInput) {
                const selectedOption = this.options[this.selectedIndex];
                const techDocument = selectedOption.dataset.document || '';
                technicalDocumentInput.value = techDocument || 'Sin asignar';
            }

            // No actualizamos el estado en edición para mantener el estado actual
        });
    }
}

// Inicializar funcionalidades cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar funcionalidades principales
    setupTechnicianHandling();
    setupMoneyHandling();
    setupPartsTable();
    setupProblemsSelector();
    
    // Los selectores de repuestos ahora usan la clase form-select de Bootstrap
    // No es necesario inicializarlos con Select2
});
