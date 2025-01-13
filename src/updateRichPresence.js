import {client} from "../main.js";

export let rpcdata;
export let starttime;
export let endtime;

export async function updateRichPresence(song, artist, album, url, cover, length) {
    if (!client.user) {
        console.error('Client user is not ready.');
        return;
    }

    if (!song || !artist || !album || !url || !cover || !length) {
        console.error('Missing data for RPC.');
        rpcdata = null;
        return;
    }

    starttime = Date.now();
    endtime = Date.now() + length * 1000;
    rpcdata = {
        type: 2,
        state: artist,
        details: song,
        startTimestamp: starttime,
        endTimestamp: endtime,
        largeImageKey: cover,
        largeImageText: album,
        smallImageKey: "tidallogo",
        buttons: [{label: 'Listen on TIDAL', url: url}]
    };

    await client.user.setActivity(rpcdata);
    console.log('Rich presence updated!');
}