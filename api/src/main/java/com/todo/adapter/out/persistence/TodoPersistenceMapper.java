package com.todo.adapter.out.persistence;

import com.todo.domain.todo.Todo;
import java.time.Instant;
import java.util.UUID;
import org.springframework.stereotype.Component;

/**
 * Maps between domain {@link Todo} aggregate and {@link TodoJpaEntity}.
 */
@Component
public class TodoPersistenceMapper {

    public TodoJpaEntity toEntity(Todo todo) {
        return new TodoJpaEntity(
                todo.getId(),
                todo.getUserId(),
                todo.getTitle(),
                todo.getDueDate(),
                todo.isDone(),
                todo.getCreatedAt(),
                todo.getUpdatedAt()
        );
    }

    public Todo toDomain(TodoJpaEntity entity) {
        UUID id = entity.getId();
        String userId = entity.getUserId();
        String title = entity.getTitle();
        Instant dueDate = entity.getDueDate();
        boolean done = entity.isDone();
        Instant createdAt = entity.getCreatedAt();
        Instant updatedAt = entity.getUpdatedAt();
        return Todo.of(id, userId, title, dueDate, done, createdAt, updatedAt);
    }
}
