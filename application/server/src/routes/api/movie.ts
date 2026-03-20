import { promises as fs } from "fs";
import path from "path";

import { Router } from "express";
import { fileTypeFromBuffer } from "file-type";
import httpErrors from "http-errors";
import { v4 as uuidv4 } from "uuid";

import { UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";
import { convertMovieToMp4, extractPosterFromMp4 } from "@web-speed-hackathon-2026/server/src/utils/convert_media";

const EXTENSION = "mp4";

export const movieRouter = Router();

movieRouter.post("/movies", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }
  if (Buffer.isBuffer(req.body) === false) {
    throw new httpErrors.BadRequest();
  }

  const type = await fileTypeFromBuffer(req.body);
  if (type === undefined || !(type.mime.startsWith("video/") || type.mime === "image/gif")) {
    throw new httpErrors.BadRequest("Invalid file type");
  }

  const movieId = uuidv4();

  const outputBuffer = await convertMovieToMp4(req.body);

  const moviesDir = path.resolve(UPLOAD_PATH, "movies");
  await fs.mkdir(moviesDir, { recursive: true });

  const filePath = path.resolve(moviesDir, `${movieId}.${EXTENSION}`);
  await fs.writeFile(filePath, outputBuffer);

  const posterBuffer = await extractPosterFromMp4(outputBuffer);
  const posterPath = path.resolve(moviesDir, `${movieId}-poster.webp`);
  await fs.writeFile(posterPath, posterBuffer);

  return res.status(200).type("application/json").send({ id: movieId });
});
