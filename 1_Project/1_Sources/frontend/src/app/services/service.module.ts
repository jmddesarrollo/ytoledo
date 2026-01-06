import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';

// Servicios
import { AuthService } from './websockets/auth.service';
import { EmailService } from './websockets/email.service';
import { FileService } from './websockets/file.service';
import { RoleManagerShareService } from './share/role-mananager-share.service';
import { MyPermissionShareService } from './share/my-permission.service';
import { OrderService } from './help/order.service';
import { PermissionService } from './websockets/permission.service';
import { RoleService } from './websockets/role.service';
import { RouteService } from './websockets/route.service';
import { TitleShareService } from './share/title.service';
import { WRPermissionShareService } from './share/wr-permission';
import { UserService } from './websockets/user.service';
import { ValidateService } from './help/validate.service';

// API. Servicio de soporte para probar APIs
// import { ApiService } from './http/api.service';

@NgModule({
  imports: [
    CommonModule,
    HttpClientModule
  ],
  providers: [
    AuthService,
    EmailService,
    FileService,
    RoleManagerShareService,
    MyPermissionShareService,
    OrderService,
    PermissionService,
    RoleService,
    RouteService,
    TitleShareService,
    WRPermissionShareService,
    UserService,    
    ValidateService
],
  declarations: []
})
export class ServiceModule { }