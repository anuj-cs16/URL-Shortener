# deploy.ps1
# PowerShell Deployment Script for QuickLink URL Shortener on Google Cloud Run
#
# Usage:
#   .\deploy.ps1 -ProjectId "your-gcp-project-id" -Region "us-central1" -ServiceName "quicklink"
#

param (
    [Parameter(Mandatory = $true)]
    [string]$ProjectId,

    [Parameter(Mandatory = $false)]
    [string]$Region = "us-central1",

    [Parameter(Mandatory = $false)]
    [string]$ServiceName = "quicklink",

    [Parameter(Mandatory = $false)]
    [switch]$UseLocalDocker
)

$ErrorActionPreference = "Stop"

# ── 1. Check prerequisites ──
Write-Host "`n🔍 Checking prerequisites..." -ForegroundColor Cyan

try {
    $gcloudVersion = gcloud --version
    Write-Host "✅ gcloud CLI is installed." -ForegroundColor Green
} catch {
    Write-Host "❌ Error: Google Cloud SDK (gcloud) is not installed or not in PATH." -ForegroundColor Red
    Write-Host "Please install it from: https://cloud.google.com/sdk/docs/install" -ForegroundColor Yellow
    exit 1
}

# ── 2. Configure project ──
Write-Host "`n⚙️ Configuring Google Cloud Project to: $ProjectId" -ForegroundColor Cyan
gcloud config set project $ProjectId

# Enable required Google APIs
Write-Host "📡 Enabling required Google APIs (run, artifactregistry, builds, secretmanager)..." -ForegroundColor Cyan
gcloud services enable run.googleapis.com `
                       artifactregistry.googleapis.com `
                       cloudbuild.googleapis.com `
                       secretmanager.googleapis.com

# ── 3. Artifact Registry Repository setup ──
$RepoName = "quicklink-repo"
$ImageName = "$Region-docker.pkg.dev/$ProjectId/$RepoName/$ServiceName:latest"

Write-Host "`n📦 Checking Artifact Registry Repository..." -ForegroundColor Cyan
$repoExists = gcloud artifacts repositories list --location=$Region --filter="name:projects/$ProjectId/locations/$Region/repositories/$RepoName" --format="value(name)"

if (-not $repoExists) {
    Write-Host "Creating repository '$RepoName' in region '$Region'..." -ForegroundColor Yellow
    gcloud artifacts repositories create $RepoName `
        --repository-format=docker `
        --location=$Region `
        --description="Docker repository for QuickLink app"
} else {
    Write-Host "✅ Artifact Registry repository '$RepoName' already exists." -ForegroundColor Green
}

# ── 4. Build and Push Container ──
if ($UseLocalDocker) {
    Write-Host "`n🐳 Building image locally using Docker..." -ForegroundColor Cyan
    try {
        docker --version
    } catch {
        Write-Host "❌ Error: Docker is not running or not installed." -ForegroundColor Red
        exit 1
    }
    
    Write-Host "Building Docker image: $ImageName" -ForegroundColor Yellow
    docker build -t $ImageName .
    
    Write-Host "Configuring Docker authentication for Artifact Registry..." -ForegroundColor Yellow
    gcloud auth configure-docker "$Region-docker.pkg.dev"
    
    Write-Host "Pushing Docker image..." -ForegroundColor Yellow
    docker push $ImageName
} else {
    Write-Host "`n☁️ Building image in the cloud using Google Cloud Build (No local Docker needed)..." -ForegroundColor Cyan
    gcloud builds submit --tag $ImageName .
}

# ── 5. Setup Secrets in Secret Manager (if they don't exist) ──
Write-Host "`n🔒 Checking Secrets in Secret Manager..." -ForegroundColor Cyan

$requiredSecrets = @("MONGODB_URI", "JWT_SECRET")
foreach ($secret in $requiredSecrets) {
    $secretExists = gcloud secrets list --filter="name:projects/$ProjectId/secrets/$secret" --format="value(name)"
    if (-not $secretExists) {
        Write-Host "⚠️ Secret '$secret' is not created in Secret Manager." -ForegroundColor Yellow
        Write-Host "To create and add a version, run the following commands:" -ForegroundColor Gray
        Write-Host "  gcloud secrets create $secret --replication-policy=`"automatic`"" -ForegroundColor Gray
        Write-Host "  echo -n `"your-secret-value`" | gcloud secrets versions add $secret --data-file=-" -ForegroundColor Gray
    } else {
        Write-Host "✅ Secret '$secret' exists in Secret Manager." -ForegroundColor Green
    }
}

# ── 6. Deploy to Google Cloud Run ──
Write-Host "`n🚀 Deploying container to Google Cloud Run..." -ForegroundColor Cyan

$deployCmd = "gcloud run deploy $ServiceName `
    --image $ImageName `
    --region $Region `
    --platform managed `
    --allow-unauthenticated `
    --set-env-vars `"NODE_ENV=production,BASE_URL=https://$ServiceName-$ProjectId.a.run.app`" `
    --set-secrets `"MONGODB_URI=MONGODB_URI:latest,JWT_SECRET=JWT_SECRET:latest`" `
    --min-instances 1 `
    --max-instances 10 `
    --memory 512Mi `
    --cpu 1 `
    --concurrency 80 `
    --timeout 60"

Write-Host "Deploy Command:" -ForegroundColor Gray
Write-Host "  $deployCmd`n" -ForegroundColor Gray

# Ask for confirmation before running deployment
$confirm = Read-Host "Proceed with deployment? (y/n)"
if ($confirm -eq 'y' -or $confirm -eq 'yes') {
    Invoke-Expression $deployCmd
    Write-Host "`n🎉 QuickLink successfully deployed!" -ForegroundColor Green
} else {
    Write-Host "`nDeployment cancelled by user. You can run the deploy command manually." -ForegroundColor Yellow
}
