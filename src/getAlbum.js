import {client, country_code, display_versions, sort_by} from "../main.js";
import axios from "axios";

export async function getAlbum(query) {
    let encodedQuery = encodeURIComponent(query);
    let endpoint = `https://api.tidal.com/v1/search/tracks?countryCode=${country_code}&query=${encodedQuery}&limit=10`;
    let request;

    try {
        request = await axios.get(endpoint, {
            headers: {"x-tidal-token": "CzET4vdadNUFQ5JU"}
        });
    } catch (error) {
        console.error('Error fetching album, you might be offline. Exiting!');
        throw error;
    }

if (request.data.totalNumberOfItems === 0) {
    console.log("No tracks found for the query:", query);
    console.log("I'll try again by cutting the artist name from the query...");
    // If no tracks are found, try removing the artist name from the query
    let parts = query.split(" - ");
    if (parts.length > 1) {
        let newQuery = parts.slice(1).join(" - ");
        return getAlbum(newQuery);
    } else {
        console.log("No more parts to cut, setting RPC to null...");
        client.user.setActivity(null);
        return null;
    }
}

    try {
        const response = await request.data;
        let maxpop = 0;
        let maxpopindex = 0;

        // Find the most popular track. This helps us avoid getting compilations from random live concerts and whatnot.
        // If the sort_by is set to popularity or not set, we find the most popular track.
        if (sort_by === "popularity" || !sort_by || sort_by !== "releaseDate") {
            console.log("Sorting by popularity...");
            for (let i = 0; i < response.items.length; i++) {
                if (response.items[i].popularity > maxpop) {
                    maxpop = response.items[i].popularity;
                    maxpopindex = i;
                }
            }
        }
        else if (sort_by === "releaseDate") {
            console.log("Sorting by release date...");
            // After finding the most popular track, we find the oldest instance to avoid compilation albums.
            for (let i = 0; i < response.items.length; i++) {
                if (response.items[i].streamStartDate && response.items[i].streamStartDate < response.items[maxpopindex].streamStartDate) {
                    maxpopindex = i;
                }
            }
        }

        console.log("Got", response.items[maxpopindex].title, "from album:", response.items[maxpopindex].album.title, "with a track length of:", response.items[maxpopindex].duration, "seconds.");

        if (response.items && response.items.length > 0 && response.items[0].album) {
            // If the track has a version (this is usually alternative editions of the same song), append it to the title.
            let title = response.items[maxpopindex].version && display_versions
                ? response.items[maxpopindex].title + " (" + response.items[maxpopindex].version + ")"
                : response.items[maxpopindex].title;
            // If the track has multiple artists, join them with a comma.
            let artist = response.items[maxpopindex].artists.length > 1
                ? response.items[maxpopindex].artists.map(artist => artist.name).join(", ")
                : response.items[maxpopindex].artists[0].name;
            let artistid = response.items[maxpopindex].artists[0].id;
            let artistphoto = response.items[maxpopindex].artists[0].picture;
            let album = response.items[maxpopindex].album.title;
            let albumid = response.items[maxpopindex].album.id;
            let songurl = response.items[maxpopindex].url;
            let coveruuid;
            let videocoveruuid;
            let length = response.items[maxpopindex].duration;
            if (!response.items[maxpopindex].album.videoCover) {
                coveruuid = response.items[maxpopindex].album.cover;
            } else {
                videocoveruuid = response.items[maxpopindex].album.videoCover;
            }
            return{title, artist, artistid, artistphoto, album, albumid, songurl, coveruuid, videocoveruuid, length};
        } else {
            console.log("No track found, setting RPC to null...");
            client.user.setActivity(null);
        }
    } catch (error) {
        console.error('Error parsing response:', error);
        throw error;
    }
}