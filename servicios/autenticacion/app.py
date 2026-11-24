from flask import Flask, jsonify, request
import requests, os, pybreaker
from database import conectar

app = Flask(__name__)

usuarios_url = os.getenv("USUARIOS_URL")
tiempo_maximo_usuarios = float(os.getenv("USUARIOS_TIMEOUT", "5"))

roles_validos = ["cliente", "operador", "administrador"]

circuito_usuarios = pybreaker.CircuitBreaker(
    fail_max=int(os.getenv("CB_MAX_FALLOS", "3")),
    reset_timeout=int(os.getenv("CB_RECUPERACION", "20")),
    throw_new_error_on_trip=False
)


def llamar_usuarios(metodo, ruta, datos=None):
    with circuito_usuarios.calling():
        respuesta = requests.request(
            metodo,
            f"{usuarios_url}{ruta}",
            json=datos,
            timeout=tiempo_maximo_usuarios
        )
        if respuesta.status_code >= 500:
            respuesta.raise_for_status()
    return respuesta


def revertir_usuario(usuario_id):
    try:
        respuesta = llamar_usuarios("DELETE", f"/api/usuarios/{usuario_id}")
        return respuesta.status_code in (200, 404)
    except Exception:
        return False


def guardar_credenciales(usuario_id, nombre_usuario, password):
    conexion = conectar()
    cursor = conexion.cursor()

    cursor.execute(
        """
        INSERT INTO credenciales (usuario_id, nombre_usuario, password)
        VALUES (%s, %s, %s)
        """,
        (usuario_id, nombre_usuario, password)
    )

    conexion.commit()
    nuevo_id = cursor.lastrowid

    cursor.close()
    conexion.close()

    return nuevo_id


def buscar_por_nombre_usuario(nombre_usuario):
    conexion = conectar()
    cursor = conexion.cursor(dictionary=True)

    cursor.execute(
        "SELECT id, usuario_id, nombre_usuario FROM credenciales WHERE nombre_usuario = %s",
        (nombre_usuario,)
    )

    credencial = cursor.fetchone()

    cursor.close()
    conexion.close()

    return credencial


def consultar_credenciales(nombre_usuario, password):
    conexion = conectar()
    cursor = conexion.cursor(dictionary=True)

    cursor.execute(
        """
        SELECT id, usuario_id, nombre_usuario
        FROM credenciales
        WHERE nombre_usuario = %s AND password = %s
        """,
        (nombre_usuario, password)
    )

    credencial = cursor.fetchone()

    cursor.close()
    conexion.close()

    return credencial


@app.route("/api/autenticacion/registro", methods=["POST"])
def registrar():
    datos = request.get_json(silent=True) or {}

    obligatorios = ["nombre", "apellidos", "correo", "direccion", "nombre_usuario", "password"]

    faltantes = [
        campo for campo in obligatorios
        if not str(datos.get(campo) or "").strip()
    ]

    if faltantes:
        return jsonify({
            "mensaje": "Faltan campos obligatorios: " + ", ".join(faltantes)
        }), 400

    rol = datos.get("rol") or "cliente"

    if rol not in roles_validos:
        return jsonify({
            "mensaje": "Rol no válido. Use: " + ", ".join(roles_validos)
        }), 400

    nombre_usuario = str(datos["nombre_usuario"]).strip()
    password = str(datos["password"])

    try:
        if buscar_por_nombre_usuario(nombre_usuario):
            return jsonify({"mensaje": "El nombre de usuario ya está registrado"}), 409
    except Exception:
        return jsonify({"mensaje": "No fue posible consultar la base de datos de autenticación"}), 503

    perfil = {
        "nombre": str(datos["nombre"]).strip(),
        "apellidos": str(datos["apellidos"]).strip(),
        "correo": str(datos["correo"]).strip(),
        "telefono": str(datos.get("telefono") or "").strip(),
        "direccion": str(datos["direccion"]).strip(),
        "rol": rol
    }

    try:
        respuesta_usuario = llamar_usuarios("POST", "/api/usuarios", perfil)
    except pybreaker.CircuitBreakerError:
        return jsonify({"mensaje": "Circuito abierto: el servicio de usuarios no está disponible"}), 503
    except requests.exceptions.Timeout:
        return jsonify({"mensaje": "El servicio de usuarios tardó demasiado en responder"}), 504
    except requests.exceptions.ConnectionError:
        return jsonify({"mensaje": "El servicio de usuarios no está disponible"}), 503
    except requests.exceptions.RequestException:
        return jsonify({"mensaje": "Error al comunicarse con el servicio de usuarios"}), 502

    if respuesta_usuario.status_code == 409:
        return jsonify({"mensaje": "El correo ya está registrado"}), 409

    if respuesta_usuario.status_code != 201:
        return jsonify({"mensaje": "El servicio de usuarios no pudo crear el perfil"}), 502

    usuario_id = respuesta_usuario.json()["id"]

    try:
        credencial_id = guardar_credenciales(usuario_id, nombre_usuario, password)
    except Exception:
        if revertir_usuario(usuario_id):
            return jsonify({
                "mensaje": "No se pudieron guardar las credenciales. Se revirtió la creación del usuario"
            }), 500

        return jsonify({
            "mensaje": f"No se pudieron guardar las credenciales ni revertir el usuario #{usuario_id}"
        }), 500

    return jsonify({
        "mensaje": "Cuenta registrada correctamente",
        "id": credencial_id,
        "usuario_id": usuario_id,
        "nombre_usuario": nombre_usuario,
        "rol": rol
    }), 201


@app.route("/api/autenticacion/login", methods=["POST"])
def iniciar_sesion():
    datos = request.get_json(silent=True) or {}

    if not datos.get("nombre_usuario") or not datos.get("password"):
        return jsonify({
            "mensaje": "Nombre de usuario y contraseña son obligatorios"
        }), 400

    try:
        credencial = consultar_credenciales(
            str(datos["nombre_usuario"]).strip(),
            str(datos["password"])
        )
    except Exception:
        return jsonify({"mensaje": "No fue posible consultar las credenciales"}), 503

    if credencial is None:
        return jsonify({"mensaje": "Nombre de usuario o contraseña incorrectos"}), 401

    usuario = {
        "usuario_id": credencial["usuario_id"],
        "nombre_usuario": credencial["nombre_usuario"]
    }

    try:
        respuesta_usuario = llamar_usuarios(
            "GET",
            f"/api/usuarios/{credencial['usuario_id']}"
        )
    except Exception:
        respuesta_usuario = None

    if respuesta_usuario is not None and respuesta_usuario.status_code == 404:
        return jsonify({"mensaje": "La cuenta ya no tiene un usuario asociado"}), 401

    if respuesta_usuario is None or respuesta_usuario.status_code != 200:
        usuario.update({
            "nombre": credencial["nombre_usuario"],
            "apellidos": "",
            "correo": "",
            "direccion": "",
            "rol": "cliente",
            "perfil_completo": False
        })

        return jsonify({
            "mensaje": "Sesión iniciada con perfil limitado: el servicio de usuarios no está disponible",
            "usuario": usuario
        }), 200

    perfil = respuesta_usuario.json()

    usuario.update({
        "nombre": perfil.get("nombre"),
        "apellidos": perfil.get("apellidos"),
        "correo": perfil.get("correo"),
        "telefono": perfil.get("telefono"),
        "direccion": perfil.get("direccion"),
        "rol": perfil.get("rol"),
        "perfil_completo": True
    })

    return jsonify({
        "mensaje": "Inicio de sesión exitoso",
        "usuario": usuario
    }), 200


@app.route("/api/autenticacion/circuito/usuarios", methods=["GET"])
def estado_circuito_usuarios():
    return jsonify({
        "servicio": "usuarios",
        "estado": circuito_usuarios.current_state.upper(),
        "fallos_consecutivos": circuito_usuarios.fail_counter,
        "umbral_fallos": circuito_usuarios.fail_max,
        "periodo_recuperacion": circuito_usuarios.reset_timeout
    }), 200


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)