# Deploying Mise to Google Cloud

**Recommendation: Cloud Run in `asia-south1` (Mumbai)**, built from source with the repo's `Dockerfile`. No local Docker needed; Cloud Build does the build.

Why not Firebase App Hosting: its official support stops at Next 15 (16 is "preview"), Firebase itself lists Cache Components and `proxy.ts` as open problems, and it has no Mumbai region. Don't put Firebase Hosting in front of Cloud Run either: it forwards only a cookie named `__session`, which would drop Mise's session and Zepto cookies.

## What the app needs

| Variable | Where | When | Secret |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | `.env.production` (committed; public values only) | build | no |
| `NEXT_PUBLIC_DEMO_LOGIN=1` (lets judges skip sign-in) | `.env.production` | build | no |
| `GEMINI_API_KEY` (or the Vertex vars below) | Secret Manager | runtime | yes |
| `SESSION_SECRET` (32+ chars; production refuses to start sessions without it) | Secret Manager | runtime | yes |
| `CART_API_KEY` | Secret Manager | runtime | yes |
| `APP_URL` (**required**, the public URL) | `--set-env-vars` | runtime | no |
| `CART_API_URL`, `GEMINI_MODEL`, `GEMINI_FAST_MODEL`, `ZEPTO_CLIENT_ID` | `--set-env-vars` | runtime | no |

`APP_URL` matters: behind the standalone server, `req.url` is `0.0.0.0:8080`, so redirects (logout, Zepto OAuth) are built from `APP_URL`.

`NEXT_PUBLIC_*` values are compiled in. Put only those in `.env.production`, never secrets, and rebuild when they change.

## One-time setup

```bash
PROJECT_ID=mise-hack
REGION=asia-south1
SVC=mise

gcloud auth login
gcloud projects create $PROJECT_ID
gcloud billing projects link $PROJECT_ID --billing-account=XXXXXX-XXXXXX-XXXXXX
gcloud config set project $PROJECT_ID
gcloud config set run/region $REGION
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com secretmanager.googleapis.com

PN=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')
APP_URL=https://$SVC-$PN.$REGION.run.app   # Cloud Run's deterministic URL, known before the first deploy

# Source deploys build as the Compute default service account
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member=serviceAccount:$PN-compute@developer.gserviceaccount.com --role=roles/run.builder

# Runtime identity + secrets
gcloud iam service-accounts create mise-run
SA=mise-run@$PROJECT_ID.iam.gserviceaccount.com
printf %s "$GEMINI_API_KEY" | gcloud secrets create GEMINI_API_KEY --data-file=-
openssl rand -base64 48 | tr -d '\n' | gcloud secrets create SESSION_SECRET --data-file=-
printf %s "${CART_API_KEY:-unset}" | gcloud secrets create CART_API_KEY --data-file=-
for s in GEMINI_API_KEY SESSION_SECRET CART_API_KEY; do
  gcloud secrets add-iam-policy-binding $s --member=serviceAccount:$SA --role=roles/secretmanager.secretAccessor
done
```

Put your Google client ID in `.env.production` (committed on purpose: it only holds public build-time values, and a GitHub-triggered build only sees what's in the repo):

```bash
NEXT_PUBLIC_GOOGLE_CLIENT_ID=1234567890-abc.apps.googleusercontent.com
NEXT_PUBLIC_DEMO_LOGIN=1
```

## Deploy from the console (continuous, from GitHub)

Cloud Run → **Create service** → *Continuously deploy from a repository*:

1. **Developer Connect** → *Set up with Developer Connect*: enable the API, connect GitHub, install the Google app on `amangoelfv/mise` (private repos need it), pick the repo. Branch `^main$`.
2. **Build type: Dockerfile**, location `/Dockerfile`. Not Go/Node/Python buildpacks: the image runs `node server.js` from Next's standalone output, which `next start` doesn't support.
3. **Service name** `mise`, **Region** `asia-south1 (Mumbai)`. Neither can change later.
4. **Authentication:** *Allow public access*. **Billing:** request-based. **Scaling:** min 0 (1 while judging), max 3. **Ingress:** all.
5. **Containers → Settings:** port 8080, memory 1 GiB, CPU 1, startup CPU boost on.
6. **Containers → Variables & secrets:** env var `APP_URL=https://mise-<PROJECT_NUMBER>.asia-south1.run.app`; *Reference a secret* for `GEMINI_API_KEY` and `SESSION_SECRET` (create them in Secret Manager first; accept the prompt to grant the service account access). Add `CART_API_URL` / `CART_API_KEY` later.
7. **Create.** Every push to `main` now rebuilds and deploys. Check the URL Cloud Run shows matches `APP_URL`; if not, edit the variable and deploy a new revision.

**Permissions the build needs** (newer projects don't grant them by default; run in Cloud Shell):

```bash
# Cloud Build's service agent reads the repo through Developer Connect
gcloud projects add-iam-policy-binding $PROJECT_ID --member="serviceAccount:service-$PN@gcp-sa-cloudbuild.iam.gserviceaccount.com" --role="roles/developerconnect.tokenAccessor" --condition=None
# The trigger's service account fetches source, pushes the image and deploys
for r in roles/developerconnect.readTokenAccessor roles/run.builder roles/run.developer roles/iam.serviceAccountUser; do gcloud projects add-iam-policy-binding $PROJECT_ID --member="serviceAccount:$PN-compute@developer.gserviceaccount.com" --role="$r" --condition=None; done
# Runtime access to secrets
for s in GEMINI_API_KEY SESSION_SECRET; do gcloud secrets add-iam-policy-binding "$s" --member="serviceAccount:$PN-compute@developer.gserviceaccount.com" --role="roles/secretmanager.secretAccessor"; done
gcloud artifacts repositories create cloud-run-source-deploy --repository-format=docker --location=$REGION
```

**If you edit the trigger in Cloud Build:** keep *Type: Cloud Build configuration file*. The trigger editor's *Dockerfile* type only builds and pushes; it never deploys. A working inline config:

```yaml
steps:
  - id: build
    name: gcr.io/cloud-builders/docker
    args: ["build", "-t", "asia-south1-docker.pkg.dev/$PROJECT_ID/cloud-run-source-deploy/mise:$COMMIT_SHA", "."]
  - id: push
    name: gcr.io/cloud-builders/docker
    args: ["push", "asia-south1-docker.pkg.dev/$PROJECT_ID/cloud-run-source-deploy/mise:$COMMIT_SHA"]
  - id: deploy
    name: gcr.io/google.com/cloudsdktool/cloud-sdk:slim
    entrypoint: gcloud
    args: ["run", "deploy", "mise", "--image=asia-south1-docker.pkg.dev/$PROJECT_ID/cloud-run-source-deploy/mise:$COMMIT_SHA", "--region=asia-south1", "--quiet"]
timeout: 1200s
options:
  logging: CLOUD_LOGGING_ONLY  # required when the trigger runs as a chosen service account
```

## Deploy from your machine

```bash
gcloud run deploy $SVC --source . --region $REGION --service-account $SA \
  --allow-unauthenticated \
  --set-secrets GEMINI_API_KEY=GEMINI_API_KEY:latest,SESSION_SECRET=SESSION_SECRET:latest,CART_API_KEY=CART_API_KEY:latest \
  --set-env-vars APP_URL=$APP_URL \
  --memory 1Gi --cpu 1 --concurrency 80 --min-instances 0 --max-instances 3 --cpu-boost --timeout 300

gcloud run services describe $SVC --format='value(status.url)'
```

- Add `,CART_API_URL=https://…` to `--set-env-vars` once the cart service is live. Until then carts are simulated.
- Later changes: use `--update-env-vars` / `--update-secrets`; the `--set-*` flags replace everything.
- If your Google Workspace org blocks public (`allUsers`) access, swap `--allow-unauthenticated` for `--no-invoker-iam-check`.
- While judges are using it: `gcloud run services update $SVC --min-instances 1` (no cold starts; billed while idle). Set it back to `0` after.

## Outside Google Cloud

1. **Google sign-in.** In the OAuth client (type *Web application*), add `$APP_URL` (and any custom domain) under *Authorized JavaScript origins*; no redirect URI is needed. Use an *External* consent screen; in *Testing* mode only listed test users (max 100) can sign in, so add the judges or publish it. `NEXT_PUBLIC_DEMO_LOGIN=1` is the fallback.
2. **Zepto.** Zepto's OAuth only accepts allow-listed redirect URIs (localhost works for local dev). Open an issue on [github.com/zeptonow/mcp](https://github.com/zeptonow/mcp) asking them to allow `https://mise-<PROJECT_NUMBER>.asia-south1.run.app/api/connectors/zepto/callback` (and your custom domain, if any). Settle the final hostname before filing.
3. **Gemini via Vertex AI (optional, no API key).** `gcloud services enable aiplatform.googleapis.com`, grant the runtime service account `roles/aiplatform.user`, drop the `GEMINI_API_KEY` secret and set `GOOGLE_GENAI_USE_VERTEXAI=true,GOOGLE_CLOUD_PROJECT=$PROJECT_ID,GOOGLE_CLOUD_LOCATION=global`. Check the model IDs exist on Vertex first and set `GEMINI_MODEL` / `GEMINI_FAST_MODEL` if they differ.

## Custom domain

`*.run.app` already has managed HTTPS. Cloud Run domain mapping isn't available in `asia-south1`, so a custom domain means a global external Application Load Balancer with a serverless NEG (about $18/month for the forwarding rule): see [Google's guide](https://docs.cloud.google.com/load-balancing/docs/https/setup-global-ext-https-serverless). Afterwards update `APP_URL`, the Google OAuth origins and the Zepto redirect URI.

## Cost for a demo

Cloud Run's free tier (180k vCPU-seconds, 360k GiB-seconds, 2M requests a month), Cloud Build's 2,500 build-minutes and Secret Manager's free versions cover a hackathon. You pay for egress from Mumbai (cents), `min-instances 1` if enabled, a load balancer if you add one, and Gemini usage. New accounts get $300 of credit for 90 days.

## Gotchas

- Cache Components works on Cloud Run, but `'use cache'` data lives in each instance's memory and is lost on scale-to-zero. Mise doesn't use `'use cache'` today.
- Env-var secrets are read at instance start; a new secret version needs a new revision (`gcloud run services update $SVC --update-secrets …`).
- Rotating `SESSION_SECRET` signs everyone out and disconnects Zepto.
- Without `ZEPTO_CLIENT_ID`, each new instance registers a fresh OAuth client with Zepto. Once you have a stable client id, set it.
- Cloud Run gives a container 10 s after SIGTERM, and its filesystem lives in memory, hence `--memory 1Gi`.

Sources: [Cloud Run source deploys](https://docs.cloud.google.com/run/docs/deploying-source-code) · [secrets](https://docs.cloud.google.com/run/docs/configuring/services/secrets) · [container contract](https://docs.cloud.google.com/run/docs/container-contract) · [domain mapping](https://docs.cloud.google.com/run/docs/mapping-custom-domains) · [Firebase App Hosting frameworks](https://firebase.google.com/docs/app-hosting/frameworks-tooling) · [Firebase on Next adapters](https://firebase.blog/posts/2026/03/nextjs-adapters) · [Firebase Hosting cookies](https://firebase.google.com/docs/hosting/manage-cache) · [Next.js self-hosting](https://nextjs.org/docs/app/guides/self-hosting) · [free tier](https://docs.cloud.google.com/free/docs/free-cloud-features)
