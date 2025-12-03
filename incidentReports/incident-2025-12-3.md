# Incident: YYYY-MM-DD HH-mm-ss

## Summary

```md
Between 9:56 and 10:50 on December 3, 2025, the JWT pizza service experienced failures caused by an active chaos test run initiated the prior evening.

HTTP metrics show a clear spike in requests failures from the Pizza service along with an absence of order latency. The on call engineer worked on the incident by examining the current metrics across services and diagnosing the cause as the chaos test due to logs and requests. After looking through the logs, the engineer was able to find the link needed to end the chaos test and services have since been restored to normal.
```

## Detection

```md
THe team detected the initial alert which was texted to the JWT DevOps team and the on call engineer Jayden Allen.

The on call engineer was involved with another task at the moment, so he received an alert through email 5 minutes later. The initial requests were done before 10:00 and around 10:15 the engineer was able to look into the incident.
The errors were caught both in the logs as well as the HTTP request monitoring. Luckily the incident was caught soon enough since the grafana cloud monitoring system only stores 4 hours of logs on the free version. The company will have to look into premium if future incident arise. Addiitonally, further monitoring and rate limiting should be explored to ensure that logs can be filtered from the frequenting of Bots and Google search crawlers on the site.
```

## Impact

```md
For nearly 1 hour, services were impacted. Luckily, the incident affected 0 actual customers and only simulated users who had failure in pizza order attempts.

0 support tickets were submitted.
```

## Timeline

```md

- _2025-12-01 21:00_ - Chaos testing is initiated for the JWT Pizza service
- _2025-12-02 08:00_ - Scheduled chaos testing window begins
- _09:56_ - Grafana order failure alert triggers due to elevated POST failures
- _10:04_ - On call engineer acknowledges the alert
- _10:10_ - Engineer reviews HTTP logs and identifies missing Pizza Factory responses
- _10:22_ - Retry storms increase, engineer confirms failures align with chaos test behavior
- _10:38_ - Engineer prepares to terminate chaos test after confirming no external factors
- _10:50_ - Chaos testing is disabled, restoring Pizza Factory fulfillment
- _10:50_ - HTTP request metrics stabilize and pizza orders resume normally

```

## Response


```md
THe on call engineer Jayden reviewed teh grafana dashboard, HTTP request monitoring, and logs and identified the requests involved in teh incident. After confirming the cause was related to the chaos testing, the engineer terminated the chaos test, as well as filled out the incident report. The chaos test was fully diagnosed and terminated at 10:50.

To decrease the response times the company should look into additional on call engineers.
```

## Root cause

```md
An active chaos testing run disrupted communication with the Pizza Factory, preventing successful pizza order fulfillment.
```

## Resolution

```md
The engineer resolved the incident by disabling the chaos test at 10:50. Also of note, the initial link did not work the first several times it was used to acces Chaos Monkey. After several attempts it appears to have gone through especially since services appeared to have resumed to normal.
```

## Prevention


```md
Add automated shutdown logic for chaos tests outside their scheduled window.

Add clearer logging identifiers for chaos events.

Make sure multiple on call engineers are available.

Look into additional log retention with a paid grafana account.
```

## Action items

```md

Implement automatic chaos-test shutdown
Owner: DevOps Lead — Due: 2025-12-10




Improve failure detection and modify the thresholds for triggering alerts
Owner: Monitoring Engineer — Due: 2025-12-12

Improve Logging to surface chaos  test activity
Owner: Lead Developer — Due: 2026-01-05

Add a secondary on call engineer
Owner: Engineering Manager — Due: 2025-12-15
```
