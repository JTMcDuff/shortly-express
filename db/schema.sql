-- Schema for users table.
-- Has id as primary key, username, password.

DROP TABLE IF EXISTS `users`;

CREATE TABLE `users` (
  `username` VARCHAR(100) NOT NULL,
  `password` VARCHAR(200) NOT NULL,
  PRIMARY KEY (`username`)
);
