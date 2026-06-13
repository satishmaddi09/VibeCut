import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UTFiles } from "uploadthing/server";
import { z } from "zod";

const f = createUploadthing();

export const ourFileRouter = {
  imageUploader: f({
    image: { maxFileSize: "8MB", maxFileCount: 10 },
  })
    .input(z.object({ customId: z.string() }))
    .middleware(async ({ input, files }) => {
      // Map the files to assign the customId passed from the client
      const fileOverrides = files.map((file) => ({
        ...file,
        customId: input.customId,
      }));
      return { [UTFiles]: fileOverrides };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Image upload complete:", file.url, "customId:", file.customId);
      return { url: file.url };
    }),
  videoUploader: f({
    video: { maxFileSize: "128MB", maxFileCount: 1 },
  })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Video upload complete:", file.url);
      return { url: file.url };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
