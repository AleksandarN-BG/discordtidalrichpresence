import path from "path";
import axios from "axios";
import fs from "fs";
import {MessageAttachment} from "discord.js-selfbot-v13";
import {client} from "../main.js";
import {fileURLToPath} from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadedImages = new Map();

export async function getAlbumCover(uuid) {
    let parseduuid = uuid.replace(/-/g, '/');

    if (uploadedImages.has(parseduuid)) {
        console.log(`Image with UUID ${uuid} has already been uploaded.`);
        return Promise.resolve(uploadedImages.get(parseduuid));
    }

    const coverUrl = `https://resources.tidal.com/images/${parseduuid}/1280x1280.jpg`;
    const imagePath = path.join(__dirname, `${uuid}.jpg`);

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

        const message = await client.channels.cache.get('1294705928196591658').send({files: [attachment]});

        console.log(`Image uploaded: ${message.attachments.first().url}`);
        uploadedImages.set(parseduuid, message.attachments.first().url);

        fs.unlinkSync(imagePath);

        return message.attachments.first().url;
    } catch (error) {
        console.error('Error uploading image:', error);
        throw error;
    }
}