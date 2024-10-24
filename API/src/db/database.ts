import pg from 'pg';
import dotenv from "dotenv";

dotenv.config();

const { Client } = pg;

export const query_database = async (query: string, params?: any[]) => {
    const client = new Client();
    try {
        await client.connect();
    
        await client.query('BEGIN');
        const db_response = await client.query(query, params);
        await client.query("COMMIT");

        return db_response;
    } catch(e) {
        await client.query('ROLLBACK');
        throw e; 
    } finally {
        client.end();
    }
};