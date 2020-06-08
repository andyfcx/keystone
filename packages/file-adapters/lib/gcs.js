const { Storage } = require('@google-cloud/storage');
const path = require('path')
const gcskeyfile = './configs/gcskeyfile.json';


module.exports.GCSAdapter = class {
    constructor(gcsDir, gcskeyfilePath = gcskeyfile) {
        gcskeyfilePath = path.resolve(gcskeyfile)
        if (!gcskeyfilePath) {
            throw new Error('GCSAdapter needs you specifies GOOGLE_APPLICATION_CREDENTIALS, should be a string path')
        }
        process.env.GOOGLE_APPLICATION_CREDENTIALS = gcskeyfilePath
        this.storage = new Storage()
        this.bucket = this.storage.bucket('mirrormedia-files')
        this.gcsDir = gcsDir
    }

    getFilename({ id, originalFilename }) {
        return `${id}-${originalFilename}`;
    }

    // https://googleapis.dev/nodejs/storage/latest/Bucket.html#upload
    // https://googleapis.dev/nodejs/storage/latest/File.html#createWriteStream
    async save({ stream, filename, mimetype, encoding, id }) {
        const baseName = path.basename(filename)
        const file = this.bucket.file(`${this.gcsDir}${baseName}`)

        try {
            const fulfilled = stream.pipe(file.createWriteStream(this.getOptions(baseName)) )
        }
        catch (err) { console.log(err) }
        return { id, filename, mimetype }
    }

    getOptions(filename) {
        let destination = `${this.gcsDir}${filename}`;
        console.log("UPLOAD TO destination: " + destination)
        let options = {
            gzip: true,
            destination: destination,
            metadata: {
                cacheControl: 'public, max-age=31536000',
            },
        };


        return options
    }

    async delete(filename) {
        await this.bucket.file(filename).delete();

        console.log(`gs://${this.gcsDir}${filename} deleted.`);
    }

    async makePublic(filename) {
        // Makes the file public
        await this.bucket.file(`${this.gcsDir}{filename}`).makePublic();
    }

    PublicUrl(filename) {
        let s = `https://storage.googleapis.com/${this.bucket}/${filename}`
        return s
    }
}


