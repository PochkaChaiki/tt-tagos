const nReadLines = require('n-readlines');
const fs = require('fs');
const {unlink} = require('fs/promises');

function mergeFiles(fileName1, fileName2){
    const outFileName = fileName1+fileName2;
    const fileRead1 = new nReadLines(fileName1);
    const fileRead2 = new nReadLines(fileName2);
    const writeStream = fs.createWriteStream(outFileName);

    let lineFromFile1 = fileRead1.next();
    let lineFromFile2 = fileRead2.next();

    return new Promise((resolve, reject) => {
        while (lineFromFile1 || lineFromFile2) {
            if (!lineFromFile2 || (lineFromFile1 && lineFromFile1.toString() <= lineFromFile2.toString())) {
                writeStream.write(`${lineFromFile1}\n`);
                lineFromFile1 = fileRead1.next();
            } else {
                writeStream.write(`${lineFromFile2}\n`);
                lineFromFile2 = fileRead2.next();
            }
        }

        writeStream.on('finish', () => resolve(outFileName));
        writeStream.on('error', (reason) => reject(reason));
        writeStream.end();
    });
}

exports.saveLinesToFile = function(linesArray, filename){
    linesArray.sort(function(a, b){return a.toString().localeCompare(b.toString())});
    const writeStream = fs.createWriteStream(filename);
    linesArray.forEach(value => writeStream.write(`${value}\n`));

    return new Promise((resolve, reject) => {
        writeStream.on('finish', () => resolve());
        writeStream.on('error', (reason) => reject(reason));
        writeStream.end();
    });
}


  
exports.loopOnFiles = async function (filenames){
    while (filenames.length > 1){
        let newFileNames = []
        for (i = 0; i < filenames.length; i+=2){
            if (i + 1 < filenames.length) {
                const mergedFile = await mergeFiles(filenames[i], filenames[i + 1]);
                await unlink(filenames[i]);
                await unlink(filenames[i + 1]);
                newFileNames.push(mergedFile);
            } else {
                newFileNames.push(filenames[i]);
            }
        }
        filenames = newFileNames;
    }
    return filenames[0];
}
