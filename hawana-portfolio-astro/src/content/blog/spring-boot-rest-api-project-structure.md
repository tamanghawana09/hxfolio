---
title: "How I Structure a Spring Boot REST API for a Real-World Project"
description: "Learn how I structure a real-world Spring Boot REST API using controllers, services, repositories, DTOs, validation, and centralized exception handling."
pubDate: 2026-10-03
readTime: "11 min read"
category: "Spring Boot"
tags: ["Spring Boot", "Java", "REST API", "Web Development"]
featured: true
accent: "violet"
---

# How I Structure a Spring Boot REST API for a Real-World Project

Most Spring Boot apps start out tidy. You add one controller, a few endpoints, and things work. Then the app grows. A controller method picks up a validation check, then a database query, then a business rule, then a `try/catch` that returns an error string. Six months later, `UserController.java` is 800 lines long and nobody wants to touch it.

I've written that controller. This article describes the structure I now use for every **Spring Boot REST API** I build for a real project. It's not the only correct way, but it has held up as my projects grow.

![Spring Boot REST API project structure](/spring-boot-structure.webp)

The idea is simple:

**Controller → Service → Repository**, with **DTOs** between the API and the entities, plus **centralized exception handling** so every error response looks the same.

I'll go through each layer with code, using a simple `User` resource as the running example.

> The examples target Spring Boot 3.x+ and Java 17+ (records, `jakarta.*` imports).

---

## Why Project Structure Matters

Project structure isn't about appearances. It decides how easy the code is to:

- **Read**: a new developer knows where to look for a business rule or a query.
- **Change**: switching databases or reshaping a JSON response doesn't spread across the whole codebase.
- **Test**: each piece can be tested on its own, without starting the whole application.
- **Grow**: new features follow a pattern that already exists.

Spring already pushes you in this direction. Spring Data JPA, for example, exists largely to [cut repetitive boilerplate in the data-access layer](https://docs.spring.io/spring-data/jpa/reference/), so a separate repository layer costs very little. You might as well use it.

---

## The Spring Boot REST API Architecture I Use

At a high level, a request moves down through the layers like this:

```
Client
   ↓
Controller
   ↓
Service
   ↓
Repository
   ↓
Database
```

Here's where DTOs and exception handling fit in:

```
                 ┌──────────────┐
                 │    Client    │
                 └──────┬───────┘
                        ↓  JSON
                 ┌──────────────┐
                 │  Controller  │
                 └──────┬───────┘
                        ↓
                    Request DTO
                        ↓
                 ┌──────────────┐
                 │   Service    │ ──→ Response DTO ──→ back to Client
                 └──────┬───────┘
                        ↓  Entity
                 ┌──────────────┐
                 │  Repository  │
                 └──────┬───────┘
                        ↓
                    Database

   Any layer throws an exception → Global Exception Handler → JSON error
```

Each layer has one job and talks only to the layer directly below it. That rule does most of the work in this **Spring Boot layered architecture**.

---

## A Real-World Spring Boot Project Structure

This is the package layout I start with:

```
src/main/java/com/example/project/
│
├── controller/
│   └── UserController.java
│
├── service/
│   ├── UserService.java
│   └── UserServiceImpl.java      (optional, more on this below)
│
├── repository/
│   └── UserRepository.java
│
├── entity/
│   └── User.java
│
├── dto/
│   ├── CreateUserRequest.java
│   └── UserResponse.java
│
├── exception/
│   ├── UserNotFoundException.java
│   ├── EmailAlreadyExistsException.java
│   └── GlobalExceptionHandler.java
│
└── ProjectApplication.java
```

What each package is for:

| Layer      | Responsibility                                   |
|------------|--------------------------------------------------|
| Controller | Handles HTTP requests and responses              |
| Service    | Contains business logic                          |
| Repository | Handles database access                          |
| Entity     | Represents persisted domain data                 |
| DTO        | Defines the API's request and response shapes    |
| Exception  | Defines and handles application/API errors       |

A note on **package-by-layer vs package-by-feature**: this layout groups code by technical layer, which suits small and medium projects and makes the architecture easy to learn. In bigger codebases I often switch to grouping by feature (`user/`, `order/`, `payment/`), with the same controller/service/repository split inside each feature package. The layering stays the same either way.

---

## Controllers: Handling HTTP Requests

The controller is the API's entry point. Its job is to deal with HTTP:

- Mapping endpoints and HTTP methods
- Reading path variables, query parameters, and request bodies
- Triggering validation
- Choosing the HTTP status code
- Passing the work to the service layer

```java
@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/{id}")
    public UserResponse getUser(@PathVariable Long id) {
        return userService.getUserById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponse createUser(@Valid @RequestBody CreateUserRequest request) {
        return userService.createUser(request);
    }
}
```

A few things to note:

- **Constructor injection.** The dependency is `final` and passed in through the constructor. With a single constructor, Spring wires it automatically, and the class is easy to create in a unit test.
- **No repository here.** The controller never calls `userRepository.findById(...)`.
- **No business rules.** Checks like "Is this email already taken?" or "Can this user be deactivated?" don't belong in the controller.

I keep one question in mind for every controller:

> **What HTTP request is coming in, and which application operation should handle it?**

If a controller method does more than answer that question, something has probably leaked in from another layer.

---

## Services: Keeping Business Logic Separate

The service layer is the core of the application. This is where the rules of your domain live.

It helps to separate two kinds of logic:

- **Controller logic** is about HTTP: "This is a `POST` to `/api/users` with a JSON body, return `201 Created`."
- **Business logic** is about the domain: "A user's email must be unique. Passwords are hashed before storage. A missing user is an error."

Business logic shouldn't know or care that it was triggered by an HTTP request. It could just as well be called from a scheduled job, a message consumer, or a CLI command.

```java
@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public UserResponse getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException(id));

        return toResponse(user);
    }

    @Transactional
    public UserResponse createUser(CreateUserRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new EmailAlreadyExistsException(request.email());
        }

        User user = new User(
                request.name(),
                request.email(),
                passwordEncoder.encode(request.password())
        );

        User saved = userRepository.save(user);
        return toResponse(saved);
    }

    private UserResponse toResponse(User user) {
        return new UserResponse(user.getId(), user.getName(), user.getEmail());
    }
}
```

> `PasswordEncoder` comes from Spring Security (`spring-security-crypto`). Expose a `BCryptPasswordEncoder` bean, or any encoder you prefer.

Keeping this logic in the **Spring Boot service layer** pays off in several ways:

- **Easier to test.** You can unit test `createUser` with a mocked repository. No web server or database needed.
- **Easier to maintain.** The "unique email" rule lives in one place.
- **Easier to modify.** A changed business rule touches the service and nothing else.
- **Reusable.** An admin endpoint, a batch import, and a public signup endpoint can all call the same method.
- **Extensible.** Sending a welcome email or publishing an event goes here, without cluttering the controller.

It's also the right place for transaction boundaries (`@Transactional`), because a single business operation may involve several repository calls that must succeed or fail together.

### Do you need a `UserService` interface and a `UserServiceImpl`?

Not always. The interface/impl pair is common and does help when you have several implementations or need strict module boundaries. For most applications with one implementation, I start with a concrete `@Service` class. Mockito can mock concrete classes, and I can extract an interface later if I need one.

---

## Repositories: Working With the Database

The repository layer owns persistence. With **Spring Data JPA**, this layer is usually just an interface:

```java
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);
}
```

There's no implementation class. Spring Data's repository support gives you an [abstraction over the persistence store](https://docs.spring.io/spring-data/jpa/reference/repositories/definition.html), and extending an interface like `JpaRepository` provides the common operations (`save`, `findById`, `findAll`, `deleteById`, pagination, sorting, and more). See the [JpaRepository API reference](https://docs.spring.io/spring-data/jpa/reference/api/java/org/springframework/data/jpa/repository/JpaRepository.html) for the full list. Methods like `findByEmail` and `existsByEmail` are generated from the method name.

> You'll often see `@Repository` on these interfaces. For Spring Data repository interfaces it's optional, because Spring Data detects them automatically. It doesn't hurt if you want it for readability.

The main rule is the direction of the calls. Do this:

```
Controller
   ↓
Service
   ↓
Repository
   ↓
Database
```

Not this:

```
Controller
   ↓
Database
```

When a controller talks to the repository directly, business rules have nowhere to live. They end up copied across controllers, or dropped.

For more complex dynamic queries, like search screens with many optional filters, Spring Data JPA also supports [Specifications](https://docs.spring.io/spring-data/jpa/reference/jpa/specifications.html). That's a topic for another article.

---

## DTOs: Separating API Models From Entities

Many beginner Spring Boot tutorials skip this part, but it's one of the most important decisions in a real API.

An **entity** and a **DTO** describe the same data for two different audiences:

```
Entity  →  how the data is stored (database representation)
DTO     →  how the data is exposed (API representation)
```

Here's the `User` entity:

```java
@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @Column(unique = true, nullable = false)
    private String email;

    private String password;

    protected User() {
        // required by JPA
    }

    public User(String name, String email, String password) {
        this.name = name;
        this.email = email;
        this.password = password;
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getEmail() { return email; }
    public String getPassword() { return password; }
}
```

> Small real-world tip: I map the table to `users` instead of `user`, because `user` is a reserved word in some databases, including PostgreSQL.

You probably don't want to return this entity from a controller:

```java
@GetMapping("/{id}")
public User getUser(@PathVariable Long id) {
    return userRepository.findById(id).orElseThrow();  // don't do this
}
```

Doing so sends the `password` field (even if hashed) to every client. It also ties your public API to your database schema, and it can lead to lazy-loading errors or infinite recursion once you add relationships.

Return a DTO instead:

```java
public record UserResponse(
        Long id,
        String name,
        String email
) {}
```

Now the API controls exactly what it exposes.

### Why DTOs are worth the extra class

- **Prevent accidental data exposure.** New sensitive columns don't leak into responses on their own.
- **Separate the API contract from the database structure.** You can rename a column or split a table without breaking clients.
- **Make responses easier to evolve.** Add fields, version responses, or shape them for a specific client.
- **Support different request and response models.** See the next section.
- **Improve maintainability.** The API's shape is written down in one small, readable class.

Java records work well for DTOs. They're immutable, short, and give you `equals`, `hashCode`, and `toString` for free.

---

## Request DTOs vs Response DTOs

I keep request and response DTOs separate, because what a client sends and what the server returns are usually different.

**Request DTO:**

```java
public record CreateUserRequest(
        String name,
        String email,
        String password
) {}
```

**Response DTO:**

```java
public record UserResponse(
        Long id,
        String name,
        String email
) {}
```

Here's how the separation looks on the wire:

```
POST /api/users

Request:
{
    "name": "Hawana",
    "email": "example@email.com",
    "password": "secret123"
}

Response (201 Created):
{
    "id": 1,
    "name": "Hawana",
    "email": "example@email.com"
}
```

**The password comes into the system but never goes back out in the response.** The client doesn't send an `id`, because the server generates it. The two DTOs capture these rules in their types, so you don't have to remember them.

As the API grows, this pattern scales well: `CreateUserRequest`, `UpdateUserRequest`, `UserResponse`, `UserSummaryResponse`. Each one has exactly the fields its endpoint needs.

---

## Validating REST API Requests

Bad input should be rejected before it reaches business logic. Bean Validation (via `spring-boot-starter-validation`) lets you declare the rules on the request DTO:

```java
public record CreateUserRequest(

        @NotBlank
        String name,

        @NotBlank
        @Email
        String email,

        @NotBlank
        @Size(min = 8)
        String password
) {}
```

Then trigger validation in the controller with `@Valid`:

```java
@PostMapping
@ResponseStatus(HttpStatus.CREATED)
public UserResponse createUser(@Valid @RequestBody CreateUserRequest request) {
    return userService.createUser(request);
}
```

What each annotation does:

- `@Valid` tells Spring to validate the request body before calling the method.
- `@NotBlank` rejects `null`, empty, and whitespace-only strings.
- `@Email` checks the email format. It accepts `null`, which is why I pair it with `@NotBlank`.
- `@Size(min = 8)` enforces a minimum length.

If validation fails, Spring throws a `MethodArgumentNotValidException` and the controller method never runs. By default the client gets a generic `400 Bad Request`. In the next sections I'll turn that into a clear, consistent error response.

A useful way to split responsibilities: **format and shape rules** ("is this a valid email?") go on the DTO. **Business rules** ("is this email already registered?") go in the service.

---

## Global Exception Handling

Here's a realistic case: `userRepository.findById(id)` finds nothing.

You don't want to return a stack trace, and you don't want a `try/catch` copied into every controller method. Instead, throw a meaningful exception from the service:

```java
public class UserNotFoundException extends RuntimeException {

    public UserNotFoundException(Long id) {
        super("User not found with id: " + id);
    }
}
```

```java
public class EmailAlreadyExistsException extends RuntimeException {

    public EmailAlreadyExistsException(String email) {
        super("Email is already registered: " + email);
    }
}
```

Then handle these exceptions in one place:

```java
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(UserNotFoundException.class)
    public ResponseEntity<String> handleUserNotFound(UserNotFoundException exception) {
        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(exception.getMessage());
    }
}
```

Spring's `@RestControllerAdvice` lets [exception-handling methods apply across all controllers](https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-advice.html) instead of being repeated in each one. The service throws, the advice catches, and the controller stays clean.

This works, but the response body is a plain string. We can do better.

---

## Designing Consistent API Error Responses

A plain `"User not found"` string is hard for clients to handle. Frontend developers can't reliably tell one error from another, and every endpoint ends up returning errors in a slightly different format.

A structured error response is much more useful:

```json
{
    "timestamp": "2026-10-03T12:30:00Z",
    "status": 404,
    "error": "USER_NOT_FOUND",
    "message": "User not found with id: 42",
    "path": "/api/users/42"
}
```

You can build your own `ErrorResponse` record for this. These days I prefer Spring's built-in support for **Problem Details for HTTP APIs (RFC 9457)**, a standard format for API errors. Spring provides a [`ProblemDetail` type and related support for RFC 9457 error responses](https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-ann-rest-exceptions.html), so you don't need to invent your own format.

Here's my `GlobalExceptionHandler` using `ProblemDetail`:

```java
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(UserNotFoundException.class)
    public ProblemDetail handleUserNotFound(UserNotFoundException ex,
                                            HttpServletRequest request) {
        return problem(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", ex.getMessage(), request);
    }

    @ExceptionHandler(EmailAlreadyExistsException.class)
    public ProblemDetail handleEmailExists(EmailAlreadyExistsException ex,
                                           HttpServletRequest request) {
        return problem(HttpStatus.CONFLICT, "EMAIL_ALREADY_EXISTS", ex.getMessage(), request);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ProblemDetail handleValidation(MethodArgumentNotValidException ex,
                                          HttpServletRequest request) {
        ProblemDetail problem = problem(HttpStatus.BAD_REQUEST, "VALIDATION_FAILED",
                "One or more fields are invalid", request);

        Map<String, String> fieldErrors = new LinkedHashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(error ->
                fieldErrors.put(error.getField(), error.getDefaultMessage()));

        problem.setProperty("fieldErrors", fieldErrors);
        return problem;
    }

    @ExceptionHandler(Exception.class)
    public ProblemDetail handleUnexpected(Exception ex, HttpServletRequest request) {
        // Log the full exception here, but never send internals to the client
        return problem(HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL_ERROR",
                "An unexpected error occurred", request);
    }

    private ProblemDetail problem(HttpStatus status, String code,
                                  String detail, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(status, detail);
        problem.setTitle(status.getReasonPhrase());
        problem.setInstance(URI.create(request.getRequestURI()));
        problem.setProperty("errorCode", code);
        problem.setProperty("timestamp", Instant.now());
        return problem;
    }
}
```

A missing user now returns:

```json
{
    "type": "about:blank",
    "title": "Not Found",
    "status": 404,
    "detail": "User not found with id: 42",
    "instance": "/api/users/42",
    "errorCode": "USER_NOT_FOUND",
    "timestamp": "2026-10-03T12:30:00Z"
}
```

And a failed validation returns:

```json
{
    "type": "about:blank",
    "title": "Bad Request",
    "status": 400,
    "detail": "One or more fields are invalid",
    "instance": "/api/users",
    "errorCode": "VALIDATION_FAILED",
    "fieldErrors": {
        "email": "must be a well-formed email address",
        "password": "size must be between 8 and 2147483647"
    },
    "timestamp": "2026-10-03T12:30:00Z"
}
```

Every error now has the same shape. The `errorCode` gives clients a stable, machine-readable value to branch on, and the response is served as `application/problem+json`.

> Tip: The default validation messages are fine to start with, but you can set friendlier ones, e.g. `@Size(min = 8, message = "Password must be at least 8 characters")`.

---

## Putting the Architecture Together

Here's one complete request, `POST /api/users`, through every layer:

```
POST /api/users  (JSON body)
       ↓
UserController           → maps the request, triggers @Valid
       ↓
CreateUserRequest DTO    → validated input
       ↓
UserService              → checks unique email, hashes password
       ↓
UserRepository           → save(user)
       ↓
Database
       ↓
User Entity              → persisted with generated id
       ↓
UserResponse DTO         → id, name, email (no password)
       ↓
201 Created + JSON response
```

And here's what happens when something goes wrong:

```
GET /api/users/42
       ↓
UserService
       ↓
throws UserNotFoundException
       ↓
GlobalExceptionHandler
       ↓
404 Not Found + ProblemDetail JSON
```

Each layer does its own job:

- The controller never sees a database row.
- The repository never sees an HTTP request.
- The service never builds a JSON error.
- The client never sees an entity or a stack trace.

---

## Common Mistakes I Avoid

These are the patterns I've learned to avoid, mostly by making them myself first.

### 1. Fat controllers

```
UserController
 ├── validation logic
 ├── business rules
 ├── database queries
 ├── error handling
 └── response formatting
```

A controller that does all of this is hard to test, hard to reuse, and hard to read. Controllers should be thin: map the request, delegate to the service, return the result.

### 2. Returning entities directly

```java
return userRepository.findById(id);
```

This exposes internal fields, couples clients to your schema, and can cause serialization problems with JPA relationships. Map to a response DTO.

### 3. Duplicated exception handling

If every controller has its own `try/catch` blocks and its own error format, clients get inconsistent responses and fixes have to be applied everywhere. One `@RestControllerAdvice` solves this.

### 4. Business logic inside repositories

Repositories should handle persistence and data access. A complicated `@Query` is fine. Repository default methods full of business rules are not. When the repository starts making decisions, it has turned into a second service layer.

### 5. One giant DTO for everything

It's tempting to make one `UserDto` with every field and reuse it for create, update, and read. Then you end up asking whether `id` is required here, whether `password` is allowed there. Small, purpose-built DTOs make each endpoint's contract clear.

---

## Testing Each Layer

One of the biggest benefits of this structure is that each layer can be tested on its own, with the right tool for the job.

```
src/test/java/com/example/project/
├── controller/UserControllerTest.java
├── service/UserServiceTest.java
├── repository/UserRepositoryTest.java
└── UserApiIntegrationTest.java
```

- **Controller tests** (`@WebMvcTest`): Load only the web layer and mock the service. Check routing, status codes, JSON shape, validation errors, and that the exception handler returns the expected `ProblemDetail`.
- **Service tests** (plain JUnit + Mockito): No Spring context. Mock the repository and test the business rules directly, e.g. "throws `EmailAlreadyExistsException` when the email exists". These are fast and should make up most of your tests.
- **Repository tests** (`@DataJpaTest`): Load only the JPA layer against a test database to check custom queries like `findByEmail`. Testcontainers works well if you want to test against your real database engine.
- **Integration tests** (`@SpringBootTest`): Start the whole application and send real HTTP requests end to end. Write fewer of these, but make them count.

Here's a quick service test:

```java
class UserServiceTest {

    private final UserRepository userRepository = mock(UserRepository.class);
    private final PasswordEncoder passwordEncoder = mock(PasswordEncoder.class);
    private final UserService userService = new UserService(userRepository, passwordEncoder);

    @Test
    void throwsWhenUserDoesNotExist() {
        when(userRepository.findById(42L)).thenReturn(Optional.empty());

        assertThrows(UserNotFoundException.class, () -> userService.getUserById(42L));
    }
}
```

There's no Spring context, no database, and no web server. Because we used constructor injection, the service is just a plain Java object.

---

## When Should You Use This Architecture?

This is not the only correct way to build a Spring Boot application, and it isn't always necessary.

For a tiny app, such as a prototype, an internal tool with three endpoints, or a weekend project, this may be enough:

```
Controller → Repository
```

Adding a service layer, separate DTOs, and a global exception handler to a 200-line app can be more ceremony than it's worth.

But once the application grows to multiple resources, real business rules, more than one developer, and clients that depend on a stable contract, this structure starts paying for itself:

```
Controller
    ↓
Service
    ↓
Repository
```

plus DTOs and centralized exception handling.

It's a trade-off: a few more classes in return for clear separation of concerns. In my experience, most "small" projects that last end up needing it, and adding the structure early is much cheaper than untangling a fat controller later.

---

## Final Project Structure

Here's the full structure again:

```
com.example.project
│
├── controller
│   └── UserController
│
├── service
│   └── UserService
│
├── repository
│   └── UserRepository
│
├── entity
│   └── User
│
├── dto
│   ├── CreateUserRequest
│   └── UserResponse
│
├── exception
│   ├── UserNotFoundException
│   ├── EmailAlreadyExistsException
│   └── GlobalExceptionHandler
│
└── ProjectApplication
```

If you remember one thing from this article, make it this:

> **Controllers handle HTTP. Services handle business logic. Repositories handle persistence. DTOs define the API contract. Exception handlers keep errors consistent.**

Keep each layer focused on its own job, and your Spring Boot REST API will stay easy to read, test, and change as it grows.

---

### Further Reading

- [Spring Data JPA Reference Documentation](https://docs.spring.io/spring-data/jpa/reference/)
- [Defining Repository Interfaces – Spring Data JPA](https://docs.spring.io/spring-data/jpa/reference/repositories/definition.html)
- [JpaRepository API Reference](https://docs.spring.io/spring-data/jpa/reference/api/java/org/springframework/data/jpa/repository/JpaRepository.html)
- [Controller Advice – Spring Framework](https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-advice.html)
- [Error Responses (ProblemDetail / RFC 9457) – Spring Framework](https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-ann-rest-exceptions.html)
- [Specifications – Spring Data JPA](https://docs.spring.io/spring-data/jpa/reference/jpa/specifications.html)

---

**Suggested image alt text:**
- Architecture diagram: "Spring Boot REST API layered architecture showing controller, service, repository, and database"
- Package tree: "Spring Boot project structure with controller, service, repository, entity, DTO, and exception packages"
- Request flow: "Request flow through a Spring Boot REST API from controller to JSON response"
