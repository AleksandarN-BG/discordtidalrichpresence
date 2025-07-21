import {client, artist_photos} from "../main.js";

export let rpcdata;
export let starttime;
export let endtime;
let elapsedTime = 0;
let lastsong;

export async function updateRichPresence(song, artist, artistid, artistphoto, album, albumid, url, cover, length) {
    if (!client || !client.user) {
        console.error('Client user is not ready.');
        return;
    }

    if (!song || !artist || !album || !url || !cover || !length) {
        console.error('Missing data for RPC.');
        rpcdata = null;
        return;
    }

    // keep the start time if the song is the same
    if (lastsong && lastsong.details === song && lastsong.state === artist && elapsedTime < length * 1000) {
        starttime = Date.now() - elapsedTime;
        console.log("Resuming...");
    } else {
        starttime = Date.now();
        elapsedTime = 0;
    }

    try {
        endtime = starttime + length * 1000;
        rpcdata = {
            type: 2, // Listening
            state: artist,
            details: song,
            detailsUrl: url, // Makes song title clickable
            stateUrl: 'https://tidal.com/artist/' + artistid,   // Makes artist name clickable
            startTimestamp: starttime,
            endTimestamp: endtime,
            largeImageKey: cover,
            largeImageText: album,
            largeImageUrl: 'https://tidal.com/album/' + albumid,
            smallImageKey: artist_photos && artistphoto ? artistphoto : 'tidallogo',
            smallImageText: artist_photos && artistphoto ? artist : 'TIDAL - ' + artist,
            smallImageUrl: 'https://tidal.com/artist/' + artistid,
            statusDisplayType: 1, // 0 = activity name, 1 = state (artist), 2 = details (song)
            buttons: [{label: 'Listen on TIDAL', url: url}]
        };

        await client.user.setActivity(rpcdata);
        console.log('Rich presence updated!');
        lastsong = rpcdata;
    } catch (error) {
        console.error('Error setting activity:', error);
    }
}

export async function clearRichPresence() {
    if (!client.user) {
        console.error('Client user is not ready.');
        return;
    }
    try {
        elapsedTime = Date.now() - starttime;
        await client.user.clearActivity();
        console.log('Rich presence cleared!');
        rpcdata = null;
    } catch (error) {
        console.error('Error clearing activity:', error);
    }
}