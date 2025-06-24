import { Component } from '@angular/core';
import { RouterLink } from '@angular/router'; // Import RouterLink

@Component({
  selector: 'app-footer',
  imports: [RouterLink], // Add RouterLink
  template: `
    <footer class="app-footer">
      <div class="footer-content">
        <p>&copy; {{ currentYear }} E-Learning Platform. All rights reserved.</p>
        <nav class="footer-nav">
          <ul>
            <li><a routerLink="/about">About Us</a></li>
            <li><a routerLink="/contact">Contact</a></li>
            <li><a routerLink="/privacy">Privacy Policy</a></li>
            <li><a routerLink="/terms">Terms of Service</a></li>
          </ul>
        </nav>
      </div>
    </footer>
  `,
  styles: [`
    .app-footer {
      background-color: #343a40;
      color: #f8f9fa;
      padding: 20px 30px;
      text-align: center;
      margin-top: auto; /* Helps push footer to bottom if main content is short */
    }
    .footer-content p {
      margin: 0 0 10px 0;
    }
    .footer-nav ul {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      justify-content: center;
      gap: 15px; /* Spacing between links */
    }
    .footer-nav ul li a {
      color: #f8f9fa;
      text-decoration: none;
    }
    .footer-nav ul li a:hover {
      text-decoration: underline;
      color: #adb5bd;
    }
  `]
})
export class Footer { // Ensure class name matches: Footer
  currentYear = new Date().getFullYear();
}
