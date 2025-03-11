from flask import Blueprint, render_template
from flask_login import login_required

upload_images = Blueprint('upload_images', __name__)

@upload_images.route("/upload_images.html")
@login_required
def upload_images():
    return render_template("upload_images.html")
