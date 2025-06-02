import { useState } from 'react';
import { 
  Container, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  Box, 
  Avatar, 
  Button, 
  Divider, 
  Tabs, 
  Tab, 
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  LinearProgress,
  Chip,
} from '@mui/material';
import { useAppSelector } from '../utils/hooks';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

// Tab panel component for showing/hiding tab content
function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const Profile = () => {
  const [tabValue, setTabValue] = useState(0);
  const { user } = useAppSelector((state) => state.auth);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Sample enrolled courses data (in a real app, this would come from an API or Redux)
  const enrolledCourses = [
    {
      id: '1',
      title: 'Introduction to React',
      description: 'Learn the basics of React and build your first application.',
      instructor: {
        id: '101',
        name: 'Jane Smith',
      },
      thumbnail: 'https://via.placeholder.com/300x200?text=React',
      progress: 65,
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
      progress: 30,
    },
  ];

  if (!user) {
    return (
      <Container>
        <Typography>Loading user profile...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Grid container spacing={4}>
        {/* Profile Information */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
                <Avatar
                  alt={user.username}
                  src={user.avatar}
                  sx={{ width: 120, height: 120, mb: 2 }}
                />
                <Typography variant="h5">{user.firstName} {user.lastName}</Typography>
                <Typography variant="body1" color="text.secondary">{user.email}</Typography>
                <Chip 
                  label={user.role.charAt(0).toUpperCase() + user.role.slice(1)} 
                  color="primary" 
                  sx={{ mt: 1 }}
                />
              </Box>
              <Divider sx={{ my: 2 }} />
              <Button variant="outlined" fullWidth sx={{ mb: 1 }}>
                Edit Profile
              </Button>
              <Button variant="contained" fullWidth>
                Become an Instructor
              </Button>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Profile Tabs */}
        <Grid item xs={12} md={8}>
          <Paper>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={tabValue} onChange={handleTabChange} aria-label="profile tabs">
                <Tab label="My Courses" />
                <Tab label="Achievements" />
                <Tab label="Account Settings" />
              </Tabs>
            </Box>
            
            {/* My Courses Tab */}
            <TabPanel value={tabValue} index={0}>
              {enrolledCourses.length > 0 ? (
                <List>
                  {enrolledCourses.map((course) => (
                    <ListItem key={course.id} alignItems="flex-start" sx={{ mb: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                      <ListItemAvatar>
                        <Avatar alt={course.title} src={course.thumbnail} variant="rounded" sx={{ width: 80, height: 80, mr: 2 }} />
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography variant="h6">{course.title}</Typography>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                              Instructor: {course.instructor.name}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              <Typography variant="body2" sx={{ mr: 1 }}>Progress:</Typography>
                              <LinearProgress 
                                variant="determinate" 
                                value={course.progress}
                                sx={{ flexGrow: 1, height: 8, borderRadius: 4 }} 
                              />
                              <Typography variant="body2" sx={{ ml: 1 }}>{course.progress}%</Typography>
                            </Box>
                            <Button size="small" variant="contained">Continue Learning</Button>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="h6" gutterBottom>
                    You haven't enrolled in any courses yet.
                  </Typography>
                  <Button variant="contained" color="primary">
                    Browse Courses
                  </Button>
                </Box>
              )}
            </TabPanel>
            
            {/* Achievements Tab */}
            <TabPanel value={tabValue} index={1}>
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="h6" gutterBottom>
                  Complete courses to earn achievements!
                </Typography>
                <Button variant="contained" color="primary">
                  View Available Achievements
                </Button>
              </Box>
            </TabPanel>
            
            {/* Account Settings Tab */}
            <TabPanel value={tabValue} index={2}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Personal Information
                  </Typography>
                  <Card sx={{ mb: 3 }}>
                    <CardContent>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="subtitle2">First Name</Typography>
                          <Typography>{user.firstName}</Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="subtitle2">Last Name</Typography>
                          <Typography>{user.lastName}</Typography>
                        </Grid>
                        <Grid item xs={12}>
                          <Typography variant="subtitle2">Email</Typography>
                          <Typography>{user.email}</Typography>
                        </Grid>
                      </Grid>
                      <Button size="small" sx={{ mt: 2 }}>
                        Edit Information
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Password
                  </Typography>
                  <Card sx={{ mb: 3 }}>
                    <CardContent>
                      <Button size="small">
                        Change Password
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Notifications
                  </Typography>
                  <Card>
                    <CardContent>
                      <Typography variant="body2">
                        Configure how you want to receive notifications.
                      </Typography>
                      <Button size="small" sx={{ mt: 2 }}>
                        Manage Notifications
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </TabPanel>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Profile;

