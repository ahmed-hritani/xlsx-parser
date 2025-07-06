import { config } from "dotenv";
config();

export const ConfigVars = {
    aws: {
        region: process.env.AWS_REGION,
        endpoint: process.env.LOCALSTACK_ENDPOINT,
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        }
    },
    s3: {
        bucketName: process.env.BUCKET_NAME,
    },
    dynamodb: {
        tableName: process.env.TABLE_NAME,
    },
};

function validateConfig() {
    const required = [
        'AWS_REGION',
        'LOCALSTACK_ENDPOINT',
        'AWS_ACCESS_KEY_ID',
        'AWS_SECRET_ACCESS_KEY',
        'BUCKET_NAME',
        'TABLE_NAME'
    ];
    const missing = required.filter(key => !process.env[key]);
    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
}

validateConfig();
