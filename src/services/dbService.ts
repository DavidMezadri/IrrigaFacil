import * as SQLite from 'expo-sqlite';

export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS';
export type LogCategory = 'MQTT' | 'SYSTEM' | 'USER_ACTION' | 'AUTOMATION';

export interface DbLogEntry {
    id: number;
    farmId: string;
    level: LogLevel;
    category: LogCategory;
    message: string;
    timestamp: string; // ISO String stored in DB
}

export interface HourGroup {
    hour: string; // "14:00 - 14:59"
    logs: DbLogEntry[];
    summary: {
        total: number;
        errors: number;
        warns: number;
    };
}

export interface DayGroup {
    date: string; // "YYYY-MM-DD"
    hours: HourGroup[];
}

const DB_NAME = 'irrigafacil_logs.db';

class DbService {
    private db: SQLite.SQLiteDatabase | null = null;
    private initialized = false;
    private initPromise: Promise<void> | null = null;

    /**
     * Obter a instância do banco (abre se não estiver aberto)
     */
    private async getDb(): Promise<SQLite.SQLiteDatabase> {
        if (this.db) return this.db;
        this.db = await SQLite.openDatabaseAsync(DB_NAME);
        return this.db;
    }

    /**
     * Inicializa as tabelas do sistema se ainda não existirem
     */
    async init(): Promise<void> {
        if (this.initialized) return;
        if (this.initPromise) return this.initPromise;

        this.initPromise = new Promise(async (resolve, reject) => {
            try {
                const database = await this.getDb();
                await database.execAsync(`
                    CREATE TABLE IF NOT EXISTS sys_logs (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        farmId TEXT NOT NULL,
                        level TEXT NOT NULL,
                        category TEXT NOT NULL,
                        message TEXT NOT NULL,
                        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
                    );
                    CREATE INDEX IF NOT EXISTS idx_sys_logs_farm_time ON sys_logs(farmId, timestamp DESC);
                `);
                this.initialized = true;
                resolve();
            } catch (error) {
                console.error('Erro ao inicializar DB de logs:', error);
                reject(error);
            }
        });

        return this.initPromise;
    }

    /**
     * Insere um novo log no banco de dados SQLite
     */
    async insertLog(farmId: string, level: LogLevel, category: LogCategory, message: string): Promise<void> {
        await this.init();
        try {
            const database = await this.getDb();
            const timestamp = new Date().toISOString();

            await database.runAsync(
                'INSERT INTO sys_logs (farmId, level, category, message, timestamp) VALUES (?, ?, ?, ?, ?)',
                [farmId, level, category, message, timestamp]
            );
        } catch (error) {
            console.error('Falha ao inserir log no DB:', error);
        }
    }

    /**
     * Limpa logs mais antigos que 'daysToKeep' para não inflar o armazenamento
     */
    async clearOldLogs(daysToKeep = 7): Promise<void> {
        await this.init();
        try {
            const database = await this.getDb();
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
            const cutoffIso = cutoffDate.toISOString();

            await database.runAsync(
                'DELETE FROM sys_logs WHERE timestamp < ?',
                [cutoffIso]
            );
        } catch (error) {
            console.error('Falha ao limpar logs antigos:', error);
        }
    }

    /**
     * Retorna todos os logs para uma fazenda, filtrados e estruturados em Dias > Horas > Logs
     */
    async getLogsGroupedByDayAndHour(
        farmId: string,
        levelFilter?: LogLevel[],
        categoryFilter?: LogCategory[]
    ): Promise<DayGroup[]> {
        await this.init();
        const database = await this.getDb();

        let query = 'SELECT * FROM sys_logs WHERE farmId = ?';
        const params: any[] = [farmId];

        if (levelFilter && levelFilter.length > 0) {
            query += ` AND level IN (${levelFilter.map(() => '?').join(',')})`;
            params.push(...levelFilter);
        }

        if (categoryFilter && categoryFilter.length > 0) {
            query += ` AND category IN (${categoryFilter.map(() => '?').join(',')})`;
            params.push(...categoryFilter);
        }

        query += ' ORDER BY timestamp DESC'; // Mais recentes primeiro

        const rawLogs = await database.getAllAsync<DbLogEntry>(query, params);

        // Agrupar no JavaScript:
        // Como o SQLite retorna tudo muito rápido, mapear de array plano para a Árvore de UI aqui é perfeitamente viável em listas de até milhares de itens
        const groupsMap = new Map<string, Map<string, DbLogEntry[]>>();

        rawLogs.forEach(log => {
            const d = new Date(log.timestamp);

            // YYYY-MM-DD
            const dateStr = d.toISOString().split('T')[0];

            // "HH:00 - HH:59"
            const hour = d.getHours().toString().padStart(2, '0');
            const hourStr = `${hour}:00 - ${hour}:59`;

            if (!groupsMap.has(dateStr)) {
                groupsMap.set(dateStr, new Map());
            }
            const dateMap = groupsMap.get(dateStr)!;

            if (!dateMap.has(hourStr)) {
                dateMap.set(hourStr, []);
            }
            dateMap.get(hourStr)!.push(log);
        });

        // Converter Maps para as Interfaces do React
        const result: DayGroup[] = [];

        Array.from(groupsMap.entries()).forEach(([date, hoursMap]) => {
            const hours: HourGroup[] = [];

            Array.from(hoursMap.entries()).forEach(([hour, logs]) => {
                const total = logs.length;
                const errors = logs.filter(l => l.level === 'ERROR').length;
                const warns = logs.filter(l => l.level === 'WARN').length;

                hours.push({ hour, logs, summary: { total, errors, warns } });
            });

            // Ordenar horas da mais recente para a mais antiga (ex: 14:00 antes de 13:00)
            hours.sort((a, b) => b.hour.localeCompare(a.hour));

            result.push({ date, hours });
        });

        // Retorna já estruturado
        return result;
    }
}

export const dbService = new DbService();
