import { Request, Response } from "express";
require('dotenv').config();
import { AppDataSource } from "./config/db";
import routes from "./routes/routes";
import swaggerSpec1 from "./Swagger/swaggerConfig";
import bodyParser from "body-parser";
import { watchGmailInbox } from "./Controller/emailProcessingController";
const { google } = require('googleapis');
const { PubSub } = require('@google-cloud/pubsub');
const express = require('express');
const app = express();
const port = 3002;
const SCOPES = ['https://www.googleapis.com/auth/gmail'];
const PROJECT_ID = 'login-with-goggle-398805';
const TOPIC_NAME = 'projects/login-with-goggle-398805/topics/email-process-demo1';
const SUBSCRIPTION_NAME = 'projects/login-with-goggle-398805/subscriptions/email-process-sub-demo1';
const fs = require('fs');
const credentials = JSON.parse(fs.readFileSync('src/config/client.json'));
const { OAuth2Client } = require('google-auth-library');
const { client_id, client_secret, redirect_uris } = credentials.web;
const oAuth2Client = new OAuth2Client(client_id, client_secret, redirect_uris[0]);

const REFRESH_TOKEN = "1//04NSGwowVQIUJCgYIARAAGAQSNwF-L9IriO51tYS3QVxBW4X37QPKpbuoRl52MR4Y6l5UwA7-1pxOYqkIMhV0kNA_K6FtCl-0ZbQ"

oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

app.use(bodyParser.json({ limit: '50mb' }));

/* For parsing urlencoded data */
app.use(bodyParser.urlencoded({ extended: false }))

app.use('/', routes) //main route

async function watchGmail() {
    // Set up the Gmail API client
    // const auth = await authorize();
    console.log('1');
    const gmail = google.gmail({ version: 'v1', oAuth2Client });
    console.log('2');

    // Create a Pub/Sub client
    const pubsub: any = new PubSub({ keyFilename: 'src/config/client2.json' });

    console.log('25', pubsub);
    // Create a Pub/Sub topic
    // const [topic] = await pubsub.createTopic(`${TOPIC_NAME}`);
    // console.log('3');

    // // Create a Pub/Sub subscription
    // await topic.createSubscription(SUBSCRIPTION_NAME);
    // console.log('4');

    // Watch the Gmail inbox
    // const res = await gmail.users.watch({
    //     userId: 'me',
    //     resource: {
    //         'labelIds': ['INBOX'],
    //         topicName: `projects/${PROJECT_ID}/topics/${TOPIC_NAME}`,
    //     },
    // });
    const res = await gmail.users.watch({
        userId: 'me',
        requestBody: {
            'labelIds': ['INBOX'],
            topicName: "projects/login-with-goggle-398805/topics/email-process"
        },
    });
    console.log('Gmail watch response:', res.data);
}


AppDataSource.initialize().then(() => {
    console.log("Connected to Postgres Database")

    app.listen(port, async () => {
        await watchGmailInbox()
        console.log(`Server listening on port http://localhost:${port}`)
    })

}).catch((error) => {
    console.log('Database Connection Failed : ', error)
})
