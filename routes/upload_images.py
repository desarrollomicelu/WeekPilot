# routes/upload_images.py
from flask import Blueprint, render_template, request, redirect, url_for, flash

upload_images_bp = Blueprint("upload_images", __name__, template_folder="templates")

@upload_images_bp.route("/upload", methods=["GET", "POST"])
def upload():
    if request.method == "POST":
        flash("Imagen subida", "success", endpoint="upload_images")
        return redirect(url_for("upload_images.upload"))
    return render_template("upload_images.html")
