import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getLesson, lessonUrl, type LessonPart } from '@/lib/lessons';

export type LessonPageProps = { params: Promise<{ slug: string }> };

function requireLesson(slug: string) {
  const lesson = getLesson(slug);
  if (!lesson) notFound();
  return lesson;
}

export async function lessonMetadata({ params }: LessonPageProps, part: LessonPart): Promise<Metadata> {
  const lesson = requireLesson((await params).slug);
  return {
    title: `${lesson.title}${part === 'exercises' ? ' — Bài tập' : ''} | ${lesson.subject} lớp ${lesson.grade}`,
    description: lesson.description,
  };
}

export async function LessonDocument({ params, part }: LessonPageProps & { part: LessonPart }) {
  const lesson = requireLesson((await params).slug);
  // The catalogue above validates the slug before resolving a local MDX module.
  const { default: Content } = part === 'theory'
    ? await import(`@/content/lessons/${lesson.slug}/theory.mdx`)
    : await import(`@/content/lessons/${lesson.slug}/exercises.mdx`);

  return (
    <article>
      <header className="mb-8 border-b-2 border-gray-200 pb-4">
        <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded uppercase tracking-wide">
          {lesson.subject} · Lớp {lesson.grade} · {lesson.chapter}
        </span>
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-slate-800 mt-2 mb-2">{lesson.title}</h1>
        <p className="text-gray-500 text-base italic">{part === 'theory' ? 'Lý thuyết & Dẫn dắt tư duy' : 'Bài tập luyện tập'}</p>
        <nav aria-label="Nội dung bài học" className="mt-4 flex gap-3">
          {(['theory', 'exercises'] as const).map(item => (
            <a key={item} href={lessonUrl(lesson, item)} aria-current={part === item ? 'page' : undefined}
              className={`rounded-lg px-4 py-2 font-semibold ${part === item ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'}`}>
              {item === 'theory' ? 'Lý thuyết' : 'Bài tập'}
            </a>
          ))}
        </nav>
      </header>
      <Content />
      <div className="mt-12 mb-8 flex justify-center">
        <a className="rounded-xl bg-slate-900 px-8 py-4 font-bold text-white hover:bg-slate-700"
          href={lessonUrl(lesson, part === 'theory' ? 'exercises' : 'theory')}>
          {part === 'theory' ? 'Chuyển sang bài tập luyện tập' : 'Quay lại bài giảng'}
        </a>
      </div>
    </article>
  );
}
