# STORS

> File upload and management service with support for thumbnailing, S3 storage, and JWT-based user authentication

Stors is a straightforward ExpressJS app for receiving and storing user uploads. There are many modules like this
available (e.g. `multer-s3`) but STORS was designed to address a few use cases that some applications have that are
not provided by other solutions:

  1. Upload requests can be validated by checking for a JWT auth token. The JWT can be issued by another server (e.g.
  the back-end API the client application is talking to). This is much simpler and easier to use than S3 Signed Requests
  or other auth techniques.

  2. Metadata such as token contents, UUIDs, and date elements may be used to format clean, final URLs for uploaded
  assets.

  3. S3 is currently supported as a storage backend, but the storage layer is modular. New destinations may be easily
  added by implementing a simple module interface (`init()` and `store()`).

  4. After upload requests have been completed, a Webhook may be called with the information about the upload and the
  authentication block if enabled. This can allow back-ends to update database references to files without having to
  "trust" the user. The back-end could also kick of validation or post-processing routines.

## Installation and Configuration

Installation is simple. Just clone this repository into a suitable working directory, then copy `config.json.sample`
to `config.json` and customize to suit your needs. Run the service via `npm start`, although a NodeJS daemon manager
such as `ForeverJS` or `PM2` is recommended.

### Basic Options

    {
        "port": 3000,
        "uploadUri": "/upload",
        ...
    }

*port*: The port to listen on. May be overriden with the `PORT` environment variable, e.g. `PORT=80 npm start`.
 Defaults to 3000.

*uploadUri*: The path to listen on for uploads, e.g. "/upload".

### Notifications

The notifications block is optional and may be omitted to disable this feature. If included, each upload request will
trigger a POST request to the specified url after the files have been processed (and before the final response is made
to the client).

Requests are not retried - if high reliability is required for this step, it is recommended that you use a reliable,
scalable service for making this hook, such as an AWS Lambda + Dead Letter Queue endpoint. Failures to post to the
notification endpoint DO trigger errors to the client requesting the upload, so a (less ideal, but simpler) alternative
may be to offer the end-user a "retry" option.

Note that one request is triggered *per upload request*, not per uploaded file. If a request contains multiple files,
they will be included together in a single notification.

    {
        ...
        "notifications": {
            "url": "https://requestb.in/1as1q1s1",
            "fields": {
                "secretKey": "1234"
            }
        },
        ...
    }

*url*: The URL to trigger a POST request to for each upload.

*fields*: Optional collection of additional fields to merge into the POST request. May be useful for including routing
data and/or a secret key to authenticate the notification.

The notification will include the following fields:

    {
        source: 'stors',
        event: 'upload',
        session: {
            token: /* Optional. Included if JWT authentication is enabled. Will contain the decoded token fields. */ }
        },
        uploads: [{
            fieldName: 'thumbnail',
            destinationPath: 'path/to/file.jpg',
            mimetype: 'image/jpeg',
            size: 6236,
            url: 'https://mybucket.s3.amazonaws.com/path/to/file.jpg'
        }, {... additional files ...}],
        secretKey: '1234'
    }

### Storage

The storage system was designed to be modular, although today only an S3 engine is provided. To create a new storage
engine simply copy `storage-s3.js` to a new file, adjust the logic (there are only two methods), and load it in
`storage.js`.

    {
        ...
        "storage": {
            "destinationPath": "{date.y}/{date.m}/{token.userId}/{uuid}{ext}",
            ...
        },
        ...
    }

*destinationPath*: Tokenized string indicating where the file should be stored in the back-end. Relative to the root
of the configured destination. Tokens must be placed in curly brackets. Some standard token replacements are available:

  - `{date.\[y/m/d/h/i/s/ms]}` - Date fields (year, month, day, hour, minute, second, millisecond). Note: dates are
  generated at the time the upload request is processed, not per file. Do not use dates as unique identifiers!
  - `{token.\[fieldname]}` - Field from an authentication token. Note: currently these are not validated and if not
  present, will be silently ignored! It is up to the application developer to provide valid tokens!
  - `{uuid}` - A UUIDv4 unique value for each file.
  - `{ext}` - The original extension for the file.

#### S3 Engine

    {
        ...
        "storage": {
            "s3": {
                 "region": "us-east-1",
                 "params": {
                     "Bucket": "my-bucket"
                 }
            }
        },
        ...
    }

*region*: S3 region the bucket is in.

*params.Bucket*: Bucket name to upload to.

These parameters are passed to the AWS.S3 SDK during configuration when the application is started. This means you can
include any additional parameters as required. For instance, an ideal configuration would use EC2 Instance Roles to not
require authentication here. However, if this is not possible (server is hosted elsewhere, or to support local dev
work) you can easily include an access key and secret here:

    {
        ...
        "storage": {
            "s3": {
                 "accessKeyId": "ACCESSKEY",
                 "secretAccessKey": "SECRETKEY",
                 "region": "us-east-1",
                 "params": {
                     "Bucket": "my-bucket"
                 }
            }
        },
        ...
    }

For a full list of configuration options available, see
[Constructing a S3 object](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#constructor-property)

### Form Processing

Form processing is handled by [Formidable](https://github.com/felixge/node-formidable). For a full list of options
please see that project's documentation, but reasonable defaults might be:

    {
        ...
        "formidable": {
            "encoding": "utf-8",
            "keepExtensions": true,
            "multiples": true
        },
        ...
    }

### Authentication

User access to the service may be validated using [JWT](https://github.com/auth0/node-jsonwebtoken). Auth settings are
passed directly to the JWT library - for a full list of options, please see that project's documentation.

    {
        ...
        "auth": {
            "secret": "CHANGEME",
            "algorithm": "HS256"
        },
        ...
    }

This is a very simple yet powerful mechanism because it can address two use-cases:

  1. If you are already assigning JWTs to your users as part of other authentication mechanisms, you can reuse the same
  token here. Just make sure the client sends the token with each upload request, and configure the secret to match your
  other servers. As a bonus, any data (e.g. `userId`) that you encode into the token is made available through the
  request handling (and Notification postback) in Stors. This makes it easy to match up files in your back-end to the
  users uploading them.

  2. If you prefer a more secure approach, you can have your back-end pre-flight upload requests. Configure your
  application to make an API call to your back-end before an upload is transmitted. The back-end can validate the
  request and issue an application-specific JWT with a very short expiration (e.g. 60 seconds). For additional security
  you can even generate unique field names to make sure a token cannot be used more than once.
