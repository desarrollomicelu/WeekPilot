document.addEventListener("DOMContentLoaded", function () {
    const sidebar = document.getElementById("sidebar");
    const content = document.getElementById("content");
    const openBtn = document.getElementById("open-btn");
    const closeBtn = document.getElementById("close-btn");

    // Cerrar sidebar (colapsar)
    closeBtn.addEventListener("click", function () {
        sidebar.classList.toggle("collapsed");
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
        closeBtn.innerHTML = '<i class="fas fa-chevron-left"></i>'; /* Ícono para cerrar */
    });

    // Cerrar sidebar al hacer clic fuera (solo en móviles)
    document.addEventListener("click", function (event) {
        if (window.innerWidth <= 768 && !sidebar.contains(event.target) && !openBtn.contains(event.target)) {
            sidebar.classList.add("collapsed");
            closeBtn.innerHTML = '<i class="fas fa-chevron-right"></i>'; /* Ícono para abrir */
        }
    });
});