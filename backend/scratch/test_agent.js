import dotenv from "dotenv";
dotenv.config();
import { runAgent } from "../src/ai/agent.js";

async function test() {
    const userId = "test_user_123";
    const message = "search hotels in Ahmedabad";
    console.log("Running agent...");
    const response = await runAgent(userId, message);
    console.log("Response:", response);
}

test().catch(console.error);
