import { Pool, PoolClient, QueryResult } from "pg"
import dotenv from "dotenv"
import { IActivity, NewController, OActive, OActivity, SkeletonController, State, NewBlockedTime, BlockedTime } from "../types/types"

dotenv.config()

const pool = new Pool()

export type TransactionClient = Pick<PoolClient, "query">

export const withTransaction = async <T>(operation: (client: TransactionClient) => Promise<T>): Promise<T> => {
    const client = await pool.connect()
    try {
        await client.query("BEGIN")
        const result = await operation(client)
        await client.query("COMMIT")
        return result
    } catch (error) {
        try {
            await client.query("ROLLBACK")
        } catch (rollbackError) {
            console.error("Rollback failed", rollbackError)
        }
        throw error
    } finally {
        client.release()
    }
}

export const closeDatabase = async () => {
    await pool.end()
}

const handleQueryError = (e: Error, query: string, params: any[] | undefined) => {
    console.error(`Error executing query: ${query} with params: ${params}`)
    console.error(e)
}

export const query_database = async (query: string, params?: any[], useTransaction = false) => {
    const client = await pool.connect()
    try {
        if (useTransaction) {
            await client.query("BEGIN")
        }
        const db_response = await client.query(query, params)
        if (useTransaction) {
            await client.query("COMMIT")
        }
        return db_response
    } catch (e) {
        if (useTransaction) {
            await client.query("ROLLBACK")
        }
        handleQueryError(e as Error, query, params)
        throw e
    } finally {
        client.release()
    }
}

export const cid_query = async (cid: string): Promise<QueryResult<SkeletonController>> => {
    return query_database("SELECT cid, controller_name AS name, sign, controller_rating AS rating FROM Controller WHERE cid = $1", [cid])
}

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
            active.session_start AT TIME ZONE 'UTC' AS timestamp,
            active.in_list,
            COALESCE(array_agg(endorsement.endorsement), '{NIL}') AS endorsements
                FROM controller
                JOIN active ON controller.cid = active.cid
                LEFT JOIN Endorsements AS endorsement ON controller.cid = endorsement.cid
            GROUP BY
            controller.controller_name,
            controller.sign,
            controller.cid,
            active.callsign,
            controller.controller_rating,
            active.position,
            active.session_start,
            active.in_list;
        `,
    )
}

export const addController = async (controllerToAdd: NewController): Promise<QueryResult<any>> => {
    const client = await pool.connect()
    try {
        await client.query("BEGIN")
        const ControllerQuerry = `INSERT INTO Controller VALUES ($1, $2, $3, $4); `

        await client.query(ControllerQuerry, [controllerToAdd.cid, controllerToAdd.name, controllerToAdd.sign, controllerToAdd.rating])

        if (controllerToAdd.rating != "C1" && controllerToAdd.endorsement) {
            const endorsementQuerry = `INSERT INTO endorsements VALUES ($1, $2);`
            for (const endor of controllerToAdd.endorsement) {
                const endorsementParams = [controllerToAdd.cid, endor]
                await client.query(endorsementQuerry, endorsementParams)
            }
        }

        await client.query("COMMIT")

        return { rowCount: 1 } as QueryResult<any>
    } catch (e) {
        await client.query("ROLLBACK")
        if (e instanceof Error && "code" in e && e.code == "23505") {
            //console.error(`Duplicate entry for controller with cid ${controllerToAdd.cid}`);
            throw new Error(`Controller with cid ${controllerToAdd.cid} already exists.`)
        }
        throw e
    } finally {
        client.release()
    }
}

export const removeController = async (cid: string) => {
    const client = await pool.connect()

    // TODO is this nessecery? Or only for testing?
    const tablesToRemvoveUserFrom = ["endorsements", "session", "active", "controller"]
    try {
        await client.query("BEGIN")

        for (const table of tablesToRemvoveUserFrom) {
            const removeQuerry = `DELETE FROM ${table} WHERE cid = $1;` // $1 cid
            await client.query(removeQuerry, [cid])
        }

        await client.query("COMMIT")
        return { rowCount: 1 } as QueryResult<any>
    } catch (e) {
        try {
            await client.query("ROLLBACK")
        } catch (rollbackError) {
            console.error("Rollback failed", rollbackError)
        }
        throw e
    } finally {
        client.release()
    }
}

export const moveController = async (cid: string) => {}

export const stateChange = async (ctrl: IActivity) => {
    if (ctrl.callsign && ctrl.position) {
        return query_database("INSERT INTO active VALUES ($1, $2, $3, NOW(), $4)", [ctrl.cid, ctrl.callsign, ctrl.position, ctrl.in_list])
    } else if (ctrl.callsign) {
        return query_database("INSERT INTO active (cid, callsign, session_start, in_list) VALUES ($1, $2, NOW(), $3)", [
            ctrl.cid,
            ctrl.callsign,
            ctrl.in_list,
        ])
    } else {
        return query_database("INSERT INTO active (cid, session_start, in_list) VALUES ($1, NOW(), $2)", [ctrl.cid, ctrl.in_list])
    }
}

export const deleteState = async (cid: string) => {
    return query_database("DELETE FROM active WHERE cid = $1;", [cid])
}

/**
 * Blocked Time functions
 */

export const createBlockedTime = async (data: NewBlockedTime): Promise<QueryResult<BlockedTime>> => {
    return query_database(
        `INSERT INTO BlockedTime (cid, position, blocked_start, blocked_end, reason, notes)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *;`,
        [data.cid, data.position, data.blocked_start, data.blocked_end, data.reason, data.notes || null],
    )
}

export const getBlockedTimes = async (date?: string): Promise<QueryResult<BlockedTime>> => {
    if (date) {
        return query_database(
            `SELECT
                block_id,
                cid,
                position,
                blocked_start AT TIME ZONE 'UTC' as blocked_start,
                blocked_end AT TIME ZONE 'UTC' as blocked_end,
                reason,
                notes,
                created_at AT TIME ZONE 'UTC' as created_at
             FROM BlockedTime
             WHERE blocked_start::date = $1::date OR blocked_end::date = $1::date
             ORDER BY blocked_start;`,
            [date],
        )
    } else {
        return query_database(
            `SELECT
                block_id,
                cid,
                position,
                blocked_start AT TIME ZONE 'UTC' as blocked_start,
                blocked_end AT TIME ZONE 'UTC' as blocked_end,
                reason,
                notes,
                created_at AT TIME ZONE 'UTC' as created_at
             FROM BlockedTime
             ORDER BY blocked_start;`,
        )
    }
}

export const deleteBlockedTime = async (block_id: number): Promise<QueryResult<any>> => {
    return query_database("DELETE FROM BlockedTime WHERE block_id = $1;", [block_id])
}
