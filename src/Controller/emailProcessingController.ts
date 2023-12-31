import { Request, Response } from "express";
import { ErrorResponse, successResponse } from "../helpers/apiResponse";
import { addExcelData } from "../model/email.model";
import { AppDataSource } from "../config/db";
import { ExcelData } from "../entities/excelData";
// import { videointelligence } from "googleapis/build/src/apis/videointelligence";


const xlsx = require('xlsx');

const { google } = require('googleapis');
const { OAuth2Client } = require('google-auth-library');
const fs = require('fs');
const excel = require('exceljs');
const xlsToJson = require('xls-to-json');

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


const credentials = JSON.parse(fs.readFileSync('src/config/client.json'));

const { client_id, client_secret, redirect_uris } = credentials.web;
const oAuth2Client = new OAuth2Client(client_id, client_secret, redirect_uris[0]);

const REFRESH_TOKEN = "1//04NSGwowVQIUJCgYIARAAGAQSNwF-L9IriO51tYS3QVxBW4X37QPKpbuoRl52MR4Y6l5UwA7-1pxOYqkIMhV0kNA_K6FtCl-0ZbQ"

oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

async function listMessages(query: any) {
    const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });
    const response = await gmail.users.messages.list({
        userId: 'me',
        q: query,
    });
    console.log('response', response);
    return response.data.messages;
}

async function getMessage(messageId: any) {
    const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });
    const response = await gmail.users.messages.get({
        userId: 'me',
        id: messageId,
    });
    console.log(response.data, 'response.data');
    return response.data;
}

async function getAttachments(message: any) {
    console.log('*****');
    const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });
    const parts = message.payload.parts;
    if (!parts) {
        console.log('No attachments found in this email.');
        return;
    }
    let allDataArr: any[] = []
    let errorArr: any[] = [];
    for (const part of parts) {
        if (part.filename && part.filename.length > 0 && part.filename.includes('.xls')) {

            const attachment = await gmail.users.messages.attachments.get({
                userId: 'me',
                messageId: message.id,
                id: part.body.attachmentId,
            });
            // console.log(attachment, 'attachment');

            const data = attachment.data.data;
            const xlsFilePath = `${part.filename}`;

            // Save attachment data to a local file
            fs.writeFileSync(xlsFilePath, data, 'base64');
            // const f = fs.readFileSync(xlsFilePath)
            // console.log('test', f.length);
            const workbook = xlsx.readFile(xlsFilePath, { encoding: 'utf-8' });
            const sheetName = workbook.SheetNames[0]; // Assuming there's only one sheet
            const worksheet = workbook.Sheets[sheetName];

            const xlsData = xlsx.utils.sheet_to_json(worksheet);

            const res = JSON.parse(JSON.stringify(xlsData));

            await AppDataSource
                .createQueryBuilder()
                .insert()
                .into(ExcelData)
                .values(res)
                .returning('*')
                .orIgnore()
                .execute()
                .then((result) => {
                    // Clean up the local file
                    allDataArr.push(result.raw)
                }).catch((err) => {
                    console.log(err, 'err');
                    if (err && err.driverError && err.driverError.detail && err.driverError.detail.includes("already exists.")) {
                        const errorMsg = "Email already exists!"
                        errorArr.push(errorMsg)
                    } else {
                        errorArr.push(err)
                    }
                });

            fs.unlinkSync(xlsFilePath);

        }
    }
    console.log(allDataArr, 'allDataArr');
    if (errorArr && errorArr.length > 0) {
        return errorArr
    }
    return allDataArr
}

export async function watchGmailInbox() {
    const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });
    // await gmail.users.watch(
    //     {
    //         userId: 'me',
    //         resource: {
    //             topicName: "projects/login-with-goggle-398805/topics/email-process", // Use the actual topic name
    //             callbackUrl: "http://localhost:3002/notifications"
    //         },
    //     },
    //     (err: any, res: any) => {
    //         if (err) {
    //             console.error('Error watching Gmail inbox:', err);
    //             return;
    //         }
    //         console.log('Watch request successful. You will receive notifications.', res);
    //         return res
    //     }
    // );


    const res = await gmail.users.watch({
        userId: 'me',
        requestBody: {
            'labelIds': ['INBOX'],
            topicName: "projects/login-with-goggle-398805/topics/email-process"
        },
    });

    console.log('Watch response:', res.data);

}



export const notifications = async (req: Request, res: Response) => {
    try {

        const query = 'from:hello.test2512@gmail.com';
        const messages = await listMessages(query);
        console.log(messages, messages?.length, 'messages');
        if (!messages || messages?.length === 0) {
            console.log('No email found.');
            return ErrorResponse(res, "No email found!");
        }

        const messageId = messages[0].id;
        const message = await getMessage(messageId);

        console.log('Email Subject:', message.subject);
        console.log('Email Body:', message.snippet);

        const data = await getAttachments(message);

        return successResponse(res, "Data Get Successfully", data);

    } catch (e) {
        console.log(e, 'error');
        ErrorResponse(res, e);
    }
};


export const test = async () => {
    try {

        const query = 'from:hello.test2512@gmail.com';
        const messages = await listMessages(query);
        console.log(messages, messages?.length, 'messages');
        if (!messages || messages?.length === 0) {
            console.log('No email found.');
        }

        const messageId = messages[0].id;
        const message = await getMessage(messageId);

        console.log('Email Subject:', message.subject);
        console.log('Email Body:', message.snippet);

        const data = await getAttachments(message);

        console.log("Data Get Successfully");
    } catch (e) {
        console.log(e, 'error');
    }
};
