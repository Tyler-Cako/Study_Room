import pgPromise, { IDatabase, IMain } from 'pg-promise';

const pgp: IMain = pgPromise({});

interface DbConfig {
    host: string;
    port: number;
    database: string | undefined;
    user: string | undefined;
    password: string | undefined;
}

// connecting to db
const dbConfig: DbConfig = {
    host: 'db', // the database server
    port: 5432, // the database port
    database: process.env.POSTGRES_DB, // the database name
    user: process.env.POSTGRES_USER, // the user account to connect with
    password: process.env.POSTGRES_PASSWORD, // the password of the user account
};

const db: IDatabase<any> = pgp(dbConfig);

export default db;