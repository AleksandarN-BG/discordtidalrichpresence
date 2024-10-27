import {Client} from "discord.js-selfbot-v13";
import {fetchWindowTitleAndAlbum} from "./src/fetchWindowTitleAndAlbum.js";
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
        fetchWindowTitleAndAlbum((result) => {song = result;});
        if (song !== null) {
            albumData = await (getAlbum(song));
            coverurl = await getAlbumCover(albumData.coveruuid);
            if (tempsong !== song) {
                updateRichPresence(albumData.title, albumData.artist, albumData.album, albumData.songurl, coverurl);
                tempsong = song;
                activityCleared = false;
            }
        }
        else if (!activityCleared) {
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
