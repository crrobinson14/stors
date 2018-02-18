const uuid = require('uuid').v4;
const path = require('path');

/**
 * Format a string with replacement tokens in the format "{token}".
 *
 * @param {String} str - The path template to format.
 * @param {Object} replace - [K:V] pairs with tokens to use during formatting.
 * @param {Array} [prefixes] - Path prefixes for dotted notation.
 * @returns {String}
 */
const replaceTokens = (str, replace, prefixes) => {
    return Object
        .keys(replace || {})
        .reduce((s, field) => {
            const value = replace[field];
            if (typeof value === 'object') {
                return replaceTokens(s, replace[field], (prefixes || []).concat(field));
            }

            return s.replace(new RegExp('\\{' + (prefixes || []).concat(field).join('.') + '\\}', 'gm'), value);
        }, str);
};

const Storage = {
    /**
     * Initialize the Storage subsystem.
     *
     * @param {Object} config - Configuration block.
     */
    init(config) {
        this.options = config.storage;

        if (!this.options) {
            throw new Error('STORAGE: Must specify a storage configuration!');
        }

        if (!this.options.destinationPath) {
            throw new Error('STORAGE: Must specify a storage destinationPath!');
        }

        if (this.options.s3) {
            this.engine = require('./storage-s3');
        }

        if (this.engine) {
            console.log('STORAGE: Configuring Storage subsystem');
            this.engine.init(config);
        } else {
            throw new Error('STORAGE: Must specify a storage engine!');
        }
    },

    /**
     * Process the uploads for a request.
     *
     * @param {Object} req - Request.
     * @param {Object} res - Response.
     */
    processFiles(req, res) {
        const dt = new Date();
        const date = {
            d: dt.getUTCDate(),
            m: dt.getUTCMonth() + 1,
            y: dt.getUTCFullYear(),
            h: dt.getUTCHours(),
            i: dt.getUTCMinutes(),
            s: dt.getUTCSeconds(),
            ms: dt.getUTCMilliseconds()
        };

        const uploads = Object.keys(req.files || {}).map(fieldName => {
            const file = req.files[fieldName];

            const destinationPath = replaceTokens(this.options.destinationPath, Object.assign({}, res.locals, {
                uuid: uuid(),
                ext: path.extname(file.name),
                basename: path.basename(file.name),
                date
            }));

            console.log('STORAGE: Processing file', fieldName, destinationPath);
            return this.engine.store(file, destinationPath)
                .then(() => ({ fieldName, destinationPath, mimetype: file.type, size: file.size }));
        });

        console.log('STORAGE: Queued ' + uploads.length + ' uploads...');
        return Promise.all(uploads);
    },
};

module.exports = Storage;
