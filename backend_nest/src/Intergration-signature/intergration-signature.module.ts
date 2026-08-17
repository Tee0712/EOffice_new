import { forwardRef, Module } from "@nestjs/common";
import { IntergrationSignatureController } from "./intergration-signature.controller";
import { IntegrationSignatureService } from "./intergration-signature.service";
import { DatabaseModule } from "src/database/database.module";
import { FilesManagementModule } from "src/files-managerment/files-management.module";
import { BpmnModule } from "src/bpmn/bpmn.module";
import { WorkItemsModule } from "src/work-items/work-items.module";
import { SystemLogSqlModule } from "src/systemLogManagement/system-log.module";
import { OutgoingDocumentsModule } from "src/outgoing-documents/outgoing-documents.module";
import { CallbackAuthGuard } from "./guards/callback-auth.guard";

import { UsbTokenSignService } from "./usb-token/usb-token-sign.service";
import { UsbTokenSignController } from "./usb-token/usb-token-sign.controller";

@Module({
  imports: [
    forwardRef(() => DatabaseModule),
    forwardRef(() => FilesManagementModule),
    forwardRef(() => SystemLogSqlModule),
    forwardRef(() => BpmnModule),
    forwardRef(() => WorkItemsModule),
    forwardRef(() => OutgoingDocumentsModule),
  ],
  controllers: [IntergrationSignatureController, UsbTokenSignController],
  providers: [IntegrationSignatureService, UsbTokenSignService, CallbackAuthGuard],
  exports: [IntegrationSignatureService, UsbTokenSignService],
})

export class IntergrationSignatureModule { } 
