import express, { Request, Response } from 'express'
import { authForEmail, insertExceldata } from '../Controller/emailProcessingController';
const router = express.Router()

router.post('/add-excel-data', insertExceldata)
router.post('/auth-mail', authForEmail)
export default router;


