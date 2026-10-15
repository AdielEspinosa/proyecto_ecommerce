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

# GET ID
@app.route("/productos/<int:id>", methods=["GET"])
def buscar(id):
    conexion = conectar()
    cursor = conexion.cursor(dictionary=True)
    sql = "SELECT * FROM productos WHERE id = %s"
    cursor.execute(sql, (id,))
    producto = cursor.fetchone()

    cursor.close()
    conexion.close()

    if producto is None:
        return jsonify({"mensaje": "Producto no encontrado"}), 404

    return jsonify(producto)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)