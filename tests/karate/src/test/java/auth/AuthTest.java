package auth;

import com.intuit.karate.junit5.Karate;

class AuthTest {

    @Karate.Test
    Karate authSecurity() {
        return Karate.run("auth-session").relativeTo(getClass());
    }
}
