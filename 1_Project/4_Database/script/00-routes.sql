CREATE TABLE IF NOT EXISTS `y-toledo`.`routes` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `date` DATE NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `start_point` VARCHAR(100) NOT NULL,
  `description` TEXT,
  `distance_km` DECIMAL(5,2) NOT NULL,
  `elevation_gain` INT(11) NOT NULL,
  `max_height` INT(11) NOT NULL,
  `min_height` INT(11) NOT NULL,
  `estimated_duration_hours` INT(2) NOT NULL,
  `estimated_duration_minutes` INT(2) NOT NULL,
  `type` TINYINT(1) NOT NULL,
  `difficulty` VARCHAR(50) NOT NULL,
  `sign_up_link` VARCHAR(255),
  `wikiloc_link` VARCHAR(255),
  `wikiloc_map_link` VARCHAR(255),
  `user_id` INT(11) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `fk_routes_users_idx` (`user_id` ASC),
  CONSTRAINT `fk_routes_users`
    FOREIGN KEY (`user_id`)
    REFERENCES `y-toledo`.`users` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8;


INSERT INTO `y-toledo`.`permissions` (`id`, `name`, `detail`) VALUES (DEFAULT, 'permission_routes_manager', 'Gestión de rutas');
INSERT INTO `y-toledo`.`permissions` (`id`, `name`, `detail`) VALUES (DEFAULT, 'permission_public_access', 'Acceso público');

INSERT INTO `y-toledo`.`role_has_permission` (`permissions_id`, `roles_id`, `reading`, `writing`) VALUES ('4', '1', '1', '1');
INSERT INTO `y-toledo`.`role_has_permission` (`permissions_id`, `roles_id`, `reading`, `writing`) VALUES ('5', '1', '1', '1');
INSERT INTO `y-toledo`.`role_has_permission` (`permissions_id`, `roles_id`, `reading`, `writing`) VALUES ('5', '2', '2', '2');
INSERT INTO `y-toledo`.`role_has_permission` (`permissions_id`, `roles_id`, `reading`, `writing`) VALUES ('5', '3', '3', '3');
