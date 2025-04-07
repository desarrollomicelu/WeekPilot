/**
 * upload_image.js
 * Funcionalidad para subir y previsualizar imágenes en formularios
 */

/**
 * Muestra un toast (notificación pequeña) usando SweetAlert2.
 * @param {string} icon - Tipo de ícono ('success', 'error', 'info', etc.).
 * @param {string} title - Texto a mostrar.
 * @param {string} [position='top-end'] - Posición en la pantalla.
 * @param {number} [timer=3000] - Tiempo en milisegundos.
 */
function showImageToast(icon, title, position = 'top-end', timer = 3000) {
    // Verificar si SweetAlert2 está disponible
    if (typeof Swal === 'undefined') {
        console.error('SweetAlert2 no está disponible');
        return;
    }
    
    const Toast = Swal.mixin({
        toast: true,
        position: position,
        showConfirmButton: false,
        timer: timer,
        timerProgressBar: true,
        didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer);
            toast.addEventListener('mouseleave', Swal.resumeTimer);
        }
    });
    Toast.fire({ icon: icon, title: title });
}

/**
 * Clase para gestionar la subida y previsualización de imágenes
 */
class ImageUploadManager {
    /**
     * Constructor de la clase
     * @param {Object} options - Opciones de configuración
     */
    constructor(options = {}) {
        // Configuración por defecto
        this.config = {
            uploadImagesSelector: '#uploadImages',
            takePhotoSelector: '#takePhoto',
            previewContainerSelector: '#previewContainer',
            imageReferencesSelector: '#imageReferences',
            clearImagesBtnSelector: '#clearImagesBtn',
            maxImages: 10,
            maxSizeInMB: 5,
            ...options
        };
        
        // Elementos del DOM
        this.uploadImagesInput = document.querySelector(this.config.uploadImagesSelector);
        this.takePhotoInput = document.querySelector(this.config.takePhotoSelector);
        this.previewContainer = document.querySelector(this.config.previewContainerSelector);
        this.imageReferencesInput = document.querySelector(this.config.imageReferencesSelector);
        this.clearImagesBtn = document.querySelector(this.config.clearImagesBtnSelector);
        
        // Array para almacenar las imágenes (como objetos File o URLs)
        this.uploadedImages = [];
        
        // Inicializar
        this.init();
    }
    
    /**
     * Inicializa los eventos y componentes
     */
    init() {
        // Verificar que existan los elementos necesarios
        if (!this.previewContainer) {
            console.error('No se encontró el contenedor de previsualización');
            return;
        }
        
        // Eventos para el input de "Subir Fotos"
        if (this.uploadImagesInput) {
            this.uploadImagesInput.addEventListener('change', (event) => {
                this.handleFiles(event.target.files);
                // Limpiar el input para permitir seleccionar el mismo archivo nuevamente
                event.target.value = '';
            });
        }
        
        // Eventos para el input de "Tomar Foto"
        if (this.takePhotoInput) {
            this.takePhotoInput.addEventListener('change', (event) => {
                this.handleFiles(event.target.files);
                // Limpiar el input para permitir tomar otra foto
                event.target.value = '';
            });
        }
        
        // Evento para limpiar todas las imágenes
        if (this.clearImagesBtn) {
            this.clearImagesBtn.addEventListener('click', () => this.clearAllImages());
        }
    }
    
    /**
     * Agrega una imagen al contenedor de previsualización
     * @param {string} src - URL o Data URL de la imagen
     * @param {File} file - Objeto File de la imagen
     */
    addPreview(src, file) {
        // Verificar límite de imágenes
        if (this.uploadedImages.length >= this.config.maxImages) {
            showImageToast('error', `No puedes subir más de ${this.config.maxImages} imágenes`, 'top-end');
            return;
        }
        
        const col = document.createElement('div');
        col.className = "col-6 col-md-3 mb-3 preview-image-container";
        
        // Crear contenedor para la imagen con botón de eliminar
        col.innerHTML = `
            <div class="position-relative">
                <img src="${src}" class="img-fluid rounded" alt="Preview">
                <button type="button" class="btn btn-sm btn-danger position-absolute top-0 end-0 m-1 remove-image">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        // Agregar evento para eliminar la imagen
        col.querySelector('.remove-image').addEventListener('click', () => {
            // Encontrar el índice de esta imagen
            const index = Array.from(this.previewContainer.children).indexOf(col);
            if (index !== -1) {
                // Eliminar del array
                this.uploadedImages.splice(index, 1);
                // Eliminar del DOM
                col.remove();
                // Actualizar el campo oculto
                this.updateImageReferences();
            }
        });
        
        // Agregar al contenedor
        this.previewContainer.appendChild(col);
        
        // Agregar al array de imágenes
        if (file) {
            this.uploadedImages.push(file);
        } else {
            this.uploadedImages.push(src);
        }
        
        // Actualizar el campo oculto
        this.updateImageReferences();
    }
    
    /**
     * Actualiza el campo oculto con referencias a las imágenes
     */
    updateImageReferences() {
        if (this.imageReferencesInput) {
            // Convertir los archivos a un formato serializable
            const references = this.uploadedImages.map(img => {
                if (typeof img === 'string') return img;
                return {
                    name: img.name,
                    type: img.type,
                    size: img.size,
                    lastModified: img.lastModified
                };
            });
            
            this.imageReferencesInput.value = JSON.stringify(references);
        }
    }
    
    /**
     * Procesa y previsualiza archivos
     * @param {FileList} files - Lista de archivos a procesar
     */
    handleFiles(files) {
        Array.from(files).forEach(file => {
            // Verificar que sea una imagen
            if (!file.type.startsWith('image/')) {
                showImageToast('error', 'Solo se permiten archivos de imagen', 'top-end');
                return;
            }
            
            // Verificar tamaño máximo
            const fileSizeInMB = file.size / (1024 * 1024);
            if (fileSizeInMB > this.config.maxSizeInMB) {
                showImageToast('error', `La imagen es demasiado grande. Máximo ${this.config.maxSizeInMB}MB`, 'top-end');
                return;
            }
            
            const reader = new FileReader();
            reader.onload = (e) => {
                this.addPreview(e.target.result, file);
            };
            reader.readAsDataURL(file);
        });
    }
    
    /**
     * Limpia todas las imágenes
     */
    clearAllImages() {
        // Confirmar antes de eliminar
        if (typeof Swal !== 'undefined' && this.uploadedImages.length > 0) {
            Swal.fire({
                title: '¿Eliminar todas las imágenes?',
                text: 'Esta acción no se puede deshacer',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Sí, eliminar',
                cancelButtonText: 'Cancelar'
            }).then((result) => {
                if (result.isConfirmed) {
                    this._clearImages();
                    showImageToast('success', 'Todas las imágenes han sido eliminadas', 'top-end');
                }
            });
        } else {
            this._clearImages();
        }
    }
    
    /**
     * Método interno para limpiar imágenes sin confirmación
     */
    _clearImages() {
        // Limpiar el contenedor de previsualización
        if (this.previewContainer) {
            this.previewContainer.innerHTML = '';
        }
        
        // Limpiar el array de imágenes
        this.uploadedImages = [];
        
        // Actualizar el campo oculto
        this.updateImageReferences();
    }
    
    /**
     * Obtiene las imágenes subidas
     * @returns {Array} - Array de imágenes (File o URL)
     */
    getUploadedImages() {
        return [...this.uploadedImages];
    }
    
    /**
     * Agrega imágenes desde URLs
     * @param {Array<string>} urls - Array de URLs de imágenes
     */
    addImagesFromUrls(urls) {
        if (!Array.isArray(urls)) return;
        
        urls.forEach(url => {
            this.addPreview(url);
        });
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Crear instancia del gestor de imágenes
    window.imageUploadManager = new ImageUploadManager();
});
