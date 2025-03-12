from flask import Blueprint, render_template

dashboard_bp = Blueprint("dashboard", __name__, template_folder="templates")

@dashboard_bp.route("/dashboard", endpoint="dashboard")
def dashboard():
    return render_template("dashboard.html")
