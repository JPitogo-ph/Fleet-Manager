import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import pg from "pg";
import { config } from "../config.js";

//Pg pool for session store
const pool = new pg.Pool({
  connectionString: config.db.connectionString,
});

const PgSession = connectPgSimple(session);

export const sessionMiddleware = session({
  store: new PgSession({
    pool,
    tableName: "session",
    createTableIfMissing: true,
  }),
  secret: config.session.secret,
  resave: false, //Don't write to db if session was not modified
  saveUninitialized: false, //Don't create session until something's stored
  cookie: {
    httpOnly: true, //No JS access
    secure: false, //TODO: Set true in prod
    sameSite: "strict", //TODO: Setup CORS for the entire project
    maxAge: config.session.ttlMs,
  },
});
