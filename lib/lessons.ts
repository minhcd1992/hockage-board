import bai1 from '@/content/lessons/bai-1/meta';
import bai2 from '@/content/lessons/bai-2/meta';
import bai3 from '@/content/lessons/bai-3/meta';

export interface LessonMeta {
  slug: string;
  grade: number;
  subject: string;
  chapter: string;
  order: number;
  title: string;
  description: string;
}

export type LessonPart = 'theory' | 'exercises';

// Register each lesson here once. Keep this catalogue free of MDX/simulation imports
// so the board can list lessons without loading their interactive content.
export const lessons: readonly LessonMeta[] = [bai1, bai2, bai3].sort(
  (a, b) => a.grade - b.grade || a.subject.localeCompare(b.subject, 'vi') || a.order - b.order,
);

export function getLesson(slug: string) {
  return lessons.find(lesson => lesson.slug === slug);
}

export function lessonUrl(lesson: LessonMeta, part: LessonPart = 'theory') {
  return `/lesson/${lesson.slug}${part === 'exercises' ? '/bai-tap' : ''}`;
}

export function lessonTabTitle(lesson: LessonMeta, part: LessonPart = 'theory') {
  return `Lớp ${lesson.grade} · Bài ${lesson.order}${part === 'exercises' ? ' · BT' : ''}`;
}

export function resolveLessonUrl(url: string) {
  for (const lesson of lessons) {
    for (const part of ['theory', 'exercises'] as const) {
      if (url === lessonUrl(lesson, part)) return { lesson, part };
    }
  }
  return undefined;
}
