import {RichPresence} from "discord.js-selfbot-v13";
import {client} from "../main.js";

export let rpcdata;

export function updateRichPresence(song, artist, album, url, cover) {
    if (!client.user) {
        console.error('Client user is not ready.');
        return;
    }

    if(!song || !artist || !album || !url || !cover) {
        console.error('Missing data for RPC.');
        rpcdata = null;
        return;
    }

    rpcdata = new RichPresence(client)
        .setApplicationId('1265797224454164531')
        .setType('LISTENING')
        .setAssetsLargeImage(cover)
        .setAssetsLargeText(album)
        .setAssetsSmallImage('1297578290084581406')
        .setName('TIDAL')
        .setState(artist)
        .setDetails(song)
        .addButton('Listen on TIDAL', url);
    client.user.setActivity(rpcdata);
    console.log('Rich presence updated!');
}