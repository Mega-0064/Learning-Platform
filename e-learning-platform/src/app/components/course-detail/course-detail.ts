import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router'; // Import ActivatedRoute and RouterLink
import { CommonModule } from '@angular/common'; // Import CommonModule for *ngIf, etc.

@Component({
  selector: 'app-course-detail',
  imports: [CommonModule, RouterLink], // Add CommonModule and RouterLink
  template: `
    <div *ngIf="course">
      <h2>{{ course.title }}</h2>
      <p>{{ course.description }}</p>
      <nav>
        <a [routerLink]="['/courses', course.id, 'learn']">Start Learning</a> |
        <a [routerLink]="['/courses', course.id, 'forum']">Discussion Forum</a>
      </nav>
      <hr>
      <a routerLink="/courses">Back to Courses</a>
    </div>
    <div *ngIf="!course">
      <p>Course not found.</p>
      <a routerLink="/courses">Back to Courses</a>
    </div>
  `,
  styles: [`
    :host { display: block; padding: 20px; }
    h2 { color: #333; }
    p { color: #555; line-height: 1.6; }
    nav a { margin-right: 10px; text-decoration: none; color: #007bff; }
    nav a:hover { text-decoration: underline; }
    hr { margin: 20px 0; }
  `]
})
export class CourseDetail implements OnInit {
  courseId: string | null = null;
  // Placeholder for actual course data. In a real app, this would come from a service.
  course: { id: string, title: string, description: string, modules?: any[] } | undefined;

  // Dummy course data for now
  private allCourses = [
    { id: '1', title: 'Course 1: Introduction to Angular', description: 'Learn the basics of the Angular framework. This course covers components, templates, services, and routing.' },
    { id: '2', title: 'Course 2: Advanced TypeScript', description: 'Deep dive into TypeScript features including generics, decorators, and advanced types.' },
    { id: '3', title: 'Course 3: Web Accessibility', description: 'Understanding and implementing WCAG standards to make web applications accessible to everyone.' }
  ];

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.courseId = params.get('id');
      if (this.courseId) {
        this.course = this.allCourses.find(c => c.id === this.courseId);
      }
    });
  }
}
