import {Client} from "discord.js-selfbot-v13";
import {fetchWindowTitle} from "./src/fetchWindowTitle.js";
import {getAlbum} from "./src/getAlbum.js";
import {getAlbumCover} from "./src/getAlbumCover.js";
import {updateRichPresence, endtime} from "./src/updateRichPresence.js";
import user_config from './config.json' with {type: "json"};

export const client = new Client();
export const token = user_config.token;
export const channel_id = user_config.channel_id;
export const country_code = user_config.country_code;

let song = "";
let albumData;
let coverurl;
export let activityCleared = false;
let tempsong = "";

client.login(token).then(()=> console.log("Logged in!"));

client.on('ready', async () => {
    console.log(`${client.user.username} is ready!`);

    async function checkSong() {
        if (Date.now() > endtime && !activityCleared) {
            console.log("Song ended, clearing RPC...");
            client.user.setActivity(null);
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
                client.user.setActivity(null);
                console.log("Cleared RPC.");
                tempsong = "";
                activityCleared = true;
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
            await checkSong();
        });
    }

    await checkSong();
});

process.on('SIGINT', function () {
    client.user.setActivity(null);
    console.log("Received exit signal, clearing RPC and exiting...");
    process.exit();
})
