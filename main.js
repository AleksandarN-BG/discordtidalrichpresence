import {Client} from "@xhayper/discord-rpc";
import {fetchWindowTitle} from "./src/fetchWindowTitle.js";
import {getAlbum} from "./src/getAlbum.js";
import {getAlbumCover} from "./src/getAlbumCover.js";
import {updateRichPresence, endtime, clearRichPresence} from "./src/updateRichPresence.js";
import user_config from './config.json' with {type: "json"};

export let client;
try {
    client = new Client({
        clientId: "1265797224454164531"
    });
} catch (error) {
    console.error('Error creating client:', error);
    process.exit(1);
}

export const country_code = user_config.country_code;

let song = "";
let albumData;
let coverurl;
export let activityCleared = false;
let tempsong = "";

async function loginClient() {
    try {
        await client.login();
    } catch (error) {
        console.error('Error logging in. Make sure you have Discord running:', error);
        process.exit(1);
    }
}

loginClient();

client.on("ready", async () => {
    console.log(`${client.user.username} is ready!`);

    async function checkSong() {
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
                albumData = await getAlbum(song);
                coverurl = await getAlbumCover(albumData.coveruuid, albumData.videocoveruuid);
                if (coverurl !== undefined) {
                    await updateRichPresence(albumData.title, albumData.artist, albumData.album, albumData.songurl, coverurl, albumData.length);
                    tempsong = song;
                    activityCleared = false;
                }
            }
            if (!activityCleared && song === null) {
                await clearRichPresence();
                tempsong = "";
                activityCleared = true;
            }
            await new Promise(resolve => setTimeout(resolve, 10));
            await checkSong();
        });
    }

    await checkSong();
});

process.on('SIGINT', function () {
    client.user.clearActivity().then(() => {
        console.log("Received exit signal, clearing RPC and exiting...");
        process.exit();
    });

})
