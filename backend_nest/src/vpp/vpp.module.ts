import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductEntity } from './entities/product.entity';
import { InventoriesEntity } from './entities/inventories.entity';
import { ProductLimitEntity } from './entities/product-limit.entity';
import { InventoryTransactionEntity, InventoryTransactionItemEntity, InventoryTransactionLogEntity } from './entities/inventory-transaction.entity';
import { GoodsReceiptEntity } from './entities/goods-receipt.entity';
import { GoodsIssueEntity } from './entities/goods-issue.entity';
import { SystemLogEntity } from 'src/systemLogManagement/system-log.entity';
import { VppController } from './controller/vpp.controller';
import { VppReportController } from './controller/vpp-report.controller';
import { VppCatalogService } from './service/vpp-catalog.service';
import { VppInventoryService } from './service/vpp-inventory.service';
import { VppReportService } from './service/vpp-report.service';
import { AuditService } from './service/audit.service';
import { UserEntity } from 'src/users/entities/user.entity';
import { FileEntity } from 'src/files-managerment/file.entity';
import { FileRelationEntity } from 'src/files-managerment/file-relation.entity';
import { UsersModule } from 'src/users/users.module';
import { GroupUserEntity } from 'src/group-users/entities/group-users.entity';
import { ListRoleEntity } from 'src/list-role/entities/list-role.entity';
import { VppUserGuard } from './guards/vpp-user.guard';
import { VppAdminGuard } from './guards/vpp-admin.guard';
import { VppReportAccessGuard } from './guard/vpp-report-access.guard';
@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProductEntity,
      InventoriesEntity,
      ProductLimitEntity,
      InventoryTransactionEntity,
      InventoryTransactionItemEntity,
      InventoryTransactionLogEntity,
      GoodsReceiptEntity,
      GoodsIssueEntity,
      SystemLogEntity,
      UserEntity,
      GroupUserEntity,
      ListRoleEntity,
      FileEntity,
      FileRelationEntity,
    ], 'mssqlConnection'),
    UsersModule,
  ],
  controllers: [VppController, VppReportController],
  providers: [
    VppCatalogService,
    VppInventoryService,
    VppReportService,
    AuditService,
    VppUserGuard,
    VppAdminGuard,
    VppReportAccessGuard,
  ],
  exports: [VppCatalogService, VppInventoryService, VppReportService, VppUserGuard, VppAdminGuard],
})
export class VppModule { }
