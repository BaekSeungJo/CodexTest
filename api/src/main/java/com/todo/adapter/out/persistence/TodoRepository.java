package com.todo.adapter.out.persistence;

import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Spring Data repository for Todo persistence operations.
 */
public interface TodoRepository extends JpaRepository<TodoJpaEntity, UUID> {
}
