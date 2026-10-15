from flask import Flask, jsonify, request
import requests, os
from database import conectar

app = Flask(__name__)

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

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)