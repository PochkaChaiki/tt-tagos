const fs = require('fs');

const maxLinesPerChunk = 256 * 1024 / 4;

const writeStream = fs.createWriteStream(`file.txt`);
for (i = 0; i < 2*maxLinesPerChunk+1; i++){
    writeStream.write(`abc${i}\n`);
}

writeStream.on('error', (err) => {
    throw `There is an error writing the file ${filePath} => ${err}`;
});

writeStream.end();
