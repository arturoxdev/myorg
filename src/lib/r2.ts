import "server-only"
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3"

const r2 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
  },
})

const Bucket = process.env.R2_BUCKET

export async function putObject(key: string, body: Uint8Array, contentType: string) {
  await r2.send(new PutObjectCommand({ Bucket, Key: key, Body: body, ContentType: contentType }))
}

export async function getObject(key: string) {
  return r2.send(new GetObjectCommand({ Bucket, Key: key }))
}

export async function deleteObject(key: string) {
  await r2.send(new DeleteObjectCommand({ Bucket, Key: key }))
}

/** URL interna desde la que la app sirve un archivo de R2. */
export function fileUrl(key: string) {
  return `/api/files/${key}`
}
