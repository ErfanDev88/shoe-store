import { Controller, Post, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { UploadsService } from './uploads.service';

@Roles(Role.Admin, Role.Content)
@Controller('admin/uploads')
export class UploadsController {
  constructor(private readonly uploads: UploadsService) {}

  @Post('images')
  @UseInterceptors(FilesInterceptor('files', 8, { storage: memoryStorage(), limits: { fileSize: 5 * 1024 * 1024, files: 8 } }))
  async images(@UploadedFiles() files: Express.Multer.File[]) {
    return { urls: await this.uploads.saveImages(files) };
  }
}
