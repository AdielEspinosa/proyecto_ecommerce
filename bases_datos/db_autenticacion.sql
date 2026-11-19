CREATE DATABASE IF NOT EXISTS db_autenticacion;

USE db_autenticacion;

CREATE TABLE IF NOT EXISTS credenciales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    nombre_usuario VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL
);

INSERT INTO credenciales
(usuario_id, nombre_usuario, password)
VALUES
(1, 'laura.gomez', '123456'),
(2, 'carlos.martinez', '123456'),
(3, 'sofia.ramirez', '123456'),
(4, 'andres.perez', '123456'),
(5, 'valentina.lopez', '123456'),
(6, 'juan.rodriguez', '123456'),
(7, 'camila.torres', '123456'),
(8, 'daniel.castro', '123456');

