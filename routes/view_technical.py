from flask import Blueprint, render_template, request, redirect, url_for, flash, jsonify
from flask_login import login_required, current_user
from models.tickets import Tickets
from models.clients import Clients_tickets
from extensions import db
from utils.decorators import technician_access, admin_or_technician_access

import os
from PIL import Image
from datetime import datetime
from werkzeug.utils import secure_filename

view_technical_bp = Blueprint(
    "view_technical", __name__, template_folder="templates")

# Carpeta de subida y extensiones permitidas (reutilizamos tu lógica)
UPLOAD_FOLDER = 'static/uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp'}
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def save_image(image_file):
    """
    Lógica para guardar la imagen en formato webp, 
    misma que usas en tu archivo upload_images.
    """
    try:
        img = Image.open(image_file)
        filename = f"{datetime.now().strftime('%Y%m%d%H%M%S%f')}.webp"
        save_path = os.path.join(UPLOAD_FOLDER, secure_filename(filename))
        img.save(save_path, 'webp', quality=75)
        return True, filename
    except Exception as e:
        return False, str(e)


# ----------------------------------------------------------------------
# (LISTA DE TICKETS ASIGNADOS AL TÉCNICO)
# ----------------------------------------------------------------------
@view_technical_bp.route("/view_technical")
@login_required
@technician_access()
def view_technical():
    # Normalizar la cédula del usuario actual
    normalized_cedula = ''.join(c for c in current_user.cedula if c.isalnum())

    # Buscar tickets donde el documento del técnico coincida
    tickets = []
    for ticket in Tickets.query.all():
        if ticket.technical_document:
            normalized_ticket_doc = ''.join(
                c for c in ticket.technical_document if c.isalnum())
            if normalized_ticket_doc == normalized_cedula:
                tickets.append(ticket)

    # Cargar info adicional (cliente)
    for ticket in tickets:
        if not hasattr(ticket, 'client_info') or ticket.client_info is None:
            ticket.client_info = Clients_tickets.query.get(ticket.client)

    return render_template("view_technical.html", tickets=tickets)


# ----------------------------------------------------------------------
# NUEVA RUTA: VER/EDITAR UN TICKET ESPECÍFICO (IMÁGENES + COMENTARIOS)
# ----------------------------------------------------------------------
@view_technical_bp.route("/view_technical/ticket/<int:ticket_id>", methods=["GET", "POST"])
@login_required
@technician_access()
def technician_ticket_detail(ticket_id):
    ticket = Tickets.query.get_or_404(ticket_id)

    if request.method == "POST":
        # 1. Subir imágenes (misma lógica que en tu upload_images)
        uploaded_files = request.files.getlist('images')
        taken_photo = request.files.get('photo')  # foto tomada con cámara

        success = 0
        errors = 0

        # Guardar múltiples imágenes
        for file in uploaded_files:
            if file and allowed_file(file.filename):
                ok, _ = save_image(file)
                success += 1 if ok else 0
                errors += 0 if ok else 1

        # Guardar foto de la cámara (si existe)
        if taken_photo and allowed_file(taken_photo.filename):
            ok, _ = save_image(taken_photo)
            success += 1 if ok else 0
            errors += 0 if ok else 1

        # 2. Manejo de comentarios (campo `comment`)
        new_comment = request.form.get('new_comment', '').strip()
        if new_comment:
            # Reemplazar completamente el comentario existente con el nuevo
            ticket.comment = new_comment

        # Guardar en la base de datos
        try:
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            flash(f"Error al guardar: {str(e)}", "danger")
            return redirect(request.url)

        # Mensajes informativos
        if success:
            flash(f'{success} imagen(es) subida(s) correctamente.', 'success')
        if errors:
            flash(f'{errors} imagen(es) no pudieron procesarse.', 'danger')
        if new_comment:
            flash('Comentario actualizado correctamente.', 'info')

        return redirect(url_for('view_technical.technician_ticket_detail', ticket_id=ticket_id))

    # Modo GET: Se muestra el ticket y el formulario
    return render_template(
        "technician_ticket_detail.html",
        ticket=ticket
    )



# ----------------------------------------------------------------------
# RUTA AJAX
# ----------------------------------------------------------------------
@view_technical_bp.route('/update_ticket_status_ajax', methods=['POST'])
@login_required
def update_ticket_status_ajax():
    ticket_id = request.form.get('ticket_id')
    new_status = request.form.get('status')

    if not ticket_id or not new_status:
        return jsonify({'success': False, 'message': 'Datos incompletos'})

    try:
        ticket = Tickets.query.get(ticket_id)
        if not ticket:
            return jsonify({'success': False, 'message': 'Ticket no encontrado'})

        now = ticket.update_state(new_status)
        db.session.commit()

        formatted_time = now.strftime("%d/%m/%Y %H:%M:%S")

        return jsonify({
            'success': True,
            'message': 'Estado actualizado correctamente',
            'status': new_status,
            'timestamp': formatted_time
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Error: {str(e)}'})
