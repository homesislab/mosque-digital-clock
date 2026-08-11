# Karate API Tests

Integration tests for the admin authentication and server-side session flow.

## Prerequisites

- Java 17 or newer
- Maven 3.9 or newer
- Running `web-admin` application
- Migration `002_admin_sessions.sql` applied
- A dedicated test user with a bcrypt password and at least one mosque key

## Configuration

Set these environment variables without committing their values:

- `KARATE_BASE_URL` — defaults to `http://localhost:3002`
- `KARATE_TEST_EMAIL` — dedicated test account email
- `KARATE_TEST_PASSWORD` — dedicated test account password

Equivalent Maven properties are `baseUrl`, `testEmail`, and `testPassword`.

## Run

From this directory, run Maven test. Reports are generated under `target/karate-reports` and JUnit results under `target/surefire-reports`.

The suite intentionally uses invalid cookie values derived from a known user ID and a random opaque token. It verifies that neither value grants access, a valid login creates a non-user-ID cookie, logout revokes that token, and malformed or incorrect credentials are rejected.
