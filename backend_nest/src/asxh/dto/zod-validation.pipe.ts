import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { ZodSchema, ZodError } from 'zod';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) { }

  transform(value: unknown, metadata: ArgumentMetadata) {
    try {
      const parsedValue = this.schema.parse(value);
      return parsedValue;
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.issues.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        throw new BadRequestException({
          success: false,
          message: `Dữ liệu không hợp lệ: ${errors[0].message} (tại trường ${errors[0].field})`,
          errors: errors,
        });
      }

      throw new BadRequestException({
        success: false,
        message: 'Lỗi xác thực dữ liệu',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

