import { relations } from "drizzle-orm";
import {
  users,
  anonSessions,
  transcripts,
  segments,
  jobs,
  usageEvents,
  tags,
  transcriptTags,
} from "./schema";

export const usersRelations = relations(users, ({ many }) => ({
  transcripts: many(transcripts),
  usageEvents: many(usageEvents),
  tags: many(tags),
}));

export const anonSessionsRelations = relations(anonSessions, ({ many }) => ({
  transcripts: many(transcripts),
  usageEvents: many(usageEvents),
}));

export const transcriptsRelations = relations(transcripts, ({ one, many }) => ({
  user: one(users, { fields: [transcripts.userId], references: [users.id] }),
  anonSession: one(anonSessions, {
    fields: [transcripts.anonSessionId],
    references: [anonSessions.id],
  }),
  segments: many(segments),
  job: one(jobs),
  transcriptTags: many(transcriptTags),
}));

export const segmentsRelations = relations(segments, ({ one }) => ({
  transcript: one(transcripts, {
    fields: [segments.transcriptId],
    references: [transcripts.id],
  }),
}));

export const jobsRelations = relations(jobs, ({ one }) => ({
  transcript: one(transcripts, {
    fields: [jobs.transcriptId],
    references: [transcripts.id],
  }),
  user: one(users, { fields: [jobs.userId], references: [users.id] }),
  anonSession: one(anonSessions, {
    fields: [jobs.anonSessionId],
    references: [anonSessions.id],
  }),
}));

export const usageEventsRelations = relations(usageEvents, ({ one }) => ({
  user: one(users, { fields: [usageEvents.userId], references: [users.id] }),
  anonSession: one(anonSessions, {
    fields: [usageEvents.anonSessionId],
    references: [anonSessions.id],
  }),
}));

export const tagsRelations = relations(tags, ({ one, many }) => ({
  user: one(users, { fields: [tags.userId], references: [users.id] }),
  transcriptTags: many(transcriptTags),
}));

export const transcriptTagsRelations = relations(transcriptTags, ({ one }) => ({
  transcript: one(transcripts, {
    fields: [transcriptTags.transcriptId],
    references: [transcripts.id],
  }),
  tag: one(tags, { fields: [transcriptTags.tagId], references: [tags.id] }),
}));
