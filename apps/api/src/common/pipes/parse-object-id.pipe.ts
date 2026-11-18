import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class ParseObjectIdPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (typeof value !== 'string' || !/^[a-f\d]{24}$/i.test(value)) {
      throw new BadRequestException('INVALID_ID');
    }
    return value;
  }
}
