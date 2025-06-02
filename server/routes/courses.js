const express = require('express');
const db = require('../config/db.js');

const router = express.Router();

/**
 * @route   GET /api/courses
 * @desc    Get all courses
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT c.id, c.title, c.description, c.created_at,
        u.name AS instructor_name, u.id AS instructor_id,
        COUNT(DISTINCT e.id) AS enrollment_count,
        COUNT(DISTINCT l.id) AS lesson_count
      FROM courses c
      JOIN users u ON c.instructor_id = u.id
      LEFT JOIN enrollments e ON c.id = e.course_id
      LEFT JOIN lessons l ON c.id = l.course_id
      GROUP BY c.id, u.id
      ORDER BY c.created_at DESC`
    );
    
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching courses:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/**
 * @route   GET /api/courses/:id
 * @desc    Get course details by ID
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ message: 'Invalid course ID' });
    }
    
    // Get course details
    const courseResult = await db.query(
      `SELECT c.id, c.title, c.description, c.created_at,
        u.name AS instructor_name, u.id AS instructor_id,
        COUNT(DISTINCT e.id) AS enrollment_count
      FROM courses c
      JOIN users u ON c.instructor_id = u.id
      LEFT JOIN enrollments e ON c.id = e.course_id
      WHERE c.id = $1
      GROUP BY c.id, u.id`,
      [id]
    );
    
    if (courseResult.rows.length === 0) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Get course lessons
    const lessonsResult = await db.query(
      `SELECT id, title, content, order_index, created_at
      FROM lessons
      WHERE course_id = $1
      ORDER BY order_index ASC`,
      [id]
    );
    
    // Combine results
    const course = {
      ...courseResult.rows[0],
      lessons: lessonsResult.rows
    };
    
    res.json(course);
  } catch (err) {
    console.error('Error fetching course details:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/**
 * @route   POST /api/courses
 * @desc    Create a new course
 * @access  Private/Instructor
 */
router.post('/', async (req, res) => {
  try {
    const { title, description, instructor_id } = req.body;
    
    // Basic validation
    if (!title || !description || !instructor_id) {
      return res.status(400).json({ message: 'Please provide title, description, and instructor_id' });
    }
    
    // Verify instructor exists and has instructor role
    const instructorResult = await db.query(
      'SELECT * FROM users WHERE id = $1 AND role IN (\'instructor\', \'admin\')',
      [instructor_id]
    );
    
    if (instructorResult.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid instructor ID or user is not an instructor' });
    }
    
    // Insert new course
    const result = await db.query(
      'INSERT INTO courses (title, description, instructor_id) VALUES ($1, $2, $3) RETURNING *',
      [title, description, instructor_id]
    );
    
    res.status(201).json({
      message: 'Course created successfully',
      course: result.rows[0],
    });
  } catch (err) {
    console.error('Error creating course:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/**
 * @route   PUT /api/courses/:id
 * @desc    Update a course
 * @access  Private/Instructor
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description } = req.body;
    
    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ message: 'Invalid course ID' });
    }
    
    // Basic validation
    if (!title && !description) {
      return res.status(400).json({ message: 'Please provide at least one field to update' });
    }
    
    // Check if course exists
    const courseCheck = await db.query('SELECT * FROM courses WHERE id = $1', [id]);
    if (courseCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // In a real app, you would check if the current user is the instructor of this course
    
    // Build update query
    let updateQuery = 'UPDATE courses SET ';
    const updateValues = [];
    let valueIndex = 1;
    
    if (title) {
      updateQuery += `title = $${valueIndex}, `;
      updateValues.push(title);
      valueIndex++;
    }
    
    if (description) {
      updateQuery += `description = $${valueIndex}, `;
      updateValues.push(description);
      valueIndex++;
    }
    
    // Add updated_at timestamp
    updateQuery += `updated_at = CURRENT_TIMESTAMP WHERE id = $${valueIndex} RETURNING *`;
    updateValues.push(id);
    
    const result = await db.query(updateQuery, updateValues);
    
    res.json({
      message: 'Course updated successfully',
      course: result.rows[0],
    });
  } catch (err) {
    console.error('Error updating course:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/**
 * @route   DELETE /api/courses/:id
 * @desc    Delete a course
 * @access  Private/Instructor
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ message: 'Invalid course ID' });
    }
    
    // Check if course exists
    const courseCheck = await db.query('SELECT * FROM courses WHERE id = $1', [id]);
    if (courseCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // In a real app, you would check if the current user is the instructor of this course
    
    // Delete course (cascade will delete lessons and enrollments due to foreign key constraints)
    await db.query('DELETE FROM courses WHERE id = $1', [id]);
    
    res.json({ message: 'Course deleted successfully' });
  } catch (err) {
    console.error('Error deleting course:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/**
 * @route   GET /api/courses/:id/students
 * @desc    Get all students enrolled in a course
 * @access  Private/Instructor
 */
router.get('/:id/students', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ message: 'Invalid course ID' });
    }
    
    // Check if course exists
    const courseCheck = await db.query('SELECT * FROM courses WHERE id = $1', [id]);
    if (courseCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Get enrolled students
    const studentsResult = await db.query(
      `SELECT u.id, u.name, u.email, e.progress, e.created_at AS enrollment_date
      FROM users u
      JOIN enrollments e ON u.id = e.user_id
      WHERE e.course_id = $1
      ORDER BY u.name ASC`,
      [id]
    );
    
    res.json(studentsResult.rows);
  } catch (err) {
    console.error('Error fetching enrolled students:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/**
 * @route   POST /api/courses/:id/enroll
 * @desc    Enroll a user in a course
 * @access  Private
 */
router.post('/:id/enroll', async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.body;
    
    // Validate IDs
    if (!id || isNaN(parseInt(id)) || !user_id || isNaN(parseInt(user_id))) {
      return res.status(400).json({ message: 'Invalid course ID or user ID' });
    }
    
    // Check if course exists
    const courseCheck = await db.query('SELECT * FROM courses WHERE id = $1', [id]);
    if (courseCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Check if user exists
    const userCheck = await db.query('SELECT * FROM users WHERE id = $1', [user_id]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if already enrolled
    const enrollmentCheck = await db.query(
      'SELECT * FROM enrollments WHERE user_id = $1 AND course_id = $2',
      [user_id, id]
    );
    
    if (enrollmentCheck.rows.length > 0) {
      return res.status(400).json({ message: 'User already enrolled in this course' });
    }
    
    // Create enrollment
    const result = await db.query(
      'INSERT INTO enrollments (user_id, course_id, progress) VALUES ($1, $2, 0) RETURNING *',
      [user_id, id]
    );
    
    res.status(201).json({
      message: 'Enrolled in course successfully',
      enrollment: result.rows[0],
    });
  } catch (err) {
    console.error('Error enrolling in course:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/**
 * @route   DELETE /api/courses/:id/enroll
 * @desc    Unenroll a user from a course
 * @access  Private
 */
router.delete('/:id/enroll', async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.body;
    
    // Validate IDs
    if (!id || isNaN(parseInt(id)) || !user_id || isNaN(parseInt(user_id))) {
      return res.status(400).json({ message: 'Invalid course ID or user ID' });
    }
    
    // Check if enrollment exists
    const enrollmentCheck = await db.query(
      'SELECT * FROM enrollments WHERE user_id = $1 AND course_id = $2',
      [user_id, id]
    );
    
    if (enrollmentCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }
    
    // Delete enrollment
    await db.query(
      'DELETE FROM enrollments WHERE user_id = $1 AND course_id = $2',
      [user_id, id]
    );
    
    res.json({ message: 'Unenrolled from course successfully' });
  } catch (err) {
    console.error('Error unenrolling from course:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/**
 * @route   PUT /api/courses/:id/progress
 * @desc    Update a user's progress in a course
 * @access  Private
 */
router.put('/:id/progress', async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id, progress } = req.body;
    
    // Validate IDs
    if (!id || isNaN(parseInt(id)) || !user_id || isNaN(parseInt(user_id))) {
      return res.status(400).json({ message: 'Invalid course ID or user ID' });
    }
    
    // Validate progress
    if (progress === undefined || isNaN(parseInt(progress)) || progress < 0 || progress > 100) {
      return res.status(400).json({ message: 'Progress must be a number between 0 and 100' });
    }
    
    // Check if enrollment exists
    const enrollmentCheck = await db.query(
      'SELECT * FROM enrollments WHERE user_id = $1 AND course_id = $2',
      [user_id, id]
    );
    
    if (enrollmentCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }
    
    // Update progress
    const result = await db.query(
      'UPDATE enrollments SET progress = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2 AND course_id = $3 RETURNING *',
      [progress, user_id, id]
    );
    
    res.json({
      message: 'Course progress updated successfully',
      enrollment: result.rows[0],
    });
  } catch (err) {
    console.error('Error updating course progress:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
