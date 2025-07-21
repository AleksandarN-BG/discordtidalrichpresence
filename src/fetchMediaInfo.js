import winplayer from "@innei/winplayer-rs/emitter/index.js";

let playerManager = null;
let currentMediaInfo = null;
let lastPositionUpdateTime = 0;
let lastLoggedStatus = null; // Add flag to prevent spam logging

async function initializeWinPlayer() {
    if (playerManager) {
        return true; // Already initialized
    }

    try {
        console.log("Initializing @innei/winplayer-rs...");

        // Get the player manager using the default function
        playerManager = await winplayer.default();

        if (!playerManager) {
            console.error("Failed to get WinPlayer manager");
            return false;
        }

        console.log("@innei/winplayer-rs initialized successfully");

        // Set up event listeners for media changes
        playerManager.on("MediaPropertiesChanged", (status) => {
            if (status && status.app === "com.squirrel.TIDAL.TIDAL") {
                currentMediaInfo = {
                    ...currentMediaInfo,
                    artist: status.metadata.artist || "",
                    title: status.metadata.title || "",
                    album: status.metadata.album || "",
                    duration: status.metadata.length ? Math.floor(status.metadata.length) : 0,
                    sourceApp: status.app
                };
                console.log(`Media properties updated: ${currentMediaInfo.artist} - ${currentMediaInfo.title}`);
            }
        });

        playerManager.on("PlaybackInfoChanged", (status) => {
            if (status && status.app === "com.squirrel.TIDAL.TIDAL") {
                // Parse the playback status
                let playbackStatus = "Unknown";
                if (status.status) {
                    const statusMatch = status.status.match(/\((\d+)\)/);
                    if (statusMatch) {
                        const statusCode = parseInt(statusMatch[1]);
                        switch (statusCode) {
                            case 4: playbackStatus = "Playing"; break;
                            case 5: playbackStatus = "Paused"; break;
                            case 3: playbackStatus = "Stopped"; break;
                            default: playbackStatus = "Unknown"; break;
                        }
                    }
                }

                currentMediaInfo = {
                    ...currentMediaInfo,
                    artist: status.metadata.artist || "",
                    title: status.metadata.title || "",
                    album: status.metadata.album || "",
                    playbackStatus: playbackStatus,
                    duration: status.metadata.length ? Math.floor(status.metadata.length) : 0,
                    position: status.elapsed ? Math.floor(status.elapsed.howMuch) : 0,
                    sourceApp: status.app
                };

                // Reset position tracking when new media starts playing
                if (playbackStatus === "Playing" && lastPositionUpdateTime === 0) {
                    lastPositionUpdateTime = Date.now();
                }

                console.log(`Playback status: ${playbackStatus} at ${currentMediaInfo.position}s`);
            }
        });

        playerManager.on("TimelinePropertiesChanged", (position) => {
            if (currentMediaInfo && currentMediaInfo.sourceApp === "com.squirrel.TIDAL.TIDAL") {
                const newPosition = position.howMuch ? Math.floor(position.howMuch) : 0;
                const oldPosition = currentMediaInfo.position || 0;
                const currentTime = Date.now();

                // Initialize lastPositionUpdateTime if not set
                if (lastPositionUpdateTime === 0) {
                    lastPositionUpdateTime = currentTime;
                    currentMediaInfo = {
                        ...currentMediaInfo,
                        position: newPosition
                    };
                    return;
                }

                // Calculate expected position based on time elapsed since last update
                const timeDiffSeconds = (currentTime - lastPositionUpdateTime) / 1000;
                const expectedPosition = oldPosition + timeDiffSeconds;

                // Check if this is a seek (position difference > 2 seconds from expected)
                const positionDiff = Math.abs(newPosition - expectedPosition);
                const isSeek = positionDiff >= 2;

                if (isSeek) {
                    console.log(`🎵 Seeking detected! Position jumped from ${oldPosition}s to ${newPosition}s`);
                }

                currentMediaInfo = {
                    ...currentMediaInfo,
                    position: newPosition,
                    // Add a flag to indicate this was a seek operation
                    lastSeekTime: isSeek ? currentTime : (currentMediaInfo.lastSeekTime || 0)
                };

                lastPositionUpdateTime = currentTime;
            }
        });

        // Get initial state immediately after setup
        try {
            const initialStatus = await playerManager.getStatus();
            const initialPosition = await playerManager.getPosition();

            // If we have TIDAL data, populate currentMediaInfo immediately
            if (initialStatus && initialStatus.title && initialStatus.artist) {
                currentMediaInfo = {
                    artist: initialStatus.artist || "",
                    title: initialStatus.title || "",
                    album: initialStatus.albumTitle || initialStatus.album || "",
                    playbackStatus: initialStatus.playbackStatus || "Playing",
                    position: initialPosition ? Math.floor(initialPosition.position / 1000000) : 0,
                    duration: initialPosition ? Math.floor(initialPosition.endTime / 1000000) : 0,
                    sourceApp: "com.squirrel.TIDAL.TIDAL"
                };

                console.log(`Initial track loaded: ${currentMediaInfo.artist} - ${currentMediaInfo.title}`);
            }
        } catch (initialError) {
            console.log("Could not get initial state, will wait for events");
        }

        return true;
    } catch (error) {
        console.error("Failed to initialize @innei/winplayer-rs:", error);
        return false;
    }
}

export async function fetchMediaInfo() {
    try {
        // Initialize WinPlayer if not already done
        const initialized = await initializeWinPlayer();
        if (!initialized) {
            console.log("WinPlayer initialization failed, falling back to window title");
            return await fallbackToWindowTitle();
        }

        // Use the real-time event data instead of slow direct calls
        if (!currentMediaInfo || !currentMediaInfo.title || !currentMediaInfo.artist) {
            return null;
        }

        // Only return data if TIDAL is actually playing
        if (currentMediaInfo.playbackStatus !== "Playing") {
            // Only log once when status changes to avoid spam
            if (lastLoggedStatus !== currentMediaInfo.playbackStatus) {
                console.log(`TIDAL is ${currentMediaInfo.playbackStatus || 'unknown'}, clearing RPC...`);
                lastLoggedStatus = currentMediaInfo.playbackStatus;
            }
            return null;
        }

        // Reset logged status when playing
        if (lastLoggedStatus !== "Playing") {
            lastLoggedStatus = "Playing";
        }

        return {
            artist: currentMediaInfo.artist,
            title: currentMediaInfo.title,
            album: currentMediaInfo.album || "",
            playbackStatus: currentMediaInfo.playbackStatus,
            position: currentMediaInfo.position || 0,
            duration: currentMediaInfo.duration || 0,
            lastSeekTime: currentMediaInfo.lastSeekTime || 0,
            query: `${currentMediaInfo.artist} - ${currentMediaInfo.title}`
        };

    } catch (error) {
        console.error("Error fetching media info from @innei/winplayer-rs:", error);
        console.log("Falling back to window title method...");
        return await fallbackToWindowTitle();
    }
}

// Fallback function for when WinPlayer fails
async function fallbackToWindowTitle() {
    try {
        // Simple process enumeration without edge.js
        const { spawn } = await import("child_process");

        return new Promise((resolve) => {
            const powershell = spawn("powershell.exe", [
                "-Command",
                "Get-Process -Name 'TIDAL' -ErrorAction SilentlyContinue | Select-Object -ExpandProperty MainWindowTitle"
            ], {
                stdio: ["ignore", "pipe", "pipe"]
            });

            let stdout = "";

            powershell.stdout.on("data", (data) => {
                stdout += data.toString();
            });

            powershell.on("close", () => {
                const windowTitle = stdout.trim();

                if (!windowTitle || windowTitle === "TIDAL") {
                    console.log("No media info available or TIDAL not playing (fallback)");
                    resolve(null);
                    return;
                }

                // Parse the window title to extract artist and title
                const parts = windowTitle.split(" - ");
                if (parts.length < 2) {
                    console.log("Could not parse window title:", windowTitle);
                    resolve(null);
                    return;
                }

                const artist = parts[0].trim();
                const title = parts.slice(1).join(" - ").trim();

                console.log(`🎵 [DEBUG] Fallback - Parsed from window title: Artist="${artist}", Title="${title}"`);

                resolve({
                    artist: artist,
                    title: title,
                    album: "",
                    playbackStatus: "Playing",
                    position: 0,
                    duration: 0,
                    query: windowTitle
                });
            });

            setTimeout(() => {
                powershell.kill();
                resolve(null);
            }, 3000);
        });

    } catch (error) {
        console.error("Error in fallback method:", error);
        return null;
    }
}
