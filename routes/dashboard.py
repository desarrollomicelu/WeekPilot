from flask import Blueprint, render_template
from flask_login import login_required
from utils.access_control import role_required

dashboard_bp = Blueprint("dashboard", __name__, template_folder="templates")

@dashboard_bp.route("/dashboard", endpoint="dashboard")
@login_required
@role_required("Admin")
def dashboard():
    return render_template("dashboard.html")
