import { Navigate, Route } from 'react-router-dom'

import StudentLayout from '../pages/student/StudentLayout'

// Pages
import StudentDashboard from '../pages/student/StudentDashboard'
import StudentMessMenu from '../pages/student/StudentMessMenu'
import StudentReviewForm from '../pages/student/StudentReview'
import StudentVoting from '../pages/student/StudentVoting'
import StudentSuggestDish from '../pages/student/StudentSuggestDish'
import StudentIssues from '../pages/student/StudentIssues'
export const studentRoutes = (
  <Route path="/student" element={<StudentLayout />}>
    <Route path="dashboard" element={<StudentDashboard />} /> 
    <Route path="voting/status" element={<StudentVoting />} />
    <Route path="menu" element={<StudentMessMenu />} />
    <Route path="reviews" element={<StudentReviewForm />} />
    <Route path="suggest-dishes" element={<StudentSuggestDish />} />
    <Route path="issues" element={<StudentIssues />} />
    <Route index element={<Navigate to="dashboard" replace />} />
  </Route>
)
