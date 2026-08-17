import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProgramAttachmentEntity } from '../entities/program-attachment.entity';

@Injectable()
export class ProgramAttachmentsService {
  private readonly logger = new Logger(ProgramAttachmentsService.name);

  constructor(
    @InjectRepository(ProgramAttachmentEntity, 'mssqlConnection')
    private readonly repo: Repository<ProgramAttachmentEntity>,
  ) {}

  /**
   * Lưu danh sách văn bản liên kết cho một chương trình
   */
  async saveForProgram(
    programId: number,
    documents: { document_id: number; document_code?: string; document_subject?: string }[],
  ): Promise<ProgramAttachmentEntity[]> {
    if (!documents || documents.length === 0) return [];

    const entities = documents.map(doc =>
      this.repo.create({
        programId: programId,
        documentId: doc.document_id,
        documentCode: doc.document_code || '',
        documentSubject: doc.document_subject || '',
      }),
    );

    return this.repo.save(entities);
  }

  /**
   * Lấy danh sách văn bản liên kết theo chương trình
   */
  async findByProgram(programId: number): Promise<ProgramAttachmentEntity[]> {
    return this.repo.find({
      where: { programId: programId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Xoá tất cả liên kết văn bản của chương trình (dùng khi rollback)
   */
  async removeByProgram(programId: number): Promise<void> {
    await this.repo.delete({ programId: programId });
  }
}
