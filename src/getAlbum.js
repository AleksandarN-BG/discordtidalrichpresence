import {client, country_code} from "../main.js";

export async function getAlbum(query) {
    let encodedQuery = encodeURIComponent(query);
    let endpoint = `https://api.tidal.com/v1/search/tracks?countryCode=${country_code}&query=${encodedQuery}&limit=1`;
    const request = await fetch(endpoint, {
        method: "GET",
        headers: {"x-tidal-token": "CzET4vdadNUFQ5JU"}
    });

    try {
        const response = await request.json();
        console.log("Got", response.items[0].title, "from album:", response.items[0].album.title);

        if (response.items && response.items.length > 0 && response.items[0].album) {
            let title = response.items[0].title;
            let artist = response.items[0].artist.name;
            let album = response.items[0].album.title;
            let songurl = response.items[0].url;
            let coveruuid;
            let videocoveruuid;
            if (!response.items[0].album.videoCover) {
                coveruuid = response.items[0].album.cover;
            } else {
                videocoveruuid = response.items[0].album.videoCover;
            }
            return{title, artist, album, songurl, coveruuid, videocoveruuid};
        } else {
            console.log("No track found, setting RPC to null...");
            client.user.setActivity(null);
        }
    } catch (error) {
        console.error('Error parsing response:', error);
        throw error;
    }
}