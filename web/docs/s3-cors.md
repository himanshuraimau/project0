# S3 CORS setup for direct browser uploads

If uploads use presigned S3 URLs from the browser, the bucket must allow CORS for your app origins.

Without this, uploads fail with browser errors like:
- `blocked by CORS policy`
- `No 'Access-Control-Allow-Origin' header`
- `TypeError: Failed to fetch`

## Recommended CORS rule

In AWS Console:
1. Open **S3** -> your bucket.
2. Go to **Permissions** -> **Cross-origin resource sharing (CORS)**.
3. Use a rule like this (replace domains with your own):

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["PUT", "GET", "HEAD"],
    "AllowedOrigins": [
      "http://localhost:3000",
      "https://project0-nu.vercel.app"
    ],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

## Why this matters

- Audio/PDF uploads are done with `PUT` directly from the browser to S3.
- Browsers send a preflight `OPTIONS` request first.
- S3 only accepts the upload if your bucket CORS explicitly allows:
  - the request origin
  - method `PUT`
  - required headers (using `*` is easiest)

## Quick checks

1. Retry upload and confirm the presigned URL query no longer requires `content-length` in `X-Amz-SignedHeaders`.
2. In browser Network tab, confirm `OPTIONS` to S3 returns CORS headers and status `200`.
3. Confirm the subsequent `PUT` succeeds.

