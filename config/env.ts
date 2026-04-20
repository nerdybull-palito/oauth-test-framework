import dotenv from 'dotenv';

dotenv.config();

export const config = {
    baseUrl: process.env.BASE_URL!,
    clientId: process.env.CLIENT_ID!,
    redirectUrl: process.env.REDIRECT_URI!,
}