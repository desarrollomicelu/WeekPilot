document.addEventListener('DOMContentLoaded', function() {
    // Elementos del DOM
    const navbarToggler = document.querySelector('.navbar-toggler');
    const navbarCollapse = document.querySelector('.navbar-collapse');
    const overlay = document.getElementById('sidebar-overlay');
    
    // Función para detectar dispositivos móviles o tablets
    function isMobile() {
        return window.innerWidth < 992;
    }
    
    // Evitar scroll cuando el menú está abierto en móviles
    function toggleBodyScroll(shouldDisable) {
        if (shouldDisable) {
            document.body.style.overflow = 'hidden';
            document.body.style.height = '100vh';
        } else {
            document.body.style.overflow = '';
            document.body.style.height = '';
        }
    }
    
    // Función para cerrar el menú correctamente
    function closeNavMenu() {
        // Primero quitamos las clases
        navbarCollapse.classList.remove('show');
        if (overlay) overlay.classList.remove('active');
        
        // Luego actualizamos el estado del botón toggler
        navbarToggler.setAttribute('aria-expanded', 'false');
        
        // Restablecer el scroll
        toggleBodyScroll(false);
    }
    
    // Configuración especial para el menú en dispositivos móviles
    function setupMobileMenu() {
        if (isMobile()) {
            // Asegurarse de que los elementos del menú tengan la clase correcta
            const navLists = document.querySelectorAll('.navbar-nav');
            navLists.forEach(navList => {
                navList.classList.add('navbar-nav-horizontal');
            });
            
            // Ajustar altura máxima del menú desplegable para que se ajuste mejor a la pantalla
            if (navbarCollapse) {
                navbarCollapse.style.maxHeight = (window.innerHeight * 0.8) + 'px';
            }
            
            // Mejorar la respuesta táctil del menú
            const menuItems = document.querySelectorAll('.navbar-nav .nav-link');
            menuItems.forEach(item => {
                item.addEventListener('touchstart', function() {
                    this.classList.add('active-touch');
                }, { passive: true });
                
                item.addEventListener('touchend', function() {
                    this.classList.remove('active-touch');
                }, { passive: true });
            });
        }
    }
    
    // Manejar clic en el botón de toggle
    navbarToggler.addEventListener('click', function() {
        const isExpanded = navbarCollapse.classList.contains('show');
        
        if (overlay) {
            if (isExpanded) {
                overlay.classList.remove('active');
                toggleBodyScroll(false);
            } else {
                overlay.classList.add('active');
                toggleBodyScroll(true);
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
    
    // Ajustar overlay y comportamiento cuando cambia el tamaño de la ventana
    window.addEventListener('resize', function() {
        if (!isMobile()) {
            closeNavMenu();
        } else {
            setupMobileMenu();
        }
    });
    
    // Inicializar configuración del menú móvil
    setupMobileMenu();
    
    // Optimizar imágenes para dispositivos móviles con carga diferida
    if ('loading' in HTMLImageElement.prototype) {
        const images = document.querySelectorAll('img[loading="lazy"]');
        images.forEach(img => {
            img.src = img.dataset.src;
        });
    } else {
        // Fallback para navegadores que no soportan lazy loading nativo
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/lazysizes/5.3.0/lazysizes.min.js';
        document.body.appendChild(script);
    }
    
    // Optimización táctil para dispositivos móviles
    if (isMobile()) {
        // Mejorar respuesta táctil eliminando delay
        const touchElements = document.querySelectorAll('.nav-link, .btn, [role="button"]');
        touchElements.forEach(el => {
            el.style.touchAction = 'manipulation';
        });
        
        // Fix para problemas de doble tap en dispositivos iOS
        document.addEventListener('touchend', function() {}, false);
    }
    
    // Convertir todos los botones outline-primary a outline-secondary
    // Encuentra todos los botones con clase btn-outline-primary
    const primaryButtons = document.querySelectorAll('.btn-outline-primary:not(.keep-primary)');
    
    // Cambia la clase de cada botón
    primaryButtons.forEach(function(button) {
        button.classList.remove('btn-outline-primary');
        button.classList.add('btn-outline-secondary');
    });
    
    // Para elementos dentro de btn-check (botones de radio/checkbox)
    const primaryLabels = document.querySelectorAll('.btn-check + .btn-outline-primary');
    primaryLabels.forEach(function(label) {
        label.classList.remove('btn-outline-primary');
        label.classList.add('btn-outline-secondary');
    });
    
    // Convertir todos los elementos text-primary a text-secondary
    const primaryTextElements = document.querySelectorAll('.text-primary:not(.keep-primary)');
    primaryTextElements.forEach(function(element) {
        element.classList.remove('text-primary');
        element.classList.add('text-secondary');
    });
    
    // Convertir iconos específicamente
    const primaryIcons = document.querySelectorAll('i.text-primary, .fas.text-primary, .far.text-primary, .fab.text-primary');
    primaryIcons.forEach(function(icon) {
        icon.classList.remove('text-primary');
        icon.classList.add('text-secondary');
    });
});