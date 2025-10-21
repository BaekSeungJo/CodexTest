package com.todo.domain.todo;

import java.time.Instant;
import java.util.UUID;
import java.util.Objects;

/**
 * Aggregate root representing a to-do item in the domain model.
 */
public final class Todo {

    private final UUID id;
    private final String userId;
    private final String title;
    private final Instant dueDate;
    private final boolean done;
    private final Instant createdAt;
    private final Instant updatedAt;

    private Todo(UUID id,
                 String userId,
                 String title,
                 Instant dueDate,
                 boolean done,
                 Instant createdAt,
                 Instant updatedAt) {
        this.id = Objects.requireNonNull(id, "id must not be null");
        this.userId = Objects.requireNonNull(userId, "userId must not be null");
        this.title = Objects.requireNonNull(title, "title must not be null");
        this.dueDate = dueDate;
        this.done = done;
        this.createdAt = Objects.requireNonNull(createdAt, "createdAt must not be null");
        this.updatedAt = Objects.requireNonNull(updatedAt, "updatedAt must not be null");
    }

    public static Todo of(UUID id,
                          String userId,
                          String title,
                          Instant dueDate,
                          boolean done,
                          Instant createdAt,
                          Instant updatedAt) {
        return new Todo(id, userId, title, dueDate, done, createdAt, updatedAt);
    }

    public UUID getId() {
        return id;
    }

    public String getUserId() {
        return userId;
    }

    public String getTitle() {
        return title;
    }

    public Instant getDueDate() {
        return dueDate;
    }

    public boolean isDone() {
        return done;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
