import {Client} from "discord.js-selfbot-v13";
import {fetchWindowTitle} from "./src/fetchWindowTitle.js";
import {getAlbum} from "./src/getAlbum.js";
import {getAlbumCover} from "./src/getAlbumCover.js";
import {updateRichPresence} from "./src/updateRichPresence.js";
import user_config from './config.json' with {type: "json"};

export const client = new Client();
export const token = user_config.token;
export const channel_id = user_config.channel_id;
export const country_code = user_config.country_code;

let song = "";
let albumData;
let coverurl;
let activityCleared = true;
let tempsong = "";


client.login(token).then(()=> console.log("Logged in!"));

client.on('ready', async () => {
    console.log(`${client.user.username} is ready!`)
    setInterval(async () => {
        fetchWindowTitle((result) => {song = result;});
        if (song !== null && tempsong !== song) {
                console.log("Song changed and/or RPC isn't set! Fetching album data...");
                albumData = await (getAlbum(song));
                coverurl = await (getAlbumCover(albumData.coveruuid, albumData.videocoveruuid));
                if (coverurl !== undefined) {
                updateRichPresence(albumData.title, albumData.artist, albumData.album, albumData.songurl, coverurl, albumData.length);
                tempsong = song;
                activityCleared = false;
                }
                else {
                    console.log("Image not uploaded yet, skipping...");
                }
        }
        if (!activityCleared && song === null) {
            client.user.setActivity(null);
            console.log("Cleared RPC.");
            tempsong = "";
            activityCleared = true;
        }
    }, 5000);
})


process.on('SIGINT', function () {
    client.user.setActivity(null);
    console.log("Received exit signal, clearing RPC and exiting...");
    process.exit();
})
