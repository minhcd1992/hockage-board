import type { MDXComponents } from 'mdx/types'
import { Section } from '@/components/lesson/Section'
import { InfoBox } from '@/components/lesson/InfoBox'
import { Quiz } from '@/components/lesson/Quiz'
import { QuizTF } from '@/components/lesson/QuizTF'
import { QuizShort } from '@/components/lesson/QuizShort'
import { TwoColumns, Col } from '@/components/lesson/TwoColumns'
import { Math } from '@/components/lesson/Math'
import { CompareTable } from '@/components/lesson/CompareTable'

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    Section,
    InfoBox,
    Quiz,
    QuizTF,
    QuizShort,
    TwoColumns,
    Col,
    Math,
    CompareTable,

    ...components,
  }
}
