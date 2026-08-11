@auth @session
Feature: Secure admin server-side sessions

  Background:
    * url baseUrl
    * configure cookies = null

  Scenario: Protected profile rejects requests without a session
    Given path 'api', 'auth', 'me'
    When method get
    Then status 401
    And match response == { error: 'Unauthorized' }

  Scenario: A known user ID cannot be forged into an authenticated session
    * if (!testEmail || !testPassword) karate.fail('Set KARATE_TEST_EMAIL and KARATE_TEST_PASSWORD')
    Given path 'api', 'auth', 'login'
    And request { email: '#(testEmail)', password: '#(testPassword)', rememberMe: false }
    When method post
    Then status 200
    And match response.success == true
    * def validSession = responseCookies['admin-session'].value
    * match validSession == '#string'

    Given path 'api', 'auth', 'me'
    And cookie admin-session = validSession
    When method get
    Then status 200
    * def knownUserId = response.id
    * match knownUserId == '#string'

    * configure cookies = null
    Given path 'api', 'auth', 'me'
    And cookie admin-session = knownUserId
    When method get
    Then status 401
    And match response == { error: 'Unauthorized' }

  Scenario: Random opaque cookie cannot authenticate
    * def forgedToken = java.util.UUID.randomUUID() + java.util.UUID.randomUUID()
    Given path 'api', 'auth', 'me'
    And cookie admin-session = forgedToken
    When method get
    Then status 401
    And match response == { error: 'Unauthorized' }

  Scenario: Valid login creates an opaque secure session and logout revokes it
    * if (!testEmail || !testPassword) karate.fail('Set KARATE_TEST_EMAIL and KARATE_TEST_PASSWORD')
    Given path 'api', 'auth', 'login'
    And request { email: '#(testEmail)', password: '#(testPassword)', rememberMe: false }
    When method post
    Then status 200
    And match response == { success: true, mosqueKey: '#string' }
    And match responseCookies contains key 'admin-session'
    * def sessionCookie = responseCookies['admin-session']
    * def sessionToken = sessionCookie.value
    * match sessionToken == '#regex [A-Za-z0-9_-]{43}'
    * match sessionCookie.httpOnly == true
    * match sessionCookie.sameSite == 'Lax'

    Given path 'api', 'auth', 'me'
    And cookie admin-session = sessionToken
    When method get
    Then status 200
    And match response ==
      """
      {
        id: '#string',
        email: '#(testEmail)',
        mosqueKey: '#string',
        mosqueKeys: '#[] #string'
      }
      """
    And match sessionToken != response.id

    Given path 'api', 'auth', 'logout'
    And cookie admin-session = sessionToken
    When method post
    Then status 200
    And match response == { success: true }

    * configure cookies = null
    Given path 'api', 'auth', 'me'
    And cookie admin-session = sessionToken
    When method get
    Then status 401
    And match response == { error: 'Unauthorized' }

  Scenario Outline: Login input validation rejects malformed payloads
    Given path 'api', 'auth', 'login'
    And request <payload>
    When method post
    Then status 400
    And match response.success == false
    And match response.message contains 'Validation error:'

    Examples:
      | payload |
      | { email: 'not-an-email', password: 'ValidPass123', rememberMe: false } |
      | { email: 'user@example.com', password: 'short', rememberMe: false } |
      | { email: 'user@example.com', password: 'ValidPass123', rememberMe: 'yes' } |

  Scenario: Incorrect credentials do not create a session
    * if (!testEmail) karate.fail('Set KARATE_TEST_EMAIL')
    Given path 'api', 'auth', 'login'
    And request { email: '#(testEmail)', password: 'DefinitelyWrongPassword123!', rememberMe: false }
    When method post
    Then status 401
    And match response == { success: false, message: 'Email atau password salah' }
    And match responseCookies !contains key 'admin-session'
