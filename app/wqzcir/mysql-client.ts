import mysql, { ConnectionOptions } from "mysql2";

export const mysqlOption: ConnectionOptions = {
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  database: process.env.MYSQL_DB,
  password: process.env.MYSQL_PWD,
  port: parseInt(process.env.MYSQL_PORT ?? "3306"),
  charset: "utf8mb4",
  debug: process.env.NODE_ENV !== "production",
};

// create the pool
export const pool = mysql.createPool(mysqlOption);
// now get a Promise wrapped instance of that pool
export const promisePool = pool.promise();
