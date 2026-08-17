import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { ZodSchema } from 'zod';
import * as fs from 'fs';
import * as path from 'path';

const LOG_FILE = path.join(process.cwd(), 'meal_debug.log');
const logDetail = (msg: string) => {
  try {
    const timestamp = new Date().toISOString();
    fs.appendFileSync(LOG_FILE, `[${timestamp}] [ZOD] ${msg}\n`);
  } catch (e) {}
};

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}

  transform(value: unknown, metadata: ArgumentMetadata) {
    try {
      const parsedValue = this.schema.parse(value);
      return parsedValue;
    } catch (error) {
      logDetail(`Validation Error for ${String(metadata.type)}: ${JSON.stringify((error as any).issues)}`);
      logDetail(`Value: ${JSON.stringify(value)}`);


      if (error && typeof error === 'object' && 'issues' in error && Array.isArray((error as any).issues)) {
        const formattedErrors = (error as any).issues.map((err: any) => ({
          field: err.path ? err.path.join('.') : 'unknown',
          message: err.message || 'Invalid value',
        }));
        throw new BadRequestException({
          success: false,
          message: 'Dữ liệu không hợp lệ (Zod)',
          errors: formattedErrors,
        });
      }
      throw new BadRequestException({
        success: false,
        message: 'Validation failed',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
