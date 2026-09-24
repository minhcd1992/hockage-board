import { LessonDocument, lessonMetadata, type LessonPageProps } from '@/components/lesson/LessonDocument';
import { lessons } from '@/lib/lessons';

export function generateStaticParams() {
  return lessons.map(({ slug }) => ({ slug }));
}

export function generateMetadata(props: LessonPageProps) {
  return lessonMetadata(props, 'theory');
}

export default function Page(props: LessonPageProps) {
  return <LessonDocument {...props} part="theory" />;
}
