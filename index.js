const nReadLines = require('n-readlines');
const fs = require('fs');
const process = require('node:process');

const filePath = "file.txt";
const bigFileLines = new nReadLines(filePath);

const maxLinesPerChunk = 256 * 1024 / 4;

let line;
let tmpFileNumber = 1;
let linesArray = [];

function saveLinesToFile(linesArray){
    linesArray.sort(function(a, b){return a>b?1:-1});
    const writeStream = fs.createWriteStream(`tmp${tmpFileNumber}.txt`);
    linesArray.forEach(value => writeStream.write(`${value}\n`));
    
    writeStream.on('error', (err) => {
        throw `There is an error writing the file ${filePath} => ${err}`;
    });
    
    writeStream.end();
    linesArray.length = 0;
    tmpFileNumber++;
}

function main(){
    while (line = bigFileLines.next()){
        linesArray.push(line);
        if (linesArray.length >= maxLinesPerChunk){
            try {
                saveLinesToFile(linesArray);
            } catch(err){
                console.log(err);
                process.exitCode = 1;
            }
        }
    }
    if (linesArray.length >= 0){
        try {
            saveLinesToFile(linesArray);
        } catch(err){
            console.log(err);
            process.exitCode = 1;
        }
    }
    
}

main();

