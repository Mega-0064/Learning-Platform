import { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  CardMedia, 
  CardActions, 
  Button, 
  Box, 
  TextField, 
  InputAdornment, 
  FormControl, 
  InputLabel, 
  MenuItem, 
  Select, 
  SelectChangeEvent,
  Chip, 
  Rating, 
  Pagination,
  Slider,
  FormGroup,
  FormControlLabel,
  Checkbox,
  IconButton,
  Drawer,
  useTheme,
  useMediaQuery,
  CircularProgress,
  Alert,
  Divider,
} from '@mui/material';
import { 
  Search as SearchIcon,
  FilterList as FilterListIcon,
  AccessTime as AccessTimeIcon,
  Person as PersonIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { Course } from '../types/common';

// Sample courses data (in a real app, this would come from Redux/API)
const allCourses: Course[] = [
  {
    id: '1',
    title: 'Introduction to React',
    description: 'Learn the basics of React and build your first application.',
    instructor: {
      id: '101',
      name: 'Jane Smith',
    },
    thumbnail: 'https://via.placeholder.com/300x200?text=React',
    duration: 10,
    level: 'beginner',
    rating: 4.5,
    enrolledCount: 1200,
    price: 49.99,
  },
  {
    id: '2',
    title: 'Advanced JavaScript Concepts',
    description: 'Deep dive into advanced JavaScript concepts and patterns.',
    instructor: {
      id: '102',
      name: 'John Doe',
    },
    thumbnail: 'https://via.placeholder.com/300x200?text=JavaScript',
    duration: 15,
    level: 'advanced',
    rating: 4.8,
    enrolledCount: 800,
    price: 69.99,
  },
  {
    id: '3',
    title: 'TypeScript for Beginners',
    description: 'Start your journey with TypeScript and learn type-safe programming.',
    instructor: {
      id: '103',
      name: 'Alice Johnson',
    },
    thumbnail: 'https://via.placeholder.com/300x200?text=TypeScript',
    duration: 8,
    level: 'beginner',
    rating: 4.2,
    enrolledCount: 650,
    price: 39.99,
  },
  {
    id: '4',
    title: 'Full Stack Development with MERN',
    description: 'Build complete applications with MongoDB, Express, React, and Node.js.',
    instructor: {
      id: '104',
      name: 'Robert Wilson',
    },
    thumbnail: 'https://via.placeholder.com/300x200?text=MERN',
    duration: 30,
    level: 'intermediate',
    rating: 4.9,
    enrolledCount: 2500,
    price: 99.99,
  },
  {
    id: '5',
    title: 'UI/UX Design Principles',
    description: 'Learn how to create beautiful and user-friendly interfaces.',
    instructor: {
      id: '105',
      name: 'Sarah Parker',
    },
    thumbnail: 'https://via.placeholder.com/300x200?text=UI/UX',
    duration: 12,
    level: 'beginner',
    rating: 4.7,
    enrolledCount: 1800,
    price: 59.99,
  },
  {
    id: '6',
    title: 'Node.js Masterclass',
    description: 'Master Node.js and build scalable backend applications.',
    instructor: {
      id: '106',
      name: 'Michael Brown',
    },
    thumbnail: 'https://via.placeholder.com/300x200?text=Node.js',
    duration: 20,
    level: 'intermediate',
    rating: 4.6,
    enrolledCount: 1500,
    price: 79.99,
  },
  {
    id: '7',
    title: 'Python for Data Science',
    description: 'Learn Python programming for data analysis and visualization.',
    instructor: {
      id: '107',
      name: 'David Miller',
    },
    thumbnail: 'https://via.placeholder.com/300x200?text=Python',
    duration: 18,
    level: 'beginner',
    rating: 4.8,
    enrolledCount: 2200,
    price: 69.99,
  },
  {
    id: '8',
    title: 'Machine Learning Fundamentals',
    description: 'Understand the core concepts of machine learning and AI.',
    instructor: {
      id: '108',
      name: 'Emily Wilson',
    },
    thumbnail: 'https://via.placeholder.com/300x200?text=ML',
    duration: 25,
    level: 'advanced',
    rating: 4.9,
    enrolledCount: 1800,
    price: 89.99,
  },
];

/**
 * Courses page component
 * 
 * Displays a list of available courses with search, filtering, and pagination
 */
const Courses = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // State for search and filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<number[]>([0, 100]);
  const [ratingFilter, setRatingFilter] = useState<number>(0);
  const [sortBy, setSortBy] = useState('popular');
  const [isLoading, setIsLoading] = useState(false);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  
  // Pagination state
  const [page, setPage] = useState(1);
  const coursesPerPage = 6;
  
  // Simulate loading effect
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    
    return () => clearTimeout(timer);
  }, [searchQuery, levelFilter, priceRange, ratingFilter, sortBy]);
  
  // Filter courses
  const filteredCourses = allCourses
    .filter((course) => {
      // Search filter
      const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           course.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Level filter
      const matchesLevel = levelFilter.length === 0 || levelFilter.includes(course.level);
      
      // Price filter
      const matchesPrice = course.price >= priceRange[0] && course.price <= priceRange[1];
      
      // Rating filter
      const matchesRating = course.rating >= ratingFilter;
      
      return matchesSearch && matchesLevel && matchesPrice && matchesRating;
    })
    .sort((a, b) => {
      // Sort courses
      if (sortBy === 'popular') return b.enrolledCount - a.enrolledCount;
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'price-low') return a.price - b.price;
      if (sortBy === 'price-high') return b.price - a.price;
      if (sortBy === 'newest') return 0; // In a real app, this would compare dates
      return 0;
    });
  
  // Pagination logic
  const indexOfLastCourse = page * coursesPerPage;
  const indexOfFirstCourse = indexOfLastCourse - coursesPerPage;
  const currentCourses = filteredCourses.slice(indexOfFirstCourse, indexOfLastCourse);
  const totalPages = Math.ceil(filteredCourses.length / coursesPerPage);
  
  // Event handlers
  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
    window.scrollTo(0, 0);
  };
  
  const handleSortByChange = (event: SelectChangeEvent) => {
    setSortBy(event.target.value);
  };
  
  const handleLevelChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.name;
    setLevelFilter(prev => 
      event.target.checked
        ? [...prev, value]
        : prev.filter(item => item !== value)
    );
  };
  
  const handlePriceChange = (event: Event, newValue: number | number[]) => {
    setPriceRange(newValue as number[]);
  };
  
  const handleRatingChange = (event: Event, newValue: number | number[]) => {
    setRatingFilter(newValue as number);
  };
  
  const toggleFilterDrawer = () => {
    setFilterDrawerOpen(!filterDrawerOpen);
  };
  
  const clearFilters = () => {
    setSearchQuery('');
    setLevelFilter([]);
    setPriceRange([0, 100]);
    setRatingFilter(0);
    setSortBy('popular');
  };
  
  // Filter panel component - used in both drawer and sidebar
  const filterPanel = (
    <Box sx={{ p: isMobile ? 3 : 0 }}>
      {isMobile && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Filters</Typography>
          <IconButton onClick={toggleFilterDrawer}>
            <CloseIcon />
          </IconButton>
        </Box>
      )}
      
      <Box sx={{ mb: 4 }}>
        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
          Course Level
        </Typography>
        <FormGroup>
          <FormControlLabel 
            control={
              <Checkbox 
                checked={levelFilter.includes('beginner')} 
                onChange={handleLevelChange} 
                name="beginner" 
              />
            } 
            label="Beginner" 
          />
          <FormControlLabel 
            control={
              <Checkbox 
                checked={levelFilter.includes('intermediate')} 
                onChange={handleLevelChange} 
                name="intermediate" 
              />
            } 
            label="Intermediate" 
          />
          <FormControlLabel 
            control={
              <Checkbox 
                checked={levelFilter.includes('advanced')} 
                onChange={handleLevelChange} 
                name="advanced" 
              />
            } 
            label="Advanced" 
          />
        </FormGroup>
      </Box>
      
      <Box sx={{ mb: 4 }}>
        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
          Price Range
        </Typography>
        <Box sx={{ px: 1 }}>
          <Slider
            value={priceRange}
            onChange={handlePriceChange}
            valueLabelDisplay="auto"
            min={0}
            max={100}
            step={5}
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2">${priceRange[0]}</Typography>
            <Typography variant="body2">${priceRange[1]}</Typography>
          </Box>
        </Box>
      </Box>
      
      <Box sx={{ mb: 4 }}>
        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
          Rating
        </Typography>
        <Box sx={{ px: 1 }}>
          <Slider
            value={ratingFilter}
            onChange={handleRatingChange}
            valueLabelDisplay="auto"
            min={0}
            max={5}
            step={0.5}
            marks={[
              { value: 0, label: '0' },
              { value: 5, label: '5' },
            ]}
          />
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
            <Typography variant="body2" sx={{ mr: 1 }}>Minimum rating:</Typography>
            <Rating value={ratingFilter} precision={0.5} readOnly size="small" />
          </Box>
        </Box>
      </Box>
      
      <Button 
        variant="outlined" 
        color="primary" 
        onClick={clearFilters}
        fullWidth
      >
        Clear Filters
      </Button>
    </Box>
  );
  
  return (
    <Container maxWidth="lg">
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom fontWeight="bold">
          Courses
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Explore our wide range of courses and find the perfect one for your learning journey.
        </Typography>
      </Box>
      
      {/* Search and Filter Controls */}
      <Grid container spacing={4}>
        {/* Left sidebar for filters (desktop) */}
        {!isMobile && (
          <Grid item xs={12} md={3}>
            {filterPanel}
          </Grid>
        )}
        
        {/* Main content area */}
        <Grid item xs={12} md={isMobile ? 12 : 9}>
          {/* Search and sort bar */}
          <Box 
            sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', sm: 'row' }, 
              gap: 2,
              alignItems: { xs: 'stretch', sm: 'center' },
              mb: 3,
            }}
          >
            <TextField
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ flexGrow: 1 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              {isMobile && (
                <Button 
                  variant="outlined" 
                  startIcon={<FilterListIcon />}
                  onClick={toggleFilterDrawer}
                  sx={{ minWidth: 100 }}
                >
                  Filters
                </Button>
              )}
              
              <FormControl sx={{ minWidth: 150 }}>
                <InputLabel id="sort-by-label">Sort By</InputLabel>
                <Select
                  labelId="sort-by-label"
                  value={sortBy}
                  label="Sort By"
                  onChange={handleSortByChange}
                >
                  <MenuItem value="popular">Most Popular</MenuItem>
                  <MenuItem value="rating">Highest Rated</MenuItem>
                  <MenuItem value="price-low">Price: Low to High</MenuItem>
                  <MenuItem value="price-high">Price: High to Low</MenuItem>
                  <MenuItem value="newest">Newest</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>
          
          {/* Active filters */}
          {(levelFilter.length > 0 || priceRange[0] > 0 || priceRange[1] < 100 || ratingFilter > 0) && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
              <Typography variant="body2" sx={{ mr: 1, alignSelf: 'center' }}>
                Active filters:
              </Typography>
              
              {levelFilter.map(level => (
                <Chip 
                  key={level}
                  label={`Level: ${level.charAt(0).toUpperCase() + level.slice(1)}`}
                  onDelete={() => setLevelFilter(prev => prev.filter(l => l !== level))}
                  size="small"
                />
              ))}
              
              {(priceRange[0] > 0 || priceRange[1] < 100) && (
                <Chip 
                  label={`Price: $${priceRange[0]} - $${priceRange[1]}`}
                  onDelete={() => setPriceRange([0, 100])}
                  size="small"
                />
              )}
              
              {ratingFilter > 0 && (
                <Chip 
                  label={`Rating: ${ratingFilter}+`}
                  onDelete={() => setRatingFilter(0)}
                  size="small"
                />
              )}
              
              <Button 
                variant="text" 
                size="small"
                onClick={clearFilters}
              >
                Clear All
              </Button>
            </Box>
          )}
          
          {/* Loading state */}
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {/* Results count */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2">
                  Showing {filteredCourses.length} courses
                </Typography>
              </Box>
              
              {/* Course grid */}
              {filteredCourses.length > 0 ? (
                <Grid container spacing={3}>
                  {currentCourses.map((course) => (
                    <Grid item xs={12} sm={6} lg={4} key={course.id}>
                      <Card 
                        sx={{ 
                          height: '100%', 
                          display: 'flex', 
                          flexDirection: 'column',
                          transition: 'transform 0.3s, box-shadow 0.3s',
                          '&:hover': {
                            transform: 'translateY(-5px)',
                            boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
                          }
                        }}
                      >
                        <CardMedia
                          component="img"
                          height="140"
                          image={course.thumbnail}
                          alt={course.title}
                        />
                        <CardContent sx={{ flexGrow: 1 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Chip 
                              label={course.level} 
                              size="small" 
                              color={
                                course.level === 'beginner' ? 'success' : 
                                course.level === 'intermediate' ? 'primary' : 'error'
                              }
                            />
                            <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <AccessTimeIcon fontSize="inherit" />
                              {course.duration} hours
                            </Typography>
                          </Box>
                          <Typography gutterBottom variant="h6" component="h2">
                            {course.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {course.description.length > 80 
                              ? `${course.description.substring(0, 80)}...` 
                              : course.description}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <PersonIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                            <Typography variant="body2">
                              {course.instructor.name}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Rating value={course.rating} precision={0.5} readOnly size="small" />
                            <Typography variant="body2" sx={{ ml: 1 }}>
                              ({course.rating})
                            </Typography>
                          </Box>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {course.enrolledCount.toLocaleString()} students
                          </Typography>
                          <Typography 
                            variant="h6" 
                            color="primary.main" 
                            fontWeight="bold"
                          >
                            ${course.price}
                          </Typography>
                        </CardContent>
                        <CardActions>
                          <Button size="small" color="primary">
                            Details
                          </Button>
                          <Button size="small" variant="contained" color="primary">
                            Enroll Now
                          </Button>
                        </CardActions>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Box sx={{ py: 8, textAlign: 'center' }}>
                  <Alert severity="info" sx={{ mb: 3 }}>
                    No courses match your search criteria.
                  </Alert>
                  <Button variant="outlined" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                </Box>
              )}
              
              {/* Pagination */}
              {filteredCourses.length > coursesPerPage && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
                  <Pagination
                    count={totalPages}
                    page={page}
                    onChange={handlePageChange}
                    color="primary"
                    showFirstButton
                    showLastButton
                  />
                </Box>
              )}
            </>
          )}
        </Grid>
      </Grid>
      
      {/* Filter drawer for mobile */}
      <Drawer
        anchor="left"
        open={filterDrawerOpen}
        onClose={toggleFilterDrawer}
        PaperProps={{
          sx: { width: '80%', maxWidth: 300 },
        }}
      >
        {filterPanel}
      </Drawer>
    </Container>
  );
};

export default Courses;

