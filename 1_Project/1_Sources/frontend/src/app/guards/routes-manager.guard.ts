import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, take, switchMap, filter, timeout, catchError } from 'rxjs/operators';
import { WebsocketService } from '../services/websocket.service';
import { MyPermissionShareService } from '../services/share/my-permission.service';
import { PermissionService } from '../services/websockets/permission.service';
import { GLOBAL } from '../services/global';

@Injectable({
  providedIn: 'root'
})
export class RoutesManagerGuard implements CanActivate {

  constructor(
    private websocketService: WebsocketService,
    private myPermissionShareService: MyPermissionShareService,
    private permissionService: PermissionService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    
    // Check if user is logged in first
    if (!this.websocketService.sessionOn || !this.websocketService.token) {
      this.router.navigate(['/login']);
      return false;
    }

    // Get current permissions and check if user has routes manager permission
    return this.myPermissionShareService.currentMyPermissions.pipe(
      filter(permissions => permissions !== null), // Wait for permissions to be loaded
      take(1),
      map(permissions => {
        if (permissions && permissions.length > 0) {
          const hasPermission = permissions.some(permission => 
            permission.permissions_id === GLOBAL.permission_routes_manager
          );
          
          if (hasPermission) {
            return true;
          }
        }
        
        // Redirect to unauthorized page or main page
        this.router.navigate(['/']);
        return false;
      }),
      timeout(5000), // Timeout after 5 seconds
      catchError(() => {
        // If there's an error or timeout, redirect to main page
        this.router.navigate(['/']);
        return of(false);
      })
    );
  }
}