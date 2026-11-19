from flask import Flask, jsonify, Response, request
import os
import requests

app = Flask(__name__)

USUARIOS_URL = os.getenv("USUARIOS_URL", "http://usuarios:5000")
PRODUCTOS_URL = os.getenv("PRODUCTOS_URL", "http://productos:5000")
PEDIDOS_URL = os.getenv("PEDIDOS_URL", "http://pedidos:5000")
AUTENTICACION_URL = os.getenv("AUTENTICACION_URL", "http://autenticacion:5000")
PAGOS_URL = os.getenv("PAGOS_URL", "http://pagos:5000")


def reenviar(metodo, url):
    try:
        respuesta = requests.request(
            metodo,
            url,
            params=request.args,
            json=request.get_json(silent=True),
            timeout=5
        )

        return Response(
            respuesta.content,
            status=respuesta.status_code,
            content_type=respuesta.headers.get("Content-Type", "application/json")
        )

    except requests.exceptions.Timeout:
        return jsonify({
            "mensaje": "El servicio tardó mucho en responder"
        }), 504

    except requests.exceptions.ConnectionError:
        return jsonify({
            "mensaje": "El servicio no está disponible"
        }), 503



@app.route("/api/usuarios-list", methods=["GET"])
def listar_usuarios():
    return reenviar(request.method, USUARIOS_URL + "/usuarios")


@app.route("/api/usuarios", methods=["POST"])
def crear_usuario():
    return reenviar(request.method, USUARIOS_URL + "/api/usuarios")


@app.route("/api/usuarios/<int:id>", methods=["GET", "PUT", "PATCH", "DELETE"])
def ruta_usuarios(id):
    return reenviar(request.method, USUARIOS_URL + "/api/usuarios/" + str(id))



@app.route("/api/productos-list", methods=["GET"])
def listar_productos():
    return reenviar(request.method, PRODUCTOS_URL + "/productos")


@app.route("/api/productos", methods=["POST"])
def crear_producto():
    return reenviar(request.method, PRODUCTOS_URL + "/productos")


@app.route("/api/productos/<int:id>", methods=["GET", "PUT", "DELETE"])
def ruta_productos(id):
    return reenviar(request.method, PRODUCTOS_URL + "/productos/" + str(id))


@app.route("/api/productos/<int:id>/disponibilidad", methods=["PATCH"])
def actualizar_disponibilidad(id):
    return reenviar(request.method, PRODUCTOS_URL + "/productos/" + str(id) + "/disponibilidad")



@app.route("/api/pedidos", methods=["GET", "POST"])
def ruta_pedidos():
    return reenviar(request.method, PEDIDOS_URL + "/api/pedidos")


@app.route("/api/pedidos/<int:id>", methods=["GET", "PATCH", "DELETE"])
def ruta_pedido(id):
    return reenviar(request.method, PEDIDOS_URL + "/api/pedidos/" + str(id))


@app.route("/api/pedidos/<int:id>/estado", methods=["PUT"])
def actualizar_estado_pedido(id):
    return reenviar(request.method, PEDIDOS_URL + "/api/pedidos/" + str(id) + "/estado")


@app.route("/api/pedidos/circuito/usuarios", methods=["GET"])
def circuito_usuarios():
    return reenviar(request.method, PEDIDOS_URL + "/api/pedidos/circuito/usuarios")


@app.route("/api/pedidos/circuito/productos", methods=["GET"])
def circuito_productos():
    return reenviar(request.method, PEDIDOS_URL + "/api/pedidos/circuito/productos")



@app.route("/api/autenticacion/registro", methods=["POST"])
def registrar():
    return reenviar(request.method, AUTENTICACION_URL + "/api/autenticacion/registro")


@app.route("/api/autenticacion/login", methods=["POST"])
def iniciar_sesion():
    return reenviar(request.method, AUTENTICACION_URL + "/api/autenticacion/login")


@app.route("/api/autenticacion/circuito", methods=["GET"])
def circuito_autenticacion():
    return reenviar(request.method, AUTENTICACION_URL + "/api/autenticacion/circuito")



@app.route("/api/pagos", methods=["GET", "POST"])
def ruta_pagos():
    return reenviar(request.method, PAGOS_URL + "/api/pagos")


@app.route("/api/pagos/<int:id>", methods=["GET", "PUT", "DELETE"])
def ruta_pago(id):
    return reenviar(request.method, PAGOS_URL + "/api/pagos/" + str(id))


@app.route("/api/pagos/circuito/pedidos", methods=["GET"])
def circuito_pedidos():
    return reenviar(request.method, PAGOS_URL + "/api/pagos/circuito/pedidos")



if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)