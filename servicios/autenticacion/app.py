from flask import Flask, jsonify, request
import requests, os, mysql.connector, pybreaker
from database import conectar

app = Flask(__name__)

usuarios_url = os.getenv("USUARIOS_URL")

circuito_autenticacion = pybreaker.CircuitBreaker(
    fail_max=int(os.getenv("CB_MAX_FALLOS", "3")),
    reset_timeout=int(os.getenv("CB_RECUPERACION", "20")),
    throw_new_error_on_trip=False
)

def guardar_credenciales(usuario_id, nombre_usuario, password):
    conexion = conectar()
    cursor = conexion.cursor()

    sql = """
        INSERT INTO credenciales (usuario_id, nombre_usuario, password)
        VALUES (%s, %s, %s)
    """

    cursor.execute(sql, (usuario_id, nombre_usuario, password))
    conexion.commit()

    nuevo_id = cursor.lastrowid

    cursor.close()
    conexion.close()

    return nuevo_id


def consultar_credenciales(nombre_usuario, password):
    conexion = conectar()
    cursor = conexion.cursor(dictionary=True)

    sql = """
        SELECT id, usuario_id, nombre_usuario
        FROM credenciales
        WHERE nombre_usuario = %s AND password = %s
    """

    cursor.execute(sql, (nombre_usuario, password))
    credencial = cursor.fetchone()

    cursor.close()
    conexion.close()

    return credencial


@app.route("/api/autenticacion/registro", methods=["POST"])
def registrar():
    datos = request.json

    if not datos or not datos.get("usuario_id") or not datos.get("nombre_usuario") or not datos.get("password"):
        return jsonify({"mensaje": "Todos los campos son obligatorios"}), 400

    tiempo_maximo_usuarios = float(os.getenv("USUARIOS_TIMEOUT", "2"))

    
    try:
        respuesta_usuario = requests.get(
            f"{usuarios_url}/api/usuarios/{datos['usuario_id']}",
            timeout=tiempo_maximo_usuarios
        )

    except requests.exceptions.ConnectionError:
        return jsonify({"mensaje": "El servicio de usuarios no está disponible"}), 503

    except requests.exceptions.Timeout:
        return jsonify({"mensaje": "El servicio de usuarios tardó demasiado en responder"}), 504

    if respuesta_usuario.status_code == 404:
        return jsonify({"mensaje": "Usuario no encontrado"}), 404

    if respuesta_usuario.status_code != 200:
        return jsonify({"mensaje": "Error al consultar el usuario"}), 502

    # Guardar las credenciales en la base de datos de Autenticación
    try:
        with circuito_autenticacion.calling():
            credencial_id = guardar_credenciales(
                datos["usuario_id"],
                datos["nombre_usuario"],
                datos["password"]
            )

    except pybreaker.CircuitBreakerError:
        return jsonify({"mensaje": "Circuito abierto: el servicio de autenticacion no está disponible"}), 503

    except mysql.connector.Error:
        return jsonify({"mensaje": "No fue posible guardar las credenciales"}), 503

    if credencial_id is None:
        return jsonify({"mensaje": "El nombre de usuario ya está registrado"}), 409

    return jsonify({
        "mensaje": "Credenciales registradas",
        "id": credencial_id
    }), 201


@app.route("/api/autenticacion/login", methods=["POST"])
def iniciar_sesion():
    datos = request.json

    if not datos or not datos.get("nombre_usuario") or not datos.get("password"):
        return jsonify({"mensaje": "Nombre de usuario y contraseña son obligatorios"}), 400

    try:
        with circuito_autenticacion.calling():
            credencial = consultar_credenciales(
                datos["nombre_usuario"],
                datos["password"]
            )

    except pybreaker.CircuitBreakerError:
        return jsonify({"mensaje": "Circuito abierto: el servicio de autenticacion no está disponible"}), 503

    except mysql.connector.Error:
        return jsonify({"mensaje": "No fue posible consultar las credenciales"}), 503

    if credencial is None:
        return jsonify({"mensaje": "Nombre de usuario o contraseña incorrectos"}), 401

    return jsonify({
        "mensaje": "Inicio de sesión exitoso",
        "usuario_id": credencial["usuario_id"],
        "nombre_usuario": credencial["nombre_usuario"]
    }), 200


@app.route("/api/autenticacion/circuito", methods=["GET"])
def estado_circuito():
    return jsonify({
        "servicio": "autenticacion",
        "estado": circuito_autenticacion.current_state.upper(),
        "fallos_consecutivos": circuito_autenticacion.fail_counter,
        "umbral_fallos": circuito_autenticacion.fail_max,
        "periodo_recuperacion": circuito_autenticacion.reset_timeout
    }), 200


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)