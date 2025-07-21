# Discord Rich Presence for TIDAL

A modern, real-time Discord Rich Presence client for TIDAL that displays your currently playing music with support for animated covers, accurate playback position tracking, and instant seeking detection.

![animatedcover](https://github.com/user-attachments/assets/c985ec5c-fcf4-45f6-b89e-8f95423a6d76)

![image](https://github.com/user-attachments/assets/2b3eb1f3-0ce6-4eea-9a7f-49579e970fa7)

## Features

### **Real-Time Media Detection**
- Uses [@innei/winplayer-rs](https://www.npmjs.com/package/@innei/winplayer-rs) for instant media event detection
- No polling delays - updates happen immediately when you change tracks
- Automatic fallback to window title scraping if needed

### **Advanced Playback Tracking**
- **Accurate position tracking** - Shows exact elapsed/remaining time
- **Seek detection** - Instantly updates when you skip forward/backward by 2+ seconds
- **Play/pause synchronization** - RPC updates immediately with playback state changes
- **Smart timing calculation** - Maintains accuracy even during network interruptions or Discord restarts/crashes

### **Other Cool Stuff**
- **Animated album covers** - Supports TIDAL's video covers converted to GIFs
- **Artist photos** - Optional artist images in the corner
- **Clickable links** - Direct links to songs, albums, and artists on TIDAL

## Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/AleksandarN-BG/PublicDiscordTidalRPC.git
   cd PublicDiscordTidalRPC
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure settings** in `src/config.js`:
   ```javascript
   export const CONFIG = {
       COUNTRY_CODE: "US", // Your two-letter country code
       DISPLAY_VERSIONS: true, // Show version info (e.g., "Remastered")
       DISPLAY_ARTIST_PHOTO: true, // Show artist photo in corner
       SORT_BY: "popularity", // "popularity" or "releaseDate"
       // ... other settings
   };
   ```

## Usage

**Start the application:**
```bash
npm run start
```

## How It Works

### Media Detection Pipeline
1. **Primary Method**: [@innei/winplayer-rs](https://www.npmjs.com/package/@innei/winplayer-rs) monitors Windows Media Session API
2. **Event-Driven**: Responds to `MediaPropertiesChanged`, `PlaybackInfoChanged`, and `TimelinePropertiesChanged` events
3. **Fallback Method**: PowerShell-based window title scraping if primary method fails as a legacy feature from v1.0.0

### Smart Position Tracking
- **Natural Progression**: Tracks expected playback position based on elapsed time
- **Seek Detection**: Compares actual vs. expected position to detect jumps ≥2 seconds
- **Instant Updates**: Discord RPC updates immediately when seeking is detected

### API Integration
- **TIDAL Search API**: Matches playing tracks with TIDAL's database
- **Metadata Enrichment**: Fetches album info, cover art, and artist photos
- **Cover Processing**: Converts video covers to animated GIFs using FFmpeg
- **GIF Hosting**: Uploads animated covers to uguu.se for Discord compatibility

## Configuration Options

Located in `src/config.js`:

### Display Settings
- `DISPLAY_VERSIONS`: Show track versions (e.g., "Remastered", "Radio Edit")
- `DISPLAY_ARTIST_PHOTO`: Display artist photo in the small image corner
- `SORT_BY`: Search result sorting - "popularity" or "releaseDate"

### Performance Settings
- `SONG_CHECK_INTERVAL`: Monitoring frequency (default: 1000ms)
- `MAX_RECONNECT_ATTEMPTS`: Discord reconnection attempts (default: 10)
- `RECONNECT_DELAY`: Base delay between reconnection attempts (default: 5000ms)

### Image Quality
- `ALBUM_COVER_SIZE`: Cover resolution (default: "1280x1280")
- `ARTIST_PHOTO_SIZE`: Artist photo resolution (default: "160x160")

## Architecture

### Core Components
- **`main.js`**: Application orchestrator and monitoring loop
- **`fetchMediaInfo.js`**: Real-time media detection using winplayer-rs
- **`updateRichPresence.js`**: Discord RPC management with smart timing
- **`getAlbum.js`**: TIDAL API integration and metadata fetching
- **`getAlbumCover.js`**: Cover art processing and animated GIF generation
- **`DiscordClientManager.js`**: Connection management with auto-reconnection

### Event Flow
```
TIDAL Media Event → winplayer-rs → fetchMediaInfo() → 
Main App Logic → TIDAL API → Cover Processing → 
Discord RPC Update
```

## Requirements

- **Windows 10/11** (Uses Windows Media Session API)
- **Node.js 18+**

## Contributing

This project has evolved significantly from its original implementation. Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Test your changes thoroughly
4. Submit a pull request with detailed description

## Changelog

### v2.0.0 (Current)
- **Complete rewrite** using @innei/winplayer-rs
- **Real-time event detection** - no more polling delays
- **Advanced seek detection** - instant position updates
- **Improved error handling** and automatic recovery
- **Spam prevention** in console output
- **Enhanced timing accuracy** with smart position tracking

### v1.0.0 (Legacy)
- Basic window title scraping with edge.js
- Polling-based detection
- Limited timing accuracy

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [@xhayper/discord-rpc](https://www.npmjs.com/package/@xhayper/discord-rpc) - For the Discord RPC client
- [@innei/winplayer-rs](https://www.npmjs.com/package/@innei/winplayer-rs) - For excellent Windows Media Session integration
- [FFmpeg](https://ffmpeg.org/) - For media processing
- [uguu.se](https://uguu.se/) - For image hosting


