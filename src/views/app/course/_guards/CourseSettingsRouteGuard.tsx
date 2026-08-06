import { COURSE_ROLE } from '@/domains/Course';
import { useCourseContext } from '@/layouts/Course/CourseContext';
import ForbiddenRoute from '@/views/app/error/ForbiddenRoute';
import { Outlet } from 'react-router-dom';

function CourseSettingsRouteGuard() {
  const { course } = useCourseContext();
  return course.myRole === COURSE_ROLE.TEACHER ? <Outlet /> : <ForbiddenRoute />;
}

export default CourseSettingsRouteGuard;
