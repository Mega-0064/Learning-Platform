import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-lms',
  imports: [CommonModule, RouterLink],
  template: `
    <div *ngIf="course">
      <h3>Learning: {{ course.title }}</h3>
      <a [routerLink]="['/courses', course.id]">Back to Course Details</a> |
      <a [routerLink]="['/courses', course.id, 'forum']">Discussion Forum</a>
      <hr>
      <div class="lms-content">
        <h4>Course Modules</h4>
        <ul *ngIf="course.modules && course.modules.length > 0; else noModules">
          <li *ngFor="let module of course.modules">
            <h5>{{ module.title }}</h5>
            <p>{{ module.description }}</p>
            <ul>
              <li *ngFor="let lesson of module.lessons">
                <a href="#" (click)="selectLesson(lesson); false">{{ lesson.title }}</a>
              </li>
            </ul>
          </li>
        </ul>
        <ng-template #noModules>
          <p>No modules available for this course yet.</p>
        </ng-template>

        <div *ngIf="selectedLesson" class="lesson-viewer">
          <h4>{{ selectedLesson.title }}</h4>
          <p>{{ selectedLesson.content }}</p>
        </div>
      </div>
    </div>
    <div *ngIf="!course">
      <p>Course content not found.</p>
      <a routerLink="/courses">Back to Courses</a>
    </div>
  `,
  styles: [`
    :host { display: block; padding: 20px; }
    h3, h4, h5 { color: #333; }
    .lms-content { margin-top: 20px; }
    .lms-content ul { list-style-type: none; padding-left: 0; }
    .lms-content ul li { margin-bottom: 10px; }
    .lms-content > ul > li { padding: 10px; border: 1px solid #eee; border-radius: 4px; background: #f9f9f9; }
    .lms-content ul ul { padding-left: 20px; } /* Nested list for lessons */
    .lms-content ul ul li a { text-decoration: none; color: #007bff; }
    .lms-content ul ul li a:hover { text-decoration: underline; }
    .lesson-viewer { margin-top: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 4px; background-color: #fff; }
    hr { margin: 15px 0; }
  `]
})
export class Lms implements OnInit {
  courseId: string | null = null;
  course: {
    id: string,
    title: string,
    description: string,
    modules?: { title: string, description: string, lessons: { title: string, content: string }[] }[]
  } | undefined;
  selectedLesson: { title: string, content: string } | undefined;

  // Dummy course data with modules and lessons
  private allCoursesData = [
    {
      id: '1',
      title: 'Course 1: Introduction to Angular',
      description: 'Learn the basics of the Angular framework.',
      modules: [
        {
          title: 'Module 1: Getting Started',
          description: 'Introduction to Angular and setup.',
          lessons: [
            { title: 'Lesson 1.1: What is Angular?', content: 'Content for What is Angular...' },
            { title: 'Lesson 1.2: Setting up your environment', content: 'Content for Setting up your environment...' }
          ]
        },
        {
          title: 'Module 2: Components and Templates',
          description: 'Understanding Angular components.',
          lessons: [
            { title: 'Lesson 2.1: Anatomy of a Component', content: 'Content for Anatomy of a Component...' },
            { title: 'Lesson 2.2: Template Syntax', content: 'Content for Template Syntax...' }
          ]
        }
      ]
    },
    { id: '2', title: 'Course 2: Advanced TypeScript', description: 'Deep dive into TypeScript features.', modules: [] },
    { id: '3', title: 'Course 3: Web Accessibility', description: 'Understanding and implementing WCAG standards.', modules: [] }
  ];

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.courseId = params.get('id');
      if (this.courseId) {
        this.course = this.allCoursesData.find(c => c.id === this.courseId);
        // Optionally, select the first lesson of the first module by default
        if (this.course?.modules?.[0]?.lessons?.[0]) {
          // this.selectedLesson = this.course.modules[0].lessons[0];
        }
      }
    });
  }

  selectLesson(lesson: { title: string, content: string }): void {
    this.selectedLesson = lesson;
  }
}
