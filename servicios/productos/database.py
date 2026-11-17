import mysql.connector
import os

def conectar():
    return mysql.connector.connect(
        host=os.getenv("PRODUCTOS_DB_HOST"),
        user=os.getenv("PRODUCTOS_DB_USER"),
        password=os.getenv("PRODUCTOS_DB_PASSWORD"),
        database=os.getenv("PRODUCTOS_DB_NAME"),
        port=int(os.getenv("DB_PORT", 3306))
    )