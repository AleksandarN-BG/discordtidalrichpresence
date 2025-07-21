import path from "path";
import axios from "axios";
import fs from "fs";
import {fileURLToPath} from "url";
import FormData from "form-data";
import ffmpeg from "fluent-ffmpeg";
import { CONFIG } from "./config.js";
import { parseUUID } from "./utils.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class CoverCache {
    constructor() {
        this.uploadedImages = new Map();
    }

    has(uuid) {
        return this.uploadedImages.has(uuid);
    }

    get(uuid) {
        return this.uploadedImages.get(uuid);
    }

    set(uuid, url) {
        this.uploadedImages.set(uuid, url);
    }
}

class ImageCoverHandler {
    static getCoverUrl(uuid) {
        const parsedUuid = parseUUID(uuid);
        return `${CONFIG.TIDAL_IMAGES_URL}/${parsedUuid}/${CONFIG.ALBUM_COVER_SIZE}.jpg`;
    }
}

class VideoCoverHandler {
    constructor(cache) {
        this.cache = cache;
    }

    async process(videouuid) {
        console.log('Video cover found! Uploading that instead...');

        const parsedVideoUuid = parseUUID(videouuid);
        const videoCoverUrl = `${CONFIG.TIDAL_VIDEOS_URL}/${parsedVideoUuid}/${CONFIG.ALBUM_COVER_SIZE}.mp4`;
        const videoPath = path.join(__dirname, `${videouuid}.mp4`);
        const gifPath = path.join(__dirname, `${videouuid}.gif`);

        try {
            await this.downloadVideo(videoCoverUrl, videoPath);
            await this.convertToGif(videoPath, gifPath);
            const gifUrl = await this.uploadGif(gifPath);

            this.cache.set(parsedVideoUuid, gifUrl);
            this.cleanup(videoPath, gifPath);

            console.log(`Animated cover uploaded: ${gifUrl}`);
            return gifUrl;
        } catch (error) {
            console.error('Error processing video cover:', error);
            this.cleanup(videoPath, gifPath);
            throw error;
        }
    }

    async downloadVideo(url, filePath) {
        const response = await axios({
            url,
            responseType: 'stream',
        });

        return new Promise((resolve, reject) => {
            const stream = response.data.pipe(fs.createWriteStream(filePath));
            stream.on('finish', resolve);
            stream.on('error', reject);
        });
    }

    async convertToGif(videoPath, gifPath) {
        return new Promise((resolve, reject) => {
            ffmpeg(videoPath)
                .output(gifPath)
                .outputOptions('-vf', 'scale=320:-1')
                .on('end', resolve)
                .on('error', reject)
                .run();
        });
    }

    async uploadGif(gifPath) {
        const form = new FormData();
        form.append('files[]', fs.createReadStream(gifPath));

        const uploadResponse = await axios.post(CONFIG.UPLOAD_URL, form, {
            headers: {
                ...form.getHeaders()
            }
        });

        return uploadResponse.data.files[0].url;
    }

    cleanup(videoPath, gifPath) {
        try {
            if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
            if (fs.existsSync(gifPath)) fs.unlinkSync(gifPath);
        } catch (error) {
            console.warn('Error cleaning up temporary files:', error);
        }
    }
}

class CoverManager {
    constructor() {
        this.cache = new CoverCache();
        this.videoHandler = new VideoCoverHandler(this.cache);
    }

    async getCover(uuid, videouuid) {
        // Check cache first
        if (uuid) {
            const parsedUuid = parseUUID(uuid);
            if (this.cache.has(parsedUuid)) {
                console.log(`Image with UUID ${uuid} has already been uploaded.`);
                return this.cache.get(parsedUuid);
            }
        }

        if (videouuid) {
            const parsedVideoUuid = parseUUID(videouuid);
            if (this.cache.has(parsedVideoUuid)) {
                console.log(`Video with UUID ${videouuid} has already been uploaded.`);
                return this.cache.get(parsedVideoUuid);
            }

            return await this.videoHandler.process(videouuid);
        }

        // Return static image URL for regular covers
        return ImageCoverHandler.getCoverUrl(uuid);
    }
}

const coverManager = new CoverManager();

export async function getAlbumCover(uuid, videouuid) {
    return coverManager.getCover(uuid, videouuid);
}

export async function getArtistPhoto(artistuuid) {
    const parsedArtistPhoto = parseUUID(artistuuid);
    return `${CONFIG.TIDAL_IMAGES_URL}/${parsedArtistPhoto}/${CONFIG.ARTIST_PHOTO_SIZE}.jpg`;
}
