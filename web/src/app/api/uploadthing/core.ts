import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

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
      maxFileSize: "128MB",
      maxFileCount: 1,
    },
  })
    .middleware(async () => {
      // Authenticate user
      const session = await auth.api.getSession({
        headers: await headers()
      });
      
      if (!session?.user?.id) throw new UploadThingError("Unauthorized");
      
      // Return metadata that will be accessible in onUploadComplete
      return { userId: session.user.id };
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

  // Podcast audio upload endpoint
  podcastAudio: f({
    audio: {
      maxFileSize: "64MB",
      maxFileCount: 1,
    },
  })
    .middleware(async () => {
      // Authenticate user
      const session = await auth.api.getSession({
        headers: await headers()
      });
      
      if (!session?.user?.id) throw new UploadThingError("Unauthorized");
      
      // Return metadata that will be accessible in onUploadComplete
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // This runs on the server after podcast audio upload
      console.log("Podcast audio upload complete for userId:", metadata.userId);
      console.log("Audio URL:", file.url);
      console.log("Audio size:", file.size);
      console.log("Audio name:", file.name);
      console.log("File key:", file.key);
      
      return { 
        uploadedBy: metadata.userId,
        url: file.url,
        key: file.key,
        size: file.size,
        name: file.name,
        type: 'podcast-audio'
      };
    }),

  // Admin-only: blog cover and instructor images
  blogImage: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 1,
    },
  })
    .middleware(async () => {
      const session = await auth.api.getSession({ headers: await headers() });
      if (!session?.user?.id) throw new UploadThingError("Unauthorized");
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true },
      });
      if (user?.role !== "ADMIN") throw new UploadThingError("Admin only");
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ file }) => {
      return { url: file.url, name: file.name };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
