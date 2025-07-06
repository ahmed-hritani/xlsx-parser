import { ConfigVars } from '../config';
import { S3Client, ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";

const BUCKET_NAME = ConfigVars.s3.bucketName;

const s3 = new S3Client({
    region: ConfigVars.aws.region,
    endpoint: ConfigVars.aws.endpoint,
    forcePathStyle: true,
    credentials: {
        accessKeyId: ConfigVars.aws.credentials.accessKeyId,
        secretAccessKey: ConfigVars.aws.credentials.secretAccessKey,
    },
});

export async function getNamesOfAllXlsxFiles(): Promise<string[]> {
    try {
        const command = new ListObjectsV2Command({
            Bucket: BUCKET_NAME,
        });
        const response = await s3.send(command);
        if (!response.Contents) {
            return [];
        }

        const xlsxFiles = response.Contents
            .filter(obj => obj.Key && obj.Key.toLowerCase().endsWith('.xlsx'))
            .map(obj => obj.Key);
        return xlsxFiles;
    } catch (error) {
        throw error;
    }
}

export async function readFile(key: string): Promise<Buffer> {
    try {
        const command = new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
        });
        const response = await s3.send(command);
        if (!response.Body) {
            throw new Error(`No content found for file: ${key}`);
        }

        const arrayBuffer = await response.Body.transformToByteArray();
        return Buffer.from(arrayBuffer);
    } catch (error) {
        throw error;
    }
}