function fn() {
  var config = {
    baseUrl: karate.properties['baseUrl'] || karate.env('KARATE_BASE_URL') || 'http://localhost:3002',
    testEmail: karate.properties['testEmail'] || karate.env('KARATE_TEST_EMAIL'),
    testPassword: karate.properties['testPassword'] || karate.env('KARATE_TEST_PASSWORD')
  };

  karate.configure('connectTimeout', 10000);
  karate.configure('readTimeout', 10000);
  karate.configure('ssl', true);
  karate.configure('logPrettyRequest', true);
  karate.configure('logPrettyResponse', true);

  return config;
}
