import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });
dotenv.config(); // fallback

mongoose.connect(process.env.MONGODB_URI, { dbName: "shipit" })
    .then(async () => {
        console.log("Connected to DB");
        const db = mongoose.connection.db;

        const res1 = await db.collection("projects").updateMany(
            { isOpenToInvestment: "true" },
            { $set: { isOpenToInvestment: true } }
        );
        console.log("Update string true -> boolean true:", res1.modifiedCount);

        const res2 = await db.collection("projects").updateMany(
            { isOpenToInvestment: "false" },
            { $set: { isOpenToInvestment: false } }
        );
        console.log("Update string false -> boolean false:", res2.modifiedCount);

        const res3 = await db.collection("projects").updateMany(
            { isOpenToInvestment: { $exists: false } },
            { $set: { isOpenToInvestment: false } }
        );
        console.log("Update missing -> boolean false:", res3.modifiedCount);

        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
