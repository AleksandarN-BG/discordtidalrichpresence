import {RichPresence} from "discord.js-selfbot-v13";
import {client} from "../main.js";

export let rpcdata;
export let starttime;
export let endtime;

export function updateRichPresence(song, artist, album, url, cover, length) {
    if (!client.user) {
        console.error('Client user is not ready.');
        return;
    }

    if(!song || !artist || !album || !url || !cover || !length) {
        console.error('Missing data for RPC.');
        rpcdata = null;
        return;
    }

    starttime = Date.now();
    endtime = Date.now() + length * 1000;
    rpcdata = new RichPresence(client)
        .setApplicationId('1265797224454164531')
        .setType('LISTENING')
        .setAssetsLargeImage(cover)
        .setAssetsLargeText(album)
        .setAssetsSmallImage('1297578290084581406')
        .setName('TIDAL')
        .setState(artist)
        .setDetails(song)
        .setStartTimestamp(starttime)
        .setEndTimestamp(endtime)
        .addButton('Listen on TIDAL', url);
    client.user.setActivity(rpcdata);
    console.log('Rich presence updated!');
}