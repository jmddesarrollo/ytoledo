/**
 * Servicio de detección de inactividad del usuario.
 * Requisitos: 4.1, 4.2, 4.3, 4.4, 4.5
 *
 * - Detecta inactividad midiendo el tiempo desde la última interacción (clic, teclado, ratón).
 * - Emite un evento de advertencia 2 minutos antes de hacer logout.
 * - Emite logout si el usuario no interactúa durante el timeout configurado.
 * - Reinicia el contador ante cualquier interacción.
 */

import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { environment } from '../../../environments/environment';

const WARNING_BEFORE_MS = 2 * 60 * 1000; // 2 minutos antes del logout

@Injectable({
  providedIn: 'root'
})
export class InactivityService implements OnDestroy {

  /** Emite cuando quedan 2 minutos para el logout */
  public readonly warning$ = new Subject<void>();

  /** Emite cuando el usuario debe ser desconectado por inactividad */
  public readonly logout$ = new Subject<void>();

  private timeoutMs: number;
  private logoutTimer: ReturnType<typeof setTimeout> | null = null;
  private warningTimer: ReturnType<typeof setTimeout> | null = null;

  private readonly events = ['click', 'keydown', 'mousemove'];
  private boundResetTimer = this.resetTimer.bind(this);

  constructor(private ngZone: NgZone) {
    this.timeoutMs = environment.inactivityTimeoutMinutes * 60 * 1000;
  }

  /**
   * Inicia la escucha de eventos DOM y arranca los timers.
   * Llamar cuando el usuario inicia sesión. (Requisito 4.1)
   */
  startWatching(): void {
    this.events.forEach(event =>
      document.addEventListener(event, this.boundResetTimer, { passive: true })
    );
    this.scheduleTimers();
  }

  /**
   * Reinicia el contador de inactividad ante cualquier interacción. (Requisito 4.5)
   */
  resetTimer(): void {
    this.clearTimers();
    this.scheduleTimers();
  }

  /**
   * Detiene la escucha de eventos y limpia los timers.
   * Llamar cuando el usuario cierra sesión.
   */
  stopWatching(): void {
    this.events.forEach(event =>
      document.removeEventListener(event, this.boundResetTimer)
    );
    this.clearTimers();
  }

  ngOnDestroy(): void {
    this.stopWatching();
  }

  // ---------------------------------------------------------------------------
  // Privado
  // ---------------------------------------------------------------------------

  private scheduleTimers(): void {
    // Ejecutar fuera de la zona Angular para no disparar change detection en cada tick
    this.ngZone.runOutsideAngular(() => {

      // Timer de advertencia: 2 minutos antes del logout (Requisito 4.3)
      const warningDelay = this.timeoutMs - WARNING_BEFORE_MS;
      if (warningDelay > 0) {
        this.warningTimer = setTimeout(() => {
          this.ngZone.run(() => this.warning$.next());
        }, warningDelay);
      }

      // Timer de logout (Requisito 4.2)
      this.logoutTimer = setTimeout(() => {
        this.ngZone.run(() => this.logout$.next());
      }, this.timeoutMs);

    });
  }

  private clearTimers(): void {
    if (this.logoutTimer !== null) {
      clearTimeout(this.logoutTimer);
      this.logoutTimer = null;
    }
    if (this.warningTimer !== null) {
      clearTimeout(this.warningTimer);
      this.warningTimer = null;
    }
  }
}
