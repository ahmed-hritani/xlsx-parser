import { ConfigVars } from "./config";
import { S3Client, HeadBucketCommand, CreateBucketCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { DynamoDBClient, DescribeTableCommand, CreateTableCommand } from "@aws-sdk/client-dynamodb";
import * as fs from'fs';
import * as path from 'path';

const s3 = new S3Client({
    region: ConfigVars.aws.region,
    endpoint: ConfigVars.aws.endpoint,
    forcePathStyle: true,
    credentials: {
        accessKeyId: ConfigVars.aws.credentials.accessKeyId,
        secretAccessKey: ConfigVars.aws.credentials.secretAccessKey,
    },
});
const dynamodb = new DynamoDBClient({
    region: ConfigVars.aws.region,
    endpoint: ConfigVars.aws.endpoint,
    credentials: {
        accessKeyId: ConfigVars.aws.credentials.accessKeyId,
        secretAccessKey: ConfigVars.aws.credentials.secretAccessKey,
    },
});

export async function ensureLocalResources() {
    const BUCKET_NAME = ConfigVars.s3.bucketName;
    try {
        await s3.send(new HeadBucketCommand({ Bucket: BUCKET_NAME }));
        console.log(`S3 bucket "${BUCKET_NAME}" exists.`);
    } catch (err: any) {
        if (err.name === "NotFound" || err.$metadata?.httpStatusCode === 404) {
            await s3.send(new CreateBucketCommand({ Bucket: BUCKET_NAME }));
            console.log(`S3 bucket "${BUCKET_NAME}" created.`);
        } else {
            throw err;
        }
    } finally {
        // Upload the file if it doesn't exist in the bucket
        const filePath = path.resolve(process.cwd(), "produktkatalog_coding_challenge.xlsx");
        const fileStream = fs.createReadStream(filePath);

        await s3.send(
            new PutObjectCommand({
                Bucket: BUCKET_NAME,
                Key: "produktkatalog_coding_challenge.xlsx",
                Body: fileStream,
            })
        );
        console.log(`File "produktkatalog_coding_challenge.xlsx" uploaded to S3 bucket "${BUCKET_NAME}".`);
    }

    // Check/create DynamoDB table
    const TABLE_NAME = ConfigVars.dynamodb.tableName;
    try {
        await dynamodb.send(new DescribeTableCommand({ TableName: TABLE_NAME }));
        console.log(`DynamoDB table "${TABLE_NAME}" exists.`);
    } catch (err: any) {
        if (err.name === "ResourceNotFoundException") {
            await dynamodb.send(
                new CreateTableCommand({
                    TableName: TABLE_NAME,
                    AttributeDefinitions: [
                        { AttributeName: "id", AttributeType: "S" },
                    ],
                    KeySchema: [
                        { AttributeName: "id", KeyType: "HASH" },
                    ],
                    BillingMode: "PAY_PER_REQUEST",
                })
            );
            console.log(`DynamoDB table "${TABLE_NAME}" created.`);
        } else {
            throw err;
        }
    }
}

ensureLocalResources().catch(err => {
    console.error("Failed to ensure local resources:", err);
    process.exit(1);
});