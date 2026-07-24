import { closePool } from "./pool.js";
import { backfillAllCharactersFromJson } from "../repositories/characterRepository.js";

backfillAllCharactersFromJson()
    .then((count) => {
        console.log(`Backfill complete. Migrated ${count} character(s).`);
    })
    .catch((error) => {
        console.error("Backfill failed:", error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await closePool();
    });
