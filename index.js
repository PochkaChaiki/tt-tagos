const nReadLines = require('n-readlines');
const fs = require('fs');
const {saveLinesToFile, loopOnFiles} = require('./sortFile.js');

const maxLinesPerChunk = 256 * 1024 / 4;


async function main() {
    const filePath = "file.txt";
    const outPath = "outFile.txt";
    const bigFileLines = new nReadLines(filePath);
    let line;
    let tmpFileNumber = 1;
    let linesArray = [];
    let filenames = [];
     
    // reading and sorting single file to multiple small
    while ((line = bigFileLines.next())) {
        linesArray.push(line.toString());

        if (linesArray.length >= maxLinesPerChunk) {
            const filename = `tmp${tmpFileNumber}.txt`;
            await saveLinesToFile(linesArray, filename);
            filenames.push(filename);
            linesArray = [];
            tmpFileNumber++;
        }
    }
    if (linesArray.length > 0) {
        const filename = `tmp${tmpFileNumber}.txt`;
        await saveLinesToFile(linesArray, filename);
        filenames.push(filename);
    }

    // reading and merging files to one
    let outFile = await loopOnFiles(filenames);
    outFile = await new Promise((resolve, reject)=>{
        fs.rename(outFile, outPath, (err)=> {
            if (err !== null) {
                reject(`error rename file: ${err.message}`);
            }
            resolve(outPath);
        });

    });
    console.log(`Result file: ${outFile}`);
}

main().catch(err => console.error(`Error: ${err.message}`));

