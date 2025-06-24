import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router'; // Import RouterLink and RouterLinkActive

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive], // Add RouterLink and RouterLinkActive
  template: `
    <header class="app-header">
      <div class="logo">
        <a routerLink="/">E-Learning Platform</a>
      </div>
      <nav class="main-nav">
        <ul>
          <li><a routerLink="/courses" routerLinkActive="active-link">Courses</a></li>
          <!-- Placeholder for future links -->
          <li><a routerLink="/dashboard" routerLinkActive="active-link">Dashboard</a></li>
          <li><a routerLink="/profile" routerLinkActive="active-link">Profile</a></li>
        </ul>
      </nav>
      <div class="user-actions">
        <!-- Placeholder for login/logout or user profile icon -->
        <span>Welcome, User!</span>
        <a routerLink="/login" class="login-button">Login</a>
      </div>
    </header>
  `,
  styles: [`
    .app-header {
      background-color: #007bff;
      color: white;
      padding: 15px 30px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .logo a {
      color: white;
      text-decoration: none;
      font-size: 1.5em;
      font-weight: bold;
    }
    .main-nav ul {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
    }
    .main-nav ul li {
      margin-left: 20px;
    }
    .main-nav ul li a {
      color: white;
      text-decoration: none;
      font-size: 1em;
      padding: 5px 0;
      position: relative;
    }
    .main-nav ul li a:hover,
    .main-nav ul li a.active-link {
      border-bottom: 2px solid #fff;
    }
    .user-actions span {
      margin-right: 15px;
    }
    .user-actions .login-button {
      color: #007bff;
      background-color: white;
      padding: 8px 15px;
      text-decoration: none;
      border-radius: 4px;
      font-weight: bold;
    }
    .user-actions .login-button:hover {
      background-color: #f0f0f0;
    }
  `]
})
export class Header { // Ensure class name matches: Header

}
