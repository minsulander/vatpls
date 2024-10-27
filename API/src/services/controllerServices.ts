import { QueryResult } from "pg";
import { cid_query, query_database } from "../db/database";
import { Controller, SkeletonController } from "../types/types";

/** Returns all Active controllers,
 * returns { Controller: row } (row is db rows)
 */
export async function activeControllersService() {
    try {
        // TODO take active data
        const result = await query_database(
            `
            SELECT 
            *
            FROM active;
            `);

        return ({ Controllers: result.rows });

    } catch (error: any) {
        // TODO
        return error;
    }   
}

export async function predefinedControllersService() { 

}


export async function getControllerStateService(cid: string): Promise<QueryResult<any>> {
    return await query_database(
            "SELECT * FROM active WHERE cid = $1;",
            [cid]
    );
}

// TODO
export async function getControllerByCIDService(cid: string): Promise<QueryResult<SkeletonController> | undefined> {
    try {
        const result = await cid_query(cid); 

        console.log(result);
        return result;
    } catch(error: any) {
        // TODO
        return undefined;
    }
}

// TODO
export async function changeStateService(controller: Controller) {
    try {
        const result = await query_database(
            `
            
            `
        )
    } catch (Error) {
        throw Error;
    }
}