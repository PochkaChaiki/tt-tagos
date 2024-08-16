const nReadLines = require('n-readlines');
const fs = require('fs').promises;
const process = require('node:process');



const maxLinesPerChunk = 256 * 1024 / 4;


async function saveLinesToFile(linesArray, filename){
    linesArray. sort(function(a, b){return a>b?1:-1});
    const file = await fs.open(filename, 'w');
    const writeStream = file.createWriteStream();
    linesArray.forEach(value => writeStream.write(`${value}\n`));
    
    writeStream.on('error', (err) => {
        file?.close();
        throw `error saveLinesToFile: ${filePath} => ${err}`;
    });
    
    writeStream.end();
    file?.close();

    
}


async function mergeFiles(fileName1, fileName2){
    const outFileName = fileName1+fileName2;
    const fileRead1 = new nReadLines(fileName1);
    const fileRead2 = new nReadLines(fileName2);
    const file = await fs.open(outFileName, 'w');
    const writeStream = file.createWriteStream();

    let lineFromFile1 = fileRead1.next();
    let lineFromFile2 = fileRead2.next();

    while (lineFromFile1 && lineFromFile2){
        if (lineFromFile1 > lineFromFile2){
            writeStream.write(lineFromFile1+"\n");
            lineFromFile1 = fileRead1.next();
        }else{
            writeStream.write(lineFromFile2+"\n");
            lineFromFile2 = fileRead2.next();
        }
    }
    
    if (!lineFromFile1){
        while (lineFromFile2){
            writeStream.write(lineFromFile2+"\n");
            lineFromFile2 = fileRead2.next();
        }
    }
    if (!lineFromFile2){
        while (lineFromFile1){
            writeStream.write(lineFromFile1+"\n");
            lineFromFile1 = fileRead1.next();
        }
    }
    writeStream.on('error', (err) => {
        file?.close();
        throw `error mergeFiles: ${filePath} => ${err}`;
    });
    
    writeStream.end();
    file?.close();
    return outFileName;
}

async function deleteFile(filePath) {
    await fs.unlink(filePath);
}
  

async function uniteFiles(filenames){
    let outFile = "output.txt";
    for (i = 0; i < filenames.length-1; i++){
        try {
            tempOutFile = await mergeFiles(filenames[i], filenames[i+1]);
            deleteFile(filenames[i]);
            deleteFile(filenames[i+1]);
            filenames[i+1] = tempOutFile;
        } catch (err) {
            throw `error uniteFiles: ${err.message}`;
        }
    }
    fs.rename(filenames[filenames.length-1], outFile);
    return outFile;

}

async function main(){
    const filePath = "file.txt";
    const bigFileLines = new nReadLines(filePath);
    let line;
    let tmpFileNumber = 1;
    let linesArray = [];
    let filenames = [];
    let outFile = "";

    // reading and sorting single file to multiple small
    while (line = bigFileLines.next()){
        linesArray.push(line);
        if (linesArray.length >= maxLinesPerChunk){
            try {
                let filename = `tmp${tmpFileNumber}.txt`;
                await saveLinesToFile(linesArray, filename);
                tmpFileNumber++;
                filenames.push(filename);
                linesArray.length = 0;
            } catch(err){
                console.log(err);
                process.exitCode = 1;
            }
        }
    }
    if (linesArray.length >= 0){
        try {
            let filename = `tmp${tmpFileNumber}.txt`;
            saveLinesToFile(linesArray, filename);
            tmpFileNumber++;
            filenames.push(filename);
        } catch(err){
            console.log(err);
            process.exitCode = 1;
        }
    }

    // reading and merging files to one
    try{
        outFile = uniteFiles(filenames);
    } catch (err) {
        console.log(err);
        process.exitCode = 1;
    }
    console.log(`result file: ${outFile}\n`);
    
}

main();

