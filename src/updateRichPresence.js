import { CONFIG } from "./config.js";

class TimeManager {
    constructor() {
        this.starttime = null;
        this.endtime = null;
        this.elapsedTime = 0;
        this.lastSong = null;
        this.lastSeekTime = 0;
    }

    updateTiming(song, artist, length, currentPosition = null, mediaInfo = null) {
        const isSameSong = this.lastSong &&
                          this.lastSong.details === song &&
                          this.lastSong.state === artist;

        // Check if this is a seek operation
        const isSeek = mediaInfo && mediaInfo.lastSeekTime && mediaInfo.lastSeekTime > this.lastSeekTime;

        if (isSameSong && currentPosition !== null && isSeek) {
            // Force update due to seeking
            this.starttime = Date.now() - (currentPosition * 1000);
            this.lastSeekTime = mediaInfo.lastSeekTime;
            console.log(`Syncing with seek position: ${currentPosition}s`);
        } else if (isSameSong && currentPosition !== null) {
            // Use the actual position from the media player
            this.starttime = Date.now() - (currentPosition * 1000);
            console.log(`Syncing with actual position: ${currentPosition}s`);
        } else if (isSameSong) {
            // Same song, calculate elapsed time from last known position
            this.starttime = Date.now() - this.elapsedTime;
            console.log("Resuming...");
        } else {
            // New song or first time
            if (currentPosition !== null) {
                this.starttime = Date.now() - (currentPosition * 1000);
                console.log(`Starting new song at position: ${currentPosition}s`);
            } else {
                this.starttime = Date.now();
            }
            this.elapsedTime = 0;
            this.lastSeekTime = mediaInfo && mediaInfo.lastSeekTime ? mediaInfo.lastSeekTime : 0;
        }

        this.endtime = this.starttime + length * 1000;
    }

    updateElapsed() {
        if (this.starttime) {
            this.elapsedTime = Date.now() - this.starttime;
        }
    }

    getTimestamps() {
        return {
            startTimestamp: this.starttime,
            endTimestamp: this.endtime
        };
    }
}

class RPCDataBuilder {
    static build(song, artist, artistid, artistphoto, album, albumid, url, cover, timestamps) {
        return {
            type: 2, // Listening
            state: artist,
            details: song,
            detailsUrl: url, // Makes song title clickable
            stateUrl: `https://tidal.com/artist/${artistid}`,   // Makes artist name clickable
            ...timestamps,
            largeImageKey: cover,
            largeImageText: album,
            largeImageUrl: `https://tidal.com/album/${albumid}`,
            smallImageKey: CONFIG.DISPLAY_ARTIST_PHOTO && artistphoto ? artistphoto : 'tidallogo',
            smallImageText: CONFIG.DISPLAY_ARTIST_PHOTO && artistphoto ? artist : `TIDAL - ${artist}`,
            smallImageUrl: `https://tidal.com/artist/${artistid}`,
            statusDisplayType: 1, // 0 = activity name, 1 = state (artist), 2 = details (song)
            buttons: [{label: 'Listen on TIDAL', url: url}]
        };
    }
}

class RichPresenceManager {
    constructor() {
        this.timeManager = new TimeManager();
        this.rpcdata = null;
        this.client = null;
    }

    setClient(client) {
        this.client = client;
    }

    validateData(song, artist, album, url, cover, length) {
        if (!song || !artist || !album || !url || !cover || !length) {
            console.error('Missing data for RPC.');
            return false;
        }
        return true;
    }

    validateClient() {
        if (!this.client || !this.client.user) {
            console.error('Client user is not ready.');
            return false;
        }
        return true;
    }

    async updatePresence(song, artist, artistid, artistphoto, album, albumid, url, cover, length, currentPosition = null, mediaInfo = null) {
        if (!this.validateClient() || !this.validateData(song, artist, album, url, cover, length)) {
            this.rpcdata = null;
            return;
        }

        try {
            this.timeManager.updateTiming(song, artist, length, currentPosition, mediaInfo);
            const timestamps = this.timeManager.getTimestamps();

            this.rpcdata = RPCDataBuilder.build(
                song, artist, artistid, artistphoto, album,
                albumid, url, cover, timestamps
            );

            await this.client.user.setActivity(this.rpcdata);
            console.log('Rich presence updated!');

            this.timeManager.lastSong = this.rpcdata;
        } catch (error) {
            console.error('Error setting activity:', error);
        }
    }

    async clearPresence() {
        if (!this.validateClient()) return;

        try {
            this.timeManager.updateElapsed();
            await this.client.user.clearActivity();
            console.log('Rich presence cleared!');
            this.rpcdata = null;
        } catch (error) {
            console.error('Error clearing activity:', error);
        }
    }

    // Getters for backward compatibility
    get rpcData() { return this.rpcdata; }
    get startTime() { return this.timeManager.starttime; }
    get endTime() { return this.timeManager.endtime; }
}

// Create a singleton instance
const presenceManager = new RichPresenceManager();

// Export functions for backward compatibility
export async function updateRichPresence(song, artist, artistid, artistphoto, album, albumid, url, cover, length, currentPosition = null, mediaInfo = null) {
    return presenceManager.updatePresence(song, artist, artistid, artistphoto, album, albumid, url, cover, length, currentPosition, mediaInfo);
}

export async function clearRichPresence() {
    return presenceManager.clearPresence();
}

export function setClient(client) {
    presenceManager.setClient(client);
}

// Export getters for backward compatibility
export const rpcdata = presenceManager.rpcData;
export const starttime = presenceManager.startTime;
export const endtime = presenceManager.endTime;
