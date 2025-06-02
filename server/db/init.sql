-- Drop tables if they exist (useful for clean rebuilds)
DROP TABLE IF EXISTS enrollments;
DROP TABLE IF EXISTS lessons;
DROP TABLE IF EXISTS courses;
DROP TABLE IF EXISTS users;

-- Create users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'student',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on email for faster login queries
CREATE INDEX idx_users_email ON users(email);

-- Create courses table
CREATE TABLE courses (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    instructor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on instructor_id for faster instructor course queries
CREATE INDEX idx_courses_instructor ON courses(instructor_id);

-- Create lessons table
CREATE TABLE lessons (
    id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    order_index INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on course_id for faster course lesson queries
CREATE INDEX idx_lessons_course ON lessons(course_id);
-- Create index on order_index for faster sorted queries
CREATE INDEX idx_lessons_order ON lessons(course_id, order_index);

-- Create enrollments table
CREATE TABLE enrollments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    progress INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    -- Ensure a user can only enroll once in a course
    UNIQUE(user_id, course_id)
);

-- Create index on user_id for faster user enrollment queries
CREATE INDEX idx_enrollments_user ON enrollments(user_id);
-- Create index on course_id for faster course enrollment queries
CREATE INDEX idx_enrollments_course ON enrollments(course_id);

-- Insert sample data

-- Sample users (password would be hashed in a real application)
INSERT INTO users (email, password_hash, name, role) VALUES
('admin@example.com', 'sample_hash_replace_in_production', 'Admin User', 'admin'),
('instructor@example.com', 'sample_hash_replace_in_production', 'John Instructor', 'instructor'),
('student@example.com', 'sample_hash_replace_in_production', 'Jane Student', 'student');

-- Sample courses
INSERT INTO courses (title, description, instructor_id) VALUES
('Introduction to React', 'Learn the basics of React including components, state, and props.', 2),
('Advanced JavaScript', 'Deep dive into JavaScript concepts including closures, prototypes, and async/await.', 2);

-- Sample lessons
INSERT INTO lessons (course_id, title, content, order_index) VALUES
(1, 'React Fundamentals', 'Introduction to React and its core concepts.', 1),
(1, 'Components and Props', 'Learn how to create and use React components.', 2),
(1, 'State and Lifecycle', 'Understanding component state and lifecycle methods.', 3),
(2, 'JavaScript Closures', 'Understanding JavaScript closures and their applications.', 1),
(2, 'Prototypal Inheritance', 'Deep dive into JavaScript prototype chain.', 2);

-- Sample enrollments
INSERT INTO enrollments (user_id, course_id, progress) VALUES
(3, 1, 30),  -- Jane enrolled in React course with 30% progress
(3, 2, 15);  -- Jane enrolled in JavaScript course with 15% progress

