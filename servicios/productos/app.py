from flask import Flask, jsonify
from database import conectar

app = Flask(__name__)

# GET
@app.route("/productos", methods=["GET"])
def listar():
    conexion = conectar()
    cursor = conexion.cursor(dictionary=True)
    cursor.execute("SELECT * FROM productos")
    productos = cursor.fetchall()

    cursor.close()
    conexion.close()

    return jsonify(productos)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)