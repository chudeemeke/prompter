# Auto-Update Configuration

This document describes how to set up automatic updates for Prompter.

## Prerequisites

1. **GitHub Repository**: The app must be hosted on GitHub (or another supported provider)
2. **Signing Keys**: A public/private key pair for signing updates
3. **GitHub Releases**: Updates are distributed via GitHub Releases

## Step 1: Generate Signing Keys

Run the following command to generate a key pair:

```bash
# On Windows with Tauri CLI
npx @tauri-apps/cli signer generate -w ~/.tauri/prompter.key
```

This creates:
- `~/.tauri/prompter.key` - Private key (keep secret, never commit)
- `~/.tauri/prompter.key.pub` - Public key (used in tauri.conf.json)

**Important**: Store the private key securely. You'll need it for signing releases.

## Step 2: Configure tauri.conf.json

Update the `plugins.updater` section in `src-tauri/tauri.conf.json`:

```json
{
  "plugins": {
    "updater": {
      "pubkey": "YOUR_PUBLIC_KEY_HERE",
      "endpoints": [
        "https://github.com/chudeemeke/prompter/releases/latest/download/latest.json"
      ],
      "windows": {
        "installMode": "passive"
      }
    }
  }
}
```

Replace `YOUR_PUBLIC_KEY_HERE` with the contents of `~/.tauri/prompter.key.pub`.

## Step 3: Build Signed Releases

When building for release, sign the update:

```bash
# Set the private key as an environment variable
$env:TAURI_SIGNING_PRIVATE_KEY = Get-Content ~/.tauri/prompter.key
$env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD = "your-password-if-set"

# Build the release
npm run tauri:build
```

This creates:
- `src-tauri/target/release/bundle/msi/prompter_0.1.0_x64_en-US.msi`
- `src-tauri/target/release/bundle/msi/prompter_0.1.0_x64_en-US.msi.sig` (signature)
- `src-tauri/target/release/bundle/nsis/prompter_0.1.0_x64-setup.exe`
- `src-tauri/target/release/bundle/nsis/prompter_0.1.0_x64-setup.exe.sig` (signature)

## Step 4: Create GitHub Release

1. Go to your GitHub repository's Releases page
2. Create a new release with tag `v0.1.0` (matching your version)
3. Upload the following files:
   - The MSI installer (`.msi`)
   - The MSI signature (`.msi.sig`)
   - The NSIS installer (`.exe`)
   - The NSIS signature (`.exe.sig`)
   - `latest.json` file (see below)

## Step 5: Create latest.json

Create a `latest.json` file for the updater endpoint:

```json
{
  "version": "0.1.0",
  "notes": "Release notes here",
  "pub_date": "2025-01-15T00:00:00Z",
  "platforms": {
    "windows-x86_64": {
      "signature": "SIGNATURE_FROM_.sig_FILE",
      "url": "https://github.com/chudeemeke/prompter/releases/download/v0.1.0/prompter_0.1.0_x64-setup.exe"
    }
  }
}
```

Upload this file to each release.

## Frontend Integration

Use the `useUpdater` hook to check for and install updates:

```tsx
import { useUpdater } from '@/hooks/useUpdater';

function SettingsPage() {
  const { state, checkForUpdates, downloadAndInstall } = useUpdater();

  return (
    <div>
      <button onClick={checkForUpdates} disabled={state.checking}>
        {state.checking ? 'Checking...' : 'Check for Updates'}
      </button>

      {state.available && (
        <div>
          <p>Version {state.version} available!</p>
          <button onClick={downloadAndInstall} disabled={state.downloading}>
            {state.downloading ? `Downloading... ${state.progress}%` : 'Install Update'}
          </button>
        </div>
      )}

      {state.error && <p className="error">{state.error}</p>}
    </div>
  );
}
```

## GitHub Actions (Optional)

Automate releases with GitHub Actions:

```yaml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install Rust
        uses: dtolnay/rust-action@stable

      - name: Install dependencies
        run: npm install

      - name: Build Tauri
        uses: tauri-apps/tauri-action@v0
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          TAURI_SIGNING_PRIVATE_KEY: ${{ secrets.TAURI_SIGNING_PRIVATE_KEY }}
          TAURI_SIGNING_PRIVATE_KEY_PASSWORD: ${{ secrets.TAURI_SIGNING_PRIVATE_KEY_PASSWORD }}
        with:
          tagName: v__VERSION__
          releaseName: 'Prompter v__VERSION__'
          releaseBody: 'See the assets to download and install this version.'
          releaseDraft: true
          prerelease: false
```

## Troubleshooting

### Update Check Fails

1. Verify the `endpoints` URL is accessible
2. Check that `latest.json` exists at the endpoint
3. Verify the public key matches the signing key

### Signature Verification Fails

1. Ensure the `.sig` file was generated with the correct private key
2. Verify the public key in `tauri.conf.json` matches

### Update Won't Install

1. Check Windows permissions
2. Verify the installer is not blocked by antivirus
3. Try running as administrator

## Security Notes

- Never commit the private key to version control
- Store the private key securely (e.g., GitHub Secrets)
- Rotate keys periodically for security
- Always verify the signing key before building releases
