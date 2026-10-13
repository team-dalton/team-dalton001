// Imports work videos dropped into incoming/.
//
//   1. Put the original video in incoming/, named after the work:
//        incoming/2026.mov  (or 2026.mp4, minecraft-cup-2026.mov, ...)
//   2. Run: npm run import-videos
//
// For each video this writes a web-sized copy and a cover image to
// public/media/<work>/main.mp4 and poster.jpg, and publishes the work page
// (draft: true -> draft: false). The site picks those two files up automatically.
// Requires ffmpeg (brew install ffmpeg).

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { basename, extname, join } from 'node:path';

const INCOMING = 'incoming';
const WORKS = 'src/content/works';
const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.m4v', '.mkv', '.webm'];

const workIds = readdirSync(WORKS)
  .filter((file) => file.endsWith('.md'))
  .map((file) => basename(file, '.md'));

// "2026.mov" -> the work whose id ends in 2026; "minecraft-cup-2026.mov" -> that work.
const findWorkId = (fileName) => {
  const name = basename(fileName, extname(fileName)).toLowerCase();
  if (workIds.includes(name)) return name;
  const year = name.match(/20\d\d/)?.[0];
  return year ? workIds.find((id) => id.endsWith(year)) : undefined;
};

const megabytes = (path) => `${(statSync(path).size / 1024 / 1024).toFixed(1)}MB`;

if (!existsSync(INCOMING)) mkdirSync(INCOMING);

const videos = readdirSync(INCOMING).filter((file) => VIDEO_EXTENSIONS.includes(extname(file).toLowerCase()));

if (videos.length === 0) {
  console.log(`No videos found. Put them in ${INCOMING}/ named by year, e.g. ${INCOMING}/2026.mov`);
  process.exit(0);
}

for (const file of videos) {
  const workId = findWorkId(file);
  if (!workId) {
    console.log(`Skipped ${file}: the name does not match a work (${workIds.join(', ')})`);
    continue;
  }

  const source = join(INCOMING, file);
  const outputDir = join('public/media', workId);
  const video = join(outputDir, 'main.mp4');
  const poster = join(outputDir, 'poster.jpg');
  mkdirSync(outputDir, { recursive: true });

  console.log(`${file} -> ${video} (this can take a minute)`);
  // 1080p H.264 + AAC plays in every browser; faststart lets playback begin before the download ends.
  execFileSync('ffmpeg', [
    '-v', 'error', '-y', '-i', source,
    '-vf', "scale='min(1920,iw)':-2",
    '-c:v', 'libx264', '-crf', '23', '-preset', 'slow', '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-b:a', '128k',
    '-movflags', '+faststart',
    video,
  ], { stdio: 'inherit' });

  // Cover image: a frame from 3 seconds in, so it is not a black opening frame.
  execFileSync('ffmpeg', [
    '-v', 'error', '-y', '-ss', '3', '-i', source,
    '-frames:v', '1', '-vf', "scale='min(1920,iw)':-2", '-q:v', '3',
    poster,
  ], { stdio: 'inherit' });

  const markdownPath = join(WORKS, `${workId}.md`);
  const markdown = readFileSync(markdownPath, 'utf8');
  if (/^draft: true$/m.test(markdown)) {
    writeFileSync(markdownPath, markdown.replace(/^draft: true$/m, 'draft: false'));
  }

  console.log(`  done: ${megabytes(source)} -> ${megabytes(video)}, page /works/${workId}/ is now published`);
}
