import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';

// Modulo para trabajo con formularios.
import { FormsModule} from '@angular/forms';
// DataFormulario: Necesario para formularios por validación tipo Data.
import { ReactiveFormsModule} from '@angular/forms';

// Entorno
import { environment } from '../environments/environment';

// Modulos
import { SocketIoModule, SocketIoConfig } from 'ngx-socket-io';

const config: SocketIoConfig = {
  url: environment.wsURL, options: {
    transports: ['websocket'],
    path: '/' + environment.service
    // secure: false,
    // forceNew: true,
    // reconnection: true,
    // reconnectionDelay: 3000,
    // reconnectionDelayMax: 10000,
    // reconnectionAttempts: Infinity,
    // rejectUnauthorized: false
  }
};

// Rutas
import { AppRoutingModule } from './app-routing.module';

// Servicios
import { ServiceModule } from './services/service.module';

// Pipes
import { ReversePipe } from './pipes/reverse.pipe';

// PrimeNg
import { ConfirmationService, MessageService } from 'primeng/api';

import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { CheckboxModule } from 'primeng/checkbox';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { FileUploadModule } from 'primeng/fileupload';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { MenuModule } from 'primeng/menu';
import { MultiSelectModule } from 'primeng/multiselect';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { PasswordModule } from 'primeng/password';
import { ProgressBarModule } from 'primeng/progressbar';
import { RadioButtonModule } from 'primeng/radiobutton';
import { TableModule } from 'primeng/table';
import { TabViewModule } from 'primeng/tabview';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';

// Componentes
import { AppComponent } from './app.component';

import { FilesComponent } from './components/files/files-upload/files.component';
import { LoginComponent } from './components/session/login/login.component';
import { PermissionsListComponent } from './components/permissions/permissions-list/permissions-list.component';
import { RecoveryComponent } from './components/session/recovery/recovery.component';
import { RedirectComponent } from './components/redirect/redirect.component';
import { RolesManagerComponent } from './components/permissions/roles-manager/roles-manager.component';
import { RouteDetailComponent } from './components/routes/route-detail/route-detail.component';
import { RouteFormComponent } from './components/routes/route-form/route-form.component';
import { RoutesListComponent } from './components/routes/routes-list/routes-list.component';
import { UserFormComponent } from './components/users/user-form/user-form.component';
import { UserFormPasswordComponent } from './components/users/user-form-password/user-form-password.component';
import { UserMyprofileComponent } from './components/users/user-myprofile/user-myprofile.component';
import { UsersListComponent } from './components/users/users-list/users-list.component';

@NgModule({
  declarations: [
    AppComponent,    
    FilesComponent,
    LoginComponent,
    UsersListComponent,
    UserFormComponent,
    UserFormPasswordComponent,
    UserMyprofileComponent,
    RecoveryComponent,
    PermissionsListComponent,
    RolesManagerComponent,    
    ReversePipe,
    RedirectComponent,
    RoutesListComponent,
    RouteDetailComponent,
    RouteFormComponent    
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    ServiceModule,
    SocketIoModule.forRoot(config),
    ButtonModule,
    CardModule,
    CheckboxModule,
    ConfirmPopupModule,
    DialogModule,
    DropdownModule,
    FileUploadModule,
    InputNumberModule,
    InputTextModule,
    MenuModule,
    MultiSelectModule,
    OverlayPanelModule,
    PasswordModule,
    ProgressBarModule,
    RadioButtonModule,
    TableModule,
    TabViewModule,
    TagModule,
    ToastModule
  ],
  providers: [
    ConfirmationService,
    MessageService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
