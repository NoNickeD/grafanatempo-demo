# Grafana Tempo Demo

Follow these steps to set up and explore Grafana Tempo with a local Kubernetes environment.

### Step 1: Clone the Repository and Navigate to the Directory

```bash
git clone https://github.com/NoNickeD/grafanatempo-demo.git
cd grafanatempo-demo
```

### Step 2: Pull the Latest Changes from the Repository

```bash
git pull
```

### Step 3: Set Up the Local Kubernetes Cluster

```bash
task full-deploy-local
```

Allow 3–5 minutes for all pods to be up and running, then check the pod status:

```bash
kubectl get pods -A
```

### Step 4: Build the Log-Generator Application Image

```bash
cd ./app/

task build-local
```

### Step 5: Update the Image in `log-generator.yaml`

Edit line 43 to reflect the newly built image:

```bash
nvim log-generator.yaml
```

### Step 6: Deploy the Log-Generator Application

```bash
kubectl apply -f log-generator.yaml
```

### Step 7: Deploy the Grafana Ingress

```bash
cd ../ingress

kubectl apply -f grafana-local.yaml
```

### Step 8: Update `/etc/hosts` or Port-Forward Services

Add the following lines to `/etc/hosts`:

```bash
127.0.0.1 grafana.local
127.0.0.1 log-generator.local
```

Alternatively, you can port-forward the services:

```bash
kubectl --namespace monitoring port-forward svc/loki-grafana 3000:80

kubectl --namespace sre-log-generator port-forward svc/log-generator-service 8080:80
```

Verify service status:

```bash
kubectl --namespace monitoring get pods

kubectl --namespace monitoring get svc

kubectl --namespace sre-log-generator get pods
```

### Step 9: Access Grafana

Retrieve Grafana's admin password:

```bash
kubectl --namespace monitoring get secrets loki-grafana -o jsonpath="{.data.admin-password}" | base64 --decode; echo
```

Open Grafana in your browser:

```bash
open http://grafana.local
```

In Grafana:

- Go to **Connections → Add new connection**
- Search for **Tempo**
- In URL setup, enter: `http://tempo.monitoring:3100`
- Click **Save & test**

### Step 10: Update Promtail Configuration

```bash
cd ../promtail
```

(Optional) Extract the current Promtail configuration:

```bash
kubectl --namespace monitoring get secret loki-promtail -o jsonpath="{.data.promtail\.yaml}" | base64 --decode > promtail.yaml
```

Encode the new configuration file:

```bash
cat promtail-srekubecraftio.yaml | base64 -w 0 > promtail-encoded.yaml
```

Update the Promtail secret:

```bash
kubectl --namespace monitoring patch secret loki-promtail -p="{\"data\":{\"promtail.yaml\":\"$(cat promtail-encoded.yaml)\"}}"
```

Restart Promtail to apply the changes:

```bash
kubectl --namespace monitoring delete pod -l "app.kubernetes.io/name=promtail"
```

### Step 11: Run the Smoke Test

Update the URL in `smoke_test.js` on line 11 to reflect your environment, then run the test:

```bash
cd ../smoke_test

k6 run smoke_test.js
```

### Step 12: Check Logs from Tempo and the Log-Generator App

View logs for Tempo:

```bash
kubectl --namespace monitoring logs -f -l "app.kubernetes.io/name=tempo"
```

View logs for the Log-Generator:

```bash
kubectl --namespace sre-log-generator logs -f -l "app=log-generator"
```

### Step 13: Query with Tempo in Grafana

In Grafana:

- Navigate to **Explore**
- Select **Tempo** as your data source

```
{resource.service.name="srekubecraftio-service"}
```

```
{resource.service.name="srekubecraftio-service" && name="createLogEntry-1" && traceDuration>=300ms}
```

![Tempo 1](/images/grafana-tempo-1.png)

![Tempo 2](/images/grafana-tempo-2.png)

### Step 14: Destroy everything

```bash
cd ..

task delete-local-cluster
```
