import path from "path";
import axios from "axios";
import fs from "fs";
import {MessageAttachment} from "discord.js-selfbot-v13";
import {client, channel_id} from "../main.js";
import {fileURLToPath} from "url";
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
    const imagePath = path.join(__dirname, `${uuid}.jpg`);

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
                    .on('end', async function () {
                        try {
                            const attachment = new MessageAttachment(GifPath);
                            const message = await client.channels.cache.get(channel_id).send({ files: [attachment] });

                            console.log(`Animated cover uploaded: ${message.attachments.first().url}`);
                            uploadedImages.set(parsedvideouuid, message.attachments.first().url);

                            fs.unlinkSync(VideoPath);
                            fs.unlinkSync(GifPath);

                            resolve(message.attachments.first().url);
                        } catch (err) {
                            reject(err);
                        }
                    })
                    .on('error', function (err) {
                        console.error('Error creating gif:', err);
                        reject(err);
                    })
                    .run();
            });
        } catch (error) {
            console.error('Error uploading image:', error);
            throw error;
        }
    }
    else if(uuid) {
        try {
            const response = await axios({
                url: coverUrl,
                responseType: 'stream',
            });

            const writer = fs.createWriteStream(imagePath);
            response.data.pipe(writer);

            await new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });

            const attachment = new MessageAttachment(imagePath);

            const message = await client.channels.cache.get(channel_id).send({files: [attachment]});

            console.log(`Image uploaded: ${message.attachments.first().url}`);
            uploadedImages.set(parseduuid, message.attachments.first().url);

            fs.unlinkSync(imagePath);

            return message.attachments.first().url;
        } catch (error) {
            console.error('Error uploading image:', error);
            throw error;
        }
    }
}