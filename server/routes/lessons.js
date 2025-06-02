const express = require('express');
const db = require('../config/db.js');
const query = db.query;

const router = express.Router();

/**
 * @route   GET /api/lessons
 * @desc    Get all lessons (admin only)
 * @access  Private/Admin
 */
router.get('/', async (req, res) => {
  try {
    // Optional course_id query parameter to filter by course
    const { course_id } = req.query;
    
    let queryText;
    let queryParams = [];
    
    if (course_id) {
      queryText = `
        SELECT l.*, c.title as course_title
        FROM lessons l
        JOIN courses c ON l.course_id = c.id
        WHERE l.course_id = $1
        ORDER BY l.order_index ASC
      `;
      queryParams.push(course_id);
    } else {
      queryText = `
        SELECT l.*, c.title as course_title
        FROM lessons l
        JOIN courses c ON l.course_id = c.id
        ORDER BY c.id, l.order_index ASC
      `;
    }
    
    const result = await query(queryText, queryParams);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching lessons:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/**
 * @route   GET /api/lessons/:id
 * @desc    Get lesson by ID
 * @access  Private
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ message: 'Invalid lesson ID' });
    }
    
    // Get lesson with course details
    const result = await query(
      `SELECT l.*, c.title as course_title, c.description as course_description, 
              u.name as instructor_name, u.id as instructor_id
       FROM lessons l
       JOIN courses c ON l.course_id = c.id
       JOIN users u ON c.instructor_id = u.id
       WHERE l.id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Lesson not found' });
    }
    
    // Get next and previous lessons
    const lessonData = result.rows[0];
    const courseId = lessonData.course_id;
    const orderIndex = lessonData.order_index;
    
    // Get previous lesson
    const prevLessonResult = await query(
      `SELECT id, title FROM lessons 
       WHERE course_id = $1 AND order_index < $2
       ORDER BY order_index DESC LIMIT 1`,
      [courseId, orderIndex]
    );
    
    // Get next lesson
    const nextLessonResult = await query(
      `SELECT id, title FROM lessons 
       WHERE course_id = $1 AND order_index > $2
       ORDER BY order_index ASC LIMIT 1`,
      [courseId, orderIndex]
    );
    
    // Combine results
    const lesson = {
      ...lessonData,
      previous_lesson: prevLessonResult.rows.length > 0 ? prevLessonResult.rows[0] : null,
      next_lesson: nextLessonResult.rows.length > 0 ? nextLessonResult.rows[0] : null
    };
    
    res.json(lesson);
  } catch (err) {
    console.error('Error fetching lesson:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/**
 * @route   POST /api/lessons
 * @desc    Create a new lesson
 * @access  Private/Instructor
 */
router.post('/', async (req, res) => {
  try {
    const { course_id, title, content, order_index } = req.body;
    
    // Basic validation
    if (!course_id || !title || !content) {
      return res.status(400).json({ message: 'Please provide course_id, title, and content' });
    }
    
    // Validate course_id
    if (isNaN(parseInt(course_id))) {
      return res.status(400).json({ message: 'Invalid course ID' });
    }
    
    // Check if course exists
    const courseCheck = await query('SELECT * FROM courses WHERE id = $1', [course_id]);
    if (courseCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // In a real app, you would check if the current user is the instructor of this course
    
    // Determine order_index if not provided
    let lessonOrderIndex = order_index;
    if (lessonOrderIndex === undefined) {
      // Find the max order_index for this course and add 1
      const maxOrderResult = await query(
        'SELECT MAX(order_index) as max_order FROM lessons WHERE course_id = $1',
        [course_id]
      );
      
      const maxOrder = maxOrderResult.rows[0].max_order;
      lessonOrderIndex = maxOrder !== null ? maxOrder + 1 : 1;
    }
    
    // Insert new lesson
    const result = await query(
      'INSERT INTO lessons (course_id, title, content, order_index) VALUES ($1, $2, $3, $4) RETURNING *',
      [course_id, title, content, lessonOrderIndex]
    );
    
    res.status(201).json({
      message: 'Lesson created successfully',
      lesson: result.rows[0],
    });
  } catch (err) {
    console.error('Error creating lesson:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/**
 * @route   PUT /api/lessons/:id
 * @desc    Update a lesson
 * @access  Private/Instructor
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;
    
    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ message: 'Invalid lesson ID' });
    }
    
    // Basic validation
    if (!title && !content) {
      return res.status(400).json({ message: 'Please provide at least one field to update' });
    }
    
    // Check if lesson exists
    const lessonCheck = await query('SELECT * FROM lessons WHERE id = $1', [id]);
    if (lessonCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Lesson not found' });
    }
    
    // In a real app, you would check if the current user is the instructor of this course
    
    // Build update query
    let updateQuery = 'UPDATE lessons SET ';
    const updateValues = [];
    let valueIndex = 1;
    
    if (title) {
      updateQuery += `title = $${valueIndex}, `;
      updateValues.push(title);
      valueIndex++;
    }
    
    if (content) {
      updateQuery += `content = $${valueIndex}, `;
      updateValues.push(content);
      valueIndex++;
    }
    
    // Add updated_at timestamp
    updateQuery += `updated_at = CURRENT_TIMESTAMP WHERE id = $${valueIndex} RETURNING *`;
    updateValues.push(id);
    
    const result = await query(updateQuery, updateValues);
    
    res.json({
      message: 'Lesson updated successfully',
      lesson: result.rows[0],
    });
  } catch (err) {
    console.error('Error updating lesson:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/**
 * @route   DELETE /api/lessons/:id
 * @desc    Delete a lesson
 * @access  Private/Instructor
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ message: 'Invalid lesson ID' });
    }
    
    // Check if lesson exists
    const lessonCheck = await query('SELECT * FROM lessons WHERE id = $1', [id]);
    if (lessonCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Lesson not found' });
    }
    
    // In a real app, you would check if the current user is the instructor of this course
    
    // Get lesson details before deletion for reordering
    const lesson = lessonCheck.rows[0];
    const { course_id, order_index } = lesson;
    
    // Delete lesson
    await query('DELETE FROM lessons WHERE id = $1', [id]);
    
    // Reorder remaining lessons
    await query(
      'UPDATE lessons SET order_index = order_index - 1 WHERE course_id = $1 AND order_index > $2',
      [course_id, order_index]
    );
    
    res.json({ message: 'Lesson deleted successfully' });
  } catch (err) {
    console.error('Error deleting lesson:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/**
 * @route   PUT /api/lessons/:id/reorder
 * @desc    Change the order of a lesson
 * @access  Private/Instructor
 */
router.put('/:id/reorder', async (req, res) => {
  try {
    const { id } = req.params;
    const { new_order } = req.body;
    
    // Validate inputs
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ message: 'Invalid lesson ID' });
    }
    
    if (new_order === undefined || isNaN(parseInt(new_order)) || new_order < 1) {
      return res.status(400).json({ message: 'New order must be a positive number' });
    }
    
    // Get lesson details
    const lessonResult = await query('SELECT * FROM lessons WHERE id = $1', [id]);
    if (lessonResult.rows.length === 0) {
      return res.status(404).json({ message: 'Lesson not found' });
    }
    
    const lesson = lessonResult.rows[0];
    const { course_id, order_index: current_order } = lesson;
    
    // Check if new order is different from current order
    if (current_order === new_order) {
      return res.json({
        message: 'No change in order',
        lesson
      });
    }
    
    // Get count of lessons in the course
    const countResult = await query(
      'SELECT COUNT(*) as lesson_count FROM lessons WHERE course_id = $1',
      [course_id]
    );
    
    const lessonCount = parseInt(countResult.rows[0].lesson_count);
    
    // Validate that new_order is within bounds
    if (new_order > lessonCount) {
      return res.status(400).json({
        message: `New order must be between 1 and ${lessonCount}`
      });
    }
    
    // Start a transaction for reordering
    await query('BEGIN');
    
    try {
      if (new_order < current_order) {
        // Moving up in the list - increment order_index for lessons in between
        await query(
          `UPDATE lessons 
           SET order_index = order_index + 1, updated_at = CURRENT_TIMESTAMP
           WHERE course_id = $1 AND order_index >= $2 AND order_index < $3`,
          [course_id, new_order, current_order]
        );
      } else {
        // Moving down in the list - decrement order_index for lessons in between
        await query(
          `UPDATE lessons 
           SET order_index = order_index - 1, updated_at = CURRENT_TIMESTAMP
           WHERE course_id = $1 AND order_index > $2 AND order_index <= $3`,
          [course_id, current_order, new_order]
        );
      }
      
      // Update the lesson's order_index
      const updateResult = await query(
        `UPDATE lessons 
         SET order_index = $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2
         RETURNING *`,
        [new_order, id]
      );
      
      await query('COMMIT');
      
      res.json({
        message: 'Lesson reordered successfully',
        lesson: updateResult.rows[0]
      });
    } catch (err) {
      await query('ROLLBACK');
      throw err;
    }
  } catch (err) {
    console.error('Error reordering lesson:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/**
 * @route   POST /api/lessons/:id/complete
 * @desc    Mark a lesson as completed for a user
 * @access  Private
 * 
 * Note: This would require a lesson_completions table that we haven't created yet.
 * This is just a placeholder implementation.
 */
router.post('/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.body;
    
    // Validate inputs
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ message: 'Invalid lesson ID' });
    }
    
    if (!user_id || isNaN(parseInt(user_id))) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    
    // Check if lesson exists
    const lessonCheck = await query('SELECT * FROM lessons WHERE id = $1', [id]);
    if (lessonCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Lesson not found' });
    }
    
    // Check if user exists
    const userCheck = await query('SELECT * FROM users WHERE id = $1', [user_id]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if user is enrolled in the course
    const lesson = lessonCheck.rows[0];
    const enrollmentCheck = await query(
      'SELECT * FROM enrollments WHERE user_id = $1 AND course_id = $2',
      [user_id, lesson.course_id]
    );
    
    if (enrollmentCheck.rows.length === 0) {
      return res.status(400).json({ message: 'User is not enrolled in this course' });
    }
    
    // In a real implementation, we would:
    // 1. Create a lesson_completions table in the database
    // 2. Insert or update a record for this user and lesson
    // 3. Update the user's overall course progress
    
    // For now, just update the enrollment progress
    // This is simplified - in a real app, calculate based on completed lessons
    const courseResult = await query(
      'SELECT COUNT(*) as total_lessons FROM lessons WHERE course_id = $1',
      [lesson.course_id]
    );
    
    const totalLessons = parseInt(courseResult.rows[0].total_lessons);
    const progressIncrement = Math.floor(100 / totalLessons);
    
    // Get current progress
    const enrollment = enrollmentCheck.rows[0];
    let newProgress = enrollment.progress + progressIncrement;
    if (newProgress > 100) newProgress = 100;
    
    // Update progress
    const updateResult = await query(
      'UPDATE enrollments SET progress = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [newProgress, enrollment.id]
    );
    
    res.json({
      message: 'Lesson marked as completed',
      enrollment: updateResult.rows[0]
    });
  } catch (err) {
    console.error('Error marking lesson as completed:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
