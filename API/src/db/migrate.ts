import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'
import { query_database } from './database'

/**
 * easy migration runner, just runs all .sql files not very good system...
 */
export const runMigrations = async (): Promise<void> => {
    try {
        // table to keep track of migrations 
        await query_database(`
            CREATE TABLE IF NOT EXISTS _migrations_run (
                id BOOLEAN PRIMARY KEY DEFAULT TRUE,
                run_at TIMESTAMP DEFAULT NOW()
            );
        `)

        // Check if migrations have already been run
        const result = await query_database('SELECT * FROM _migrations_run WHERE id = TRUE')
        
        if (result.rows.length > 0) {
            console.log('Migrations already completed')
            return
        }

        console.log('Running migrations...')

        // get all sql files 
        const migrationsDir = join(process.cwd(), 'src/migrations')
        const migrationFiles = readdirSync(migrationsDir)
            .filter(file => file.endsWith('.sql'))
            .sort() 

        // Run each migration file
        for (const file of migrationFiles) {
            console.log(`Running migration: ${file}`)
            const filePath = join(migrationsDir, file)
            const sql = readFileSync(filePath, 'utf-8')
            
            try {
                await query_database(sql, [], true)
                console.log(`${file} completed`)
            } catch (error: any) {
                // TODO this is not very good, implement a better migration system or use something that already works... 
                if (error.code === '42710' || 
                    error.code === '42P07' || 
                    error.code === '42P06' || 
                    error.code === '23505' || 
                    sql.includes('IF NOT EXISTS')) {
                    console.log(` ${file} - exists, skipping`)
                } else {
                    throw error
                }
            }
        }

        await query_database('INSERT INTO _migrations_run (id) VALUES (TRUE)')
        
        console.log('All migrations completed successfully')

    } catch (error) {
        console.error('Migration failed:', error)
        throw error
    }
}
