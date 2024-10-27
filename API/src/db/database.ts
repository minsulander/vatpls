import pg, { QueryResult } from 'pg';
import dotenv from "dotenv";
import { SkeletonController } from '../types/types';

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

export const cid_query = async (cid: string): Promise <QueryResult<SkeletonController>> => {
    const client = new Client();

    try { 
        await client.connect();
        const resp = await client.query<SkeletonController>("SELECT cid, controller_name as name, sign, controller_rating as rating FROM Controller WHERE cid = $1", [cid]);
        return resp;
    } catch (e) {
        throw e;
    } finally {
        client.end();
    }
};