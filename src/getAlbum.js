import axios from "axios";
import { CONFIG } from "./config.js";
import { formatArtists, formatTitle } from "./utils.js";

class TidalTrackSelector {
    static selectBestTrack(tracks, sortBy) {
        if (!tracks || tracks.length === 0) return null;

        if (sortBy === "releaseDate") {
            console.log("Sorting by release date...");
            return this.selectOldestTrack(tracks);
        } else {
            console.log("Sorting by popularity...");
            return this.selectMostPopularTrack(tracks);
        }
    }

    static selectMostPopularTrack(tracks) {
        let maxPopularity = 0;
        let bestTrackIndex = 0;

        for (let i = 0; i < tracks.length; i++) {
            if (tracks[i].popularity > maxPopularity) {
                maxPopularity = tracks[i].popularity;
                bestTrackIndex = i;
            }
        }

        return tracks[bestTrackIndex];
    }

    static selectOldestTrack(tracks) {
        let oldestTrack = tracks[0];
        let oldestIndex = 0;

        for (let i = 1; i < tracks.length; i++) {
            const currentTrack = tracks[i];
            if (currentTrack.streamStartDate &&
                currentTrack.streamStartDate < oldestTrack.streamStartDate) {
                oldestTrack = currentTrack;
                oldestIndex = i;
            }
        }

        return oldestTrack;
    }
}

async function searchTidalTracks(query) {
    const encodedQuery = encodeURIComponent(query);
    const endpoint = `${CONFIG.TIDAL_SEARCH_URL}?countryCode=${CONFIG.COUNTRY_CODE}&query=${encodedQuery}&limit=10`;

    try {
        const response = await axios.get(endpoint, {
            headers: { "x-tidal-token": CONFIG.TIDAL_TOKEN }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching album, you might be offline. Exiting!');
        throw error;
    }
}

function formatTrackData(track) {
    return {
        title: formatTitle(track.title, track.version, CONFIG.DISPLAY_VERSIONS),
        artist: formatArtists(track.artists),
        artistid: track.artists[0].id,
        artistphoto: track.artists[0].picture,
        album: track.album.title,
        albumid: track.album.id,
        songurl: track.url,
        coveruuid: track.album.cover,
        videocoveruuid: track.album.videoCover,
        length: track.duration
    };
}

export async function getAlbum(query) {
    try {
        const searchData = await searchTidalTracks(query);

        if (searchData.totalNumberOfItems === 0) {
            console.log("No tracks found for the query:", query);

            // Try removing the artist name from the query
            const parts = query.split(" - ");
            if (parts.length > 1) {
                console.log("I'll try again by cutting the artist name from the query...");
                const newQuery = parts.slice(1).join(" - ");
                return getAlbum(newQuery);
            } else {
                console.log("No more parts to cut, setting RPC to null...");
                return null;
            }
        }

        const bestTrack = TidalTrackSelector.selectBestTrack(searchData.items, CONFIG.SORT_BY);

        if (!bestTrack) {
            console.log("No suitable track found, setting RPC to null...");
            return null;
        }

        console.log(`Got "${bestTrack.title}" from album: "${bestTrack.album.title}" with a track length of: ${bestTrack.duration} seconds.`);

        return formatTrackData(bestTrack);

    } catch (error) {
        console.error('Error in getAlbum:', error);
        throw error;
    }
}
