import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export type S3Env = {
  endpoint: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
};

export function s3Env(): S3Env | null {
  const endpoint = process.env.S3_ENDPOINT;
  const region = process.env.S3_REGION || "auto";
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
  const bucket = process.env.S3_BUCKET;
  if (!endpoint || !accessKeyId || !secretAccessKey || !bucket) return null;
  return { endpoint, region, accessKeyId, secretAccessKey, bucket };
}

let client: S3Client | null = null;

function s3Client(env: S3Env): S3Client {
  if (!client) {
    client = new S3Client({
      endpoint: env.endpoint,
      region: env.region,
      credentials: {
        accessKeyId: env.accessKeyId,
        secretAccessKey: env.secretAccessKey,
      },
      forcePathStyle: true,
    });
  }
  return client;
}

export async function presignRecordingUrl(
  key: string,
  expiresInSeconds = 600
): Promise<string | null> {
  const env = s3Env();
  if (!env) return null;
  return getSignedUrl(
    s3Client(env),
    new GetObjectCommand({ Bucket: env.bucket, Key: key }),
    { expiresIn: expiresInSeconds }
  );
}

export async function uploadObject(
  key: string,
  body: Buffer,
  contentType: string
): Promise<boolean> {
  const env = s3Env();
  if (!env) return false;
  await s3Client(env).send(
    new PutObjectCommand({
      Bucket: env.bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
  return true;
}
