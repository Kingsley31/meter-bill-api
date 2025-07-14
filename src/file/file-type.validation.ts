import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';

@Injectable()
export class FileTypeValidationPipe implements PipeTransform {
  ALLOWED_MIME_TYPES = [
    'image/png',
    'image/jpeg',
    'image/jpg',
    'application/pdf',
  ];
  transform(value: Express.Multer.File, metadata: ArgumentMetadata) {
    console.log(metadata);
    if (!value) return false;

    return !this.ALLOWED_MIME_TYPES.includes(value.mimetype);
  }
}

const MAX_METER_IMAGE_SIZE_BYTES = 1000000;

export const VALIDATION_PIPE = new ParseFilePipe({
  validators: [
    new MaxFileSizeValidator({
      maxSize: MAX_METER_IMAGE_SIZE_BYTES,
      message: (maxSize) => `uploaded file is greater than ${maxSize}bytes`,
    }),
    new FileTypeValidator({
      fileType: /^(image\/(png|jpeg|jpg|gif)|application\/pdf)$/i,
    }),
  ],
});
