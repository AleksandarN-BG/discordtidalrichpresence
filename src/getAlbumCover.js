import path from "path";
import axios from "axios";
import fs from "fs";
import {fileURLToPath} from "url";
import FormData from "form-data";
import ffmpeg from "fluent-ffmpeg";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadedImages = new Map();

export async function getAlbumCover(uuid, videouuid) {
    let parseduuid = uuid ? uuid.replace(/-/g, '/') : null;
    let parsedvideouuid = videouuid ? videouuid.replace(/-/g, '/') : null;


    if (uploadedImages.has(parseduuid)) {
        console.log(`Image with UUID ${uuid} has already been uploaded.`);
        return Promise.resolve(uploadedImages.get(parseduuid));
    }

    if (uploadedImages.has(parsedvideouuid)) {
        console.log(`Video with UUID ${videouuid} has already been uploaded.`);
        return Promise.resolve(uploadedImages.get(parsedvideouuid));
    }

    const coverUrl = `https://resources.tidal.com/images/${parseduuid}/1280x1280.jpg`;

    path.join(__dirname, `${uuid}.jpg`);
    if (videouuid) {
        console.log('Video cover found! Uploading that instead...')
        let parsedvideouuid = videouuid.replace(/-/g, '/');
        const videoCoverUrl = `https://resources.tidal.com/videos/${parsedvideouuid}/1280x1280.mp4`;
        const VideoPath = path.join(__dirname, `${videouuid}.mp4`);
        const GifPath = path.join(__dirname, `${videouuid}.gif`);

        try {
            const response = await axios({
                url: videoCoverUrl,
                responseType: 'stream',
            });

            await new Promise((resolve, reject) => {
                const stream = response.data.pipe(fs.createWriteStream(VideoPath));
                stream.on('finish', resolve);
                stream.on('error', reject);
            });

            await new Promise((resolve, reject) => {
                ffmpeg(VideoPath)
                    .output(GifPath)
                    .outputOptions('-vf', 'scale=320:-1')
                    .on('end', resolve)
                    .on('error', reject)
                    .run();
            });

            const form = new FormData();
            form.append('files[]', fs.createReadStream(GifPath));

            const uploadResponse = await axios.post('https://uguu.se/upload', form, {
                headers: {
                    ...form.getHeaders()
                }
            });

            const gifUrl = uploadResponse.data.files[0].url;
            console.log(`Animated cover uploaded: ${gifUrl}`);
            uploadedImages.set(parsedvideouuid, gifUrl);

            fs.unlinkSync(VideoPath);
            fs.unlinkSync(GifPath);

            return gifUrl;
        } catch (error) {
            console.error('Error uploading image:', error);
            throw error;
        }
    }
 else {
        return coverUrl;
    }
}

export async function getArtistPhoto(artistuuid) {
    let parsedartistphoto = artistuuid.replace(/-/g, '/');

    return `https://resources.tidal.com/images/${parsedartistphoto}/160x160.jpg`;
}
