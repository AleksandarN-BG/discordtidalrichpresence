import {client, country_code} from "../main.js";

export async function getAlbum(query) {
    let encodedQuery = encodeURIComponent(query);
    let endpoint = `https://api.tidal.com/v1/search/tracks?countryCode=${country_code}&query=${encodedQuery}&limit=10`;
    const request = await fetch(endpoint, {
        method: "GET",
        headers: {"x-tidal-token": "CzET4vdadNUFQ5JU"}
    });

    try {
        const response = await request.json();
        let maxpop = 0;
        let maxpopindex = 0;

        // Find the most popular track. This helps us avoid getting compilations from random live concerts and whatnot.
        for (let i = 0; i < response.items.length; i++) {
            if (response.items[i].popularity > maxpop) {
                maxpop = response.items[i].popularity;
                maxpopindex = i;
            }
        }

        console.log("Got", response.items[maxpopindex].title, "from album:", response.items[maxpopindex].album.title, "with a track length of:", response.items[maxpopindex].duration, "seconds.");

        if (response.items && response.items.length > 0 && response.items[0].album) {
            // If the track has a version (this is usually alternative editions of the same song), append it to the title.
            let title = response.items[maxpopindex].version
                ? response.items[maxpopindex].title + " (" + response.items[maxpopindex].version + ")"
                : response.items[maxpopindex].title;
            // If the track has multiple artists, join them with a comma.
            let artist = response.items[maxpopindex].artists.length > 1
                ? response.items[maxpopindex].artists.map(artist => artist.name).join(", ")
                : response.items[maxpopindex].artists[0].name;
            let album = response.items[maxpopindex].album.title;
            let songurl = response.items[maxpopindex].url;
            let coveruuid;
            let videocoveruuid;
            let length = response.items[maxpopindex].duration;
            if (!response.items[maxpopindex].album.videoCover) {
                coveruuid = response.items[maxpopindex].album.cover;
            } else {
                videocoveruuid = response.items[maxpopindex].album.videoCover;
            }
            return{title, artist, album, songurl, coveruuid, videocoveruuid, length};
        } else {
            console.log("No track found, setting RPC to null...");
            client.user.setActivity(null);
        }
    } catch (error) {
        console.error('Error parsing response:', error);
        throw error;
    }
}