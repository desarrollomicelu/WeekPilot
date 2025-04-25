/**
 * Utilidades JavaScript para mejorar la experiencia en dispositivos móviles
 * MICELU - responsive-utils.js
 */

(function() {
    'use strict';
    
    // Detectar dispositivo móvil para optimizaciones específicas
    const isMobile = {
        Android: function() {
            return navigator.userAgent.match(/Android/i);
        },
        BlackBerry: function() {
            return navigator.userAgent.match(/BlackBerry/i);
        },
        iOS: function() {
            return navigator.userAgent.match(/iPhone|iPad|iPod/i);
        },
        Opera: function() {
            return navigator.userAgent.match(/Opera Mini/i);
        },
        Windows: function() {
            return navigator.userAgent.match(/IEMobile/i) || navigator.userAgent.match(/WPDesktop/i);
        },
        any: function() {
            return (isMobile.Android() || isMobile.BlackBerry() || isMobile.iOS() || isMobile.Opera() || isMobile.Windows());
        }
    };
    
    // Función para agregar clase al body según el tipo de dispositivo
    function applyDeviceClasses() {
        const body = document.body;
        
        if (isMobile.any()) {
            body.classList.add('is-mobile-device');
            
            if (isMobile.iOS()) {
                body.classList.add('is-ios');
            }
            if (isMobile.Android()) {
                body.classList.add('is-android');
            }
        }
        
        // Detectar orientación
        if (window.innerWidth < window.innerHeight) {
            body.classList.add('is-portrait');
            body.classList.remove('is-landscape');
        } else {
            body.classList.add('is-landscape');
            body.classList.remove('is-portrait');
        }
        
        // Detectar tamaño de pantalla para clases específicas
        if (window.innerWidth < 576) {
            body.classList.add('is-xs-screen');
        } else if (window.innerWidth < 768) {
            body.classList.add('is-sm-screen');
        } else if (window.innerWidth < 992) {
            body.classList.add('is-md-screen');
        } else if (window.innerWidth < 1200) {
            body.classList.add('is-lg-screen');
        } else {
            body.classList.add('is-xl-screen');
        }
    }
    
    // Optimizar tablas para dispositivos móviles
    function optimizeTables() {
        if (window.innerWidth < 768) {
            const tables = document.querySelectorAll('table:not(.no-responsive)');
            
            tables.forEach(table => {
                if (!table.parentElement.classList.contains('table-responsive')) {
                    // Envolver en div responsive si aún no lo está
                    const wrapper = document.createElement('div');
                    wrapper.className = 'table-responsive';
                    table.parentNode.insertBefore(wrapper, table);
                    wrapper.appendChild(table);
                }
                
                // Asegurarse de que la tabla tenga la clase 'table'
                if (!table.classList.contains('table')) {
                    table.classList.add('table');
                }
            });
        }
    }
    
    // Optimizar comportamiento de inputs en dispositivos móviles
    function optimizeFormElements() {
        if (isMobile.any()) {
            // Prevenir zoom en inputs en iOS
            const metaViewport = document.querySelector('meta[name="viewport"]');
            if (metaViewport) {
                metaViewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, shrink-to-fit=no');
            }
            
            // Ajustar atributos de inputs para mejor experiencia móvil
            const inputs = document.querySelectorAll('input, select, textarea');
            inputs.forEach(input => {
                if (input.type === 'number' || input.type === 'tel') {
                    input.setAttribute('inputmode', 'numeric');
                }
                if (input.type === 'email') {
                    input.setAttribute('autocapitalize', 'off');
                    input.setAttribute('autocorrect', 'off');
                }
            });
        }
    }
    
    // Carga diferida para imágenes
    function setupLazyLoading() {
        if ('loading' in HTMLImageElement.prototype) {
            // Si el navegador soporta lazy loading nativo
            const lazyImages = document.querySelectorAll('img[data-src]');
            lazyImages.forEach(img => {
                img.setAttribute('loading', 'lazy');
                img.src = img.dataset.src;
                if (img.dataset.srcset) {
                    img.srcset = img.dataset.srcset;
                }
            });
        } else {
            // Fallback para navegadores que no soportan lazy loading nativo
            // Implementación simple de intersección observer
            if ('IntersectionObserver' in window) {
                const lazyImageObserver = new IntersectionObserver(function(entries, observer) {
                    entries.forEach(function(entry) {
                        if (entry.isIntersecting) {
                            const lazyImage = entry.target;
                            lazyImage.src = lazyImage.dataset.src;
                            if (lazyImage.dataset.srcset) {
                                lazyImage.srcset = lazyImage.dataset.srcset;
                            }
                            lazyImageObserver.unobserve(lazyImage);
                        }
                    });
                });
                
                const lazyImages = document.querySelectorAll('img[data-src]');
                lazyImages.forEach(function(lazyImage) {
                    lazyImageObserver.observe(lazyImage);
                });
            }
        }
    }
    
    // Manejar cambios de orientación
    function handleOrientationChange() {
        window.addEventListener('orientationchange', function() {
            setTimeout(function() {
                applyDeviceClasses();
                optimizeTables();
            }, 200);
        });
    }
    
    // Funciones para adaptar contenido dinámicamente según el ancho
    function adaptContentForMobile() {
        if (window.innerWidth < 768) {
            // Ajustes para móviles
            const longButtons = document.querySelectorAll('.btn-long-text');
            longButtons.forEach(btn => {
                if (btn.dataset.shortText) {
                    btn.setAttribute('data-original-text', btn.textContent);
                    btn.textContent = btn.dataset.shortText;
                }
            });
            
            // Reducir número de columnas visibles en tablas
            const tables = document.querySelectorAll('table.responsive-columns');
            tables.forEach(table => {
                const nonEssentialCols = table.querySelectorAll('.hide-on-mobile');
                nonEssentialCols.forEach(col => {
                    col.style.display = 'none';
                });
            });
        } else {
            // Restaurar para tablets/desktop
            const longButtons = document.querySelectorAll('.btn-long-text');
            longButtons.forEach(btn => {
                if (btn.getAttribute('data-original-text')) {
                    btn.textContent = btn.getAttribute('data-original-text');
                }
            });
            
            // Restaurar columnas
            const tables = document.querySelectorAll('table.responsive-columns');
            tables.forEach(table => {
                const nonEssentialCols = table.querySelectorAll('.hide-on-mobile');
                nonEssentialCols.forEach(col => {
                    col.style.display = '';
                });
            });
        }
    }
    
    // Optimizaciones para scrolling en iOS
    function fixIOSScrolling() {
        if (isMobile.iOS()) {
            const scrollElements = document.querySelectorAll('.scroll-container');
            scrollElements.forEach(el => {
                el.style.webkitOverflowScrolling = 'touch';
            });
        }
    }
    
    // Inicialización cuando el DOM está listo
    document.addEventListener('DOMContentLoaded', function() {
        applyDeviceClasses();
        optimizeTables();
        optimizeFormElements();
        setupLazyLoading();
        handleOrientationChange();
        adaptContentForMobile();
        fixIOSScrolling();
        
        // Volver a evaluar cuando cambie el tamaño de la ventana
        window.addEventListener('resize', function() {
            applyDeviceClasses();
            adaptContentForMobile();
        });
    });

})(); 