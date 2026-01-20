# Email Campaign Manager – Scalable NestJS Architecture

This project is a **learning-focused, production-grade Email Campaign Manager** built to understand **scalable backend architecture** using **NestJS** and modern backend tools.

The goal is **not just to build a working app**, but to **learn how to design systems that scale**, handle background jobs, and can evolve into microservices later.

---

## 🎯 Purpose

This project is designed to:

- Learn **scalable NestJS modular monolith architecture**
- Implement **background job processing** using queues
- Understand **worker-based architecture**
- Apply **production best practices** from day one
- Build a system that is **easy to split into microservices later**

---

## 🧩 What This System Does

The Email Campaign Manager allows:

- User authentication and authorization
- Creating and managing email campaigns
- Scheduling campaigns for future execution
- Sending emails in the background using queues
- Handling retries, failures, and backoff strategies
- Tracking campaign and email statuses for visualization
- Monitoring system health and performance

---

## 🏗 Architecture Overview

This project follows a **Modular Monolith** approach:

- Clear module boundaries
- Shared codebase
- Separate **API** and **Worker** processes
- Event-driven background processing

Designed so each module **can later be extracted into a microservice**.

---

## 🧱 Core Technologies

- **NestJS** – Backend framework
- **JWT Authentication** – Secure access
- **BullMQ + Redis** – Background job processing
- **Prisma** – Database ORM
- **PostgreSQL** – Primary database
- **Swagger (OpenAPI)** – API documentation
- **Docker & Docker Compose** – Local infrastructure
- **Prometheus + Grafana** – Monitoring & metrics

---

## 🧩 Main Modules

- **Auth** – JWT authentication & authorization
- **Users** – User management
- **Campaigns** – Email campaign creation & scheduling
- **Emails** – Email sending logic
- **Jobs / Queues** – BullMQ workers & producers
- **Analytics** – Campaign & delivery statistics
- **Health** – Readiness & liveness checks

---

## ⚙️ Runtime Setup

- **NestJS API** runs locally
- **Worker process** runs separately
- **PostgreSQL, Redis, Prometheus, Grafana** run in Docker
- Environment-based configuration for dev and production

---

## 📈 Scalability & Best Practices

- Stateless API design
- Background processing via workers
- Retry & failure handling for jobs
- Metrics for API and queues
- Production-ready Docker setup
- Clean boundaries to support future microservices

---

## 🧪 Learning Approach

This project is built **step by step**:

1. Foundation & project structure
2. Authentication system
3. Database & Prisma modeling
4. Campaign management
5. Background job processing
6. Worker separation
7. Dockerization
8. Monitoring & observability

Each phase builds on the previous one with **clear guidance and small code snippets**.

---

## 🚀 End Goal

By completing this project, you will be able to:

- Design scalable NestJS applications
- Confidently use BullMQ & Redis
- Build reliable background job systems
- Apply production-grade architecture patterns
- Transition to Kubernetes or microservices when needed

---

## 📝 Note

This project focuses on **architecture, scalability, and learning**, not UI.
It is backend-first and visualization-ready for future frontend integration.

---

