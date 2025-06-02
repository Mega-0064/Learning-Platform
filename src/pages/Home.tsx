import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Grid,
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Chip,
  Rating,
  Stack,
  Paper,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  PlayArrow as PlayArrowIcon,
  Star as StarIcon,
  People as PeopleIcon,
  School as SchoolIcon,
  AccessTime as AccessTimeIcon,
  Devices as DevicesIcon,
  EventNote as EventNoteIcon,
} from '@mui/icons-material';
import { useAppSelector } from '../utils/hooks';
import { Course } from '../types/common';

// Featured courses data (in a real app, this would come from Redux/API)
const featuredCourses: Course[] = [
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
    title: 'TypeScript Fundamentals',
    description: 'Master TypeScript and enhance your JavaScript applications.',
    instructor: {
      id: '103',
      name: 'Alex Johnson',
    },
    thumbnail: 'https://via.placeholder.com/300x200?text=TypeScript',
    duration: 12,
    level: 'intermediate',
    rating: 4.6,
    enrolledCount: 950,
    price: 59.99,
  },
];

/**
 * Home page component
 * 
 * Landing page that showcases the platform's features and benefits
 */
const Home = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);

  return (
    <Box>
      {/* Hero Section */}
      <Box 
        sx={{ 
          background: `linear-gradient(to right, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
          color: 'white',
          pt: { xs: 8, md: 12 },
          pb: { xs: 10, md: 14 },
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background pattern */}
        <Box 
          sx={{ 
            position: 'absolute',
            top: 0,
            right: 0,
            width: '100%',
            height: '100%',
            opacity: 0.1,
            background: 'url(https://i.imgur.com/JFvl5GH.png)',
            zIndex: 0,
          }}
        />
        
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography 
                variant="h1" 
                component="h1"
                sx={{ 
                  fontSize: { xs: '2.5rem', md: '3.5rem' },
                  fontWeight: 700,
                  mb: 2,
                }}
              >
                Expand Your Skills with Expert-Led Courses
              </Typography>
              <Typography 
                variant="h5" 
                component="p" 
                sx={{ 
                  mb: 4,
                  opacity: 0.9,
                  fontWeight: 400,
                }}
              >
                Learn from industry experts and advance your career with our comprehensive learning platform.
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Button 
                  variant="contained" 
                  color="secondary" 
                  size="large"
                  sx={{ 
                    px: 4, 
                    py: 1.5,
                    fontSize: '1rem',
                    fontWeight: 600,
                  }}
                  onClick={() => navigate('/courses')}
                >
                  Explore Courses
                </Button>
                <Button 
                  variant="outlined" 
                  color="inherit" 
                  size="large"
                  startIcon={<PlayArrowIcon />}
                  sx={{ 
                    px: 4, 
                    py: 1.5,
                    fontSize: '1rem',
                    fontWeight: 600,
                    borderColor: 'white',
                    '&:hover': {
                      borderColor: 'white',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    }
                  }}
                >
                  How It Works
                </Button>
              </Stack>
              
              {/* Stats */}
              <Box sx={{ mt: 6, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                <Box>
                  <Typography variant="h4" fontWeight="bold">500+</Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>Courses</Typography>
                </Box>
                <Box>
                  <Typography variant="h4" fontWeight="bold">50k+</Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>Students</Typography>
                </Box>
                <Box>
                  <Typography variant="h4" fontWeight="bold">100+</Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>Instructors</Typography>
                </Box>
              </Box>
            </Grid>
            
            {!isMobile && (
              <Grid item md={6}>
                <Box
                  component="img"
                  src="https://i.imgur.com/vFGtQZB.png"
                  alt="Learning Illustration"
                  sx={{
                    width: '100%',
                    maxWidth: 500,
                    display: 'block',
                    margin: '0 auto',
                  }}
                />
              </Grid>
            )}
          </Grid>
        </Container>
      </Box>
      
      {/* Welcome Message for Logged In Users */}
      {isAuthenticated && user && (
        <Container maxWidth="lg">
          <Box 
            sx={{ 
              my: 6, 
              p: 4, 
              borderRadius: 2,
              backgroundColor: 'rgba(25, 118, 210, 0.05)',
              border: '1px solid rgba(25, 118, 210, 0.1)',
            }}
          >
            <Typography variant="h4" gutterBottom>
              Welcome back, {user.firstName}!
            </Typography>
            <Typography variant="body1" gutterBottom>
              Continue your learning journey or explore new courses.
            </Typography>
            <Button 
              variant="contained" 
              color="primary"
              sx={{ mt: 2 }}
              onClick={() => navigate('/profile')}
            >
              Continue Learning
            </Button>
          </Box>
        </Container>
      )}
      
      {/* Featured Courses */}
      <Container maxWidth="lg">
        <Box sx={{ mb: 8 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
            <Typography variant="h4" component="h2" fontWeight="bold">
              Featured Courses
            </Typography>
            <Button 
              variant="text" 
              onClick={() => navigate('/courses')}
              sx={{ fontWeight: 600 }}
            >
              View All
            </Button>
          </Box>
          
          <Grid container spacing={4}>
            {featuredCourses.map((course) => (
              <Grid item xs={12} sm={6} md={4} key={course.id}>
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
                    height="160"
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
                    <Typography gutterBottom variant="h6" component="h3" fontWeight="bold">
                      {course.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {course.description}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      Instructor: {course.instructor.name}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Rating value={course.rating} precision={0.5} readOnly size="small" />
                      <Typography variant="body2" sx={{ ml: 1 }}>
                        ({course.rating})
                      </Typography>
                    </Box>
                    <Typography 
                      variant="h6" 
                      color="primary" 
                      fontWeight="bold"
                    >
                      ${course.price}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button size="small" color="primary">
                      Learn More
                    </Button>
                    <Button size="small" variant="contained" color="primary">
                      Enroll Now
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Container>
      
      {/* Features Section */}
      <Box sx={{ py: 8, backgroundColor: 'rgba(0, 0, 0, 0.02)' }}>
        <Container maxWidth="lg">
          <Typography 
            variant="h4" 
            component="h2" 
            align="center" 
            gutterBottom
            fontWeight="bold"
            sx={{ mb: 6 }}
          >
            Why Choose Our Platform
          </Typography>
          
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 4, 
                  height: '100%',
                  borderRadius: 4,
                  transition: 'transform 0.3s',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                  }
                }}
              >
                <Box 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    width: 60,
                    height: 60,
                    borderRadius: '50%',
                    backgroundColor: theme.palette.primary.main,
                    color: 'white',
                    mb: 2,
                  }}
                >
                  <SchoolIcon fontSize="large" />
                </Box>
                <Typography variant="h5" component="h3" gutterBottom fontWeight="bold">
                  Expert Instructors
                </Typography>
                <Typography variant="body1">
                  Learn from industry professionals with years of real-world experience in their fields. Our instructors are passionate about sharing their knowledge.
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 4, 
                  height: '100%',
                  borderRadius: 4,
                  transition: 'transform 0.3s',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                  }
                }}
              >
                <Box 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    width: 60,
                    height: 60,
                    borderRadius: '50%',
                    backgroundColor: theme.palette.secondary.main,
                    color: 'white',
                    mb: 2,
                  }}
                >
                  <DevicesIcon fontSize="large" />
                </Box>
                <Typography variant="h5" component="h3" gutterBottom fontWeight="bold">
                  Flexible Learning
                </Typography>
                <Typography variant="body1">
                  Access our courses from any device, anytime. Learn at your own pace with lifetime access to purchased courses and downloadable resources.
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 4, 
                  height: '100%',
                  borderRadius: 4,
                  transition: 'transform 0.3s',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                  }
                }}
              >
                <Box 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    width: 60,
                    height: 60,
                    borderRadius: '50%',
                    backgroundColor: theme.palette.success.main,
                    color: 'white',
                    mb: 2,
                  }}
                >
                  <EventNoteIcon fontSize="large" />
                </Box>
                <Typography variant="h5" component="h3" gutterBottom fontWeight="bold">
                  Practical Projects
                </Typography>
                <Typography variant="body1">
                  Apply your knowledge through hands-on projects and assignments. Build a portfolio to showcase your skills to potential employers.
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>
      
      {/* Testimonials */}
      <Container maxWidth="lg">
        <Box sx={{ py: 8 }}>
          <Typography 
            variant="h4" 
            component="h2" 
            align="center" 
            gutterBottom
            fontWeight="bold"
            sx={{ mb: 6 }}
          >
            What Our Students Say
          </Typography>
          
          <Grid container spacing={4}>
            {[1, 2, 3].map((item) => (
              <Grid item xs={12} md={4} key={item}>
                <Card sx={{ height: '100%', p: 3, borderRadius: 4 }}>
                  <Box sx={{ display: 'flex', mb: 2 }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <StarIcon key={star} sx={{ color: theme.palette.warning.main }} />
                    ))}
                  </Box>
                  <Typography variant="body1" paragraph>
                    "The courses on this platform have been instrumental in advancing my career. The instructors are knowledgeable and the content is up-to-date with industry standards."
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar
                      src={`https://i.pravatar.cc/150?img=${item + 10}`}
                      sx={{ width: 50, height: 50, mr: 2 }}
                    />
                    <Box>
                      <Typography variant="subtitle1" fontWeight="bold">Student Name</Typography>
                      <Typography variant="body2" color="text.secondary">Web Developer</Typography>
                    </Box>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Container>
      
      {/* Call to Action */}
      <Box 
        sx={{ 
          py: 8, 
          background: `linear-gradient(to right, ${theme.palette.secondary.main}, ${theme.palette.secondary.dark})`,
          color: 'white',
          textAlign: 'center',
        }}
      >
        <Container maxWidth="md">
          <Typography 
            variant="h3" 
            component="h2" 
            gutterBottom
            fontWeight="bold"
            sx={{ mb: 3 }}
          >
            Ready to Start Learning?
          </Typography>
          <Typography variant="h6" paragraph sx={{ mb: 4, opacity: 0.9 }}>
            Join thousands of students who are already advancing their careers with our courses.
          </Typography>
          <Button 
            variant="contained" 
            color="primary"
            size="large"
            sx={{ 
              px: 5, 
              py: 1.5,
              fontSize: '1.1rem',
              fontWeight: 600,
              backgroundColor: 'white',
              color: theme.palette.secondary.main,
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
              }
            }}
            onClick={() => navigate(isAuthenticated ? '/courses' : '/login')}
          >
            {isAuthenticated ? 'Explore Courses' : 'Get Started'}
          </Button>
        </Container>
      </Box>
    </Box>
  );
};

export default Home;

