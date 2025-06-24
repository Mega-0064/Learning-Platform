import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from './layout/header/header'; // Corrected path and class name
import { Footer } from './layout/footer/footer'; // Corrected path and class name
import { ProgressTracker } from './components/progress-tracker/progress-tracker'; // Corrected path and class name

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, Footer, ProgressTracker],
  template: `
    <app-header />
    <main class="content-area">
      <!-- Example of embedding ProgressTracker, adjust as needed -->
      <!-- <app-progress-tracker userId="currentUser123"></app-progress-tracker> -->
      <router-outlet />
    </main>
    <app-footer />
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }
    .content-area {
      flex: 1; /* Allows content to grow and push footer down */
      padding: 0px 20px; /* Add some padding around the router outlet content */
    }
  `],
})
export class App {
  // The title property can be removed if not used in the template anymore.
}
