const express = require('express');
const formidable = require('express-formidable');
const aws = require('aws-sdk');
const config = require('./config');
const jwt = require('express-jwt');
const cors = require('cors');
const morgan = require('morgan');

const s3 = new aws.S3(Object.assign({}, config.s3config));

const app = express();

const format = (str, replacements) =>
    Object
        .keys(replacements || {})
        .reduce((str, key) => str.replace(new RegExp('\\{' + key + '\\}', 'gm'), replacements[key]), str);

app.use(cors());
app.use(morgan('short'));
app.use(formidable(config.formidable));

if (config.auth && config.auth.secret === 'CHANGEME') {
    if (config.auth.secret === 'CHANGEME') {
        console.log('You must change the JWT secret to enable authentication!');
        process.exit(-1);
    }

    app.use(jwt(Object.assign({}, config.auth, { resultProperty: 'locals.token' })));
}

app.post(config.uploadUri || '/upload', (req, res) => {
    console.log(req.fields);
    console.log(req.files);
    console.log(res.locals);

    res.status(200).json({
        status: 'OK',
        result: 'It worked!'
    })
});

