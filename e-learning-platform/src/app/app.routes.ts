import { Routes } from '@angular/router';
import { CourseList } from './components/course-list/course-list'; // Corrected path and class name
import { CourseDetail } from './components/course-detail/course-detail'; // Corrected path and class name
import { Lms } from './components/lms/lms'; // Corrected path and class name
import { DiscussionForum } from './components/discussion-forum/discussion-forum'; // Corrected path and class name
// ProgressTrackerComponent might be part of another component or a dashboard,
// so I'll hold off on a direct route for it unless specified.

export const routes: Routes = [
    { path: '', redirectTo: '/courses', pathMatch: 'full' }, // Default route
    { path: 'courses', component: CourseList }, // Corrected class name
    { path: 'courses/:id', component: CourseDetail }, // Corrected class name
    { path: 'courses/:id/learn', component: Lms }, // Corrected class name
    { path: 'courses/:id/forum', component: DiscussionForum }, // Corrected class name
    // Add a wildcard route for 404 if needed, or handle later
    // { path: '**', component: PageNotFoundComponent },
];
