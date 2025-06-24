import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

interface CourseProgress {
  courseId: string;
  courseTitle: string;
  completedModules: number;
  totalModules: number;
  percentage: number;
}

@Component({
  selector: 'app-progress-tracker',
  imports: [CommonModule],
  template: `
    <div class="progress-tracker-widget">
      <h4>My Learning Progress</h4>
      <div *ngIf="overallProgress.length > 0; else noProgress">
        <ul>
          <li *ngFor="let progress of overallProgress" class="course-progress-item">
            <h5>{{ progress.courseTitle }}</h5>
            <p>Modules: {{ progress.completedModules }} / {{ progress.totalModules }}</p>
            <div class="progress-bar-container">
              <div class="progress-bar" [style.width.%]="progress.percentage">
                {{ progress.percentage }}%
              </div>
            </div>
          </li>
        </ul>
      </div>
      <ng-template #noProgress>
        <p>No courses started yet. <a routerLink="/courses">Explore courses</a> to begin!</p>
      </ng-template>
    </div>
  `,
  styles: [`
    :host { display: block; padding: 15px; background-color: #f0f0f0; border-radius: 5px; margin-bottom: 20px; }
    h4 { color: #333; margin-top: 0; }
    ul { list-style-type: none; padding: 0; }
    .course-progress-item { margin-bottom: 15px; padding: 10px; background-color: #fff; border: 1px solid #ddd; border-radius: 4px; }
    .course-progress-item h5 { margin: 0 0 5px 0; color: #0056b3; }
    .progress-bar-container { width: 100%; background-color: #e9ecef; border-radius: .25rem; height: 20px; overflow: hidden; }
    .progress-bar {
      background-color: #28a745;
      height: 100%;
      line-height: 20px;
      color: white;
      text-align: center;
      font-size: 0.8em;
      transition: width 0.6s ease;
    }
    a { color: #007bff; }
    a:hover { text-decoration: underline; }
  `]
})
export class ProgressTracker implements OnInit {
  // This would typically be an @Input if this component is embedded,
  // or fetched from a user service if it's a standalone page/widget.
  @Input() userId: string | null = null; // Example: could be used to fetch user-specific progress

  overallProgress: CourseProgress[] = [];

  constructor() {} // Potentially inject a UserService here

  ngOnInit(): void {
    // In a real app, fetch progress data for the user (e.g., this.userId)
    this.loadUserProgress();
  }

  loadUserProgress(): void {
    // Dummy data for demonstration
    this.overallProgress = [
      { courseId: '1', courseTitle: 'Introduction to Angular', completedModules: 1, totalModules: 5, percentage: 20 },
      { courseId: '2', courseTitle: 'Advanced TypeScript', completedModules: 3, totalModules: 4, percentage: 75 },
      { courseId: 'csharp', courseTitle: 'C# Fundamentals', completedModules: 0, totalModules: 6, percentage: 0 },
    ];
    // Calculate percentage if not provided directly by a service
    this.overallProgress.forEach(p => {
      if (p.totalModules > 0) {
        p.percentage = Math.round((p.completedModules / p.totalModules) * 100);
      } else {
        p.percentage = 0;
      }
    });
  }
}
