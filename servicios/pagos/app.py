from flask import Flask, jsonify, request
import requests, os, pybreaker
from database import conectar

app = Flask(__name__)

pedidos_url = os.getenv("PEDIDOS_URL")

circuito_pedidos = pybreaker.CircuitBreaker(
    fail_max=int(os.getenv("CB_MAX_FALLOS", "3")),
    reset_timeout=int(os.getenv("CB_RECUPERACION", "30")),
    throw_new_error_on_trip=False
)


def consultar_pedido(pedido_id):
    tiempo_maximo_pedidos = float(os.getenv("PEDIDOS_TIMEOUT", "5"))
    respuesta_pedido = requests.get(
        f"{pedidos_url}/api/pedidos/{pedido_id}",
        timeout=tiempo_maximo_pedidos
    )
    if respuesta_pedido.status_code >= 500:
        respuesta_pedido.raise_for_status()
    return respuesta_pedido


@app.route("/api/pagos")
def listar():
    conexion = conectar()
    cursor = conexion.cursor(dictionary=True)

    cursor.execute("SELECT * FROM pagos")
    pagos = cursor.fetchall()

    cursor.close()
    conexion.close()

    return jsonify(pagos)


@app.route("/api/pagos/<int:id>")
def buscar(id):
    conexion = conectar()
    cursor = conexion.cursor(dictionary=True)

    cursor.execute("SELECT * FROM pagos WHERE id = %s", (id,))
    pago = cursor.fetchone()

    cursor.close()
    conexion.close()

    if pago is None:
        return jsonify({"mensaje": "Pago no encontrado"}), 404

    return jsonify(pago)


@app.route("/api/pagos", methods=["POST"])
def crear():
    datos = request.json

    if not datos or "pedido_id" not in datos or not datos["pedido_id"]:
        return jsonify({
            "mensaje": "No se recibió el pedido asociado al pago"
        }), 400

    if "metodo_pago" not in datos or not datos["metodo_pago"]:
        return jsonify({
            "mensaje": "Debe seleccionar un método de pago"
        }), 400

    metodos_validos = ["efectivo", "tarjeta", "transferencia"]
    metodo_pago = datos["metodo_pago"]

    if metodo_pago not in metodos_validos:
        return jsonify({
            "mensaje": "Método de pago no válido"
        }), 400

    try:
        with circuito_pedidos.calling():
            respuesta_pedido = consultar_pedido(datos["pedido_id"])

    except pybreaker.CircuitBreakerError:
        return jsonify({"mensaje": "Circuito abierto: El servicio de pedidos no está disponible"}), 503

    except requests.exceptions.Timeout:
        return jsonify({"mensaje": "El servicio de pedidos tardó demasiado en responder"}), 504

    except requests.exceptions.ConnectionError:
        return jsonify({"mensaje": "El servicio de pedidos no está disponible"}), 503

    except requests.exceptions.RequestException:
        return jsonify({"mensaje": "Error al consultar el pedido"}), 502

    if respuesta_pedido.status_code == 404:
        return jsonify({"mensaje": "Pedido no encontrado"}), 404

    if respuesta_pedido.status_code != 200:
        return jsonify({"mensaje": "Error al consultar el pedido"}), 502

    conexion = conectar()
    cursor = conexion.cursor()

    sql = """
        INSERT INTO pagos
        (pedido_id, metodo_pago, estado)
        VALUES (%s, %s, %s)
    """
    valores = (
        datos["pedido_id"],
        metodo_pago,
        "pendiente"
    )

    cursor.execute(sql, valores)
    conexion.commit()

    nuevoId = cursor.lastrowid

    cursor.close()
    conexion.close()

    return jsonify({
        "mensaje": "Pago registrado correctamente",
        "id": nuevoId,
        "pedido_id": datos["pedido_id"],
        "metodo_pago": metodo_pago,
        "estado": "pendiente"
    }), 201


@app.route("/api/pagos/<int:id>", methods=["PUT"])
def actualizar(id):
    datos = request.get_json(silent=True)

    if not datos or "estado" not in datos:
        return jsonify({
            "mensaje": "Debe ingresar el estado del pago"
        }), 400

    conexion = conectar()
    cursor = conexion.cursor()

    sql = """
        UPDATE pagos
        SET estado = %s
        WHERE id = %s
    """

    cursor.execute(sql, (datos["estado"], id))
    conexion.commit()

    if cursor.rowcount == 0:
        cursor.close()
        conexion.close()
        return jsonify({"mensaje": "Pago no encontrado"}), 404

    cursor.close()
    conexion.close()

    return jsonify({
        "mensaje": "Estado actualizado correctamente",
        "id": id
    })


@app.route("/api/pagos/<int:id>", methods=["DELETE"])
def eliminar(id):
    conexion = conectar()
    cursor = conexion.cursor()

    cursor.execute("DELETE FROM pagos WHERE id = %s", (id,))
    conexion.commit()
    filas = cursor.rowcount

    cursor.close()
    conexion.close()

    if filas == 0:
        return jsonify({"mensaje": "Pago no encontrado"}), 404

    return jsonify({"mensaje": "Pago eliminado"})


@app.route("/api/pagos/circuito/pedidos", methods=["GET"])
def estado_circuito_pedidos():
    return jsonify({
        "servicio": "pedidos",
        "estado": circuito_pedidos.current_state.upper(),
        "fallos_consecutivos": circuito_pedidos.fail_counter,
        "umbral_fallos": circuito_pedidos.fail_max,
        "periodo_recuperacion": circuito_pedidos.reset_timeout
    }), 200


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)