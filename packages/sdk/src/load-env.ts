/** Load repo-root `.env` before any live-env guards (PM2 env_file is unreliable). */
import { config } from "dotenv";
import { join } from "node:path";

config({ path: join(process.cwd(), ".env") });
