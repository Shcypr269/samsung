import { db } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import type {
  Challenge,
  ChallengeOption,
  ChallengeProgress,
  Course,
  Lesson,
  ReadingAttempt,
  Unit,
  UserProgress,
  UserSubscription,
} from "./schema";

const DAY_IN_MS = 86_400_000;

export function getCourses(): Course[] {
  return db.findMany<Course>("courses");
}

export async function getUserProgress(userId?: string): Promise<UserProgress | null> {
  const uid = userId ?? getUserId();
  const up = db.findFirst<UserProgress>("userProgress", {
    where: { userId: uid },
  });
  if (!up) return null;
  const course = up.activeCourseId
    ? db.findFirst<Course>("courses", { where: { id: up.activeCourseId } })
    : undefined;
  return { ...up, activeCourse: course ?? undefined };
}

export async function getUnits(userId?: string) {
  const uid = userId ?? getUserId();
  const userProgress = await getUserProgress(uid);
  if (!userProgress?.activeCourseId) return [];

  const units = db.findMany<Unit>("units", {
    where: { courseId: userProgress.activeCourseId },
    orderBy: (a, b) => a.order - b.order,
  });

  return units.map((unit) => {
    const lessons = db.findMany<Lesson>("lessons", {
      where: { unitId: unit.id },
      orderBy: (a, b) => a.order - b.order,
    });

    const lessonsWithChallenges = lessons.map((lesson) => {
      const challenges = db.findMany<Challenge>("challenges", {
        where: { lessonId: lesson.id },
        orderBy: (a, b) => a.order - b.order,
      });

      const challengesWithProgress = challenges.map((ch) => {
        const progress = db.findMany<ChallengeProgress>("challengeProgress", {
          where: { challengeId: ch.id, userId: uid },
        });
        return { ...ch, challengeProgress: progress };
      });

      const allCompleted =
        challengesWithProgress.length > 0 &&
        challengesWithProgress.every(
          (ch) =>
            ch.challengeProgress &&
            ch.challengeProgress.length > 0 &&
            ch.challengeProgress.every((p) => p.completed)
        );

      return { ...lesson, challenges: challengesWithProgress, completed: allCompleted };
    });

    return { ...unit, lessons: lessonsWithChallenges };
  });
}

export function getCourseById(courseId: number) {
  const course = db.findFirst<Course>("courses", { where: { id: courseId } });
  if (!course) return null;

  const units = db.findMany<Unit>("units", {
    where: { courseId: course.id },
    orderBy: (a, b) => a.order - b.order,
  });

  const unitsWithLessons = units.map((unit) => {
    const lessons = db.findMany<Lesson>("lessons", {
      where: { unitId: unit.id },
      orderBy: (a, b) => a.order - b.order,
    });
    return { ...unit, lessons };
  });

  return { ...course, units: unitsWithLessons };
}

export async function getCourseProgress(userId?: string) {
  const uid = userId ?? getUserId();
  const userProgress = await getUserProgress(uid);
  if (!userProgress?.activeCourseId) return null;

  const units = db.findMany<Unit>("units", {
    where: { courseId: userProgress.activeCourseId },
    orderBy: (a, b) => a.order - b.order,
  });

  const allLessons: (Lesson & {
    challenges: (Challenge & { challengeProgress: ChallengeProgress[] })[];
  })[] = [];

  for (const unit of units) {
    const lessons = db.findMany<Lesson>("lessons", {
      where: { unitId: unit.id },
      orderBy: (a, b) => a.order - b.order,
    });
    for (const lesson of lessons) {
      const challenges = db.findMany<Challenge>("challenges", {
        where: { lessonId: lesson.id },
        orderBy: (a, b) => a.order - b.order,
      });
      const challengesWithProgress = challenges.map((ch) => {
        const progress = db.findMany<ChallengeProgress>("challengeProgress", {
          where: { challengeId: ch.id, userId: uid },
        });
        return { ...ch, challengeProgress: progress };
      });
      allLessons.push({ ...lesson, challenges: challengesWithProgress });
    }
  }

  const firstUncompleted = allLessons.find((lesson) =>
    lesson.challenges.some(
      (ch) =>
        !ch.challengeProgress ||
        ch.challengeProgress.length === 0 ||
        ch.challengeProgress.some((p) => !p.completed)
    )
  );

  return {
    activeLesson: firstUncompleted ?? null,
    activeLessonId: firstUncompleted?.id ?? null,
  };
}

export async function getLesson(userId?: string, id?: number) {
  const uid = userId ?? getUserId();
  const courseProgress = await getCourseProgress(uid);
  const lessonId = id ?? courseProgress?.activeLessonId;
  if (!lessonId) return null;

  const lesson = db.findFirst<Lesson>("lessons", { where: { id: lessonId } });
  if (!lesson) return null;

  const challenges = db.findMany<Challenge>("challenges", {
    where: { lessonId: lesson.id },
    orderBy: (a, b) => a.order - b.order,
  });

  const challengesWithData = challenges.map((ch) => {
    const options = db.findMany<ChallengeOption>("challengeOptions", {
      where: { challengeId: ch.id },
    });
    const progress = db.findMany<ChallengeProgress>("challengeProgress", {
      where: { challengeId: ch.id, userId: uid },
    });
    const completed =
      progress.length > 0 && progress.every((p) => p.completed);
    return { ...ch, challengeOptions: options, challengeProgress: progress, completed };
  });

  return { ...lesson, challenges: challengesWithData };
}

export async function getLessonPercentage(userId?: string) {
  const uid = userId ?? getUserId();
  const courseProgress = await getCourseProgress(uid);
  if (!courseProgress?.activeLessonId) return 0;

  const lesson = await getLesson(uid, courseProgress.activeLessonId);
  if (!lesson) return 0;

  const completed = lesson.challenges.filter((ch) => ch.completed);
  return Math.round((completed.length / lesson.challenges.length) * 100);
}

export async function getUserSubscription(userId?: string): Promise<(UserSubscription & { isActive: boolean }) | null> {
  const uid = userId ?? getUserId();
  const data = db.findFirst<UserSubscription>("userSubscription", { where: { userId: uid } });
  if (!data) return null;

  const periodEnd = new Date(data.stripeCurrentPeriodEnd).getTime();
  const isActive = data.stripePriceId !== "" && periodEnd + DAY_IN_MS > Date.now();
  return { ...data, isActive };
}

export function getTopTenUsers(): { userId: string; userName: string; userImageSrc: string; points: number }[] {
  return db.findMany<UserProgress>("userProgress", {
    orderBy: (a, b) => b.points - a.points,
    limit: 10,
  }).map(({ userId, userName, userImageSrc, points }) => ({
    userId, userName, userImageSrc, points,
  }));
}

export function getReadingAttempts(): ReadingAttempt[] {
  const attempts = db.findMany<ReadingAttempt>("readingAttempts", {
    orderBy: (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  });

  return attempts.map((a) => {
    const challenge = db.findFirst<Challenge>("challenges", { where: { id: a.challengeId } }) ?? undefined;
    const lesson = db.findFirst<Lesson>("lessons", { where: { id: a.lessonId } }) ?? undefined;
    return { ...a, challenge, lesson };
  });
}

export function getStudentReadingSummary() {
  const attempts = getReadingAttempts();

  const byUser = new Map<string, ReadingAttempt[]>();
  for (const a of attempts) {
    const list = byUser.get(a.userId) ?? [];
    list.push(a);
    byUser.set(a.userId, list);
  }

  return Array.from(byUser.entries()).map(([userId, userAttempts]) => {
    const recent = userAttempts.slice(0, 10);
    const avgAccuracy = Math.round(
      recent.reduce((s, a) => s + a.accuracy, 0) / recent.length
    );
    const avgWcpm = Math.round(
      recent.reduce((s, a) => s + a.wcpm, 0) / recent.length
    );
    const last = userAttempts[0];
    const needsAttention = avgAccuracy < 70;

    const errorCounts = new Map<string, number>();
    for (const a of userAttempts) {
      if (a.errorsJson) {
        try {
          const errors: { target: string }[] = JSON.parse(a.errorsJson);
          for (const e of errors) {
            errorCounts.set(e.target, (errorCounts.get(e.target) ?? 0) + 1);
          }
        } catch { /* skip */ }
      }
    }
    const mostMissed = Array.from(errorCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([w]) => w);

    return {
      userId,
      totalAttempts: userAttempts.length,
      avgAccuracy,
      avgWcpm,
      lastAccuracy: last?.accuracy ?? 0,
      lastWcpm: last?.wcpm ?? 0,
      mostMissed,
      needsAttention,
    };
  }).sort((a, b) => a.avgAccuracy - b.avgAccuracy);
}
