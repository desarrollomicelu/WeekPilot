document.addEventListener('DOMContentLoaded', function() {
    const sidebar = document.getElementById('sidebar');
    const content = document.getElementById('content');
    const closeBtn = document.getElementById('close-btn');
    const openBtn = document.getElementById('open-btn');
    const overlay = document.getElementById('sidebar-overlay');
    
    // Función para verificar si estamos en móvil
    function isMobile() {
        return window.innerWidth < 992;
    }
    
    // Función para ajustar el contenido según el estado del sidebar
    function adjustContent() {
        if (sidebar.classList.contains('collapsed')) {
            content.style.marginLeft = isMobile() ? '0' : '80px';
            content.classList.add('expanded');
        } else {
            content.style.marginLeft = isMobile() ? '0' : '250px';
            content.classList.remove('expanded');
        }
    }
    
    // Función para ajustar el sidebar según el tamaño de pantalla
    function adjustSidebar() {
        if (isMobile()) {
            // En móvil, el sidebar siempre empieza oculto
            sidebar.classList.add('collapsed');
            if (!sidebar.classList.contains('show')) {
                overlay.classList.remove('active');
            }
        }
        adjustContent();
    }
    
    // Ajustar al cargar la página
    adjustSidebar();
    
    // Ajustar cuando cambia el tamaño de la ventana
    window.addEventListener('resize', adjustSidebar);
    
    // Manejar clic en el botón de cerrar
    closeBtn.addEventListener('click', function() {
        if (isMobile()) {
            // En móvil, ocultar el sidebar y el overlay
            sidebar.classList.remove('show');
            overlay.classList.remove('active');
        } else {
            // En desktop, alternar entre expandido y colapsado
            sidebar.classList.toggle('collapsed');
            adjustContent();
            
            // Cambiar el ícono del botón según el estado
            if (sidebar.classList.contains('collapsed')) {
                closeBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
            } else {
                closeBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
            }
        }
    });
    
    // Manejar clic en el botón de abrir
    openBtn.addEventListener('click', function() {
        if (isMobile()) {
            // En móvil, mostrar el sidebar y el overlay
            sidebar.classList.add('show');
            overlay.classList.add('active');
        } else {
            // En desktop, expandir el sidebar
            sidebar.classList.remove('collapsed');
            adjustContent();
            closeBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
        }
    });
    
    // Cerrar sidebar al hacer clic en el overlay (solo en móvil)
    overlay.addEventListener('click', function() {
        sidebar.classList.remove('show');
        overlay.classList.remove('active');
    });
    
    // Cerrar sidebar al hacer clic en un enlace del menú (solo en móvil)
    const menuLinks = document.querySelectorAll('.sidebar-menu a');
    menuLinks.forEach(link => {
        link.addEventListener('click', function() {
            if (isMobile() && sidebar.classList.contains('show')) {
                sidebar.classList.remove('show');
                overlay.classList.remove('active');
            }
        });
    });
    
    // Inicializar el sidebar en estado colapsado en desktop
    if (!isMobile()) {
        sidebar.classList.add('collapsed');
        closeBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
        adjustContent();
    }
});
