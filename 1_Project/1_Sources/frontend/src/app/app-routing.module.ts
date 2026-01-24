import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { FilesComponent } from './components/files/files-upload/files.component';
import { LoginComponent } from './components/session/login/login.component';
import { PermissionsListComponent } from './components/permissions/permissions-list/permissions-list.component';
import { RecoveryComponent } from './components/session/recovery/recovery.component';
import { NextRouteComponent } from './components/routes/next-route/next-route.component';
import { RedirectComponent } from './components/redirect/redirect.component';
import { RouteDetailComponent } from './components/routes/route-detail/route-detail.component';
import { RouteFormComponent } from './components/routes/route-form/route-form.component';
import { RoutesListComponent } from './components/routes/routes-list/routes-list.component';
import { RoutesPublicComponent } from './components/routes/routes-public/routes-public.component';
import { FileManagementComponent } from './components/routes/file-management/file-management.component';
import { UserMyprofileComponent } from './components/users/user-myprofile/user-myprofile.component';
import { UsersListComponent } from './components/users/users-list/users-list.component';

// Guards
import { AuthGuard } from './guards/auth.guard';
import { RoutesManagerGuard } from './guards/routes-manager.guard';

// Componentes de soporte
// import { FilesComponent } from './components/files/files.component';

const routes: Routes = [
  { path: '', component: RedirectComponent, data: {titulo: 'Y-Toledo - Redirección'} },
  { path: 'login', component: LoginComponent, data: {titulo: 'Y-Toledo - Inicio de sesión'}  },
  { path: 'recovery/:token', component: RecoveryComponent, data: {titulo: 'Y-Toledo - Regenerar contraseña'} },
  { path: 'users', component: UsersListComponent, data: {titulo: 'Y-Toledo - Usuarios'} },
  { path: 'my-profile', component: UserMyprofileComponent, data: {titulo: 'Y-Toledo - Perfil del usuario'} },
  { path: 'permissions', component: PermissionsListComponent, data: {titulo: 'Y-Toledo - Permisos'} },
  
  // Rutas públicas de senderismo
  { path: 'next-route', component: NextRouteComponent, data: {titulo: 'Y-Toledo - Próxima Ruta'} },
  { path: 'routes-public', component: RoutesPublicComponent, data: {titulo: 'Y-Toledo - Rutas de Senderismo'} },
  
  // Rutas de gestión administrativa de rutas
  { path: 'routes', component: RoutesListComponent, canActivate: [AuthGuard, RoutesManagerGuard], data: {titulo: 'Y-Toledo - Gestión de Rutas'} },
  { path: 'routes/create', component: RouteFormComponent, canActivate: [AuthGuard, RoutesManagerGuard], data: {titulo: 'Y-Toledo - Nueva Ruta'} },
  { path: 'routes/edit/:id', component: RouteFormComponent, canActivate: [AuthGuard, RoutesManagerGuard], data: {titulo: 'Y-Toledo - Editar Ruta'} },
  { path: 'routes/detail/:id', component: RouteDetailComponent, data: {titulo: 'Y-Toledo - Detalle de Ruta'} },
  { path: 'routes/files', component: FileManagementComponent, canActivate: [AuthGuard, RoutesManagerGuard], data: {titulo: 'Y-Toledo - Gestión de Archivos'} },
  
  // Rutas legacy (mantener compatibilidad)
  { path: 'routes-list', redirectTo: '/routes', pathMatch: 'full' },
  { path: 'route-detail', redirectTo: '/routes', pathMatch: 'full' },
  
  { path: 'redirect', component: RedirectComponent, data: {titulo: 'Y-Toledo - Redirección'} },
  { path: 'files', component: FilesComponent, data: {titulo: 'Y-Toledo - Ficheros'} },
  { path: '404', component: RedirectComponent, data: {titulo: 'Y-Toledo - Redirección'} },
  { path: '**', component: RedirectComponent, data: {titulo: 'Y-Toledo - Redirección'}  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
