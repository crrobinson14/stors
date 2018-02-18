const uuid = require('uuid').v4;

const Storage = {
    /**
     * Initialize the Storage subsystem.
     *
     * @param {Object} config - Configuration block.
     */
    init(config) {
        this.options = config.storage;

        if (!this.options) {
            throw new Error('Must specify a storage configuration!');
        }

        if (!this.options.destinationPath) {
            throw new Error('Must specify a storage destinationPath!');
        }

        if (this.options.s3) {
            this.engine = require('./storage-s3');
            return;
        }

        if (engine) {
            console.log('STORAGE: Configuring Storage', this.options);
            this.engine.init(config);
        } else {
            throw new Error('Must specify a storage engine!');
        }
    },

    /**
     * Format a destination path, with optional replacement tokens.
     *
     * @param {String} str - The path template to format.
     * @param {Object} replacements - [K:V] pairs with tokens to use during formatting.
     * @returns {String}
     */
    formatDestination(str, replacements) {
        return Object
            .keys(replacements || {})
            .reduce((str, key) => str.replace(new RegExp('\\{' + key + '\\}', 'gm'), replacements[key]), str);
    },

    /**
     * Process the uploads for a request.
     *
     * @param {Object} req - Request.
     * @param {Object} res - Response.
     */
    processFiles(req, res) {
        const uploads = Object.keys(req.files || {}).map(fieldName => {
            const file = req.files[fieldName];
            const destinationPath = Storage.formatDestination(this.options.destinationPath, {
                token: res.locals.token || {},
                uuid: uuid(),
            });

            console.log('Processing file', fieldName, destinationPath, file);
            return this.engine.store(file, destinationPath)
                .then(() => ({
                    fieldName,
                    destinationPath,
                    mimetype: file.type,
                    size: file.size,
                }));
        });

        console.log('STORAGE: Queued ' + uploads.length + ' uploads...');
        return Promise.all(uploads);
    },
};

module.exports = Storage;
