import { Component } from '@angular/core';
import { RouterLink } from '@angular/router'; // Import RouterLink

@Component({
  selector: 'app-course-list',
  imports: [RouterLink], // Add RouterLink here for navigation
  template: `
    <div>
      <h2>Available Courses</h2>
      <ul>
        <li>
          <a routerLink="/courses/1">Course 1: Introduction to Angular</a>
          <p>Learn the basics of the Angular framework.</p>
        </li>
        <li>
          <a routerLink="/courses/2">Course 2: Advanced TypeScript</a>
          <p>Deep dive into TypeScript features.</p>
        </li>
        <li>
          <a routerLink="/courses/3">Course 3: Web Accessibility</a>
          <p>Understanding and implementing WCAG standards.</p>
        </li>
      </ul>
    </div>
  `,
  styles: [`
    :host { display: block; padding: 20px; }
    h2 { color: #333; }
    ul { list-style-type: none; padding: 0; }
    li { margin-bottom: 15px; padding: 10px; border: 1px solid #eee; border-radius: 5px; background-color: #f9f9f9; }
    li:hover { background-color: #f1f1f1; }
    a { text-decoration: none; color: #007bff; font-weight: bold; }
    a:hover { text-decoration: underline; }
    p { margin-top: 5px; font-size: 0.9em; color: #555; }
  `]
})
export class CourseList { // Ensure class name matches what was generated: CourseList

}
