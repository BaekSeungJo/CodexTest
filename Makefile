SHELL := /bin/bash

.PHONY: bootstrap up up-build down logs api web

bootstrap:
	cd api && ./gradlew --no-daemon clean assemble || true
	cd web && npm install

up:
	docker compose -f infra/docker-compose.yml up -d

up-build:
	docker compose -f infra/docker-compose.yml up --build -d

down:
	docker compose -f infra/docker-compose.yml down

logs:
	docker compose -f infra/docker-compose.yml logs -f

api:
	cd api && ./gradlew bootRun

web:
	cd web && npm run dev
