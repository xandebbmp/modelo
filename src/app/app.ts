import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FinanceStateService } from './core/services/finance-state.service';
import { TourGuiadoService } from './core/services/tour-guiado.service';
import { SimuladorMobileMeiComponent } from './shared/components/simulador-mobile-mei.component';
import { TourGuiadoComponent } from './shared/components/tour-guiado.component';
import { ConfirmDialogComponent } from './shared/components/confirm-dialog.component';

@Component({
  selector: 'app-root',
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatIconModule,
    SimuladorMobileMeiComponent,
    TourGuiadoComponent,
    ConfirmDialogComponent
  ],
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {
  readonly financeState = inject(FinanceStateService);
  readonly tourService = inject(TourGuiadoService);

  readonly darkMode = signal<boolean>(false);
  readonly sidebarAberta = signal<boolean>(true);

  readonly empresa = computed(() => this.financeState.empresaAtiva());

  toggleDarkMode() {
    this.darkMode.update(v => !v);
    if (typeof document !== 'undefined') {
      if (this.darkMode()) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }

  toggleSidebar() {
    this.sidebarAberta.update(v => !v);
  }
}
