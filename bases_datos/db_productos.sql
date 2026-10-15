USE db_productos;


CREATE TABLE IF NOT EXISTS productos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    tamanio VARCHAR(50) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10, 2) NOT NULL,
    disponible BOOLEAN DEFAULT TRUE
);


INSERT INTO productos (nombre, tamanio, descripcion, precio, disponible) VALUES
('Pizza Pepperoni', 'Personal', 'Salsa de tomate, queso mozzarella y abundante pepperoni', 8.50, TRUE),
('Pizza Pepperoni', 'Mediana', 'Salsa de tomate, queso mozzarella y abundante pepperoni', 12.99, TRUE),
('Pizza Pepperoni', 'Familiar', 'Salsa de tomate, queso mozzarella y abundante pepperoni', 17.50, TRUE),

('Pizza Hawaiana', 'Personal', 'Salsa de tomate, queso mozzarella, jamón dulce y piña', 9.00, TRUE),
('Pizza Hawaiana', 'Mediana', 'Salsa de tomate, queso mozzarella, jamón dulce y piña', 13.50, TRUE),
('Pizza Hawaiana', 'Familiar', 'Salsa de tomate, queso mozzarella, jamón dulce y piña', 18.00, TRUE),

('Pizza Cuatro Quesos', 'Personal', 'Mezcla de queso mozzarella, parmesano, gouda y queso azul', 14.50, TRUE),
('Pizza Cuatro Quesos', 'Mediana', 'Mezcla de queso mozzarella, parmesano, gouda y queso azul', 14.50, TRUE),
('Pizza Cuatro Quesos', 'Familiar', 'Mezcla de queso mozzarella, parmesano, gouda y queso azul', 14.50, TRUE),

('Pizza Carnes Especial', 'Personal', 'Salsa BBQ, mozzarella, pepperoni, carne molida, jamón y tocino', 19.99, TRUE),
('Pizza Carnes Especial', 'Mediana', 'Salsa BBQ, mozzarella, pepperoni, carne molida, jamón y tocino', 19.99, TRUE),
('Pizza Carnes Especial', 'Familiar', 'Salsa BBQ, mozzarella, pepperoni, carne molida, jamón y tocino', 19.99, TRUE),

('Pizza Vegetariana', 'Personal', 'Salsa de tomate, mozzarella, champiñones, pimentón y aceitunas', 12.00, FALSE),
('Pizza Vegetariana', 'Mediana', 'Salsa de tomate, mozzarella, champiñones, pimentón y aceitunas', 12.00, FALSE),
('Pizza Vegetariana', 'Familiar', 'Salsa de tomate, mozzarella, champiñones, pimentón y aceitunas', 12.00, FALSE);