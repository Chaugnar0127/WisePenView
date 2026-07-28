import type { CourseDetail } from '@/domains/Course';
import { useOutletContext } from 'react-router-dom';

export interface CourseRouteContextValue {
  course: CourseDetail;
  refreshCourse: () => void;
}

export const useCourseRouteContext = (): CourseRouteContextValue =>
  useOutletContext<CourseRouteContextValue>();
