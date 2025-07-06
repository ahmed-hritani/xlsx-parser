import { config } from "dotenv";
config();

function requireEnvVar(name: string): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Required environment variable ${name} is not set`);
    }
    return value;
}

export const ConfigVars = {
    aws: {
        region: requireEnvVar('AWS_REGION'),
        endpoint: requireEnvVar('LOCALSTACK_ENDPOINT'),
        credentials: {
            accessKeyId: requireEnvVar('AWS_ACCESS_KEY_ID'),
            secretAccessKey: requireEnvVar('AWS_SECRET_ACCESS_KEY'),
        }
    },
    s3: {
        bucketName: requireEnvVar('BUCKET_NAME'),
    },
    dynamodb: {
        tableName: requireEnvVar('TABLE_NAME'),
    },
};
