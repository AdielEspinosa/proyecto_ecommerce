from flask import Flask, jsonify
from database import conectar

app = Flask(__name__)

@app.route("/usuarios", methods=["GET"])
def listar():
    conexion = conectar()
    cursor = conexion.cursor(dictionary=True)
    cursor.execute("SELECT * FROM usuarios")
    usuarios = cursor.fetchall()

    cursor.close()
    conexion.close()

    return jsonify(usuarios)

@app.route("/api/usuarios/<int:id>")
def buscar(id):
    conexion = conectar()
    cursor = conexion.cursor(dictionary=True)
    cursor.execute("SELECT * FROM usuarios WHERE id = %s", (id,))
    usuario = cursor.fetchone()
    cursor.close()
    conexion.close()
    if usuario is None:
        return jsonify({"mensaje": "Usuario no encontrado"}), 404
    return jsonify(usuario)

@app.route("/api/usuarios", methods=["POST"])
def crear():
    datos = request.json

    conexion = conectar()
    cursor = conexion.cursor()

    sql = """
        INSERT INTO usuarios
        (nombre, apellidos, correo, telefono, direccion, rol)
        VALUES (%s, %s, %s, %s, %s, %s)
    """
    valores = (
        datos["nombre"],
        datos["apellidos"],
        datos["correo"],
        datos["telefono"],
        datos["direccion"],
        datos["rol"]
    )
    cursor.execute(sql, valores)
    conexion.commit()
    cursor.close()
    conexion.close()
    return jsonify({"mensaje": "Usuario creado"})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)