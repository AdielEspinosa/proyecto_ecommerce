from flask import Flask, jsonify
from database import conectar

app = Flask(__name__)

@app.route("/usuarios", methods=["GET"])
def listar():
    conexion = conectar()
    cursor = conexion.cursor(dictionary=True)
    cursor.execute("SELECT * FROM usuarios")
    usuarios = cursor.fetchall()

    cursor.close()
    conexion.close()

    return jsonify(usuarios)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)