import type { Lesson } from "@/db/schema";

import { LessonButton } from "./lesson-button";
import { UnitBanner } from "./unit-banner";

type UnitProps = {
  id: number;
  order: number;
  title: string;
  description: string;
  lessons: (Lesson & {
    completed: boolean;
  })[];
  activeLesson:
    | (Lesson & {
        unit?: { id: number; title: string; description: string; courseId: number; order: number };
      })
    | null
    | undefined;
  activeLessonPercentage: number;
};

export const Unit = ({
  title,
  description,
  lessons,
  activeLesson,
  activeLessonPercentage,
}: UnitProps) => {
  return (
    <>
      <UnitBanner title={title} description={description} />

      <div className="relative flex flex-col items-center">
        {activeLesson?.unit && (
          <div className="absolute -left-3 -top-1 hidden h-full w-1/5 items-center lg:flex">
            <LessonButton
              id={activeLesson.id}
              index={lessons.findIndex((lesson) => lesson.id === activeLesson.id)}
              totalCount={lessons.length}
              current={false}
              locked={false}
              percentage={activeLessonPercentage}
            />
          </div>
        )}

        {lessons.map((lesson, index) => {
          const isCurrent = lesson.id === activeLesson?.id;
          const isLocked = !lesson.completed && !isCurrent;

          return (
            <LessonButton
              key={lesson.id}
              id={lesson.id}
              index={index}
              totalCount={lessons.length - 1}
              current={isCurrent}
              locked={isLocked}
              percentage={activeLessonPercentage}
            />
          );
        })}
      </div>
    </>
  );
};
