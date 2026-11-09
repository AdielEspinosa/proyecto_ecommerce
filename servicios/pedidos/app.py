from flask import Flask, jsonify, request
import requests, os, pybreaker
from database import conectar

app = Flask(__name__)
usuarios_url = os.getenv("USUARIOS_URL")
productos_url = os.getenv("PRODUCTOS_URL")

circuito_usuarios = pybreaker.CircuitBreaker(
    fail_max=int(os.getenv("CB_MAX_FALLOS", "3")),
    reset_timeout=int(os.getenv("CB_RECUPERACION", "30")),
    throw_new_error_on_trip=False
)

circuito_productos = pybreaker.CircuitBreaker(
    fail_max=int(os.getenv("CB_MAX_FALLOS", "3")),
    reset_timeout=int(os.getenv("CB_RECUPERACION", "30")),
    throw_new_error_on_trip=False
)

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
    tiempo_maximo_usuarios = float(os.getenv("USUARIOS_TIMEOUT", "2"))
    tiempo_maximo_productos = float(os.getenv("PRODUCTOS_TIMEOUT", "2"))

    try:
        with circuito_usuarios.calling():
            respuesta_usuario = requests.get(f"{usuarios_url}/api/usuarios/{datos['cliente_id']}", timeout=tiempo_maximo_usuarios)
            if respuesta_usuario.status_code >= 500:
                respuesta_usuario.raise_for_status()
                
    except requests.exceptions.ConnectionError:
        return jsonify({"mensaje": "El servicio de usuarios no está disponible"}),503
    except pybreaker.CircuitBreakerError:
        return jsonify({"mensaje": "Circuito abierto: El servicio de usuarios no está disponible"}), 503
    except requests.exceptions.Timeout:
        return jsonify({"mensaje": "El servicio de usuarios tardó demasiado en responder"}), 504
    except requests.exceptions.ConnectionError:
        return jsonify({"mensaje": "El servicio de usuarios no está disponible"}), 503
    
    if respuesta_usuario.status_code == 404:
            return jsonify({"mensaje": "Cliente no encontrado"}), 404
    if respuesta_usuario.status_code != 200:
        return jsonify({"mensaje": "Error al consultar el cliente"}), 502
    
    usuario = respuesta_usuario.json()
    
    try:
        with circuito_productos.calling():
            respuesta_producto = requests.get(f"{productos_url}/productos/{datos['producto_id']}", timeout=tiempo_maximo_productos)
            if respuesta_producto.status_code >=500:
                 respuesta_producto.raise_for_status()

    except requests.exceptions.ConnectionError:
        return jsonify({"mensaje": "El servicio de productos no está disponible"}),503
    except pybreaker.CircuitBreakerError:
        return jsonify({"mensaje": "Circuito abierto: El servicio de productos no está disponible"}), 503
    except requests.exceptions.Timeout:
        return jsonify({"mensaje": "El servicio de productos tardó demasiado en responder"}), 504
    except requests.exceptions.ConnectionError:
        return jsonify({"mensaje": "El servicio de productos no está disponible"}), 503
    
    if respuesta_producto.status_code == 404:
        return jsonify({"mensaje": "Producto no encontrado"}), 404
    if respuesta_producto.status_code != 200:
        return jsonify({"mensaje": "Error al consultar el producto"}), 502
    
    producto = respuesta_producto.json()

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
    return jsonify({"mensaje": "Pedido creado", "id": nuevoId, "total": total}),201


@app.route("/api/pedidos/<int:id>/estado", methods=["PUT"])
def actualizar_estado(id):
    datos = request.json
    conexion = conectar()
    cursor = conexion.cursor()
    sql = """
        UPDATE pedidos
        SET estado = %s
        WHERE id = %s
    """
    cursor.execute(sql, (datos["estado"], id))
    conexion.commit()
    if cursor.rowcount == 0:
        cursor.close()
        conexion.close()
        return jsonify({"mensaje": "Pedido no encontrado"}), 404
    cursor.close()
    conexion.close()
    return jsonify({"mensaje": "Estado actualizado correctamente", "id": id})


@app.route("/api/pedidos/<int:id>", methods=["DELETE"])
def eliminar(id):
    conexion = conectar()
    cursor = conexion.cursor()
    cursor.execute("DELETE FROM pedidos WHERE id = %s", (id,))
    conexion.commit()
    filas = cursor.rowcount
    cursor.close()
    conexion.close()

    if filas == 0:
        return jsonify({"mensaje": "Pedido no encontrado"}), 404
    return jsonify({"mensaje": "Pedido eliminado"})


@app.route("/api/pedidos/<int:id>", methods=["PATCH"])
def modificar(id):
    datos = request.json
    conexion = conectar()
    cursor = conexion.cursor()
    sql = """
        UPDATE pedidos
        SET direccion = %s
        WHERE id = %s
    """
    cursor.execute(sql, (datos["direccion"], id))
    conexion.commit()
    if cursor.rowcount == 0:
        cursor.close()
        conexion.close()
        return jsonify({"mensaje": "Pedido no encontrado"}), 404
    cursor.close()
    conexion.close()
    return jsonify({"mensaje": "Dirección actualizada correctamente", "id": id})

@app.route("/api/pedidos/circuito/usuarios", methods=["GET"])
def estado_circuito_usuarios():
    return jsonify({
        "servicio": "usuarios",
        "estado": circuito_usuarios.current_state.upper(),
        "fallos_consecutivos": circuito_usuarios.fail_counter,
        "umbral_fallos": circuito_usuarios.fail_max,
        "periodo_recuperacion": circuito_usuarios.reset_timeout
    }), 200

@app.route("/api/pedidos/circuito/productos", methods=["GET"])
def estado_circuito_productos():
    return jsonify({
        "servicio": "productos",
        "estado": circuito_productos.current_state.upper(),
        "fallos_consecutivos": circuito_productos.fail_counter,
        "umbral_fallos": circuito_productos.fail_max,
        "periodo_recuperacion": circuito_productos.reset_timeout
    }), 200

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)