import { getNamesOfAllXlsxFiles, readFile } from '../services/s3Service';
import { addProductRows } from '../services/dynamoDbService';
import { processXlsxFile } from '../services/fileProcessingService';

const handler = async () => {
    // Get current xlsx file from our S3 bucket
    const currentXlsxFiles = await getNamesOfAllXlsxFiles();
    console.log('Current XLSX files:', currentXlsxFiles);

    // For each file, fetch it's value as buffer then process it and upload it to DynamoDB
    // We could parallize this, but I went with this approach for simplicity
    for (const fileKey of currentXlsxFiles) {
        try {
            const fileAsBuffer = await readFile(fileKey);
            const productRows = await processXlsxFile(fileAsBuffer);
            await addProductRows(productRows)
        } catch (error) {
            console.error(`Error processing file ${fileKey}:`, error);
        }
    }
}

handler().catch((error) => {
    console.error('Error in CLI handler:', error);
});
