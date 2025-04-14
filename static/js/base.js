document.addEventListener('DOMContentLoaded', function() {
    // Elementos del DOM
    const navbarToggler = document.querySelector('.navbar-toggler');
    const navbarCollapse = document.querySelector('.navbar-collapse');
    const overlay = document.getElementById('sidebar-overlay');
    
    function isMobile() {
        return window.innerWidth < 992;
    }
    
    // Función para cerrar el menú correctamente
    function closeNavMenu() {
        // Primero quitamos las clases
        navbarCollapse.classList.remove('show');
        if (overlay) overlay.classList.remove('active');
        
        // Luego actualizamos el estado del botón toggler
        navbarToggler.setAttribute('aria-expanded', 'false');
        
        // Si estás usando Bootstrap 5, esto también podría ser necesario
        document.body.classList.remove('overflow-hidden');
    }
    
    // Manejar clic en el botón de toggle
    navbarToggler.addEventListener('click', function() {
        if (overlay) {
            if (navbarCollapse.classList.contains('show')) {
                overlay.classList.remove('active');
            } else {
                overlay.classList.add('active');
            }
        }
    });
    
    // Cerrar menú al hacer clic en el overlay
    if (overlay) {
        overlay.addEventListener('click', function(e) {
            e.preventDefault();
            closeNavMenu();
        });
    }
    
    // Cerrar menú al hacer clic en un enlace del menú (siempre en móvil)
    const menuLinks = document.querySelectorAll('.navbar-nav .nav-link');
    menuLinks.forEach(link => {
        link.addEventListener('click', function() {
            if (isMobile() && navbarCollapse.classList.contains('show')) {
                // Pequeño retraso para permitir la navegación antes de cerrar el menú
                setTimeout(closeNavMenu, 10);
            }
        });
    });
    
    // Cerrar al hacer clic fuera del menú
    document.addEventListener('click', function(event) {
        const isClickInsideMenu = navbarCollapse.contains(event.target);
        const isClickOnToggler = navbarToggler.contains(event.target);
        
        if (isMobile() && navbarCollapse.classList.contains('show') && !isClickInsideMenu && !isClickOnToggler) {
            closeNavMenu();
        }
    });
    
    // Ajustar overlay cuando cambia el tamaño de la ventana
    window.addEventListener('resize', function() {
        if (!isMobile()) {
            closeNavMenu();
        }
    });
});