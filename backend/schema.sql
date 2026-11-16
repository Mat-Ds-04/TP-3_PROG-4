CREATE DATABASE IF NOT EXISTS transporte_tp3;
USE transporte_tp3;

CREATE TABLE IF NOT EXISTS usuarios (
  id INT NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  contrasena VARCHAR(255) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY email (email)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS vehiculos (
  id INT NOT NULL AUTO_INCREMENT,
  marca VARCHAR(100) NOT NULL,
  modelo VARCHAR(100) NOT NULL,
  patente VARCHAR(20) NOT NULL,
  anio INT NOT NULL,
  capacidad_carga DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY patente (patente)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS conductores (
  id INT NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  numero_documento VARCHAR(30) NOT NULL,
  numero_licencia VARCHAR(30) NOT NULL,
  fecha_alta_licencia DATE NOT NULL,
  fecha_vencimiento_licencia DATE NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY numero_documento (numero_documento),
  UNIQUE KEY numero_licencia (numero_licencia)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS viajes (
  id INT NOT NULL AUTO_INCREMENT,
  vehiculo_id INT NOT NULL,
  conductor_id INT NOT NULL,
  fecha_salida DATETIME NOT NULL,
  fecha_llegada DATETIME NULL,
  origen VARCHAR(150) NOT NULL,
  destino VARCHAR(150) NOT NULL,
  kilometros DECIMAL(10,2) NOT NULL,
  observaciones TEXT NULL,
  PRIMARY KEY (id),
  KEY fk_viajes_vehiculo (vehiculo_id),
  KEY fk_viajes_conductor (conductor_id),
  CONSTRAINT fk_viajes_vehiculo FOREIGN KEY (vehiculo_id) REFERENCES vehiculos (id),
  CONSTRAINT fk_viajes_conductor FOREIGN KEY (conductor_id) REFERENCES conductores (id)
) ENGINE=InnoDB;
