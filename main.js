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
                coverurl = await getAlbumCover(albumData.coveruuid);
                updateRichPresence(albumData.title, albumData.artist, albumData.album, albumData.songurl, coverurl);
                tempsong = song;
                activityCleared = false;
        }
        if (!activityCleared && song === null) {
            client.user.setActivity(null);
            console.log("Cleared RPC.");
            tempsong = "";
            activityCleared = true;
        }
        else {
            console.log("Song hasn't changed and RPC is up-to-date. Not doing anything.");
        }
    }, 5000);
})


process.on('SIGINT', function () {
    client.user.setActivity(null);
    console.log("Received exit signal, clearing RPC and exiting...");
    process.exit();
})
