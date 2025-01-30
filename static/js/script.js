// Abrir el sidebar al hacer clic en el botón de menú
const sidebar = document.getElementById('sidebar');
const openBtn = document.getElementById('open-btn');
const closeBtn = document.getElementById('close-btn');
const content = document.getElementById('content');

// Función para abrir el sidebar
openBtn.addEventListener('click', function() {
    sidebar.style.left = '0';
    content.style.marginLeft = '250px';  // Ajusta el margen del contenido
});

// Función para cerrar el sidebar
closeBtn.addEventListener('click', function() {
    sidebar.style.left = '-250px';
    content.style.marginLeft = '0';
});
