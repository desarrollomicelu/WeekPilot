from flask import Flask, render_template
app = Flask(__name__)

@app.route('/')
def home ():
     return render_template("login.html")
 
@app.route('/login')
def login ():
        return render_template("login.html")

@app.route('/index')
def index ():
     return render_template("index.html")
 
@app.route('/dashboard')
def dashboard ():
     return render_template("dashboard.html")

@app.route('/technical_service')
def technical_service():
    return render_template('technical_service.html')

@app.route('/warranty')
def warranty():
    return render_template('warranty.html')

@app.route('/internal_repair')
def internal_repair():
    return render_template('internal_repair.html')





if __name__ == '__main__':
    app.run(debug=True)

