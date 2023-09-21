import { Request, Response } from "express";
require('dotenv').config();
import { AppDataSource } from "./config/db";
import routes from "./routes/routes";
import swaggerSpec1 from "./Swagger/swaggerConfig";
import bodyParser from "body-parser";
import { test, watchGmailInbox } from "./Controller/emailProcessingController";
const { PubSub } = require('@google-cloud/pubsub');
console.log(process.env.GOOGLE_CLOUD_PROJECT, 'll');
const keyFilename = 'src/config/client.json'; // Replace with the actual path
const pubsub = new PubSub({ keyFilename });

console.log(pubsub, 'pubsub');
const subscriptionName = 'projects/login-with-goggle-398805/topics/email-process'; // Replace with your subscription name

// Create an event handler to process incoming messages
export const messageHandler = (message: any) => {
    const data = JSON.parse(message.data.toString());
    console.log('Received a Gmail notification:', data);

    // Trigger your API here based on the notification content
    test()
    message.ack(); // Acknowledge the message to remove it from the queue
};
const subscription = pubsub.subscription(subscriptionName);

console.log('Listening for Gmail notifications...');
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
        subscription.on('error', (error: any) => {
            console.error('Pub/Sub Error:', error);
        });

        subscription.on('message', messageHandler);
        console.log(`Server listening on port http://localhost:${port}`)
    })

}).catch((error) => {
    console.log('Database Connection Failed : ', error)
})
