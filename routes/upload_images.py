import os
from flask import Blueprint, render_template, request, redirect, url_for, flash
from PIL import Image
from datetime import datetime
from werkzeug.utils import secure_filename

# Blueprint
upload_images_bp = Blueprint('upload_images', __name__, template_folder='../templates')

# Carpeta de subida y extensiones permitidas
UPLOAD_FOLDER = 'static/uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp'}
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Verifica si el archivo tiene extensión permitida
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Guarda imagen como .webp
def save_image(image_file):
    try:
        img = Image.open(image_file)
        filename = f"{datetime.now().strftime('%Y%m%d%H%M%S%f')}.webp"
        save_path = os.path.join(UPLOAD_FOLDER, secure_filename(filename))
        img.save(save_path, 'webp', quality=75)
        return True, filename
    except Exception as e:
        return False, str(e)

# Ruta principal
@upload_images_bp.route('/upload', methods=['GET', 'POST'])
def upload():
    if request.method == 'POST':
        uploaded_files = request.files.getlist('images')
        taken_photo = request.files.get('photo')

        if not uploaded_files and not taken_photo:
            flash('No se seleccionaron imágenes.', 'warning')
            return redirect(request.url)

        success = 0
        errors = 0

        for file in uploaded_files:
            if file and allowed_file(file.filename):
                ok, _ = save_image(file)
                success += 1 if ok else 0
                errors += 0 if ok else 1

        if taken_photo and allowed_file(taken_photo.filename):
            ok, _ = save_image(taken_photo)
            success += 1 if ok else 0
            errors += 0 if ok else 1

        if success:
            flash(f'{success} imagen(es) subida(s) correctamente.', 'success')
        if errors:
            flash(f'{errors} imagen(es) no pudieron procesarse.', 'danger')

        return redirect(url_for('upload_images.upload'))

    return render_template('upload_images.html')
