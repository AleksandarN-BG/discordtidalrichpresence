import { DiscordClientManager } from "./src/DiscordClientManager.js";
import { fetchMediaInfo } from "./src/fetchMediaInfo.js";
import { getAlbum } from "./src/getAlbum.js";
import { getAlbumCover, getArtistPhoto } from "./src/getAlbumCover.js";
import { updateRichPresence, clearRichPresence, setClient } from "./src/updateRichPresence.js";
import { CONFIG } from "./src/config.js";

class TidalRPCApp {
    constructor() {
        this.discordManager = new DiscordClientManager();
        this.currentMediaInfo = null;
        this.lastMediaInfo = null;
        this.albumData = null;
        this.coverurl = null;
        this.activityCleared = false;
        this.checkSongRunning = false;
    }

    async initialize() {
        console.log("Initializing TIDAL Discord RPC...");

        if (this.discordManager.createClient()) {
            const loginSuccess = await this.discordManager.login();

            if (loginSuccess) {
                setClient(this.discordManager.client);

                this.discordManager.onReady(() => {
                    console.log("Discord client ready!");
                });

                // Start monitoring after login
                setTimeout(() => {
                    this.startMonitoring();
                }, 2000);

                this.setupGracefulShutdown();
                return true;
            }
        }
        return false;
    }

    async startMonitoring() {
        this.monitorSongs();
    }

    async monitorSongs() {
        if (this.checkSongRunning) return;

        this.checkSongRunning = true;

        try {
            // Handle reconnection if needed
            if (!this.discordManager.isConnected) {
                const reconnected = await this.discordManager.attemptReconnect();
                if (!reconnected) {
                    this.scheduleNextCheck(1000);
                    return;
                }
                setClient(this.discordManager.client);
            }

            const mediaInfo = await fetchMediaInfo();
            await this.handleMediaChange(mediaInfo);

        } catch (error) {
            console.error("Error in monitoring loop:", error);
        } finally {
            this.checkSongRunning = false;
            this.scheduleNextCheck(CONFIG.SONG_CHECK_INTERVAL);
        }
    }

    async handleMediaChange(mediaInfo) {
        this.currentMediaInfo = mediaInfo;

        // Check if song has changed
        const songChanged = this.hasSongChanged(this.lastMediaInfo, this.currentMediaInfo);

        // Check if user has seeked within the same song
        const hasSeekOccurred = this.hasSeekOccurred(this.lastMediaInfo, this.currentMediaInfo);

        if (this.currentMediaInfo && (songChanged || hasSeekOccurred)) {
            if (songChanged) {
                console.log(`Song changed! Now playing: ${this.currentMediaInfo.artist} - ${this.currentMediaInfo.title}`);
            } else if (hasSeekOccurred) {
                console.log(`Seek detected! Position changed to: ${this.currentMediaInfo.position}s`);
            }
            await this.updateRichPresenceData();
        }

        if (!this.activityCleared && this.currentMediaInfo === null) {
            await clearRichPresence();
            this.lastMediaInfo = null;
            this.activityCleared = true;
        }
    }

    hasSongChanged(lastInfo, currentInfo) {
        if (!lastInfo && currentInfo) return true;
        if (lastInfo && !currentInfo) return true;
        if (!lastInfo && !currentInfo) return false;

        return lastInfo.title !== currentInfo.title ||
               lastInfo.artist !== currentInfo.artist;
    }

    hasSeekOccurred(lastInfo, currentInfo) {
        // Only check for seeks if we have both last and current info for the same song
        if (!lastInfo || !currentInfo) return false;
        if (lastInfo.title !== currentInfo.title || lastInfo.artist !== currentInfo.artist) return false;

        // Check if the lastSeekTime flag indicates a recent seek occurred
        return !!(currentInfo.lastSeekTime && (!lastInfo.lastSeekTime || currentInfo.lastSeekTime > lastInfo.lastSeekTime));


    }

    async updateRichPresenceData() {
        try {
            this.albumData = await getAlbum(this.currentMediaInfo.query);

            if (!this.albumData) {
                return;
            }

            this.coverurl = await getAlbumCover(
                this.albumData.coveruuid,
                this.albumData.videocoveruuid
            );

            const artistPhoto = this.albumData.artistphoto
                ? await getArtistPhoto(this.albumData.artistphoto)
                : null;

            if (this.coverurl !== undefined) {
                // Use the duration from media info if available, fallback to album data
                const duration = this.currentMediaInfo.duration || this.albumData.length;

                await updateRichPresence(
                    this.albumData.title,
                    this.albumData.artist,
                    this.albumData.artistid,
                    artistPhoto,
                    this.albumData.album,
                    this.albumData.albumid,
                    this.albumData.songurl,
                    this.coverurl,
                    duration,
                    this.currentMediaInfo.position, // Pass the current position for accurate seeking
                    this.currentMediaInfo // Pass the full mediaInfo object for seek detection
                );

                this.lastMediaInfo = this.currentMediaInfo;
                this.activityCleared = false;
            }
        } catch (error) {
            console.error("Error updating rich presence:", error);
        }
    }

    scheduleNextCheck(delay = CONFIG.SONG_CHECK_INTERVAL) {
        setTimeout(() => {
            this.monitorSongs();
        }, delay);
    }

    setupGracefulShutdown() {
        process.on('SIGINT', async () => {
            try {
                if (this.discordManager.client?.user) {
                    await this.discordManager.clearActivity();
                }
                console.log("Received exit signal, clearing RPC and exiting...");
            } catch (error) {
                console.warn("Error during shutdown:", error);
            } finally {
                process.exit();
            }
        });
    }
}

// Start the application
const app = new TidalRPCApp();

app.initialize().then(success => {
    if (!success) {
        console.error("Failed to initialize application");
        process.exit(1);
    } else {
        console.log("TIDAL Discord RPC initialized successfully!");
    }
}).catch(error => {
    console.error("Application startup error:", error);
    process.exit(1);
});

// Export for backward compatibility (if needed by other modules)
export const client = app.discordManager?.client;
