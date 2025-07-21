export const CONFIG = {
    DISCORD_CLIENT_ID: "1265797224454164531",
    TIDAL_TOKEN: "CzET4vdadNUFQ5JU",
    COUNTRY_CODE: "RS",
    DISPLAY_VERSIONS: true,
    DISPLAY_ARTIST_PHOTO: true,
    SORT_BY: "popularity", // Options: "popularity", "releaseDate"

    // Connection settings
    MAX_RECONNECT_ATTEMPTS: 10,
    RECONNECT_DELAY: 5000,
    SONG_CHECK_INTERVAL: 1000, // Check every 1 second
    RETRY_DELAY: 100,

    // API endpoints
    TIDAL_SEARCH_URL: 'https://api.tidal.com/v1/search/tracks',
    TIDAL_IMAGES_URL: 'https://resources.tidal.com/images',
    TIDAL_VIDEOS_URL: 'https://resources.tidal.com/videos',
    UPLOAD_URL: 'https://uguu.se/upload',

    // Image sizes
    ALBUM_COVER_SIZE: '1280x1280',
    ARTIST_PHOTO_SIZE: '160x160'
};
