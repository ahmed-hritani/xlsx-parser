import { ConfigVars } from "../config";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, BatchWriteCommand } from "@aws-sdk/lib-dynamodb";
import { ProductRow } from "../types";

const TABLE_NAME = ConfigVars.dynamodb.tableName;

const dynamoDBClient = new DynamoDBClient({
    region: ConfigVars.aws.region,
    endpoint: ConfigVars.aws.endpoint,
    credentials: {
        accessKeyId: ConfigVars.aws.credentials.accessKeyId,
        secretAccessKey: ConfigVars.aws.credentials.secretAccessKey,
    },
});

const dynamoDB = DynamoDBDocumentClient.from(dynamoDBClient);

// Not sure if we should make this atomic to write (with transactions or keep it as is)
// I will go with keeping it simple, also, I will make it prefer robustness over accuracy
// so it does not throw errors, but just continues on failure
export async function addProductRows(productRows: ProductRow[]): Promise<void> {
    if (productRows.length === 0) {
        return;
    }

    // DynamoDB batch write can handle max 25 items at a time
    const batchSize = 25;

    // This could also be run in paraller with Promise.all, with a batch limit too
    for (let i = 0; i < productRows.length; i += batchSize) {
        const batch = productRows.slice(i, i + batchSize);
        try {
            const putRequests = batch.map((productRow) => ({
                PutRequest: {
                    Item: {
                        id: productRow.Artikelnummer,
                        ...productRow,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                    }
                }
            }));
            const command = new BatchWriteCommand({
                RequestItems: {
                    [TABLE_NAME!]: putRequests
                }
            });
            await dynamoDB.send(command);
            
            console.log(`Batch ${(i / batchSize) + 1} added successfully.`);
        } catch (error) {
            console.error(`Error adding batch ${(i / batchSize) + 1}:`, error);
        }
    }
}
