# Auto-delete audio files from S3 after a set time

The app uploads audio to S3 under the prefix `audio-uploads/` (or your `S3_AUDIO_PREFIX`). You can have S3 **automatically delete** those objects after a certain number of days using a **Lifecycle rule**. No app code or cron is required.

## Option 1: S3 Lifecycle rule (recommended)

1. Open **AWS Console** → **S3** → your bucket.
2. Go to the **Management** tab → **Lifecycle rules** → **Create lifecycle rule**.
3. **Rule name:** e.g. `Delete audio uploads after 7 days`.
4. **Choose a rule scope:**  
   - “Limit the scope of this rule using one or more filters”  
   - **Prefix:** `audio-uploads/` (or the value of `S3_AUDIO_PREFIX` if you changed it).
5. **Lifecycle rule actions:** enable **Expire current versions of objects**.
6. **Expiration:** e.g. **Days after object creation:** `7` (or 1, 3, 30, etc.).
7. Save the rule.

S3 will then delete objects under that prefix after the chosen number of days. Transcribed notes are stored in your database and are not affected.

### Example (AWS CLI)

If you prefer CLI, you can attach a lifecycle configuration like this (replace `YOUR_BUCKET` and adjust days):

```json
{
  "Rules": [
    {
      "ID": "ExpireAudioUploads",
      "Status": "Enabled",
      "Filter": {
        "Prefix": "audio-uploads/"
      },
      "Expiration": {
        "Days": 7
      }
    }
  ]
}
```

Apply it:

```bash
aws s3api put-bucket-lifecycle-configuration \
  --bucket YOUR_BUCKET \
  --lifecycle-configuration file://lifecycle.json
```

---

## Option 2: Delete immediately after transcription

If you don’t need to keep the audio in S3 at all, you can delete the object right after your API has successfully transcribed it (in `transcribe-from-url` after fetching and processing). That would require storing the S3 key when generating the presigned URLs and adding a delete step in the transcribe flow. Lifecycle is usually simpler and gives you a retention window for debugging or retries.
