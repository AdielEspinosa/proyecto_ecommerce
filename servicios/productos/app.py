from flask import Flask, jsonify, request
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

# POST
@app.route("/productos", methods=["POST"])
def crear():
    nuevoProducto = request.json
    conexion = conectar()
    cursor = conexion.cursor(dictionary=True)

    sql = """
        INSERT INTO productos 
        (nombre, tamanio, descripcion, precio, disponible) 
        VALUES (%s, %s, %s, %s, %s)
    """
    valores = (
        nuevoProducto["nombre"],
        nuevoProducto["tamanio"],
        nuevoProducto["descripcion"],
        nuevoProducto["precio"],
        nuevoProducto.get("disponible", True)
    )

    cursor.execute(sql, valores)
    conexion.commit()
    nuevoId = cursor.lastrowid

    cursor.close()
    conexion.close()

    return jsonify({"mensaje": "Producto agregado correctamente", "id": nuevoId}), 201


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)