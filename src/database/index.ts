import { drizzle } from 'drizzle-orm/bun-sql';

export default drizzle(process.env.DATABASE_URL!!);
