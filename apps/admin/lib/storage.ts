import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
] as const

export type AllowedImageType = (typeof ALLOWED_IMAGE_TYPES)[number]

export const STORAGE_PRODUCTS_DIR = "products"

export interface StorageConfig {
  endpoint?: string
  bucket: string
  accessKeyId: string
  secretAccessKey: string
  publicUrl?: string
  region: string
}

function getStorageConfig(): StorageConfig {
  const bucket = process.env.STORAGE_BUCKET
  const accessKeyId = process.env.STORAGE_ACCESS_KEY_ID
  const secretAccessKey = process.env.STORAGE_SECRET_ACCESS_KEY

  if (!bucket) {
    throw new Error(
      "Storage configuration error: STORAGE_BUCKET environment variable is required."
    )
  }

  if (!accessKeyId || !secretAccessKey) {
    throw new Error(
      "Storage configuration error: STORAGE_ACCESS_KEY_ID and STORAGE_SECRET_ACCESS_KEY environment variables are required."
    )
  }

  const endpoint = process.env.STORAGE_ENDPOINT
  const publicUrl = process.env.STORAGE_PUBLIC_URL?.replace(/\/+$/, "")
  const region = process.env.STORAGE_REGION || "us-east-1"

  return {
    endpoint,
    bucket,
    accessKeyId,
    secretAccessKey,
    publicUrl,
    region,
  }
}

let s3ClientInstance: S3Client | null = null

export function getS3Client(): S3Client {
  if (s3ClientInstance) {
    return s3ClientInstance
  }

  const config = getStorageConfig()

  s3ClientInstance = new S3Client({
    endpoint: config.endpoint,
    region: config.region,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    // Force path-style (e.g. endpoint/bucket/key) when using custom endpoints like SeaweedFS, MinIO, or LocalStack
    forcePathStyle: Boolean(config.endpoint),
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  })

  return s3ClientInstance
}

function getExtension(filename: string, mimeType: string): string {
  const extFromName = filename.split(".").pop()?.toLowerCase()
  if (extFromName && /^[a-z0-9]+$/.test(extFromName)) {
    return extFromName
  }

  switch (mimeType) {
    case "image/jpeg":
      return "jpg"
    case "image/png":
      return "png"
    case "image/webp":
      return "webp"
    case "image/avif":
      return "avif"
    default:
      return "bin"
  }
}

export interface PresignedUploadOptions {
  productId: string
  filename: string
  contentType: string
}

export interface PresignedUploadResult {
  uploadUrl: string
  fileUrl: string
  key: string
}

export async function createPresignedUploadUrl({
  productId,
  filename,
  contentType,
}: PresignedUploadOptions): Promise<PresignedUploadResult> {
  if (!ALLOWED_IMAGE_TYPES.includes(contentType as AllowedImageType)) {
    throw new Error(`Unsupported image type: ${contentType}`)
  }

  const config = getStorageConfig()
  const s3 = getS3Client()
  const ext = getExtension(filename, contentType)
  const key = `${STORAGE_PRODUCTS_DIR}/${productId}/${crypto.randomUUID()}.${ext}`

  const command = new PutObjectCommand({
    Bucket: config.bucket,
    Key: key,
    ContentType: contentType,
  })

  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 900 })

  const fileUrl = config.publicUrl
    ? `${config.publicUrl}/${key}`
    : config.endpoint
      ? `${config.endpoint.replace(/\/+$/, "")}/${config.bucket}/${key}`
      : `https://${config.bucket}.s3.${config.region}.amazonaws.com/${key}`

  return {
    uploadUrl,
    fileUrl,
    key,
  }
}

export async function deleteStorageObject(key: string): Promise<void> {
  const config = getStorageConfig()
  const s3 = getS3Client()

  const command = new DeleteObjectCommand({
    Bucket: config.bucket,
    Key: key,
  })

  await s3.send(command)
}

export function extractStorageKeyFromUrl(url: string): string | null {
  const prefix = `${STORAGE_PRODUCTS_DIR}/`
  try {
    const parsed = new URL(url)
    const index = parsed.pathname.indexOf(prefix)
    return index !== -1 ? parsed.pathname.slice(index) : null
  } catch {
    const index = url.indexOf(prefix)
    return index !== -1 ? url.slice(index) : null
  }
}
