// In main.js
import {Client} from "@xhayper/discord-rpc";
import {fetchWindowTitle} from "./src/fetchWindowTitle.js";
import {getAlbum} from "./src/getAlbum.js";
import {getAlbumCover, getArtistPhoto} from "./src/getAlbumCover.js";
import {updateRichPresence, endtime, clearRichPresence} from "./src/updateRichPresence.js";
import user_config from './config.json' with {type: "json"};

export let client;
export const country_code = user_config.country_code;
export const artist_photos = user_config.display_artist_photo;
export const display_versions = user_config.display_versions;
export const sort_by = user_config.sort_by;

let song = "";
let albumData;
let coverurl;
export let activityCleared = false;
let tempsong = "";
let isConnected = false;
let reconnecting = false;
let reconnectAttempts = 0;
let checkSongRunning = false;
const MAX_RECONNECT_ATTEMPTS = 10;
const RECONNECT_DELAY = 5000;

function createClient() {
    try {
        client = new Client({
            clientId: "1265797224454164531"
        });

        // Set up event handlers
        client.on("ready", onReady);

        client.on("connected", () => {
            console.log("Connected to Discord RPC");
            isConnected = true;
            reconnectAttempts = 0;
        });

        client.on("disconnected", () => {
            console.log("Disconnected from Discord RPC");
            isConnected = false;
        });

        return true;
    } catch (error) {
        console.error('Error creating client:', error);
        return false;
    }
}

async function loginClient() {
    try {
        await client.login();
        return true;
    } catch (error) {
        console.error('Error logging in:', error, "Make sure Discord is running.");
    }
}

async function attemptReconnect() {
    if (reconnecting) {
        return false; // Prevent multiple reconnection attempts
    }

    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        console.error("Max reconnection attempts reached, will continue trying");
        reconnectAttempts = 0; // Reset to allow future attempts
        reconnecting = false;
        return false;
    }

    reconnecting = true;
    reconnectAttempts++;
    const delay = RECONNECT_DELAY * Math.pow(1.5, reconnectAttempts - 1);

    console.log(`Attempting to reconnect in ${delay / 1000} seconds (attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);

    return new Promise((resolve) => {
        setTimeout(async () => {
            let success = false;
            try {
                if (createClient()) {
                    success = await loginClient() || false;
                    if (success) {
                        console.log("Reconnected successfully");
                        tempsong = null;
                    }
                }
            } catch (error) {
                console.error("Reconnection attempt failed:", error);
            } finally {
                reconnecting = false;
                resolve(success);
            }
        }, delay);
    });
}

async function onReady() {
    console.log(`${client.user.username} is ready!`);
    checkSong();
}

async function checkSong() {
    if (checkSongRunning) {
        return;
    }

    checkSongRunning = true;

    if (!isConnected) {
        console.log("Discord client disconnected, attempting to reconnect...");
        const success = await attemptReconnect();
        if (!success) {
            // If reconnection failed, try again later but don't start a new loop
            checkSongRunning = false;
            setTimeout(checkSong, 1000);
            return;
        }
    }

    if (Date.now() > endtime && !activityCleared) {
        console.log("Song ended, clearing RPC...");
        await clearRichPresence();
        tempsong = "";
        activityCleared = true;
    }

    fetchWindowTitle(async (result) => {
        song = result;
        if (song !== null && tempsong !== song) {
            console.log("Song changed and/or RPC isn't set! Updating...");
            try {
                albumData = await getAlbum(song);
                coverurl = await getAlbumCover(albumData.coveruuid, albumData.videocoveruuid);
                let artistphoto = albumData.artistphoto ? await getArtistPhoto(albumData.artistphoto) : null;
                if (coverurl !== undefined) {
                    await updateRichPresence(albumData.title, albumData.artist, artistphoto, albumData.album, albumData.songurl, coverurl, albumData.length);
                    tempsong = song;
                    activityCleared = false;
                }
            } catch (error) {
                console.error("Error updating rich presence:", error);
            }
        }

        if (!activityCleared && song === null) {
            await clearRichPresence();
            tempsong = "";
            activityCleared = true;
        }

        await new Promise(resolve => setTimeout(resolve, 10));
        checkSongRunning = false;
        checkSong();
    });
}

// Start the app
if (createClient()) {
    loginClient();
}

process.on('SIGINT', function() {
    if (client && client.user) {
        client.user.clearActivity().then(() => {
            console.log("Received exit signal, clearing RPC and exiting...");
            process.exit();
        }).catch(() => {});
    } else {
        process.exit();
    }
});