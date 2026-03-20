import { promises as fs } from "fs";
import path from "path";

import { Router } from "express";
import { fileTypeFromBuffer } from "file-type";
import httpErrors from "http-errors";
import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";

import { UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";

const EXTENSION = "jpg";
const POST_SIZES = [640, 960];
const WEBP_QUALITY = 80;

export const imageRouter = Router();

imageRouter.post("/images", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }
  if (Buffer.isBuffer(req.body) === false) {
    throw new httpErrors.BadRequest();
  }

  const type = await fileTypeFromBuffer(req.body);
  if (type === undefined || type.ext !== EXTENSION) {
    throw new httpErrors.BadRequest("Invalid file type");
  }

  const imageId = uuidv4();

  await fs.mkdir(path.resolve(UPLOAD_PATH, "images"), { recursive: true });

  for (const width of POST_SIZES) {
    const outPath = path.resolve(UPLOAD_PATH, `./images/${imageId}-${width}w.webp`);
    await sharp(req.body)
      .resize(width, undefined, { withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY })
      .toFile(outPath);
  }

  return res.status(200).type("application/json").send({ id: imageId });
});
