import type { QueryClient, QueryKey } from "@tanstack/react-query";

import type {
  Board,
  CalendarData,
  ContentCard,
  MoveContentStageInput,
  ScheduleContentInput,
} from "@/lib/api/contracts";
import type { BffResponse } from "@/lib/api/client";

export type CacheSnapshot = Array<readonly [QueryKey, unknown]>;

export function snapshotQueries(queryClient: QueryClient, queryKey: QueryKey): CacheSnapshot {
  return queryClient.getQueriesData({ queryKey });
}

export function restoreQueries(queryClient: QueryClient, snapshot: CacheSnapshot): void {
  for (const [queryKey, value] of snapshot) {
    queryClient.setQueryData(queryKey, value);
  }
}

export function optimisticallyMoveBoardCard(
  queryClient: QueryClient,
  contentId: number,
  input: MoveContentStageInput,
): void {
  queryClient.setQueriesData<BffResponse<Board>>(
    { queryKey: ["aidera", "board"] },
    (current) => {
      if (!current) {
        return current;
      }

      const movedCard = current.data.columns
        .flatMap((column) => column.cards)
        .find((card) => card.id === contentId);

      if (!movedCard) {
        return current;
      }

      const optimisticCard: ContentCard = {
        ...movedCard,
        stage: input.stage,
        sort_order: input.position ?? movedCard.sort_order,
      };
      const columns = current.data.columns.map((column) => {
        const cards = column.cards.filter((card) => card.id !== contentId);

        if (column.stage === input.stage) {
          cards.push(optimisticCard);
          cards.sort((left, right) => left.sort_order - right.sort_order);
        }

        return {
          ...column,
          cards,
          count: cards.length,
        };
      });

      return {
        ...current,
        data: { ...current.data, columns },
      };
    },
  );
}

export function optimisticallyScheduleContent(
  queryClient: QueryClient,
  contentId: number,
  input: ScheduleContentInput,
): void {
  const scheduledAt = input.scheduled_at;

  queryClient.setQueriesData<BffResponse<Board>>(
    { queryKey: ["aidera", "board"] },
    (current) => current
      ? {
          ...current,
          data: {
            ...current.data,
            columns: current.data.columns.map((column) => ({
              ...column,
              cards: column.cards.map((card) => card.id === contentId
                ? { ...card, scheduled_at: input.scheduled_at }
                : card),
            })),
          },
        }
      : current,
  );

  queryClient.setQueriesData<BffResponse<CalendarData>>(
    { queryKey: ["aidera", "calendar"] },
    (current) => current
      ? {
          ...current,
          data: {
            ...current.data,
            events: scheduledAt === null
              ? current.data.events.filter((event) => event.content_id !== contentId)
              : current.data.events.map((event) => event.content_id === contentId
                ? { ...event, start: scheduledAt }
                : event),
          },
        }
      : current,
  );
}
