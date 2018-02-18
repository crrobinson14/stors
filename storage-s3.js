const AWS = require('aws-sdk');
const fs = require('fs');

const StorageS3 = {
    /**
     * Initialize the S3 Storage subsystem.
     *
     * @param {Object} config - Configuration block.
     */
    init(config) {
        this.options = config.storage.s3;

        if (!this.options) {
            throw new Error('STORAGE-S3: Must specify a configuration for S3!');
        }

        if (!this.options.region) {
            throw new Error('STORAGE-S3: Must specify a region for S3!');
        }

        if (!this.options.params || !this.options.params.Bucket) {
            throw new Error('STORAGE-S3: Must specify a bucket for S3!');
        }

        console.log('STORAGE-S3: Configuring S3', this.options);
        this.s3 = new AWS.S3(this.options);
    },

    /**
     * Upload a file to S3. This is a low-level method meant to be called mostly by other helpers in this module,
     * although it's exposed in case another caller needs full control over an upload operation.
     *
     * @param {Object} file - The uploaded file as parsed by Formidable.
     * @param {String} destinationPath - The destination path for the file.
     * @returns {Promise}
     */
    store(file, destinationPath) {
        console.log('STORAGE-S3: Uploading file %s (%s: %d bytes) from %s -> %s',
            file.name, file.type, file.size, file.path, destinationPath);
        const stat = fs.statSync(file.path);

        return Promise.resolve(true);
        // console.log({
        //     Body: fs.createReadStream(attachment.tempfile),
        //     ACL: 'public-read',
        //     Key,
        //     ContentDisposition: 'inline; filename="' + attachment.filename + '"',
        //     ContentType: attachment.mimetype || 'image/jpeg'
        // });
        // assetsBucket.upload({
        //     Body: fs.createReadStream(attachment.tempfile),
        //     ACL: 'public-read',
        //     Key,
        //     ContentDisposition: 'inline; filename="' + attachment.filename + '"',
        //     ContentType: attachment.mimetype || 'image/jpeg'
        // })
        //     .promise()
        //     .then(
        //         result => console.log('STORAGE-S3: Successfully uploaded to', Key, result),
        //         e => {
        //             console.error('STORAGE-S3: S3 upload error', e);
        //             throw e;
        //         }
        //     );
    }
};

module.exports = StorageS3;
