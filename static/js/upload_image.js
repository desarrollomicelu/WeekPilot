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
            imageCommentSelector: '#imageComment',
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
        this.commentTextarea = document.querySelector(this.config.imageCommentSelector);
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
        
        // Inicializar el manejo de comentarios
        this.initCommentHandling();
        
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
     * Inicializa el manejo de comentarios
     */
    initCommentHandling() {
        if (this.commentTextarea) {
            // Restaurar comentario guardado si existe
            const savedComment = localStorage.getItem('imageUploadComment');
            if (savedComment) {
                this.commentTextarea.value = savedComment;
            }
            
            // Guardar comentario cuando cambie
            this.commentTextarea.addEventListener('input', () => {
                localStorage.setItem('imageUploadComment', this.commentTextarea.value);
            });
        }
    }
    
    /**
     * Obtiene el comentario actual
     * @returns {string} - El texto del comentario
     */
    getComment() {
        return this.commentTextarea ? this.commentTextarea.value : '';
    }
    
    /**
     * Establece el comentario
     * @param {string} text - Texto del comentario
     */
    setComment(text) {
        if (this.commentTextarea) {
            this.commentTextarea.value = text;
            localStorage.setItem('imageUploadComment', text);
        }
    }
    
    /**
     * Limpia el comentario
     */
    clearComment() {
        this.setComment('');
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

document.addEventListener('DOMContentLoaded', function() {
    console.log('Debug: upload_image.js cargada');
    
    const form = document.querySelector('form[action*="edit_ticket"]');
    
    if (form) {
        console.log('Debug: Found edit ticket form');
        
        if (form.getAttribute('enctype') !== 'multipart/form-data') {
            console.error('Debug: Form missing enctype="multipart/form-data"');
            form.setAttribute('enctype', 'multipart/form-data');
            console.log('Debug: Added missing enctype attribute');
        }
        
        const debugField = document.createElement('input');
        debugField.type = 'hidden';
        debugField.name = 'debug_js_loaded';
        debugField.value = 'true';
        form.appendChild(debugField);
        
        const fileInputs = [
            document.getElementById('uploadImages'),
            document.getElementById('takePhoto')
        ];
        
        fileInputs.forEach(input => {
            if (input) {
                console.log(`Debug: Found input: ${input.id}`);
            } else {
                console.error(`Debug: Input not found: ${input ? input.id : 'undefined'}`);
            }
        });
        
        fetch('/check_auth_status')
            .then(response => response.json())
            .then(data => {
                console.log('Debug: OneDrive auth status:', data);
            })
            .catch(error => {
                console.error('Debug: Error checking auth status:', error);
            });
        
        form.addEventListener('submit', function(e) {
            console.log('Debug: Form submit intercepted');
            
            let hasFiles = false;
            let fileCount = 0;
            
            for (const input of fileInputs) {
                if (input && input.files && input.files.length > 0) {
                    hasFiles = true;
                    fileCount += input.files.length;
                    console.log(`Debug: Found ${input.files.length} files in ${input.id}`);
                    
                    for (let i = 0; i < input.files.length; i++) {
                        const file = input.files[i];
                        console.log(`Debug: File ${i+1}: ${file.name}, type: ${file.type}, size: ${file.size} bytes`);
                    }
                }
            }
            
            if (!hasFiles) {
                console.log('Debug: No files to upload, submitting form normally');
                return true;
            }
            
            e.preventDefault();
            console.log(`Debug: Uploading ${fileCount} files to OneDrive`);
            
            const pathParts = window.location.pathname.split('/');
            const ticketId = pathParts[pathParts.length - 1];
            console.log('Debug: Ticket ID from path:', ticketId);
            
            if (!ticketId || isNaN(parseInt(ticketId))) {
                console.error('Debug: Invalid ticket ID');
                alert('Error: No se pudo determinar el ID del ticket');
                return;
            }
            
            const formData = new FormData();
            formData.append('ticket_id', ticketId);
            
            for (const input of fileInputs) {
                if (input && input.files) {
                    for (const file of input.files) {
                        formData.append('images', file);
                        console.log(`Debug: Added file to FormData: ${file.name}`);
                    }
                }
            }
            
            const loadingDiv = document.createElement('div');
            loadingDiv.className = 'alert alert-info mt-3';
            loadingDiv.id = 'uploadLoadingAlert';
            loadingDiv.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i> Subiendo imágenes a OneDrive...';
            
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.insertAdjacentElement('beforebegin', loadingDiv);
            } else {
                form.appendChild(loadingDiv);
            }
            
            console.log('Debug: Sending request to /upload_ticket_image');
            
            fetch('/upload_ticket_image', {
                method: 'POST',
                body: formData
            })
            .then(response => {
                console.log('Debug: Response status:', response.status);
                console.log('Debug: Response headers:', response.headers);
                return response.json();
            })
            .then(data => {
                console.log('Debug: Upload response data:', data);
                
                document.getElementById('uploadLoadingAlert')?.remove();
                if (submitBtn) submitBtn.disabled = false;
                
                if (data.success) {
                    const successDiv = document.createElement('div');
                    successDiv.className = 'alert alert-success mt-3';
                    successDiv.innerHTML = `<i class="fas fa-check-circle me-2"></i> imágenes subidas correctamente`;
                    
                    if (submitBtn) {
                        submitBtn.insertAdjacentElement('beforebegin', successDiv);
                    } else {
                        form.appendChild(successDiv);
                    }
                    
                    const imageReferencesInput = document.getElementById('imageReferences');
                    if (imageReferencesInput) {
                        const currentRefs = imageReferencesInput.value ? JSON.parse(imageReferencesInput.value) : [];
                        const newRefs = [...currentRefs, ...data.images];
                        imageReferencesInput.value = JSON.stringify(newRefs);
                        console.log('Debug: Updated image references:', newRefs);
                    }
                    
                    setTimeout(() => {
                        console.log('Debug: Submitting form after successful upload');
                        form.submit();
                    }, 1000);
                } else {
                    const errorDiv = document.createElement('div');
                    errorDiv.className = 'alert alert-danger mt-3';
                    errorDiv.innerHTML = `<i class="fas fa-exclamation-triangle me-2"></i> Error: ${data.error}`;
                    
                    if (submitBtn) {
                        submitBtn.insertAdjacentElement('beforebegin', errorDiv);
                    } else {
                        form.appendChild(errorDiv);
                    }
                    
                    console.error('Debug: Upload failed:', data.error);
                }
            })
            .catch(error => {
                document.getElementById('uploadLoadingAlert')?.remove();
                if (submitBtn) submitBtn.disabled = false;
                
                console.error('Debug: Upload error:', error);
                
                const errorDiv = document.createElement('div');
                errorDiv.className = 'alert alert-danger mt-3';
                errorDiv.innerHTML = `<i class="fas fa-exclamation-triangle me-2"></i> Error de conexión: ${error.message}`;
                
                if (submitBtn) {
                    submitBtn.insertAdjacentElement('beforebegin', errorDiv);
                } else {
                    form.appendChild(errorDiv);
                }
            });
        });
    } else {
        console.warn('Debug: Edit ticket form not found');
    }
    
    const uploadImagesInput = document.getElementById('uploadImages');
    const takePhotoInput = document.getElementById('takePhoto');
    const previewContainer = document.getElementById('previewContainer');
    
    if (uploadImagesInput && previewContainer) {
        uploadImagesInput.addEventListener('change', function() {
            handleFileSelection(this.files);
        });
    }
    
    if (takePhotoInput && previewContainer) {
        takePhotoInput.addEventListener('change', function() {
            handleFileSelection(this.files);
        });
    }
    
    function handleFileSelection(files) {
        if (!files || !files.length) return;
        
        // Contar cuántas imágenes ya hay en el preview
        const currentImages = document.querySelectorAll('.preview-image-container').length;
        const maxImages = 10;
        
        // Verificar si excedería el límite
        if (currentImages + files.length > maxImages) {
            alert(`Solo puedes subir un máximo de ${maxImages} imágenes. Ya tienes ${currentImages}.`);
            return;
        }
        
        Array.from(files).forEach(file => {
            if (!file.type.includes('image/')) {
                console.warn('Debug: Non-image file selected:', file.name);
                return;
            }
            
            const reader = new FileReader();
            reader.onload = function(e) {
                addPreview(e.target.result, file.name);
            };
            reader.readAsDataURL(file);
        });
    }
    
    function addPreview(src, fileName) {
        const col = document.createElement('div');
        col.className = 'col-6 col-md-3 mb-3 preview-image-container';
        col.innerHTML = `
            <div class="card h-100 position-relative">
                <button type="button" class="btn btn-sm btn-danger position-absolute top-0 end-0 rounded-circle p-1 m-1 remove-preview" 
                        style="width: 25px; height: 25px; z-index: 100;">
                    <i class="fas fa-times" style="font-size: 0.8rem;"></i>
                </button>
                <img src="${src}" 
                     class="card-img-top img-thumbnail preview-image" 
                     alt="${fileName}"
                     style="cursor: zoom-in;"
                     data-bs-toggle="modal" 
                     data-bs-target="#imageModal" 
                     data-image-url="${src}"
                     data-image-name="${fileName}">
            </div>
        `;
        
        const removeBtn = col.querySelector('.remove-preview');
        if (removeBtn) {
            removeBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                
                col.style.transition = "opacity 0.3s";
                col.style.opacity = "0";
                
                setTimeout(() => {
                    col.remove();
                }, 300);
            });
        }
        
        previewContainer.appendChild(col);
    }
    
    const imageModal = document.getElementById('imageModal');
    if (imageModal) {
        imageModal.addEventListener('show.bs.modal', function (event) {
            const img = event.relatedTarget;
            
            const imageUrl = img.getAttribute('data-image-url');
            const imageName = img.getAttribute('data-image-name');
            
            const modalImage = document.getElementById('modalImage');
            const modalTitle = document.getElementById('imageModalLabel');
            
            if (modalImage) modalImage.src = imageUrl;
            if (modalTitle && imageName) modalTitle.textContent = imageName;
            
            console.log('Debug: Showing image in modal:', imageUrl);
        });
    } else {
        console.warn('Debug: Image modal not found in the DOM');
    }
    
    const removeButtons = document.querySelectorAll('.remove-image[data-image-id]');
    removeButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation();
            
            const imageId = this.getAttribute('data-image-id');
            console.log('Debug: Removing image with ID:', imageId);
            
            // Añadir el ID a la lista de imágenes a eliminar
            const imagesToDeleteInput = document.getElementById('imagesToDelete');
            const imagesToDelete = imagesToDeleteInput ? 
                JSON.parse(imagesToDeleteInput.value || '[]') : [];
            
            imagesToDelete.push(imageId);
            
            if (imagesToDeleteInput) {
                imagesToDeleteInput.value = JSON.stringify(imagesToDelete);
                console.log('Debug: Updated images to delete:', imagesToDeleteInput.value);
            }
            
            const container = this.closest('.preview-image-container');
            if (container) {
                container.style.transition = "opacity 0.3s";
                container.style.opacity = "0";
                
                setTimeout(() => {
                    container.remove();
                    console.log('Debug: Removed container from DOM');
                }, 300);
            }
        });
    });
    
    if (form) {
        const originalSubmit = form.onsubmit;
        
        form.onsubmit = function(e) {
            const imagesToDeleteInput = document.getElementById('imagesToDelete');
            const imagesToDelete = imagesToDeleteInput ? 
                JSON.parse(imagesToDeleteInput.value || '[]') : [];
            
            if (imagesToDelete.length > 0) {
                console.log(`Debug: Will delete ${imagesToDelete.length} images from OneDrive`);
            }
            
            if (originalSubmit) {
                return originalSubmit.call(this, e);
            }
        };
    }
});