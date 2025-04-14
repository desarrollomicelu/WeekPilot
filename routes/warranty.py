# routes/warranty.py

from flask import Blueprint, render_template
from flask_login import login_required
from utils.access_control import role_required

warranty_bp = Blueprint("warranty", __name__, template_folder="templates")

@warranty_bp.route("/warranty", endpoint="warranty")
@login_required
@role_required("Admin")
def warranty_view():
    return render_template("warranty.html")
