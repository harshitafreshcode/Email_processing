import { Request, Response } from "express";
import { ErrorResponse, successResponse } from "../helpers/apiResponse";
import { addExcelData } from "../model/email.model";
const xlsx = require('xlsx');

const { google } = require('googleapis');
const { OAuth2Client } = require('google-auth-library');
const fs = require('fs');

export const insertExceldata = (req: Request, res: Response): any => {
    try {
        const { attachment } = req.body

        console.log(attachment, 'attachment');
        const workbook = xlsx.read(attachment, { type: 'buffer' });

        // Assuming there's only one sheet in the Excel file
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        // Convert the sheet data to an array of objects (assuming headers in the first row)
        const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

        // 'data' is now an array of objects representing the Excel data
        console.log(data);
        // return data;
        return successResponse(res, "Data Added Successfully", data);



        // addExcelData(data, (err: any, data: any) => {
        //     if (err) {
        //         return ErrorResponse(res, err);
        //     } else {
        //         return successResponse(res, "Data Added Successfully", data);
        //     }
        // });
    } catch (e) {
        ErrorResponse(res, e);
    }
};


// Load client secrets from your JSON file
const credentials = JSON.parse(fs.readFileSync('src/config/client.json'));

// Set up OAuth2Client
const { client_id, client_secret, redirect_uris } = credentials.web;
const oAuth2Client = new OAuth2Client(client_id, client_secret, redirect_uris[0]);

// Authorize the client with your credentials
// async function authorize() {
//     // const authUrl = oAuth2Client.generateAuthUrl({
//     //     access_type: 'offline',
//     //     scope: ['https://www.googleapis.com/auth/gmail.readonly'],
//     // });

//     // console.log('Authorize this app by visiting this URL:', authUrl);
//     const code = "4/0AfJohXm1h9lPQekHKcGgoTiXxopSvnxl28993d63UwsHWwJ8co9iiqD7y6IVgL551Wi5UA"

//     const token = await oAuth2Client.getToken(code);
//     console.log(token, 'token');
//     oAuth2Client.setCredentials(token);
// }

const REFRESH_TOKEN = "1//04NSGwowVQIUJCgYIARAAGAQSNwF-L9IriO51tYS3QVxBW4X37QPKpbuoRl52MR4Y6l5UwA7-1pxOYqkIMhV0kNA_K6FtCl-0ZbQ"
// const oAuth2Client = new google.auth.OAuth2(
//     process.env.CLIENT_ID,
//     process.env.CLIENT_SECRET,
//     process.env.REDIRECT_URI
// );
console.log('2');

oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });




// List messages matching a specific query
async function listMessages(query: any) {
    console.log('1', query);
    const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });
    const response = await gmail.users.messages.list({
        userId: 'me',
        q: query,
    });
    console.log(response.data.messages, 'response.data.messages');
    return response.data.messages;
}

// Get a message by its ID
async function getMessage(messageId: any) {
    const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });
    const response = await gmail.users.messages.get({
        userId: 'me',
        id: messageId,
    });

    return response.data;
}

// Download email attachments
async function downloadAttachments(message: any) {
    const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });
    const parts = message.payload.parts;

    if (!parts) {
        console.log('No attachments found in this email.');
        return;
    }

    return parts

    //   for (const part of parts) {
    //     if (part.filename && part.filename.length > 0) {
    //       const attachment = await gmail.users.messages.attachments.get({
    //         userId: 'me',
    //         messageId: message.id,
    //         id: part.body.attachmentId,
    //       });

    //       const data = attachment.data;
    //       const fileData = Buffer.from(data, 'base64');
    //       fs.writeFileSync(part.filename, fileData);
    //       console.log(`Attachment "${part.filename}" downloaded.`);
    //     }
    //   }
}


export const authForEmail = async (req: Request, res: Response) => {
    try {

        // await authorize();
        const query = 'subject:"hr@freshcodes.in';
        const messages = await listMessages(query);

        if (messages.length === 0) {
            console.log('No emails found.');
            return;
        }

        const messageId = messages[0].id;
        const message = await getMessage(messageId);

        console.log('Email Subject:', message.subject);
        console.log('Email Body:', message.snippet);

        const parts = await downloadAttachments(message);

        return successResponse(res, "Data Get Successfully", parts);

    } catch (e) {
        console.log(e, 'error');
        ErrorResponse(res, e);
    }
};
