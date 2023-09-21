import "reflect-metadata"
import { DataSource } from 'typeorm'
import { ExcelData } from "../entities/excelData";

const path = require("path");
console.log(path.join(__dirname, "../", `src/entities/*{.ts,.js}`));

export const AppDataSource = new DataSource({
    type: "postgres",
    host: "localhost",
    port: 5432,
    username: "postgres",
    password: 'new_password',
    database: "swagger_demo",
    synchronize: true,
    logging: false,
    migrations: [path.join(__dirname, "../", `src/migrations/*{.ts,.js}`)],
    migrationsTableName: "migrations",
    entities: [ExcelData],
    // entities: [path.join(__dirname, "../", `src/entities/*{.ts,.js}`)],


})


// typeorm migration:create ./src/migration/NicheEntity





