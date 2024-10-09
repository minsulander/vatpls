import pg from 'pg';
import dotenv from "dotenv";

dotenv.config();

const { Client } = pg;

export const query_database = async (query: string, params?: any[]) => {
    const client = new Client();
    await client.connect();

    let res;
    try {
        res = await client.query(query, params);
    } catch (error: any) {
        throw error;
    }

    await client.end();
    
    return res;
};