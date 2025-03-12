# routes/internal_repair.py

from flask import Blueprint, render_template

internal_repair_bp = Blueprint("internal_repair", __name__, template_folder="templates")

@internal_repair_bp.route("/internal_repair", endpoint="internal_repair")
def internal_repair():
    return render_template("internal_repair.html")
