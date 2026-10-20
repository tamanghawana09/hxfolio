---
title: "Google OAuth Login in Spring Boot: What I Learned Building Fintrack"
description: "How I implemented Google OAuth login in a Spring Boot and Thymeleaf application using Spring Security. A practical look at OAuth login, sessions, roles, CSRF, and how it differs from JWT authentication."
pubDate: 2026-10-20
readTime: "9 min read"
category: "Spring Boot"
tags: ["Spring Boot", "Spring Security", "OAuth 2.0", "Google OAuth", "Java", "Thymeleaf", "Authentication", "Authorization", "Fintrack", "Web Development"]
featured: true
accent: "blue"
---


# Google OAuth Login in Spring Boot: What I Learned Building Fintrack

When I started adding authentication to Fintrack, I expected integrating Google and GitHub login to be one of the harder parts of the project. In practice, Spring Security’s OAuth 2.0 Login support made the core integration more straightforward than I expected.

Fintrack is a server-rendered Spring Boot application built with Thymeleaf. It supports email-and-password login and Google OAuth login, and its security configuration also includes a GitHub OAuth client registration. The application uses Spring Security’s session-based authentication rather than JWT-based authentication.

## Why I added Google login

Fintrack needed a way for users to sign in without necessarily creating another username and password. Google login provides a familiar alternative: users can authenticate with an account they already have.

I also kept email-and-password registration and login in the application. That gives Fintrack two visible authentication paths:

- Email-and-password login
- Google OAuth login

The supplied login page includes a Google button:

```html
<a th:href="@{/oauth2/authorization/google}" class="btn btn-google btn-lg">
    <i class="fa-brands fa-google"></i>
    Continue with Google
</a>
```

Although the security configuration and properties file include a GitHub OAuth client registration, the supplied login template does not include a corresponding “Continue with GitHub” button. Based on the code provided, GitHub is configured but not exposed through the login UI.

## Fintrack in Action

Before diving into the implementation, here's a look at Fintrack's interface, authentication page, and dashboard.

### 1. Fintrack Application

An overview of Fintrack, the personal finance application built with Spring Boot and Thymeleaf.

![Fintrack application overview](/fintrack.png)

### 2. Login Page

Fintrack supports email-and-password authentication alongside Google sign-in, providing users with multiple ways to access the application.

![Fintrack login page with Google sign-in](/fintrack-login.png)

### 3. Dashboard

After authentication, users can access the Fintrack dashboard to interact with the application.

![Fintrack dashboard after login](/fintrack-dashboard.png)
## OAuth, OpenID Connect, sessions, and JWT

These terms are related, but they are not interchangeable.

**OAuth 2.0** is an authorization framework. It lets an application obtain limited access to user information or resources without directly handling the user’s provider password.

**OpenID Connect** is an identity layer built on OAuth 2.0. Google supports OpenID Connect, which is why Google login can provide standardized identity information.

**Session-based authentication** means the server maintains the authenticated state after login. In Fintrack, Spring Security stores the authenticated user in the security context for the user’s session.

**JWT-based authentication** is different. A JWT is a token format that carries claims between parties. An API can validate a signed JWT on each request instead of relying on a server-side session. JWTs are often used alongside OAuth 2.0 and OpenID Connect, but OAuth and JWT are not competing protocols.

Fintrack’s supplied code uses OAuth 2.0 Login and Spring Security sessions. It does not include JWT generation, JWT validation, refresh-token handling, or a custom JWT authentication filter.

## How Fintrack’s security configuration works

Fintrack’s authentication rules are centralized in `SecurityConfiguration`:

```java
@Configuration
@EnableMethodSecurity
public class SecurityConfiguration {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/", "/login", "/register", "/saveUser").permitAll()
                .requestMatchers("/dashboard/**").hasRole("USER")
                .anyRequest().authenticated()
            )
            .oauth2Login(oauth -> oauth
                .loginPage("/login")
                .defaultSuccessUrl("/dashboard", true)
                .failureUrl("/login?error=true")
                .userInfoEndpoint(userInfo -> userInfo
                    .userService(customOAuth2UserService())
                )
            )
            .formLogin(form -> form
                .loginPage("/login")
                .usernameParameter("email")
                .passwordParameter("password")
                .successHandler((request, response, authentication) -> {
                    response.sendRedirect("/dashboard");
                })
                .permitAll()
            )
            .logout(logout -> logout
                .logoutSuccessUrl("/login")
                .permitAll()
            );

        return http.build();
    }
}
```

This configuration:

- Makes `/`, `/login`, `/register`, and `/saveUser` publicly accessible.
- Requires `ROLE_USER` for `/dashboard/**`.
- Requires authentication for every other request.
- Enables OAuth 2.0 Login.
- Enables email-and-password form login.
- Redirects successful logins to `/dashboard`.
- Redirects failed OAuth logins to `/login?error=true`.
- Sends users to `/login` after logout.

## Configuring route authorization

The route rules are defined here:

```java
.authorizeHttpRequests(auth -> auth
    .requestMatchers("/", "/login", "/register", "/saveUser").permitAll()
    .requestMatchers("/dashboard/**").hasRole("USER")
    .anyRequest().authenticated()
)
```

The order matters. Spring Security evaluates matchers in declaration order: public routes are matched first, then the dashboard rule, and finally all remaining requests require authentication.

The dashboard rule uses:

```java
.requestMatchers("/dashboard/**").hasRole("USER")
```

Spring Security’s role-based authorization uses a default `ROLE_` prefix, so `hasRole("USER")` checks for the authority `ROLE_USER`. [docs.spring](https://docs.spring.io/spring-security/reference/servlet/authorization/architecture.html)

## Understanding the custom OAuth2UserService

Fintrack customizes how Google-authenticated users are represented inside Spring Security:

```java
@Bean
public OAuth2UserService<OAuth2UserRequest, OAuth2User> customOAuth2UserService() {
    return userRequest -> {
        DefaultOAuth2UserService delegate = new DefaultOAuth2UserService();
        OAuth2User oAuth2User = delegate.loadUser(userRequest);

        Set<GrantedAuthority> authorities = new HashSet<>();
        authorities.add(new SimpleGrantedAuthority("ROLE_USER"));
        authorities.addAll(oAuth2User.getAuthorities());

        return new DefaultOAuth2User(authorities, oAuth2User.getAttributes(), "email");
    };
}
```

Spring Security’s `DefaultOAuth2UserService` loads user attributes from the provider’s user-info endpoint using the access token obtained during the OAuth flow. 

Fintrack then creates a new `DefaultOAuth2User` with:

- `ROLE_USER` added to the user’s authorities.
- The provider’s existing authorities retained.
- `email` set as the name attribute.

The `"email"` argument is important. It tells Spring Security which key in the returned attribute map should be used as the principal’s name. For this to work as intended, Google’s response must contain an `email` attribute. Fintrack requests the `email` and `profile` scopes for Google, which supports that flow.

## Why ROLE_USER protects the dashboard

The custom service explicitly grants:

```java
authorities.add(new SimpleGrantedAuthority("ROLE_USER"));
```

The dashboard route then requires:

```java
.requestMatchers("/dashboard/**").hasRole("USER")
```

Because Spring Security maps `hasRole("USER")` to `ROLE_USER`, a Google-authenticated user receives the authority required by the dashboard route rule.

## Supporting email-and-password login

Fintrack also supports local registration and login.

The registration endpoint hashes the submitted password before saving the user:

```java
@PostMapping("/saveUser")
public String saveUser(
        @RequestParam String username,
        @RequestParam String email,
        @RequestParam String password) {

    User user = new User(
        username,
        email,
        passwordEncoder.encode(password),
        "USER"
    );

    userRepository.save(user);
    return "redirect:/login";
}
```

This confirms that the `BCryptPasswordEncoder` bean is not just defined—it is used when creating a local account. The user is saved with the role `"USER"`.

For authentication, Fintrack implements Spring Security’s `UserDetailsService`:

```java
@Service
public class CustomerUserDetailsService implements UserDetailsService {

    @Autowired
    private UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String email)
            throws UsernameNotFoundException {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                    new UsernameNotFoundException("User not found"));

        return org.springframework.security.core.userdetails.User.builder()
                .username(user.getEmail())
                .password(user.getPassword())
                .roles(user.getRole())
                .build();
    }
}
```

Spring Security calls this service during form login. It looks up the user by email, returns the stored BCrypt-hashed password, and maps the stored role value through `.roles(...)`. Because the stored role is `"USER"`, Spring Security produces the `ROLE_USER` authority.

## How the dashboard identifies the user

After either login method succeeds, controllers use the authenticated principal’s name as the user’s email:

```java
@GetMapping("/dashboard")
public String dashboard(Model model, Principal principal) {

    String email = principal.getName();
    User user = userService.findByEmail(email);

    model.addAttribute("username", user.getUsername());
    ...
}
```

For form-login users, this works naturally: `CustomerUserDetailsService` sets the authenticated username to the stored email.

For Google OAuth users, the custom `OAuth2UserService` also uses `email` as the principal name. However, the supplied code does not save the OAuth user to the `users` table. The dashboard then calls:

```java
User user = userService.findByEmail(email);
model.addAttribute("username", user.getUsername());
```

And `UserService.findByEmail` throws if no matching record exists:

```java
public User findByEmail(String email) {
    return userRepository.findByEmail(email)
            .orElseThrow(() ->
                new RuntimeException("User not found: " + email));
}
```

That means the dashboard expects a matching local `User` record for the Google user’s email. If no such record exists, the request will fail with a `RuntimeException`.

This is the most important implementation consideration I identified while reviewing the code: Fintrack authenticates Google users through Spring Security, but it does not automatically create or link a local database user after OAuth login.

## Redirects, logout, and CSRF

Successful Google login sends users to:

```java
.defaultSuccessUrl("/dashboard", true)
```

Successful form login uses a custom handler:

```java
.successHandler((request, response, authentication) -> {
    response.sendRedirect("/dashboard");
})
```

Failed OAuth login returns the user to:

```java
.failureUrl("/login?error=true")
```

The login page displays an error message when that happens:

```html
<div th:if="${param.error}" class="alert alert-danger py-2 text-center" role="alert">
    Invalid email or password
</div>
```

Logout is configured as:

```java
.logout(logout -> logout
    .logoutSuccessUrl("/login")
    .permitAll()
)
```

The dashboard’s logout form includes Spring Security’s CSRF token:

```html
<form th:action="@{/logout}" method="post">
    <input type="hidden"
           th:name="${_csrf.parameterName}"
           th:value="${_csrf.token}" />
    <button type="submit" class="btn btn-danger mt-2">Logout</button>
</form>
```

Because Fintrack uses browser-based form login and session authentication, CSRF protection is relevant. The Thymeleaf form includes the CSRF token explicitly, which is consistent with Spring Security’s default protection for state-changing POST requests.

## Credential handling and security considerations

OAuth client IDs and client secrets are sensitive. They should not be hardcoded or committed to source control. A safer approach is to supply them through environment variables or a secrets manager:

```yaml
spring:
  security:
    oauth2:
      client:
        registration:
          google:
            client-id: ${GOOGLE_CLIENT_ID}
            client-secret: ${GOOGLE_CLIENT_SECRET}
            scope: email,profile
          github:
            client-id: ${GITHUB_CLIENT_ID}
            client-secret: ${GITHUB_CLIENT_SECRET}
```

This is a recommendation for credential management; the supplied configuration showed blank OAuth credential fields, so it does not prove which approach Fintrack uses in every environment.

The supplied datasource configuration does include a PostgreSQL username and password in plain text:

```properties
spring.datasource.username=postgres
spring.datasource.password=0911
```

For any shared, deployed, or version-controlled environment, database credentials should be externalized and rotated if they have ever been committed. A safer pattern is:

```properties
spring.datasource.username=${DB_USERNAME}
spring.datasource.password=${DB_PASSWORD}
```

## What I learned and what I would improve next

The main lesson was that Spring Security handles much of the OAuth protocol work I initially expected to implement myself. I configured the provider, login behavior, user authorities, route protection, redirects, and logout flow; Spring Security handled the underlying OAuth 2.0 Login mechanics.

If I continue developing Fintrack’s authentication, I would investigate:

- Automatically creating or linking a local `User` record after Google OAuth login.
- Handling the case where an OAuth user’s email does not exist in the database.
- Adding a GitHub login button if GitHub OAuth is intended to be user-facing.
- Preventing duplicate accounts when a user registers locally and later signs in with the same email through Google.
- Considering whether JWT-based API authentication would make sense if Fintrack later exposes a mobile or third-party API.
- Externalizing database credentials and OAuth secrets across all environments.

## Conclusion

Adding Google login to Fintrack helped me understand how Spring Security separates concerns. OAuth 2.0 Login lets users authenticate through a provider they already trust, while Spring Security sessions maintain the authenticated state inside the application.

It also clarified the difference between authentication and authorization: Google can establish who the user is, while Fintrack’s `ROLE_USER` authority and route rules decide what that user can access.

## References

- Spring Security: OAuth 2.0 Login — [https://docs.spring.io/spring-security/reference/servlet/oauth2/login/index.html](https://docs.spring.io/spring-security/reference/servlet/oauth2/login/index.html)  
- Spring Security: OAuth 2.0 Login Advanced Configuration — [https://docs.spring.io/spring-security/reference/servlet/oauth2/login/advanced.html](https://docs.spring.io/spring-security/reference/servlet/oauth2/login/advanced.html)  
- Spring Security: OAuth 2.0 Client — [https://docs.spring.io/spring-security/reference/servlet/oauth2/client/index.html](https://docs.spring.io/spring-security/reference/servlet/oauth2/client/index.html)  
- Spring Security: Servlet Authentication Architecture — [https://docs.spring.io/spring-security/reference/servlet/authentication/architecture.html](https://docs.spring.io/spring-security/reference/servlet/authentication/architecture.html)  
- Spring Security: Authorization Architecture — [https://docs.spring.io/spring-security/reference/servlet/authorization/architecture.html](https://docs.spring.io/spring-security/reference/servlet/authorization/architecture.html)  
- Spring Boot: OAuth2 — [https://docs.spring.io/spring-boot/reference/security/oauth2.html](https://docs.spring.io/spring-boot/reference/security/oauth2.html)  
- IETF: RFC 6749, The OAuth 2.0 Authorization Framework — [https://datatracker.ietf.org/doc/html/rfc6749](https://datatracker.ietf.org/doc/html/rfc6749)  
- IETF: RFC 7519, JSON Web Token (JWT) — [https://datatracker.ietf.org/doc/html/rfc7519](https://datatracker.ietf.org/doc/html/rfc7519)  
