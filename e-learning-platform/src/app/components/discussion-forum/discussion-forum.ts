import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common'; // For *ngIf, *ngFor
import { FormsModule } from '@angular/forms'; // For ngModel (template-driven forms)

interface Post {
  id: number;
  author: string;
  content: string;
  timestamp: Date;
  replies?: Post[];
}

@Component({
  selector: 'app-discussion-forum',
  imports: [CommonModule, RouterLink, FormsModule], // Added FormsModule
  template: `
    <div *ngIf="courseId"> <!-- Assuming we want to show forum for a specific course -->
      <h3>Discussion Forum for Course {{ courseId }}</h3>
      <nav>
        <a [routerLink]="['/courses', courseId]">Back to Course Details</a> |
        <a [routerLink]="['/courses', courseId, 'learn']">Back to Learning</a>
      </nav>
      <hr>

      <div class="forum-posts">
        <h4>Threads/Posts</h4>
        <div *ngIf="posts.length > 0; else noPosts">
          <ul>
            <li *ngFor="let post of posts" class="post">
              <p><strong>{{ post.author }}</strong> <small>({{ post.timestamp | date:'short' }})</small></p>
              <p>{{ post.content }}</p>
              <!-- Basic reply functionality can be added here -->
            </li>
          </ul>
        </div>
        <ng-template #noPosts>
          <p>No posts yet. Be the first to start a discussion!</p>
        </ng-template>
      </div>

      <div class="new-post-form">
        <h4>Start a New Discussion / Post a Reply</h4>
        <form (ngSubmit)="submitPost()">
          <div>
            <label for="postAuthor">Your Name:</label>
            <input type="text" id="postAuthor" [(ngModel)]="newPost.author" name="postAuthor" required>
          </div>
          <div>
            <label for="postContent">Message:</label>
            <textarea id="postContent" [(ngModel)]="newPost.content" name="postContent" rows="4" required></textarea>
          </div>
          <button type="submit">Submit Post</button>
        </form>
      </div>

    </div>
    <div *ngIf="!courseId">
      <p>Forum not associated with a specific course.</p>
      <a routerLink="/courses">Browse Courses</a>
    </div>
  `,
  styles: [`
    :host { display: block; padding: 20px; }
    h3, h4 { color: #333; }
    nav a { margin-right: 10px; text-decoration: none; color: #007bff; }
    nav a:hover { text-decoration: underline; }
    hr { margin: 20px 0; }
    .forum-posts ul { list-style-type: none; padding: 0; }
    .post { background-color: #f9f9f9; border: 1px solid #eee; border-radius: 4px; padding: 15px; margin-bottom: 15px; }
    .post p { margin: 5px 0; }
    .post strong { color: #0056b3; }
    .post small { color: #777; font-size: 0.8em; }
    .new-post-form { margin-top: 30px; padding: 20px; border: 1px solid #ddd; border-radius: 4px; background-color: #fff; }
    .new-post-form div { margin-bottom: 10px; }
    .new-post-form label { display: block; margin-bottom: 5px; font-weight: bold; }
    .new-post-form input[type="text"],
    .new-post-form textarea { width: calc(100% - 22px); padding: 10px; border: 1px solid #ccc; border-radius: 4px; }
    .new-post-form button { padding: 10px 15px; background-color: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; }
    .new-post-form button:hover { background-color: #0056b3; }
  `]
})
export class DiscussionForum implements OnInit {
  courseId: string | null = null;
  posts: Post[] = []; // To store forum posts, fetched or managed locally for now

  newPost = {
    author: '',
    content: ''
  };

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.courseId = params.get('id');
      if (this.courseId) {
        // In a real app, fetch posts for this.courseId
        this.loadPosts();
      }
    });
  }

  loadPosts(): void {
    // Dummy posts for demonstration
    this.posts = [
      { id: 1, author: 'Student Alice', content: 'Having trouble with the first module, any tips?', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2) },
      { id: 2, author: 'Instructor Bob', content: 'Make sure you have Node.js v18+ installed. Check the setup guide again.', timestamp: new Date(Date.now() - 1000 * 60 * 30) }
    ];
  }

  submitPost(): void {
    if (this.newPost.author.trim() && this.newPost.content.trim()) {
      const postToAdd: Post = {
        id: Date.now(), // simple unique ID
        author: this.newPost.author,
        content: this.newPost.content,
        timestamp: new Date()
      };
      this.posts.push(postToAdd);
      // Reset form
      this.newPost.author = '';
      this.newPost.content = '';
      // In a real app, this would also send the post to a backend service
    }
  }
}
