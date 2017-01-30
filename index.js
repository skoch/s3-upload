console.log('************************');
console.log('** HCS S3 Upload Tool **');
console.log('************************\n');

require('dotenv').config();
const cli = require('cli');
const s3 = require('s3');

if(!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.log('Ooops, please fill out your AWS credentials in the .env file!');
    process.exit();
}

cli.parse({
    dir: ['d', 'Path to directory', 'string'],
    file: ['f', 'Path to file', 'string'],
});

var client = s3.createClient({
    s3Options: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

// if(!process.env.LOCALFILE) {
//     console.log('Error: no LOCALFILE found, please update the .env file');
//     process.exit();
// }

cli.main((args, options) => {
    if (options.file) {
        const localFile = options.file;
        const parts = localFile.split('/');
        const fileName = parts[parts.length - 1];

        const params = {
            localFile: localFile,
            s3Params: {
                Bucket: process.env.AWS_S3_BUCKET,
                Key: `${process.env.AWS_FILE_PATH}${fileName}`,
                ACL: "public-read"
            },
        };

        const uploader = client.uploadFile(params);
        uploader.on('error', function(err) {
            console.error("unable to upload:", err.stack);
        });
        uploader.on('fileOpened', function() {
            console.log('Starting upload of', localFile);
        });
        uploader.on('progress', function() {
            const pct = (uploader.progressAmount / uploader.progressTotal) * 100;
            process.stdout.clearLine();
            process.stdout.cursorTo(0);
            process.stdout.write(`progress: ${pct}%`);
        });
        uploader.on('end', function() {
            console.log(`\ndone ... \nfile access: https://s3.amazonaws.com/${process.env.AWS_S3_BUCKET}/${process.env.AWS_FILE_PATH}${fileName}`);
        });

    } else if (options.dir) {
        const dir = options.dir;

        const params = {
            localDir: dir,
            // default false, whether to remove s3 objects
            // that have no corresponding local file.
            deleteRemoved: true,
            s3Params: {
                Bucket: process.env.AWS_S3_BUCKET,
                Key: `${process.env.AWS_FILE_PATH}`,
                ACL: "public-read"
            },
        };

        const uploader = client.uploadDir(params);
        uploader.on('error', function(err) {
            console.error("unable to sync:", err.stack);
        });
        uploader.on('progress', function() {
            const pct = (uploader.progressAmount / uploader.progressTotal) * 100;
            process.stdout.clearLine();
            process.stdout.cursorTo(0);
            process.stdout.write(`progress: ${pct}%`);
        });
        uploader.on('end', function() {
            // console.log("done uploading");
            console.log(`\ndone ... \nbase path: https://s3.amazonaws.com/${process.env.AWS_S3_BUCKET}/${process.env.AWS_FILE_PATH}`);
        });
    }
});

