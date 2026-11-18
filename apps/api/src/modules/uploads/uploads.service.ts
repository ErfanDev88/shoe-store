import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { mkdir } from 'fs/promises';
import { join, resolve } from 'path';
import sharp from 'sharp';

function sniff(buf: Buffer): boolean {
  const jpeg = buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  const png = buf.length > 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  const webp = buf.length > 12 && buf.subarray(0, 4).toString() === 'RIFF' && buf.subarray(8, 12).toString() === 'WEBP';
  return jpeg || png || webp;
}

@Injectable()
export class UploadsService {
  readonly dir: string;

  constructor(config: ConfigService) {
    this.dir = resolve(process.cwd(), config.get<string>('UPLOAD_DIR')!);
  }

  /** Verifies the real file type (magic bytes), re-encodes to WebP (strips metadata), random file name. */
  async saveImages(files: Express.Multer.File[]): Promise<string[]> {
    if (!files?.length) throw new BadRequestException('NO_FILES');
    await mkdir(this.dir, { recursive: true });
    const urls: string[] = [];
    for (const f of files) {
      if (!sniff(f.buffer)) throw new BadRequestException('INVALID_IMAGE_TYPE');
      const name = `${randomUUID()}.webp`;
      try {
        await sharp(f.buffer, { limitInputPixels: 40_000_000 })
          .rotate()
          .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 82 })
          .toFile(join(this.dir, name));
      } catch {
        throw new BadRequestException('INVALID_IMAGE_FILE');
      }
      urls.push(`/uploads/${name}`);
    }
    return urls;
  }
}
