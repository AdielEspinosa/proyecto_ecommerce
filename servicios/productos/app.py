from flask import Flask, jsonify, request
from database import conectar

app = Flask(__name__)

def obtener_producto_por_id(id):
    conexion = conectar()
    cursor = conexion.cursor(dictionary=True)
    sql = "SELECT * FROM productos WHERE id = %s"
    cursor.execute(sql, (id,))
    producto = cursor.fetchone()
    cursor.close()
    conexion.close()
    
    return producto

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
    producto = obtener_producto_por_id(id)

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

# PUT
@app.route("/productos/<int:id>", methods=["PUT"])
def actualizarDatos(id):
    if obtener_producto_por_id(id) is None:
        return jsonify({"mensaje": "Producto no encontrado"}), 404
    
    datosNuevos = request.json
    conexion = conectar()
    cursor = conexion.cursor(dictionary=True)

    sql = """
        UPDATE productos 
        SET nombre = %s, tamanio = %s, descripcion = %s, precio = %s, disponible = %s
        WHERE id = %s
    """
    valores = (
        datosNuevos["nombre"],
        datosNuevos["tamanio"],
        datosNuevos["descripcion"],
        datosNuevos["precio"],
        datosNuevos["disponible"],
        id
    )

    cursor.execute(sql, valores)
    conexion.commit()

    cursor.close()
    conexion.close()

    return jsonify({"mensaje": "Datos del producto actualizados correctamente"}),200

# PATCH
@app.route("/productos/<int:id>/disponibilidad", methods=["PATCH"])
def actualizarDisponibilidad(id):
    if obtener_producto_por_id(id) is None:
        return jsonify({"mensaje": "Producto no encontrado"}), 404
    
    disponible = request.json["disponible"]

    conexion = conectar()
    cursor = conexion.cursor(dictionary=True)

    sql = """
        UPDATE productos 
        SET disponible = %s
        WHERE id = %s
    """
    cursor.execute(sql, (disponible, id))
    conexion.commit()

    cursor.close()
    conexion.close()

    return jsonify({"mensaje": "Disponibilidad del producto actualizada correctamente"}),200

# DELETE
@app.route("/productos/<int:id>", methods=["DELETE"])
def eliminar(id):
    if obtener_producto_por_id(id) is None:
        return jsonify({"mensaje": "Producto no encontrado"}), 404
    
    conexion = conectar()
    cursor = conexion.cursor(dictionary=True)
    sql = "DELETE FROM productos WHERE id = %s"

    cursor.execute(sql, (id,))
    conexion.commit()

    cursor.close()
    conexion.close()

    return jsonify({"mensaje": "Producto eliminado correctamente"}),200

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)