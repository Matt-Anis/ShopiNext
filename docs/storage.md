# Storage

Object storage for user uploads (such as product media) uses an S3-compatible architecture. Uploads are handled via direct client-to-storage presigned URLs to avoid streaming heavy file payloads through the Next.js server.

---

## Architecture & Upload Flow

1. **Client requests presigned URL**: The browser calls the Server Action `getPresignedProductImageUploadUrl(productId, filename, contentType)` in [`apps/admin/features/products/image-actions.ts`](../apps/admin/features/products/image-actions.ts).
2. **Server signs upload URL**: The server validates authentication (`requireSession()`), product existence, file size (max 10MB), and MIME type (`image/jpeg`, `image/png`, `image/webp`, `image/avif`). It calls `createPresignedUploadUrl()` in [`apps/admin/lib/storage.ts`](../apps/admin/lib/storage.ts) using `@aws-sdk/s3-request-presigner` to generate a presigned PUT URL expiring in 15 minutes.
3. **Direct upload from browser**: The browser sends a `PUT` request with the raw file directly to the presigned URL (`http://localhost:8333/store/products/<productId>/<uuid>.<ext>`).
4. **Database record creation**: Once the PUT completes successfully (`uploadRes.ok`), the browser calls `createProductImage()` Server Action to persist the image record and public URL in PostgreSQL.
5. **Deletion & cleanup**: When an image is deleted via `deleteProductImage()`, `extractStorageKeyFromUrl()` extracts the object key, and `deleteStorageObject()` issues an S3 `DeleteObjectCommand`.

---

## Local Development (SeaweedFS)

Local storage runs via SeaweedFS inside [`docker-compose.yml`](../docker-compose.yml).

### Services

- `s3` (`chrislusf/seaweedfs`): Runs SeaweedFS master + volume + filer + S3 API on port `8333`. Mounted config: [`docker/seaweedfs-s3.json`](../docker/seaweedfs-s3.json).
- `s3-init` (`amazon/aws-cli`): A lightweight startup service that waits for SeaweedFS S3 to be ready and automatically creates the bucket defined in `${STORAGE_BUCKET:-store}` if it does not already exist.

### Permissions (`docker/seaweedfs-s3.json`)

SeaweedFS authenticates S3 requests based on identities:

```json
{
  "identities": [
    {
      "name": "anonymous",
      "actions": [
        "Read"
      ]
    },
    {
      "name": "localdev",
      "credentials": [
        {
          "accessKey": "localdev",
          "secretKey": "localdevsecret"
        }
      ],
      "actions": [
        "Admin",
        "Read",
        "Write"
      ]
    }
  ]
}
```

- **`anonymous` (Read)**: Allows unauthenticated browser `GET` requests (e.g. `<img src="..." />`) to fetch and display uploaded product photos. Without this, browser image loads return `403 Forbidden`.
- **`localdev` (Admin, Read, Write)**: Authenticated credentials used by the app server to generate presigned upload URLs and delete objects.

---

## Environment Variables

Configured in `apps/admin/.env.local`:

```env
# Storage (SeaweedFS via docker-compose)
STORAGE_ENDPOINT=http://localhost:8333
STORAGE_BUCKET=store
STORAGE_ACCESS_KEY_ID=localdev
STORAGE_SECRET_ACCESS_KEY=localdevsecret
STORAGE_PUBLIC_URL=http://localhost:8333/store
STORAGE_REGION=us-east-1
```

- `STORAGE_ENDPOINT`: S3 endpoint URL (set for custom/local endpoints like SeaweedFS or MinIO; omitted or set to your provider endpoint in production).
- `STORAGE_BUCKET`: Target S3 bucket name. Defaults to `store` locally.
- `STORAGE_ACCESS_KEY_ID` & `STORAGE_SECRET_ACCESS_KEY`: S3 API credentials.
- `STORAGE_PUBLIC_URL`: Base URL used for public image delivery. In local development with path-style access, this is `http://localhost:8333/store`. In production, this can point to a CDN distribution (e.g. `https://media.yourdomain.com`).
- `STORAGE_REGION`: S3 region (defaults to `us-east-1`).

---

## Important Implementation Details

### AWS SDK v3 Checksum Configuration

In recent versions of `@aws-sdk/client-s3` (v3.700+), the AWS SDK enables flexible checksums (CRC32) by default on `PutObjectCommand`. For presigned URLs where the server does not have the file bytes at signing time, the SDK injects placeholder checksum parameters (`x-amz-checksum-crc32=AAAAAA==` and `x-amz-sdk-checksum-algorithm=CRC32`).

Third-party S3 implementations (SeaweedFS, MinIO, Cloudflare R2) reject these placeholder checksums with `400 Bad Request`.

To prevent this, [`apps/admin/lib/storage.ts`](../apps/admin/lib/storage.ts) explicitly sets:

```ts
requestChecksumCalculation: "WHEN_REQUIRED",
responseChecksumValidation: "WHEN_REQUIRED",
```

This ensures clean, standard presigned URLs compatible with both local development and production S3 providers.

---

## Production Setup (AWS S3 / Cloudflare R2)

In production:
1. **Pre-provision the bucket**: Storage buckets are infrastructure and must be created ahead of time via Terraform or the cloud console. The application code intentionally does not attempt to create buckets at runtime.
2. **Least privilege**: Production IAM credentials for the app only need `s3:PutObject`, `s3:GetObject`, and `s3:DeleteObject` permissions on the bucket prefix (`products/*`). Administrative permissions (`s3:CreateBucket`, `s3:DeleteBucket`) should never be granted to application credentials.
3. **Public read delivery**: Product images must be publicly readable. Configure a public read bucket policy, or preferably serve objects through a CDN (AWS CloudFront with Origin Access Control, or Cloudflare R2 custom domain).
