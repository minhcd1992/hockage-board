import bai1 from '@/content/lessons/bai-1/meta';
import bai2 from '@/content/lessons/bai-2/meta';
import bai3 from '@/content/lessons/bai-3/meta';
import bai4 from '@/content/lessons/bai-4/meta';
import bai5 from '@/content/lessons/bai-5/meta';
import bai6 from '@/content/lessons/bai-6/meta';
import bai7 from '@/content/lessons/bai-7/meta';
import bai8 from '@/content/lessons/bai-8/meta';
import bai9 from '@/content/lessons/bai-9/meta';
import bai10 from '@/content/lessons/bai-10/meta';
import bai11 from '@/content/lessons/bai-11/meta';
import bai12 from '@/content/lessons/bai-12/meta';
import bai13 from '@/content/lessons/bai-13/meta';
import bai14 from '@/content/lessons/bai-14/meta';
import bai15 from '@/content/lessons/bai-15/meta';

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
export const lessons: readonly LessonMeta[] = [bai1, bai2, bai3, bai4, bai5, bai6, bai7, bai8, bai9, bai10, bai11, bai12, bai13, bai14, bai15].sort(
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

export function normalizeLessonUrl(url: string) {
  const clean = url.split('?')[0].split('#')[0].replace(/\/+$/, '');
  return clean || '/';
}

export function resolveLessonUrl(url: string) {
  const cleanUrl = normalizeLessonUrl(url);
  for (const lesson of lessons) {
    for (const part of ['theory', 'exercises'] as const) {
      if (cleanUrl === lessonUrl(lesson, part)) return { lesson, part };
    }
  }
  return undefined;
}
