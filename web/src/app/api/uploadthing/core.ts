import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { auth } from "@clerk/nextjs/server";

const f = createUploadthing();

// FileRouter for the app
export const ourFileRouter = {
  // Audio upload endpoint for podcasts
  podcastAudio: f({
    audio: {
      maxFileSize: "64MB",
      maxFileCount: 1,
    },
  })
    .middleware(async () => {
      // Authenticate user
      const { userId } = await auth();
      
      if (!userId) throw new UploadThingError("Unauthorized");
      
      // Return metadata that will be accessible in onUploadComplete
      return { userId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // This runs on the server after upload
      console.log("Podcast audio upload complete for userId:", metadata.userId);
      console.log("File URL:", file.url);
      console.log("File size:", file.size);
      
      // Store file info in database if needed
      // You can add database operations here
      
      return { 
        uploadedBy: metadata.userId,
        url: file.url,
        size: file.size,
        name: file.name 
      };
    }),
    
  // Audio segments upload endpoint (for individual segments)
  audioSegments: f({
    audio: {
      maxFileSize: "32MB",
      maxFileCount: 10, // Allow multiple segments
    },
  })
    .middleware(async () => {
      const { userId } = await auth();
      
      if (!userId) throw new UploadThingError("Unauthorized");
      
      return { userId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Audio segment upload complete for userId:", metadata.userId);
      console.log("File URL:", file.url);
      
      return { 
        uploadedBy: metadata.userId,
        url: file.url,
        size: file.size,
        name: file.name 
      };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
