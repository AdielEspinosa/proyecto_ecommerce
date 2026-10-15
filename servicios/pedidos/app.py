from flask import Flask, jsonify, request
import requests, os
from database import conectar

app = Flask(__name__)

@app.route("/api/pedidos")
def historial():
    conexion = conectar()
    cursor = conexion.cursor(dictionary=True)
    cursor.execute("SELECT * FROM pedidos")
    pedidos = cursor.fetchall()
    cursor.close()
    conexion.close()
    return jsonify(pedidos)

@app.route("/api/pedidos/<int:id>")
def buscar(id):
    conexion = conectar()
    cursor = conexion.cursor(dictionary=True)
    cursor.execute("SELECT * FROM pedidos WHERE id = %s", (id,))
    pedido = cursor.fetchone()
    cursor.close()
    conexion.close()

    if pedido is None:
        return jsonify({"mensaje": "Pedido no encontrado"}), 404
    return jsonify(pedido)


@app.route("/api/pedidos", methods=["POST"])
def crear():
    datos = request.json 
    respuesta = requests.get(f"{usuarios_url}/api/usuarios/{datos['cliente_id']}")
    if respuesta.status_code != 200:
        return jsonify({"mensaje": "Cliente no encontrado"}), 404
    usuario = respuesta.json()
   
    respuesta = requests.get(f"{productos_url}/productos/{datos['producto_id']}")
    if respuesta.status_code != 200:
        return jsonify({"mensaje": "Producto no encontrado"}), 404
    producto = respuesta.json()
    if not producto["disponible"]:
        return jsonify({"mensaje": "Producto no disponible"}), 400
    total = float(producto["precio"]) * datos["cantidad"]
    conexion = conectar()
    cursor = conexion.cursor()

    sql = """
        INSERT INTO pedidos
        (cliente_id, producto_id, cantidad, direccion, total)
        VALUES (%s, %s, %s, %s, %s)
    """
    valores = (datos["cliente_id"], datos["producto_id"], datos["cantidad"],
               usuario["direccion"], total)     
    cursor.execute(sql, valores)
    conexion.commit()
    nuevoId = cursor.lastrowid
    cursor.close()
    conexion.close()
    return jsonify({"mensaje": "Pedido creado", "id": nuevoId, "total": total})



if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)


