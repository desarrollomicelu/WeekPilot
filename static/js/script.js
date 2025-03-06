document.addEventListener("DOMContentLoaded", function () {
    const sidebar = document.getElementById("sidebar");
    const content = document.getElementById("content");
    const openBtn = document.getElementById("open-btn");
    const closeBtn = document.getElementById("close-btn");

    // Forzar que el sidebar inicie cerrado
    sidebar.classList.add("collapsed");

    function ajustarContenido() {
        if (sidebar.classList.contains("collapsed")) {
            content.style.marginLeft = "0"; // Centrar el contenido
        } else {
            content.style.marginLeft = "250px"; // Ajustar al tamaño del sidebar
        }
    }

    // Cerrar sidebar (colapsar)
    closeBtn.addEventListener("click", function () {
        sidebar.classList.toggle("collapsed");
        ajustarContenido(); // Ajustar contenido al cerrar el sidebar

        // Cambiar el ícono del botón de cierre
        if (sidebar.classList.contains("collapsed")) {
            closeBtn.innerHTML = '<i class="fas fa-chevron-right"></i>'; /* Ícono para abrir */
        } else {
            closeBtn.innerHTML = '<i class="fas fa-chevron-left"></i>'; /* Ícono para cerrar */
        }
    });

    // Abrir sidebar (expandir)
    openBtn.addEventListener("click", function () {
        sidebar.classList.remove("collapsed");
        ajustarContenido(); // Ajustar contenido al abrir el sidebar
        closeBtn.innerHTML = '<i class="fas fa-chevron-left"></i>'; /* Ícono para cerrar */
    });

    // Cerrar sidebar al hacer clic fuera (solo en móviles)
    document.addEventListener("click", function (event) {
        if (window.innerWidth <= 768 && !sidebar.contains(event.target) && !openBtn.contains(event.target)) {
            sidebar.classList.add("collapsed");
            ajustarContenido(); // Ajustar contenido en móvil
            closeBtn.innerHTML = '<i class="fas fa-chevron-right"></i>'; /* Ícono para abrir */
        }
    });

    // Ajustar contenido al cargar la página según el estado del sidebar
    ajustarContenido();
});
