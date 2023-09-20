import { Request, Response } from "express";
import { AppDataSource } from "./config/db";
import routes from "./routes/routes";
import swaggerSpec1 from "./Swagger/swaggerConfig";
import bodyParser from "body-parser";
import { watchGmailInbox } from "./Controller/emailProcessingController";

const express = require('express');
const app = express();
const port = 3002;

const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
// Middlewares
/* To handle invalid JSON data request */
app.use(bodyParser.json({ limit: '50mb' }));

/* For parsing urlencoded data */
app.use(bodyParser.urlencoded({ extended: false }))

app.use('/', routes) //main route

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec1));


AppDataSource.initialize().then(() => {
    console.log("Connected to Postgres Database")

    app.listen(port, () => {
        watchGmailInbox()
        console.log(`Server listening on port http://localhost:${port}`)
    })

}).catch((error) => {
    console.log('Database Connection Failed : ', error)
})
