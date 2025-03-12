# routes/warranty.py

from flask import Blueprint, render_template

warranty_bp = Blueprint("warranty", __name__, template_folder="templates")

@warranty_bp.route("/warranty", endpoint="warranty")
def warranty_view():
    return render_template("warranty.html")
