import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { auth } from "@clerk/nextjs/server";

const f = createUploadthing();

// FileRouter for the app
export const ourFileRouter = {
  // General file upload endpoint
  fileUpload: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 1,
    },
    pdf: {
      maxFileSize: "16MB", 
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
      console.log("File upload complete for userId:", metadata.userId);
      console.log("File URL:", file.url);
      console.log("File size:", file.size);
      
      return { 
        uploadedBy: metadata.userId,
        url: file.url,
        size: file.size,
        name: file.name 
      };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
