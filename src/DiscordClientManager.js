import { Client } from "@xhayper/discord-rpc";
import { CONFIG } from "./config.js";
import { createExponentialDelay } from "./utils.js";

export class DiscordClientManager {
    constructor() {
        this.client = null;
        this.isConnected = false;
        this.reconnecting = false;
        this.reconnectAttempts = 0;
    }

    createClient() {
        try {
            this.client = new Client({
                clientId: CONFIG.DISCORD_CLIENT_ID
            });

            this.client.on("connected", () => {
                console.log("Connected to Discord RPC!");
                this.isConnected = true;
                this.reconnectAttempts = 0;
            });

            this.client.on("disconnected", () => {
                console.log("Disconnected from Discord RPC.");
                this.isConnected = false;
            });

            console.log("Discord RPC client created successfully.");
            return true;
        } catch (error) {
            console.error('Error creating client:', error);
            return false;
        }
    }

    async login() {
        try {
            console.log("Logging into Discord RPC...");
            await this.client.login();
            console.log("Discord RPC login successful");
            return true;
        } catch (error) {
            console.error('Error logging in:', error, "Make sure Discord is running.");
            return false;
        }
    }

    async attemptReconnect() {
        if (this.reconnecting) {
            return false;
        }

        if (this.reconnectAttempts >= CONFIG.MAX_RECONNECT_ATTEMPTS) {
            console.error("Max reconnection attempts reached, will continue trying");
            this.reconnectAttempts = 0;
            this.reconnecting = false;
            return false;
        }

        this.reconnecting = true;
        this.reconnectAttempts++;
        const delay = createExponentialDelay(this.reconnectAttempts, CONFIG.RECONNECT_DELAY);

        console.log(`Attempting to reconnect in ${delay / 1000} seconds (attempt ${this.reconnectAttempts}/${CONFIG.MAX_RECONNECT_ATTEMPTS})`);

        return new Promise((resolve) => {
            setTimeout(async () => {
                let success = false;
                try {
                    if (this.createClient()) {
                        success = await this.login() || false;
                        if (success) {
                            console.log("Reconnected successfully");
                        }
                    }
                } catch (error) {
                    console.error("Reconnection attempt failed:", error);
                } finally {
                    this.reconnecting = false;
                    resolve(success);
                }
            }, delay);
        });
    }

    async setActivity(activityData) {
        if (!this.client?.user) {
            throw new Error('Client user is not ready.');
        }
        return this.client.user.setActivity(activityData);
    }

    async clearActivity() {
        if (!this.client?.user) {
            throw new Error('Client user is not ready.');
        }
        return this.client.user.clearActivity();
    }

    onReady(callback) {
        if (this.client) {
            this.client.on("ready", () => {
                console.log(`Discord RPC Ready! User: ${this.client.user?.username}`);
                callback();
            });
        }
    }
}
