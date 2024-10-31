import { QueryResult, Pool } from 'pg';
import dotenv from "dotenv";
import { IActivity, NewController, OActive, OActivity, SkeletonController, State } from '../types/types';

dotenv.config();

const pool = new Pool();

const handleQueryError = (e: Error, query: string, params: any[] | undefined) => {
    console.error(`Error executing query: ${query} with params: ${params}`);
    console.error(e);
};

export const query_database = async (query: string, params?: any[], useTransaction = false) => {
    const client = await pool.connect();
    try {
        if (useTransaction) {
            await client.query('BEGIN');
        }
        const db_response = await client.query(query, params);
        if (useTransaction) {
            await client.query("COMMIT");
        }
        return db_response;
    } catch (e) {
        if (useTransaction) {
            await client.query('ROLLBACK');
        }
        handleQueryError(e as Error, query, params);
        throw e;
    } finally {
        client.release();
    }
};

export const cid_query = async (cid: string): Promise <QueryResult<SkeletonController>> => {
    return query_database(
        "SELECT cid, controller_name AS name, sign, controller_rating AS rating FROM Controller WHERE cid = $1",
        [cid]
    );
};

// TODO endorsements
export const activeControllers = async (): Promise<QueryResult<OActive>> => {
    return query_database(
        `
        SELECT 
        controller.controller_name AS name,
        controller.sign,
        controller.cid,
        active.callsign,
        controller.controller_rating AS rating,
        active.position,
        active.session_start AS timestamp,
        active.in_list
        FROM controller JOIN active ON controller.cid = active.cid;
        `
    );
}

export const addController = async (controllerToAdd: NewController): Promise <QueryResult<any>> => {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        const ControllerQuerry = `INSERT INTO Controller VALUES ($1, $2, $3, $4); `;

        await client.query(ControllerQuerry, [controllerToAdd.cid, controllerToAdd.name, controllerToAdd.sign, controllerToAdd.rating]);
    
        if (controllerToAdd.rating != "C1" && controllerToAdd.endorsement) {
            const endorsementQuerry = `INSERT INTO endorsements VALUES ($1, $2);` 
            for (const endor of controllerToAdd.endorsement) {
                const endorsementParams = [controllerToAdd.cid, endor];
                await client.query(endorsementQuerry, endorsementParams);
            }
        }

        await client.query("COMMIT");

        return { rowCount: 1 } as QueryResult<any>;
    } catch (e) {
        await client.query("ROLLBACK");
        if (e instanceof Error && 'code' in e && e.code == '23505') {
            //console.error(`Duplicate entry for controller with cid ${controllerToAdd.cid}`);
            throw new Error(`Controller with cid ${controllerToAdd.cid} already exists.`);
        }
        throw e;
    } finally {
        client.release();
    }
}

export const removeController = async (cid: string) => {
    const client = await pool.connect();

    // TODO is this nessecery? Or only for testing?
    const tablesToRemvoveUserFrom = ["endorsements", "session", "active", "controller"];
    try {
        await client.query("BEGIN");

        for (const table of tablesToRemvoveUserFrom) {
            const removeQuerry = `DELETE FROM ${table} WHERE cid = $1;`; // $1 cid
            await client.query(removeQuerry, [cid]);
        }

        await client.query("COMMIT");
        return { rowCount: 1 } as QueryResult<any>;
    } catch (e) {
        try {
            await client.query("ROLLBACK");
        } catch (rollbackError) {
            console.error("Rollback failed", rollbackError);
        }
        throw e;
    } finally {
        client.release();
    }
};

export const moveController = async (cid: string) => {

};

export const stateChange = async (ctrl: IActivity) => {
    if (ctrl.callsign && ctrl.position) {
        return query_database(
            "INSERT INTO active VALUES ($1, $2, $3, NOW(), $4)",
            [ctrl.cid, ctrl.callsign, ctrl.position, ctrl.in_list]
        );
    } else if (ctrl.callsign) {
        return query_database(
            "INSERT INTO active (cid, callsign, session_start, in_list) VALUES ($1, $2, NOW(), $3)",
            [ctrl.cid, ctrl.callsign, ctrl.in_list]
        );
    } else  {
        return query_database(
            "INSERT INTO active (cid, session_start, in_list) VALUES ($1, NOW(), $2)",
            [ctrl.cid, ctrl.in_list]
        );
    }
};

export const deleteState = async (cid: string) => {
    return query_database(
        "DELETE FROM active WHERE cid = $1;",
        [cid]
    );
};