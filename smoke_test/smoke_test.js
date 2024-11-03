import http from "k6/http";
import { check, sleep } from "k6";

export let options = {
  vus: 5, // Number of virtual users
  duration: "30s", // Duration of the test
};

export default function () {
  // Change the URL to match the address of your deployed service
  const url = "http://log-generator.local/generate"; // Change this URL to match the address of your deployed service

  // Make a GET request to the /generate endpoint
  let res = http.get(url);

  // Check for successful status code (200 OK)
  check(res, {
    "is status 200": (r) => r.status === 200,
  });

  // Sleep for a short period to simulate normal traffic
  sleep(1);
}
