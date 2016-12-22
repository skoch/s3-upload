console.log('************************');
console.log('** HCS S3 Upload Tool **');
console.log('************************\n');

require('dotenv').config();
var s3 = require('s3');

if(!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.log('Ooops, please fill out your AWS credentials in the .env file!');
    process.exit();
}

var client = s3.createClient({
    s3Options: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

if(!process.env.LOCALFILE) {
    console.log('Error: no LOCALFILE found, please update the .env file');
    process.exit();
}
var localFile = process.env.LOCALFILE;
var parts = localFile.split('/');
var fileName = parts[parts.length - 1];

var params = {
    localFile: localFile,
    s3Params: {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: `${process.env.AWS_FILE_PATH}${fileName}`,
        ACL: "public-read"
    },
};

var uploader = client.uploadFile(params);
uploader.on('error', function(err) {
    console.error("unable to upload:", err.stack);
});
uploader.on('fileOpened', function() {
    console.log('Starting upload of', localFile);
});
uploader.on('progress', function() {
    var pct = (uploader.progressAmount / uploader.progressTotal) * 100;
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    process.stdout.write(`progress: ${pct}%`);
});
uploader.on('end', function() {
    console.log(`\ndone ... \nfile access: https://s3.amazonaws.com/${process.env.AWS_S3_BUCKET}/${process.env.AWS_FILE_PATH}${fileName}`);
});
